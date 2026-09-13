# Erupt AI 大模型深度集成

与当下流行的大模型深度集成，低代码开发大模型应用。

<a href="https://www.erupt.xyz/#!/ai" target="_blank">
  <img src="/ai/banner.png" width="1747">
</a>

:::tip 全面拥抱 Harness Engineering
:::

| **能力** | **说明** |
|---|---|
| **LLM** | 内置 19 个适配器：ChatGPT、Claude、Gemini、Ollama、Qwen、Doubao、GLM、DeepSeek、Moonshot、MiniMax、Mistral、Grok、Mimo、Fireworks、Together、OpenRouter、OrcaRouter、Requesty，以及可对接任意 OpenAI 兼容接口的 Open AI Adapter |
| **Chat** | 会话管理（AiChat）、消息历史（AiChatMessage）、SSE 流式输出、可配置上下文轮次（maxContext） |
| **Agent** | 自定义可视化控制 Prompt、可动态控制 Agent 提示词 |
| **Tools** | 通过 `@AiToolbox` + `@Tool` 注册工具并在对话中调用；erupt-ai 内置 `EruptUserTools`（当前用户信息、角色与菜单权限、服务器时间），erupt-ai-claw 另提供 `EruptModelTools`（模块列表、模型列表、模型 Schema，以及基于结构化 filter / sort / page 参数的数据增删改查）|
| **MCP** | 支持挂载外部 MCP Server，灵活扩展工具能力 |
| **MCP Server** | 内置 MCP Server，Bearer 鉴权，支持 Cursor / Claude 等客户端直连 |
| **知识库（RAG）** | 可视化知识库管理：文档上传、自动分块、向量嵌入、语义检索，AI 对话中自主调用（Agentic RAG） |
| **向量存储** | 可插拔向量存储层，支持 Qdrant / Milvus / PGVector / Redis / Memory 五种后端 |
| **AI 员工** | 数字员工绑定系统账户与职责人设，定时执行任务并将工作报告推送至钉钉 / 飞书 / Slack（可继承 `StaffChannel` 抽象类自行扩展渠道）|
| **Security** | 内置严格的接口权限控制，AI 聊天能力可以通过用户权限动态授予 |

## 快速接入

1. 添加依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. 可配置项：

```yaml
erupt:
  ai:
    # 定义全局系统提示词
    system-prompt: |
      你是 Erupt AI，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。
      同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。
      Erupt AI 为专有名词，不可翻译成其他语言。
    # SSE 超时时间（毫秒，默认 15 分钟）
    sse-timeout: 900000
    # 打字配置
    message-chunk-size: 20
    message-delay: 30
    # 单轮对话中连续工具调用的最大次数，超出后 ReAct 循环终止，防止工具调用失控
    max-sequential-tools-invocations: 30
```

3. 启动后会自动注册 **AI Manager** 菜单组：大模型（LLM）、向量模型（Embedding Model）、连接器（MCP）、外部智能体（A2A）、专家（Expert）、AI 设定（AI Role）、AI 对话（AI Chat）；引入 [erupt-ai-claw](/zh/modules/erupt-ai-claw/) 后还会多出「技能」：

<img src="/ai/menu.png" width="1770">

4. 交互式对话，可在任意页面右侧唤起，直接对当前数据提问：

<img src="/ai/chat.png" width="1680">

## 功能导航

| 页面 | 内容 |
|---|---|
| [LLM 接入](/zh/modules/erupt-ai/llm) | 添加与测试大模型，19 个内置适配器 |
| [AI 对话](/zh/modules/erupt-ai/chat) | 沉浸式对话、多模态图片输入、模型选择器 |
| [专家](/zh/modules/erupt-ai/agent) | 把提示词、模型与参数固化成可选身份，`EruptPromptHandler` 动态改写提示词 |
| [工具与角色授权](/zh/modules/erupt-ai/tools) | `@AiToolbox` + `@Tool` 注册工具，按角色授权工具与系统提示词 |
| [接入 MCP 生态](/zh/modules/erupt-ai/mcp) | 挂载外部 MCP Server，扩展大模型可用的工具 |
| [内置 MCP Server](/zh/modules/erupt-ai/mcp-server) | 把 erupt 的 AI Tools 暴露出去，Cursor / Claude Code 直连 |
| [提示词工程](/zh/modules/erupt-ai/prompt) | `SystemPromptProvider` 动态注入，`LlmRequest` 请求级扩展 |
| [多 Agent 协作（A2A）](/zh/modules/erupt-ai/a2a) | 兼容 Google A2A 协议，自动发现并委派子 Agent |
| [跨会话记忆](/zh/modules/erupt-ai/memory) | 按用户隔离的持久化记忆 |
| [AI 写作助手](/zh/modules/erupt-ai/writing-assistant) | 表单文本字段的生成 / 润色 / 续写 / 缩写 / 扩写 |

## 扩展模块

| 模块 | 说明 |
|---|---|
| [🦞 Erupt AI Claw](/zh/modules/erupt-ai-claw/) | 自然语言驱动服务器：操作 Erupt 数据、执行 Shell、读写文件、Agent Skills |
| [🎨 Erupt AI Canvas](/zh/modules/erupt-ai-canvas) | 一句话生成页面，数据实时来自 Erupt 后端 |
| [📖 Erupt AI RAG](/zh/modules/erupt-ai-rag) | 知识库与向量检索，AI 自主决定何时查询哪个知识库（Agentic RAG） |
| [👩‍💻 Erupt AI Staff](/zh/modules/erupt-ai-staff) | 数字员工：系统账户 + 职责人设 + cron 排班，工作报告推送到钉钉 / 飞书 / Slack |
