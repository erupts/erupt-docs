# Erupt AI Deep LLM Integration

Deep integration with today's popular large language models for low-code AI application development.

<a href="https://www.erupt.xyz/#!/ai" target="_blank">
  <img src="/ai/banner.png" width="1747">
</a>

:::tip Fully Embracing Harness Engineering
:::

| **Capability** | **Description** |
|---|---|
| **LLM** | 19 built-in adapters: ChatGPT, Claude, Gemini, Ollama, Qwen, Doubao, GLM, DeepSeek, Moonshot, MiniMax, Mistral, Grok, Mimo, Fireworks, Together, OpenRouter, OrcaRouter, Requesty, plus an Open AI Adapter for any OpenAI-compatible endpoint |
| **Chat** | Session management (AiChat), message history (AiChatMessage), SSE streaming output, configurable context rounds (maxContext) |
| **Agent** | Customizable visual control of prompts; dynamically controllable agent prompt words |
| **Tools** | Register tools via `@AiToolbox` + `@Tool` and call them during conversations; erupt-ai ships `EruptUserTools` (current user info, roles and menu permissions, server time), and erupt-ai-claw adds `EruptModelTools` (module list, model list, model schema, plus CRUD over model data driven by structured filter / sort / page parameters) |
| **MCP** | Supports mounting external MCP Servers for flexible tool capability extension |
| **MCP Server** | Built-in MCP Server with Bearer authentication; supports direct connection from Cursor / Claude and other clients |
| **Knowledge Base (RAG)** | Visual knowledge base management: document upload, automatic chunking, vector embedding, semantic retrieval — invoked autonomously by the AI during conversations (Agentic RAG) |
| **Vector Store** | Pluggable vector store layer supporting Qdrant / Milvus / PGVector / Redis / Memory backends |
| **AI Staff** | Digital employees bound to system accounts and duty personas; run scheduled tasks and push work reports to DingTalk / Feishu / Slack (extend the `StaffChannel` abstract class to add your own channel) |
| **Security** | Built-in strict interface permission control; AI chat capabilities can be dynamically granted through user permissions |

## Quick Start

1. Add the dependency:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. Configuration options:

```yaml
erupt:
  ai:
    # Define the global system prompt
    system-prompt: |
      You are Erupt AI, skilled at conversations in both Chinese and English. You provide safe, helpful, and accurate answers.
      You will refuse to answer any questions involving terrorism, racial discrimination, pornography, violence, etc.
      Erupt AI is a proper noun and should not be translated into other languages.
    # SSE timeout in milliseconds (default: 15 minutes)
    sse-timeout: 900000
    # Typing configuration
    message-chunk-size: 20
    message-delay: 30
    # Max sequential tool invocations per chat turn; the ReAct loop aborts beyond this, guarding against runaway tool-call loops
    max-sequential-tools-invocations: 30
```

3. After startup, the **AI Manager** menu group is registered automatically: Language Model (LLM), Embedding Model, Connector (MCP), External Agent (A2A), Expert, AI Role and AI Chat — plus Skill once [erupt-ai-claw](/en/modules/erupt-ai-claw/) is added:

<img src="/ai/menu.png" width="1770">

4. Interactive conversation — open it on the right of any page and ask about the data in front of you:

<img src="/ai/chat.png" width="1680">

## Feature Guide

| Page | Contents |
|---|---|
| [Configure LLMs](/en/modules/erupt-ai/llm) | Add and test models, 19 built-in adapters |
| [Chat Workbench](/en/modules/erupt-ai/chat) | Immersive conversation, multimodal image input, model picker |
| [Experts (Preset AI Roles)](/en/modules/erupt-ai/agent) | Freeze a prompt, model and parameters into a selectable identity; rewrite prompts with `EruptPromptHandler` |
| [Build Custom Tools](/en/modules/erupt-ai/tools) | Register any Spring Bean method as an AI tool with `@AiToolbox` + `@Tool` |
| [Authorize Tools by Role](/en/modules/erupt-ai/tool-auth) | Draw each role's tool boundary and give it its own system prompt |
| [Connect External MCP Servers](/en/modules/erupt-ai/mcp) | Mount external MCP Servers to widen the model's toolset |
| [Expose Erupt as an MCP Server](/en/modules/erupt-ai/mcp-server) | Expose erupt's AI Tools so Cursor / Claude Code can connect |
| [Inject System Prompts Dynamically](/en/modules/erupt-ai/prompt) | `SystemPromptProvider` dynamic injection, `LlmRequest` request-level extensions |
| [Connect External Agents (A2A)](/en/modules/erupt-ai/a2a) | Google A2A protocol, automatic discovery and delegation to sub-agents |
| [Long-Term Memory](/en/modules/erupt-ai/memory) | Persistent memory isolated per user |
| [AI Writing Assistant for Forms](/en/modules/erupt-ai/writing-assistant) | Generate / polish / continue / shorten / expand form text fields |

## Extension Modules

| Module | Description |
|---|---|
| [🦞 Erupt AI Claw](/en/modules/erupt-ai-claw/) | Drive the server with natural language: operate Erupt data, run shell, read/write files, Agent Skills |
| [🎨 Erupt AI Canvas](/en/modules/erupt-ai-canvas) | Generate a page from one sentence, wired live to the Erupt backend |
| [📖 Erupt AI RAG](/en/modules/erupt-ai-rag) | Knowledge bases with vector retrieval; the AI decides when to query which base (Agentic RAG) |
| [👩‍💻 Erupt AI Staff](/en/modules/erupt-ai-staff) | Digital staff: system account + duty persona + cron schedule, reports pushed to DingTalk / Feishu / Slack |
