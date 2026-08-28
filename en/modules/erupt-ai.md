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

3. After startup, the **AI Manager** menu group is registered automatically, containing: LLM, Embedding Model, MCP, A2A, Expert, AI Role, and AI Chat:

<img src="/ai/menu.png" width="1770">

4. Interactive conversation:

<img src="/ai/chat.png" width="1680">

## Driving Any LLM Engine

Add the corresponding large language model; obtain the corresponding key from the model's official website.

<img src="/ai/llm-list.png" width="1770">

<img src="/ai/llm-config.png" width="1770">

Click the corresponding icon to test a model conversation:

<img src="/ai/llm-test.png" width="1770">

## Immersive AI Conversation

:::tip
Converse naturally with large language models in a what-you-see-is-what-you-get interface — code highlighting, Mermaid diagrams, and mathematical formulas render in real time. Supports automatic tool invocation and agent orchestration, letting every interaction reach the true capability boundary of AI.
:::

<img src="/ai/chat-code.png" width="632">

<img src="/ai/chat-chart.png" width="743">

<img src="/ai/chat-math.png" width="768">

## Agent Orchestration

> Enter the corresponding prompt and save

<img src="/ai/agent-list.png" width="1770">

> After creation, the agent appears in the agent list within AI conversations

<img src="/ai/agent-select.png" width="764">

> Dynamic prompt handler — implement the `EruptPromptHandler` interface and select it in the interface

```java
@Component
public class TestPromptHandler implements EruptPromptHandler {
    @Override
    public String name() {
        return "Prompt Handler";
    }

    @Override
    public String handle(String prompt) {
        return prompt + ", you are a test prompt handler";
    }
}
```

<img src="/ai/agent-prompt.png" width="1770">

## Custom Tool Injection

:::info
Use `@AiToolbox` + `@Tool` to register any Spring Bean method as an AI tool. The AI can automatically recognize intent during a conversation and call it, enabling deep interaction with the current system — querying data, triggering business logic, executing operations, all with a single sentence.
:::

**For versions below 1.14.1, see:** https://www.yuque.com/erupts/1.13.x/qsk71q5zyy3segr6_gxxnld#jA3q1

**For version 1.14.1 and above:**

```java
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import xyz.erupt.annotation.ai.AiToolbox;

/**
 * 1. Add the class annotation @AiToolbox
 * 2. Add the @Tool annotation to methods to expose; use @P for parameters
 **/
@AiToolbox
@Component
public class TestTools {

    @Tool("Quickly use the shell open command to help the user open a URL or file path")
    public String call(@P("Path information") String uri) {
        Runtime runtime = Runtime.getRuntime();
        try {
            runtime.exec("open " + uri);
            return "Opened: " + uri;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Tool("Current system hardware information")
    public String systemInfo() {
        try {
            Process process = Runtime.getRuntime().exec("system_profiler SPHardwareDataType");
            return String.join("\n",
                    new BufferedReader(new InputStreamReader(process.getInputStream()))
                            .lines().collect(Collectors.toList()));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}
```

<img src="/ai/tools-demo.png" width="760">

## Role-Level Tool Authorization <Badge type="tip" text="v1.14.3+" />

:::tip
AI capabilities are no longer one-size-fits-all. By independently configuring a **system prompt** and **tool permissions** for each role, each user sees an AI tailored to their position upon login — finance staff chat about reports, DevOps engineers query logs, business users ask about data, each getting exactly what they need with no overlap.

Administrators naturally have full tool permissions; other roles are authorized as needed, enabling Claw to be safely deployed in production environments.
:::

In the Role Management interface, check the callable tools for a target role and fill in the dedicated system prompt. Changes take effect immediately:

<img src="/ai/ai-role.png" width="1270">

Configure role permission policies for each AI Tool; different roles can call different tool sets, with fine-grained control over AI capability and security boundaries. Each role can be bound to an independent system prompt, giving users in different positions a dedicated AI assistant.

| | Description |
|---|---|
| **Administrator** | Naturally has all tools; no additional configuration needed |
| **Other Roles** | Authorized by checking in the interface; unchecked tools are completely hidden from that role |
| **System Prompt** | Each role can set an independent prompt to precisely anchor that role's business context and response style |

## Integrating the External MCP Ecosystem

:::info
Connect to any external MCP with full MCP protocol support. Operate any MCP within the Erupt platform, such as controlling a browser or operating desktop files.
:::

<img src="/ai/mcp-config.png" width="1680">

<img src="/ai/mcp-list.png" width="1680">

Example invocation: controlling the Google Chrome browser and combining it with system Tools:

<img src="/ai/mcp-browser.png" width="1861">

## Built-In MCP Server

:::tip
Expose the system's AI Tools externally for use by other tools, such as Cursor and Claude Code.
:::

1. Enable the MCP configuration in `application.yml`:

```yaml
erupt:
  ai:
    mcp:
      # Whether to enable the built-in MCP Server (default: false)
      server-enabled: true
      # MCP Server name, default erupt-mcp
      name: erupt-mcp
      # MCP Server description (optional)
      description:
```

2. Add the MCP configuration in Claude Code / Cursor / VS Code:

<img src="/ai/mcp-server-config.png" width="1269">

```json
{
  "mcpServers": {
    "erupt": {
      "type": "sse",
      "url": "http://localhost:9999/mcp/sse",
      "headers": {
        "Authorization": "Bearer {{your secret}}"
      }
    }
  }
}
```

:::warning Endpoints
The SSE endpoint is `/mcp/sse`; the JSON-RPC message endpoint is `/mcp` (POST). If your client appends `/sse` automatically, `http://localhost:9999/mcp` also works.
:::

The Authorization value can be generated from the Open API menu — it corresponds to the "Secret Key" column. Keep it safe and do not expose it.

<img src="/ai/openapi-key.png" width="1519">

3. Connection successful:

<img src="/ai/mcp-connected.png" width="656">

4. Cursor interaction demo:

<img src="/ai/cursor-1.png" width="293">

<img src="/ai/cursor-2.png" width="294">

<img src="/ai/cursor-3.png" width="431">

## Dynamic System Prompt Injection

:::tip
Supports **dynamic extension** of the system prompt — injected on demand when a user sends a question, precisely controlling token consumption while improving answer relevance and accuracy.
:::

1. Implement the `SystemPromptProvider` interface
2. Call `registerProvider`
3. Implement the `getPrompt` method

```java
@Component
public class OrderAiPrompt implements SystemPromptProvider {

    @PostConstruct
    public void init() {
        SystemPromptProvider.registerProvider(this);
    }

    @Override
    public String getPrompt() {
        return """
                ## Order Assistant
                When the user asks about order-related questions, prioritize querying data with the queryOrder tool before answering.
                Do not fabricate order information. Amount unit is CNY yuan; time format is yyyy-MM-dd HH:mm.
                """;
    }

}
```

## Multi-Agent Collaboration (A2A) <Badge type="tip" text="v1.14.3+" />

Compatible with the [Google A2A protocol](https://google.github.io/A2A/), allowing connection to any Agent service that implements the A2A standard. Go to menu **AI Manager → A2A**, enter the root address of the remote Agent, and the system automatically fetches the AgentCard from `{url}/.well-known/agent.json`. The **Skills** column in the list shows all capabilities declared by that Agent; if connection fails, the error reason is displayed. The Headers field can attach authentication headers in JSON format, e.g. `{"Authorization": "Bearer xxx"}`.

The AI has built-in A2A scheduling logic during conversations: tasks beyond its own capabilities are automatically discovered and delegated to the appropriate sub-agent; tasks it can handle will not trigger delegation. The system automatically refreshes connection status every 60 seconds with no manual restart needed.

## Cross-Session Memory <Badge type="tip" text="v1.14.3+" />

:::info
The AI has persistent memory capabilities, retaining user preferences and conversation context across sessions — creating a truly personalized AI assistant with memory. Different users' memories are isolated from each other and are persisted in the `e_ai_memory` table.
:::

Memory capabilities work out of the box with no additional configuration. The AI automatically writes key information to memory at appropriate times and retrieves it on demand in subsequent conversations.

:::warning
`AiMemory` is not declared as an `@Erupt` entity and registers no menu, so there is no admin UI for it. To inspect or clean up memory entries, query the `e_ai_memory` table directly.
:::

## LlmRequest Request-Level Extensions <Badge type="tip" text="v2.0.0+" />

`LlmRequest` supports injecting additional prompts and behavior switches into a single LLM call — useful for dynamic, context-aware scenarios.

| Field | Description |
|-------|-------------|
| `agentPrompt` | The agent-role prompt for this call — temporarily overrides the agent's system prompt |
| `contextPrompt` | Supplemental context appended to the conversation (e.g., a summary of the currently visible data) |
| `thinking` | Whether to enable the model's thinking mode (default `false`) <Badge type="tip" text="v2.1.0+" /> |
| `responseFormat` | Response format: `text` (default) or `json_object` <Badge type="tip" text="v2.1.0+" /> |
| `tools` | Request-scoped tool objects (langchain4j `@Tool` methods) driving a ReAct loop for this call only — independent from `autoCallTool`, which exposes the global toolbox instead <Badge type="tip" text="v2.1.0+" /> |

These fields are passed by the frontend or integration layer when calling the chat API. Combined with `@Erupt(prompt = "...")` and `@Edit(prompt = "...")`, they allow the AI to understand the business semantics of each entity and field.

## Knowledge Base & Vector Retrieval (RAG) <Badge type="tip" text="v2.1.0+" />

Turn business documents into AI-searchable knowledge; the AI decides autonomously when to query which knowledge base during conversations (Agentic RAG).

See the standalone documentation: [📖 Erupt AI RAG](/en/modules/erupt-ai-rag)

## AI Digital Staff <Badge type="tip" text="v2.1.0+" />

AI staff have a system account, duty persona, and work schedule: they run tasks on cron schedules and push work reports to DingTalk, Feishu, or Slack. Extend the `StaffChannel` abstract class to add other push channels.

See the standalone documentation: [👩‍💻 Erupt AI Staff](/en/modules/erupt-ai-staff)

## Driving Erupt Claw

[Erupt AI Claw](/en/modules/erupt-ai-claw)
