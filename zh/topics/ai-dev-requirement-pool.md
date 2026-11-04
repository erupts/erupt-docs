---
title: "McpAuthenticator × @RowOperation × EruptScope：让编码 Agent 进后台干活，凭什么信它"
description: "AI 写代码已经不稀奇，难的是授权与交付：它能碰什么、谁来验收、冲突怎么办。本期拆 erupt-ai-dev：每次运行一枚一次性 MCP 令牌、评审与交付全走 @RowOperation、多仓库交付先 rebase 后推送，以及它对服务器账号的真实风险。"
outline: deep
---

# 第 25 期 · 编码 Agent 的工牌

> 让 AI 写一段代码已经不难，难的是把它放进团队流程之后回答三个问题：它**凭什么**能读我的数据，谁**批准**它开工和交付，几个仓库**一起**交付时冲突了怎么办。`erupt-ai-dev` 的答案是：Agent 不是一个特殊角色，只是一个**持有一次性工牌的 MCP 客户端**，评审与交付走的是 Erupt 本来就有的 `@RowOperation`。
>
> _发布于 2026-10-28 · 阅读 ~10 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

[[toc]]

## 一、为什么写这篇

「用自然语言生成一个应用」是低代码平台这两年最常见的 AI 叙事。它回答的是**生成**：一句话变成表单和页面。但真实团队的需求不是新建应用，而是**在已有的几个仓库里改代码**——有人提需求，有人评审，有人验收，改动要走 git，出了问题要能追到谁批准的。

这一类需求，AI 能不能写出代码反倒不是主要矛盾。矛盾在于：一个跑在服务器上、能执行命令的进程，应该拿到什么权限？

本文的反向命题是：

> **别给 Agent 造一套新的权限体系。让它拿一枚只属于这一次运行、只指向这一张需求单的令牌，数据权限直接继承需求创建者在 AI 对话里本来就有的那一份。**

## 二、两种思路：生成一个新应用 vs 让 Agent 当后台里的一个成员

| 维度 | 「生成应用」式 | 「Agent 作为成员」式（`erupt-ai-dev`） |
|---|---|---|
| 产出物 | 平台内的应用 / 页面 | 你已有 git 仓库里的提交 |
| 工作单位 | 一段提示词 | 需求池里的一张 `REQ-n` |
| Agent 的身份 | 平台内部能力，无需授权 | 一枚每次运行签发、结束即作废的 bearer 令牌 |
| 谁批准 | 通常没有这一步 | 项目成员角色：评审人 / 维护者 / 所有者 |
| 交付 | 平台内发布 | rebase 后 fast-forward 推送，每个仓库一条交付记录 |

## 三、可数的事实：一个模块、九个阶段、七种编码 CLI

模块在 `erupt-ai/erupt-ai-dev`，主代码约 5400 行 Java：

- **八个实体。** `xyz.erupt.ai_dev.model` 下的 `DevProject`（一个项目可挂多个仓库和成员）、`DevProjectRepo`、`DevProjectMember`、`DevRequirement`、`DevRequirementReview`、`DevRequirementDelivery`、`DevAgentSession`、`DevAgentEvent`，另有只用于表单的 `DevInstructionForm` 等。
- **一条需求生命周期。** `DRAFT → REVIEW → QUEUED → RUNNING → VERIFYING → ACCEPTANCE → DELIVERED`，另有 `FAILED` 与 `CANCELLED` 两个分支。
- **七种可选的编码 CLI。** README 列出 Claude Code、Codex、OpenCode、Kimi Code、Cursor CLI、Qwen Code，以及任意一种「提示词走 stdin、文本出」的普通 CLI（`PlainCliRunner`）。选择器只列服务器 `PATH` 上找得到的那几个。
- **三个 Agent 工具。** `xyz.erupt.ai_dev.mcp.DevTools` 里的 `devRequirement`、`devReportProgress`、`devReportVerdict`。

## 四、工牌：`McpAuthenticator` 怎么把「一次运行」变成「一个身份」

`erupt-ai` 的 MCP 端点（`/mcp`）本来就能让外部客户端调用 Erupt 的 `@AiToolbox` 工具。`erupt-ai-dev` 没有另开一个端点，而是实现了一个 `xyz.erupt.ai.mcp.McpAuthenticator`：

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

令牌由 `DevMcpGrants#issue` 签发：32 字节 `SecureRandom`，绑定租户、项目、需求、会话、角色和**需求创建者的 uid**，运行结束时 `revoke`。因此：

- **令牌只指向一张需求。** `DevTools` 里每个工具都从 `McpContext.attachment(...)` 取出这次运行的 `Grant`，不接受调用方传入需求编号。
- **工具按角色切分。** 开发 Agent 只有 `devRequirement` 和 `devReportProgress`；QA Agent 只有 `devRequirement` 和 `devReportVerdict`。
- **数据权限是创建者的，不是 Agent 的。** 其余 Erupt 工具由 `LLMRoleService#getAllowedToolsByUid` 按创建者的 AI 角色放行——创建者在 AI 对话里读不了的模型，Agent 也读不了。
- **这些工具对普通 AI 对话不可见。** `DevTools` 标注为 `@AiToolbox(exposed = false)`（`xyz.erupt.annotation.ai.AiToolbox`），对话和用户自己的 MCP 令牌都列不出它们。

:::tip 反直觉的一点
我们没有给 Agent 一个「机器人账号」。机器人账号意味着一套要单独维护的权限，而且长期有效。这里的令牌随运行出生、随运行消失，权限直接**借**需求创建者的那一份——想收窄 Agent 的可见范围，改的是人的 AI 角色，不是 Agent 的配置。
:::

## 五、评审与交付：不是新写的流程引擎，是十个 `@RowOperation`

需求的流转没有状态机框架。`DevRequirement` 上声明了行操作，每个按钮的显隐用 `ifExpr` 绑定阶段：

```java
@RowOperation(code = "approve", title = "Approve and Run", icon = "fa fa-check", mode = RowOperation.Mode.SINGLE,
        operationHandler = DevRequirementOperation.class, operationParam = "approve", eruptClass = DevReviewForm.class,
        ifExpr = "item.stage === 'REVIEW'", ifExprBehavior = RowOperation.IfExprBehavior.HIDE),
@RowOperation(code = "deliver", title = "Accept and Push", icon = "fa fa-upload", mode = RowOperation.Mode.SINGLE,
        operationHandler = DevRequirementOperation.class, operationParam = "deliver",
        ifExpr = "item.stage === 'ACCEPTANCE'", ifExprBehavior = RowOperation.IfExprBehavior.HIDE),
```

真正的把关在服务端：`DevRequirementOperation`（`xyz.erupt.annotation.fun.OperationHandler` 的实现）每个动作先校验起始阶段，再校验成员角色。`ifExpr` 只决定按钮显不显示，不是授权。两处细节值得说：

- **自审默认被禁止。** `DevAccessService#mayApprove`：评审人必须是项目成员，并且 `Boolean.TRUE.equals(project.getSelfReview()) || !isCreator(r)`——项目开了「自审」才允许创建者批准自己的需求，默认关。
- **驳回必须写理由。** `reject` 在没有说明时直接抛 `EruptWebApiRuntimeException`，并写入 `DevRequirementReview`。

「当前项目」不是一条手写的 where。`DevRequirement` 用 `@EruptScope(DevProjectScope.class)`（`xyz.erupt.annotation.EruptScope`）声明作用域，页头选一次，所有列表、详情和写入都跟随；选项来自 `MemberProjectFetch implements ChoiceFetchHandler`，**每次请求重新校验**，手改 `erupt-scope` 请求头也进不了自己不是成员的项目。机制与第 21 期相同，这里只是换了业务。

## 六、领单与交付：两处「宁可不做」

**领单用条件更新，不用锁。** `DevExecutor#execute` 的第一步：

```java
boolean claimed = devTx.call(tenant, () -> eruptDao.getEntityManager().createQuery(
                "update DevRequirement r set r.stage = :running, r.statusMessage = null, r.progress = 0, r.phase = null " +
                        "where r.id = :id and r.stage = :queued")
        .setParameter("running", RequirementStage.RUNNING).setParameter("queued", RequirementStage.QUEUED)
        .setParameter("id", id).executeUpdate() == 1);
if (!claimed) return;
```

`stage = QUEUED` 写在 `where` 里，两个实例同时轮询只会有一个更新到一行，另一个直接返回，不需要分布式锁。

**交付先检查所有仓库，再推第一个。** `DevDeliveryService#deliver` 先对每个有目标分支的仓库做 `rebase`，把冲突收集起来；只要任何一个仓库冲突，整批**一个都不推**，每个仓库各记一条 `DevRequirementDelivery`（冲突的记 `CONFLICT`，其余记 `PENDING`）。推送只做 fast-forward，远端拒绝就记 `REJECTED` / `FAILED` 并保留工作树，不会改写远端历史。

## 七、跟宜搭 / 微搭 / JeecgBoot / 若依怎么比？

我们没有逐项实测这些产品。下表左列是**选型时值得问的问题**，不是对它们的结论；各产品能力以官方文档和实测为准。

| 维度 | 国内对位：选型时该问 | Erupt |
|---|---|---|
| 产出物 | 钉钉宜搭、腾讯微搭的 AI 能力，产物是平台内应用，还是你自己仓库里的提交？ | 你仓库里的 `req/req-n` 分支，经 `erupt-git` 推送，任何 git 主机均可 |
| Agent 权限 | JeecgBoot、若依的 AI 扩展里，调用数据的身份是谁，令牌能不能只指向一单？ | 每次运行一枚令牌，权限借创建者的 AI 角色，结束即 `revoke` |
| 评审与验收 | 有没有「需求—评审—验收」这条链，能不能禁止自审？ | `@RowOperation` 驱动，自审默认关闭 |
| 多仓库交付 | 一个需求涉及多个仓库，冲突时是否整批不推？ | 先 rebase 全部，再推送；任一冲突整批不推 |
| 执行位置 | Agent 跑在谁的机器上，跑完能不能追溯日志？ | 服务器上的编码 CLI；全部消息存为 `DevAgentEvent` |

## 八、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

`erupt-ai-dev` 是 `erupt-ai` 家族里的可选模块，在 Quick Start 之上额外引入它，并在服务器上装好至少一个编码 CLI（没有可用 CLI 时，需求审批不会进入执行）。最小配置只有凭据与执行器环境：

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

菜单里出现「AI Dev」，新建项目、挂上仓库与成员，再到「需求池」页提需求。

## 九、代价与下一期预告

下面几条都能在 README 和源码里对上：

- **Agent 以服务器账号运行。** 它能编辑文件、执行命令（`Bash` 权限即该主机上任意命令）。我们能做的是：进程环境被清空，只带 `PATH`、`HOME` 等继承变量和你配置的 `executor.env`（`DevAgentProcess#clean`）；git 凭据不进入进程，所有 fetch 和 push 由 Erupt 自己做；凭据只发往 `hosts` 里列出的主机。仍建议把 CLI 装在专用容器或虚拟机里。
- **Agent 读到的数据会发给模型提供方。** 借用创建者的 AI 角色限定了「能读什么」，不改变「读到的随上下文一起离开服务器」。
- **没有 CLI 就没有执行。** 批准需求需要服务器上已装好 CLI。
- **QA 是可选的第二次运行。** 同一个 CLI 再跑一遍验证，不是独立的测试系统，裁决仍交给人在 `ACCEPTANCE` 阶段点头。
- **不替你决定合并策略。** 有目标分支则 rebase 后快进，没有则推 `req/req-n`；不会代你解冲突。

下一期回到数据层：主仓 #447 给列表加了「批量修改」——选中若干行，对同一个字段一次写入同一个值。直觉上这是一条 `UPDATE ... WHERE id IN (...)`，源码里它**每一行都走一遍已有的单元格编辑管线**：校验、行级权限、`DataProxy` 钩子、操作日志，任何一行被拒整批回滚。**批量操作为什么不该绕过管线**，下期细说。

---

:::info 参与讨论
本期涉及的源码：`erupt-ai/erupt-ai-dev/.../mcp/DevMcpAuthenticator.java`、`mcp/DevMcpGrants.java`、`mcp/DevTools.java`、`model/DevRequirement.java`、`proxy/DevRequirementOperation.java`、`scope/DevProjectScope.java`、`service/DevExecutor.java`、`service/DevDeliveryService.java`、`service/DevAccessService.java`、`runner/DevAgentProcess.java`，以及模块目录下的 `README.md`。

Agent 的权限边界还应该再收多紧，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
