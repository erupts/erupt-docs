---
title: 50+ LLM × A2A × Memory：Erupt 的 AI Harness 是怎么长出来的
description: 17 个 provider、A2A 跨 Agent 协议、跨会话 Memory，外加一个 Java 注解就能挂上去的 Tool / MCP 调用——为什么我们认为 Java 后台不该被 "AI App Generator" 叙事垄断。
outline: deep
---

# 第 01 期 · 50+ LLM × A2A × Memory

> Erupt 不做"对话框生成 App"，但它把 LLM、Agent、Memory、MCP、Tool 全部以**注解和模型**的方式塞进 Java 后台，让任何一个原本只会写 `@Entity` 的开发者，5 分钟内拥有一套挂在 admin 后面的多模型、多 Agent、多会话的 AI Harness。
>
> _发布于 2026-05-22 · 阅读 ~10 min_

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

最近半年低代码圈的叙事很统一：**"用自然语言生成内部工具"**。ToolJet 把它叫 AI App Generation，Refine.dev 让你"读数据库 schema 直接生成 admin"，Appsmith 也在内部测 Agent Builder。

但这条路有个共同的隐含前提——**你的业务系统是浏览器里的可视化拖拽编辑器搭出来的**。

Erupt 不是。Erupt 的最小单位是一个带 `@Erupt` 的 Java 类，它本质上是一段**版本管理在 Git 里的、跟你业务领域模型同源的代码**。所以我们走的不是"AI 生成 App"那条路，而是另一条路：

> **AI 必须像 `@Erupt` 一样，挂在你的领域模型上，跟 JPA、权限、菜单、流程、BI 共用同一套生命周期。**

这就是 `erupt-ai` 模块——团队内部叫它 **AI Harness**——想做的事。这一期专题把它讲清楚。

## 二、Harness Engineering：从 Prompt Engineering 走出去

业界对"做 LLM 应用"的方法论已经分层：

| 层级 | 关注点 | 典型工具 |
| --- | --- | --- |
| Prompt Engineering | 写 prompt 让模型答得更好 | ChatGPT 网页、自建 playground |
| Context Engineering | 检索、记忆、工具结果如何拼进 context | LangChain、LlamaIndex |
| **Harness Engineering** | 工具、记忆、Agent、权限、UI、监控如何**作为一个工程系统**一起运作 | LangChain4j、Mastra、Erupt AI Harness |

Erupt 不写 prompt 工具，也不与 LangChain 竞争。我们做的事是**把上面三层拍扁到 Java 后台的注解模型里**：Tool 是 `@AiToolbox` + `@Tool`，Memory 是一张 JPA 表，Agent 是一个 `@Erupt` 实体，会话历史挂在 `AiChat` 上，MCP 既能挂外部也能反向暴露出去。

这就是 `erupt-ai` README 第一行就写"全面拥抱 Harness Engineering"的原因。

## 三、50+ LLM：一个开关一个模型，不绑 OpenAI

`erupt-ai` 基于 **LangChain4j 1.14.1**，在源码里内置了 **17 个 provider 适配器**：

```
ChatGpt · Claude · DeepSeek · Doubao · Fireworks · GLM · Gemini · Grok
Mimo · MiniMax · Mistral · Moonshot · Ollama · OpenAIAdapter
OpenRouter · Qwen · Together
```

其中 `OpenAIAdapter` 是任意 OpenAI 兼容端点的通用适配器，`OpenRouter` 一家就转发了 100+ 上游模型。也就是说从用户视角，**Erupt admin 里"大模型管理"那个菜单可选的模型条目远超 50 个**，覆盖了：

- 海外旗舰：OpenAI、Anthropic Claude、Google Gemini、xAI Grok
- 国内主流：DeepSeek、通义千问、豆包、智谱 GLM、月之暗面 Kimi、小米 MiMo、MiniMax
- 推理云：Together、Fireworks、OpenRouter、Mistral
- 本地：Ollama（直连本机，办公网零外网）

切换模型不需要改代码——`大模型管理` 是一张普通的 `@Erupt` 表，加一行就多一个引擎，并且每个 chat session 可以独立选用。

:::tip 为什么这件事重要
ToolJet 让你"用 AI 生成 App"——它没法替换 AI 引擎。Erupt 把 LLM 自身做成被管理的实体，所以**当国内合规、海外旗舰、本地私有部署需要并存**时，你只需要在 admin 里多建几条记录。
:::

## 四、A2A：让 Erupt 同时是 Agent 和 Agent 的调度方

Agent-to-Agent（A2A）是 2025–2026 业界正在抬升的协议层——上一个被这样推的是 MCP。

`erupt-ai` 在 1.14.x 里把 A2A 做了双向：

1. **作为调度方**：admin 后台有一张 `A2AAgent` 表（`e_ai_a2a_agent`），填入远端 Agent 的 base URL，Erupt 自动拉对方的 skill 列表，并通过 `A2AAgentTools` 把对方包装成可被本机 LLM 调用的工具。从 LLM 视角看，它在调本地工具；从用户视角看，它在跨进程、跨语言、甚至跨公司协作。
2. **作为被调方**：`McpController` 已经把内部 Tool / Skill 通过 MCP 协议暴露出去，Cursor、Claude Desktop 等任何 MCP 客户端可以用 Bearer Token 直连。把 A2A 包装一层就是一个"对外的 Agent"。

```java
// 摘自 xyz.erupt.ai.model.A2AAgent
@Erupt(name = "A2A Agent", dataProxy = A2AAgentService.class)
@Table(name = "e_ai_a2a_agent")
@Entity
public class A2AAgent extends MetaModelUpdateVo {
    private String name;
    private Boolean enable = true;
    private String agentUrl;   // 远端 A2A base URL
    @Transient
    private String skills;     // 拉取后回填的 skill 列表
}
```

意味着——Erupt 后台不再是一个"会聊天的管理后台"，而是**企业内部 Agent 网络的一个可视化节点**。

## 五、Memory：跨会话、跨用户、可被 LLM 自己写

`AiMemory` 是一张极简的 JPA 表：

```java
@Entity
@Table(name = "e_ai_memory")
public class AiMemory extends BaseModel {
    private String content;
    private Long userId;
    private LocalDateTime createTime;
}
```

配套的 `AiMemoryTools` 把"读 / 写 memory"暴露为 LLM 工具。也就是说当模型在对话中说"记一下，这个客户偏好周二下午开会"，它会**真的去写库**，下次别的 session 加载 memory 时会取回。

为什么是 JPA 表，不是向量库？因为：

- Memory 在 Erupt 里是一份**可被人审计、可在 admin 直接增删改、可与 `userId` 做权限隔离**的领域数据。
- 真要语义检索，外挂一个向量库当 Tool 即可——但绝大多数业务系统并不需要。
- 跟 ChatMessage 的 SSE 流、Agent 的工具调用、A2A 的远端协作共用一份 `MetaContext`，意味着 Memory 也自动获得了**多租户和登录态**。

这条路的对位是 **OpenAI Memory / Claude Projects / Mem0**——但它们都是 SaaS。Erupt 的 Memory 跟你的 MySQL 表躺在一起。

## 六、跟 ToolJet / Refine.dev 怎么比？

| 维度 | ToolJet AI | Refine.dev AI | **Erupt AI Harness** |
| --- | --- | --- | --- |
| 形态 | 浏览器拖拽 + AI 生成 App | React 框架 + AI 读 schema 生成 admin | Java 注解 + AI 作为后台一等公民 |
| 自定义业务逻辑 | JS / Query Builder | TypeScript / Hooks | **直接写 Spring Bean、JPA、SpEL** |
| LLM 选择 | 主要 OpenAI/Anthropic | 主要 OpenAI | **17 provider，含国内全套 + Ollama 本地** |
| Agent 协议 | 内置 Agent Builder | 未明确 | **A2A 双向 + MCP 双向** |
| Memory | SaaS 侧 | 应用层自管 | **DB 表 + 权限隔离 + LLM 可读写** |
| 部署 | SaaS / 自部署 | 自部署 | **自部署，单 jar 2–5s 启动** |
| 适合谁 | 业务团队搭内部工具 | 前端团队定制 admin | **Java 后端团队 + 强领域模型 + 强合规约束** |

我们不否认 ToolJet 那条路的价值——对一个完全没工程团队的部门来说，"自然语言生成 App"是真实生产力。但当系统已经长大、领域模型已经稳定、合规和审计是硬约束时，**继续把业务往无代码画布上塞**就是反向的技术债。

Erupt AI Harness 的目标用户很明确：**已经在 Spring Boot 写业务的团队，希望把 LLM 接进现有领域模型，而不是把现有领域模型搬去拖拽编辑器**。

## 七、5 分钟上手

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
      你是 Erupt AI，擅长中文与英文对话。
    sse-timeout: 300000
```

启动后，admin 里会出现：

- **大模型管理**：填 key 选模型，A/B 切换
- **AI 会话**：浏览器侧 SSE 流式对话，Mermaid / 代码 / 公式实时渲染
- **A2A Agent**：填远端 Agent base URL，自动拉 skill
- **AI Memory**：人也能看、模型也能写

更细节见 [erupt-ai 模块文档](/modules/erupt-ai) 与 [erupt-ai-claw](/modules/erupt-ai-claw)。

## 八、下一期预告

第 02 期我们会写——**Erupt Cube × LLM：让 BI 看板自己给出"为什么变了"**。继续围绕 Harness Engineering 的另一条主线展开。

---

:::info 参与讨论
本期专题对应的开发分支是 [`develop`](https://github.com/erupts/erupt/tree/develop) 与 [`A2A`](https://github.com/erupts/erupt/tree/A2A)。
欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留下你的真实使用场景，下次专题选题会优先考虑社区反馈。
:::
