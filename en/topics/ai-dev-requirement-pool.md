---
title: "McpAuthenticator × @RowOperation × EruptScope: Letting a Coding Agent Work in Your Back Office, and Why You Can Trust It"
description: "Getting AI to write code is no longer rare; authorization and delivery are the hard part: what it may touch, who signs off, what happens on conflict. This issue dissects erupt-ai-dev: a one-run MCP token, review and delivery as @RowOperation, rebase-then-push across repositories, and the real risk of running agents under the server account."
outline: deep
---

# Issue 25 · A Badge for the Coding Agent

> Getting an AI to write a piece of code is easy. Putting it into a team process raises three questions: **by what right** may it read my data, who **approves** that it starts and that it ships, and what happens when several repositories are delivered **together** and one conflicts? `erupt-ai-dev` answers: the agent is not a special role. It is an **MCP client holding a single-use badge**, and review and delivery use the `@RowOperation` Erupt already has.
>
> _Published 2026-10-28 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Scan to follow the Erupt official account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

"Generate an app from a sentence" has been the most common AI story in low-code for the past two years. It answers **generation**: one sentence becomes forms and pages. A real team's work is rarely a new app; it is **changing code in several existing repositories** — someone files a requirement, someone reviews, someone accepts, the change goes through git, and when something breaks you can trace who approved it.

For that kind of work, whether the AI can write the code is not the main tension. The tension is: what permissions should a process that runs on your server and can execute commands get?

The counter-thesis of this issue:

> **Don't build a new permission system for the agent. Give it a token that belongs to this one run and points at this one requirement, and let its data access be the very share its creator already has in AI chat.**

## 2. Two approaches: generate a new app vs. let the agent be a member of the back office

| Dimension | "Generate an app" | "Agent as a member" (`erupt-ai-dev`) |
|---|---|---|
| Output | An in-platform app / page | Commits in your own git repositories |
| Unit of work | A prompt | A `REQ-n` card in the requirement pool |
| Agent identity | Internal platform capability, no authorization step | A bearer token issued per run, revoked when it ends |
| Who approves | Usually nobody | Project member roles: reviewer / maintainer / owner |
| Delivery | Publish inside the platform | Rebase, then fast-forward push; one delivery record per repository |

## 3. Countable facts: one module, nine stages, seven coding CLIs

The module lives in `erupt-ai/erupt-ai-dev`, about 5,400 lines of main Java:

- **Eight entities.** Under `xyz.erupt.ai_dev.model`: `DevProject` (a project holds several repositories and members), `DevProjectRepo`, `DevProjectMember`, `DevRequirement`, `DevRequirementReview`, `DevRequirementDelivery`, `DevAgentSession`, `DevAgentEvent`, plus form-only classes such as `DevInstructionForm`.
- **One requirement lifecycle.** `DRAFT → REVIEW → QUEUED → RUNNING → VERIFYING → ACCEPTANCE → DELIVERED`, with `FAILED` and `CANCELLED` as side branches.
- **Seven selectable coding CLIs.** The README lists Claude Code, Codex, OpenCode, Kimi Code, Cursor CLI, Qwen Code, and any plain CLI that reads the prompt on stdin and writes text (`PlainCliRunner`). The picker offers only those found on the server's `PATH`.
- **Three agent tools.** `devRequirement`, `devReportProgress` and `devReportVerdict` in `xyz.erupt.ai_dev.mcp.DevTools`.

## 4. The badge: how `McpAuthenticator` turns "a run" into "an identity"

The MCP endpoint of `erupt-ai` (`/mcp`) already lets outside clients call Erupt's `@AiToolbox` tools. `erupt-ai-dev` does not open a second endpoint; it implements `xyz.erupt.ai.mcp.McpAuthenticator`:

```java
@Component
public class DevMcpAuthenticator implements McpAuthenticator {

    @Resource
    private DevMcpGrants devMcpGrants;

    @Resource
    private LLMRoleService llmRoleService;

    @Override
    public McpGrant authenticate(String token) {
        DevMcpGrants.Grant grant = devMcpGrants.get(token);
        if (null == grant) return null;
        // the run's own tools, plus every erupt tool the requirement's creator may use in AI chat
        Set<String> tools = new LinkedHashSet<>(grant.role() == AgentRole.QA ? DevMcpGrants.QA_TOOLS : DevMcpGrants.DEVELOPER_TOOLS);
        if (null != grant.uid()) tools.addAll(llmRoleService.getAllowedToolsByUid(grant.uid()));
        return new McpGrant(grant.uid(), tools, grant);
    }

}
```

`DevMcpGrants#issue` mints the token: 32 bytes from `SecureRandom`, bound to tenant, project, requirement, session, role and the **uid of the requirement's creator**, and `revoke`d when the run ends. So:

- **The token points at one requirement.** Every tool in `DevTools` takes the run's `Grant` from `McpContext.attachment(...)`; the caller never passes a requirement id.
- **Tools are split by role.** The developer agent has only `devRequirement` and `devReportProgress`; the QA agent only `devRequirement` and `devReportVerdict`.
- **Data access is the creator's, not the agent's.** The other Erupt tools are allowed by `LLMRoleService#getAllowedToolsByUid` from the creator's AI roles — a model the creator cannot read in AI chat is one the agent cannot read either.
- **These tools are invisible to ordinary AI chat.** `DevTools` is annotated `@AiToolbox(exposed = false)` (`xyz.erupt.annotation.ai.AiToolbox`), so neither chat nor a user's own MCP token can list them.

:::tip Counter-intuitive point
We did not give the agent a "robot account". A robot account means a separately maintained permission set that lives for a long time. Here the token is born with the run and dies with it, and its permissions are **borrowed** from the requirement's creator — to narrow what the agent can see you change a person's AI role, not an agent setting.
:::

## 5. Review and delivery: not a new workflow engine, ten `@RowOperation`s

Requirement flow has no state-machine framework. `DevRequirement` declares row operations, and each button's visibility is bound to the stage with `ifExpr`:

```java
@RowOperation(code = "approve", title = "Approve and Run", icon = "fa fa-check", mode = RowOperation.Mode.SINGLE,
        operationHandler = DevRequirementOperation.class, operationParam = "approve", eruptClass = DevReviewForm.class,
        ifExpr = "item.stage === 'REVIEW'", ifExprBehavior = RowOperation.IfExprBehavior.HIDE),
@RowOperation(code = "deliver", title = "Accept and Push", icon = "fa fa-upload", mode = RowOperation.Mode.SINGLE,
        operationHandler = DevRequirementOperation.class, operationParam = "deliver",
        ifExpr = "item.stage === 'ACCEPTANCE'", ifExprBehavior = RowOperation.IfExprBehavior.HIDE),
```

The real gate is on the server: `DevRequirementOperation` (an implementation of `xyz.erupt.annotation.fun.OperationHandler`) checks the starting stage for every action, then the member's role. `ifExpr` only decides whether a button shows; it is not authorization. Two details worth noting:

- **Self-review is forbidden by default.** `DevAccessService#mayApprove`: the approver must be a project member, and `Boolean.TRUE.equals(project.getSelfReview()) || !isCreator(r)` — only a project with "self review" switched on lets a creator approve their own requirement; it is off by default.
- **Rejection needs a reason.** `reject` throws `EruptWebApiRuntimeException` when no comment is given, and the decision is stored in `DevRequirementReview`.

"The current project" is not a hand-written where clause. `DevRequirement` declares its scope with `@EruptScope(DevProjectScope.class)` (`xyz.erupt.annotation.EruptScope`): pick once in the page header, and every list, detail and write follows. The options come from `MemberProjectFetch implements ChoiceFetchHandler` and are **re-checked on every request**, so a hand-edited `erupt-scope` header cannot reach a project the user is not a member of. It is the mechanism of issue 21, applied to a different business.

## 6. Claiming and delivering: two places that prefer to do nothing

**Claiming uses a conditional update, not a lock.** The first step of `DevExecutor#execute`:

```java
boolean claimed = devTx.call(tenant, () -> eruptDao.getEntityManager().createQuery(
                "update DevRequirement r set r.stage = :running, r.statusMessage = null, r.progress = 0, r.phase = null " +
                        "where r.id = :id and r.stage = :queued")
        .setParameter("running", RequirementStage.RUNNING).setParameter("queued", RequirementStage.QUEUED)
        .setParameter("id", id).executeUpdate() == 1);
if (!claimed) return;
```

`stage = QUEUED` sits in the `where`, so when two instances poll at once only one updates a row and the other returns; no distributed lock is needed.

**Delivery checks every repository before the first push.** `DevDeliveryService#deliver` first runs `rebase` in each repository that has a target branch and collects the conflicts. If any repository conflicts, **nothing is pushed**, and each repository gets a `DevRequirementDelivery` row (`CONFLICT` for the conflicting ones, `PENDING` for the rest). Pushes are fast-forward only; a remote refusal is recorded as `REJECTED` / `FAILED` and the worktree is kept, so remote history is never rewritten.

## 7. How does it compare with Yida / Weida / JeecgBoot / RuoYi?

We have not tested these products item by item. The left column below is **what is worth asking when choosing**, not a verdict on them; rely on each product's official docs and your own testing.

| Dimension | Domestic counterpart: what to ask | Erupt |
|---|---|---|
| Output | For DingTalk Yida and Tencent Weida's AI features, is the output an in-platform app or commits in your own repositories? | A `req/req-n` branch in your repositories, pushed through `erupt-git`; any git host works |
| Agent permissions | In JeecgBoot or RuoYi AI extensions, whose identity reads the data, and can a token be limited to one ticket? | One token per run, permissions borrowed from the creator's AI roles, `revoke`d at the end |
| Review and acceptance | Is there a requirement → review → acceptance chain, and can self-review be forbidden? | Driven by `@RowOperation`; self-review off by default |
| Multi-repo delivery | When one requirement spans repositories, does a conflict stop the whole batch? | Rebase all first, then push; any conflict stops the batch |
| Where it runs | On whose machine does the agent run, and can its log be traced afterwards? | A coding CLI on the server; every message stored as a `DevAgentEvent` |

## 8. From annotation to UI in 5 minutes

From an empty project to a reachable admin page is its own page:

**→ [Quick Start](/guide/quick-start)**

`erupt-ai-dev` is an optional module of the `erupt-ai` family: add it on top of Quick Start and install at least one coding CLI on the server (without a usable CLI, an approved requirement does not start running). The minimal configuration is credentials and the executor environment:

```yaml
erupt:
  ai-dev:
    root: /data/erupt-ai-dev
    credentials:
      github:
        token: ${GITHUB_TOKEN}
        hosts: [github.com]
    executor:
      max-concurrent: 2
      env:
        ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
```

An "AI Dev" menu appears: create a project, attach repositories and members, then file requirements on the "Requirement Pool" page.

## 9. The cost, and next issue

Each of these can be matched in the README and source:

- **The agent runs as the server account.** It can edit files and run commands (the `Bash` permission means any command on that host). What we do: the process environment is cleared, keeping only inherited variables such as `PATH` and `HOME` plus your configured `executor.env` (`DevAgentProcess#clean`); git credentials never enter the process, since Erupt does every fetch and push itself; a credential goes only to the hosts listed under `hosts`. We still recommend installing the CLI in a dedicated container or VM.
- **What the agent reads goes to the model provider.** Borrowing the creator's AI roles limits *what it may read*; it does not change that what it reads leaves the server with the rest of its context.
- **No CLI, no execution.** Approving a requirement needs a CLI installed on the server.
- **QA is an optional second run.** The same CLI runs again to verify; it is not an independent test system, and a human still signs off at `ACCEPTANCE`.
- **It does not choose your merge strategy.** With a target branch it rebases and fast-forwards; without one it pushes `req/req-n`; it never resolves conflicts for you.

Next issue goes back to the data layer: #447 in the main repo added "batch edit" to the list — select some rows and write one value into one field. It sounds like `UPDATE ... WHERE id IN (...)`, but in the source **every row goes through the existing cell-edit pipeline**: validation, row-level permission, `DataProxy` hooks, operation log, and one rejected row rolls the whole batch back. **Why a batch operation should not bypass the pipeline** is next.

---

:::info Join the discussion
Source covered in this issue: `erupt-ai/erupt-ai-dev/.../mcp/DevMcpAuthenticator.java`, `mcp/DevMcpGrants.java`, `mcp/DevTools.java`, `model/DevRequirement.java`, `proxy/DevRequirementOperation.java`, `scope/DevProjectScope.java`, `service/DevExecutor.java`, `service/DevDeliveryService.java`, `service/DevAccessService.java`, `runner/DevAgentProcess.java`, and the module's `README.md`.

How tightly should the agent's permission boundary be drawn? Leave a note in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
