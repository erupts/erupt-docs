---
title: "50+ LLM × A2A × Memory: How Erupt's AI Harness Grew"
description: 17 providers, A2A cross-agent protocol, cross-session Memory, and a single Java annotation to wire in Tool/MCP calls — why we believe Java backends shouldn't be monopolized by the "AI App Generator" narrative.
outline: deep
---

# Issue 01 · 50+ LLM × A2A × Memory

> Erupt doesn't do "generate an App from a chat box" — but it packs LLM, Agent, Memory, MCP, and Tool entirely into the Java backend through **annotations and models**, giving any developer who previously only wrote `@Entity` a multi-model, multi-agent, multi-session AI Harness hanging behind the admin panel in under 5 minutes.
>
> _Published 2026-05-22 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow Erupt on WeChat</div>
    <p class="topic-mp-qr__desc">Each issue is published here first, along with release notes, source code walkthroughs, and community case studies.</p>
  </div>
</div>

## 1. Why This Article

The narrative in the low-code space over the past six months has been remarkably uniform: **"Build internal tools with natural language."** ToolJet calls it AI App Generation; Refine.dev lets you "read a database schema and instantly generate an admin"; Appsmith is internally testing an Agent Builder.

But every one of these paths shares an unstated premise — **your business system was built by dragging and dropping in a browser-based visual editor**.

Erupt is not that. Erupt's atomic unit is a Java class annotated with `@Erupt` — fundamentally, **code version-controlled in Git that shares the same origin as your domain model**. So we're not walking the "AI generates App" path; we're walking a different one:

> **AI must attach to your domain model the same way `@Erupt` does — sharing the same lifecycle with JPA, permissions, menus, workflows, and BI.**

That is what the `erupt-ai` module — internally called the **AI Harness** — is built to do. This issue explains it clearly.

## 2. Harness Engineering: Moving Beyond Prompt Engineering

The industry's methodology for "building LLM applications" has already stratified:

| Layer | Focus | Typical Tools |
| --- | --- | --- |
| Prompt Engineering | Writing prompts to get better model outputs | ChatGPT web, custom playgrounds |
| Context Engineering | How retrieval, memory, and tool results get assembled into context | LangChain, LlamaIndex |
| **Harness Engineering** | How tools, memory, agents, permissions, UI, and monitoring **operate together as an engineering system** | LangChain4j, Mastra, Erupt AI Harness |

Erupt doesn't build prompt tools, and we're not competing with LangChain. What we do is **flatten all three layers into the annotation model of the Java backend**: Tool is `@AiToolbox` + `@Tool`, Memory is a JPA table, Agent is an `@Erupt` entity, conversation history hangs on `AiChat`, and MCP can both call external services and expose your own outward.

That's why the very first line of the `erupt-ai` README says "fully embracing Harness Engineering."

## 3. 50+ LLM: One Switch Per Model, No OpenAI Lock-in

`erupt-ai` is built on **LangChain4j 1.14.1** and ships **17 provider adapters** in source:

```
ChatGpt · Claude · DeepSeek · Doubao · Fireworks · GLM · Gemini · Grok
Mimo · MiniMax · Mistral · Moonshot · Ollama · OpenAIAdapter
OpenRouter · Qwen · Together
```

`OpenAIAdapter` is a generic adapter for any OpenAI-compatible endpoint, and OpenRouter alone proxies 100+ upstream models. From the user's perspective, **the "LLM Management" menu in Erupt admin can list far more than 50 model entries**, covering:

- International flagships: OpenAI, Anthropic Claude, Google Gemini, xAI Grok
- Chinese mainstream: DeepSeek, Qwen, Doubao, Zhipu GLM, Moonshot Kimi, MiMo by Xiaomi, MiniMax
- Inference clouds: Together, Fireworks, OpenRouter, Mistral
- Local: Ollama (direct connection to localhost, zero external network on your office LAN)

Switching models requires no code changes — "LLM Management" is a plain `@Erupt` table. Add a row, gain an engine. Each chat session can independently choose its model.

:::tip Why This Matters
ToolJet lets you "generate an App with AI" — but you can't swap out the AI engine. Erupt treats the LLM itself as a managed entity, so **when domestic compliance requirements, international flagships, and local private deployments need to coexist**, you just create a few more records in admin.
:::

## 4. A2A: Making Erupt Both an Agent and an Agent Orchestrator

Agent-to-Agent (A2A) is the protocol layer the industry is currently elevating across 2025–2026 — the last thing pushed this hard was MCP.

`erupt-ai` implements A2A bidirectionally in 1.14.x:

1. **As orchestrator**: The admin backend has an `A2AAgent` table (`e_ai_a2a_agent`). Fill in a remote Agent's base URL and Erupt automatically pulls its skill list, then wraps it as a tool callable by the local LLM via `A2AAgentTools`. From the LLM's perspective, it's calling a local tool. From the user's perspective, it's cross-process, cross-language, even cross-company collaboration.
2. **As the callee**: `McpController` already exposes internal Tools/Skills via the MCP protocol. Cursor, Claude Desktop, and any MCP client can connect directly with a Bearer Token. Wrap A2A on top and you have an "outward-facing Agent."

```java
// From xyz.erupt.ai.model.A2AAgent
@Erupt(name = "A2A Agent", dataProxy = A2AAgentService.class)
@Table(name = "e_ai_a2a_agent")
@Entity
public class A2AAgent extends MetaModelUpdateVo {
    private String name;
    private Boolean enable = true;
    private String agentUrl;   // Remote A2A base URL
    @Transient
    private String skills;     // Skill list populated after fetch
}
```

This means — the Erupt backend is no longer "an admin panel that can chat." It is **a visual node in your company's internal Agent network**.

## 5. Memory: Cross-Session, Cross-User, Writable by the LLM Itself

`AiMemory` is a minimalist JPA table:

```java
@Entity
@Table(name = "e_ai_memory")
public class AiMemory extends BaseModel {
    private String content;
    private Long userId;
    private LocalDateTime createTime;
}
```

The companion `AiMemoryTools` exposes "read/write memory" as LLM tools. So when the model says in a conversation "remember this — the client prefers Tuesday afternoons for meetings," it **actually writes to the database**. The next session that loads memory will retrieve it.

Why a JPA table and not a vector store?

- Memory in Erupt is **domain data that can be audited by humans, directly managed (CRUD) in admin, and permission-isolated per `userId`**.
- If you genuinely need semantic search, attach a vector store as a Tool — but the vast majority of business systems don't need that.
- Sharing a single `MetaContext` with the ChatMessage SSE stream, agent tool calls, and A2A remote collaboration means Memory automatically inherits **multi-tenancy and login context**.

The analogues here are **OpenAI Memory / Claude Projects / Mem0** — but those are all SaaS. Erupt's Memory sits right next to your MySQL tables.

## 6. How Does It Compare to ToolJet / Refine.dev?

| Dimension | ToolJet AI | Refine.dev AI | **Erupt AI Harness** |
| --- | --- | --- | --- |
| Paradigm | Browser drag-and-drop + AI-generated App | React framework + AI reads schema to generate admin | Java annotations + AI as a first-class citizen in the backend |
| Custom business logic | JS / Query Builder | TypeScript / Hooks | **Direct Spring Beans, JPA, SpEL** |
| LLM choice | Primarily OpenAI/Anthropic | Primarily OpenAI | **17 providers, full Chinese ecosystem + Ollama local** |
| Agent protocol | Built-in Agent Builder | Not specified | **A2A bidirectional + MCP bidirectional** |
| Memory | SaaS-side | Self-managed in application layer | **DB table + permission isolation + LLM read/write** |
| Deployment | SaaS / self-hosted | Self-hosted | **Self-hosted, single jar, 2–5s startup** |
| Best for | Business teams building internal tools | Frontend teams customizing admin | **Java backend teams + strong domain model + strict compliance** |

We don't deny the value of ToolJet's path — for a department with no engineering team at all, "natural language generates an App" is genuine productivity. But when a system has matured, the domain model has stabilized, and compliance and auditing are hard constraints, **continuing to stuff business logic into a no-code canvas** creates technical debt in the other direction.

The target user for Erupt AI Harness is clear: **teams already writing business logic in Spring Boot who want to wire LLMs into their existing domain model — not move their existing domain model into a drag-and-drop editor**.

## 7. Up and Running in 5 Minutes

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

```yaml
erupt:
  ai:
    system-prompt: |
      You are Erupt AI, fluent in both Chinese and English.
    sse-timeout: 300000
```

After startup, the admin panel gains:

- **LLM Management**: Enter your API key, choose a model, A/B switch between engines
- **AI Chat**: Browser-side SSE streaming conversation, with real-time rendering of Mermaid diagrams, code blocks, and formulas
- **A2A Agent**: Enter a remote Agent base URL, skills auto-fetched
- **AI Memory**: Readable by humans, writable by the model

For more details see the [erupt-ai module docs](/en/modules/erupt-ai) and [erupt-ai-claw](/en/modules/erupt-ai-claw).

---

:::info Join the Discussion
The development branches for this issue are [`develop`](https://github.com/erupts/erupt/tree/develop) and [`A2A`](https://github.com/erupts/erupt/tree/A2A).
Share your real use cases in [GitHub Discussions](https://github.com/erupts/erupt/discussions) — community feedback gets priority consideration for future topics.
:::
