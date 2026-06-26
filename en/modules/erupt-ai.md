# Erupt AI Deep LLM Integration

Deep integration with today's popular large language models for low-code AI application development.

<a href="https://www.erupt.xyz/#!/ai" target="_blank">
  <img src="/ai/banner.png" width="1747">
</a>

:::tip Fully Embracing Harness Engineering
:::

| **Capability** | **Description** |
|---|---|
| **LLM** | Supports: ChatGPT, Claude, Gemini, Ollama, Qwen, Doubao, GLM, DeepSeek, Moonshot, MinMax, Mistral, Grok, Fireworks, Together, OpenRouter, and more |
| **Chat** | Session management (AiChat), message history (AiChatMessage), SSE streaming output, configurable context rounds (maxContext) |
| **Agent** | Customizable visual control of prompts; dynamically controllable agent prompt words |
| **Tools** | Register tools via `@AiToolbox` + `@Tool` and call them during conversations; EruptAiToolbox provides base model list, Schema, current user, HQL query, module list, and more |
| **MCP** | Supports mounting external MCP Servers for flexible tool capability extension |
| **MCP Server** | Built-in MCP Server with Bearer authentication; supports direct connection from Cursor / Claude and other clients |
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
    # SSE timeout in milliseconds
    sse-timeout: 300000
    # Typing configuration
    message-chunk-size: 20
    message-delay: 30
```

3. After startup, the following menus are added:

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
import xyz.erupt.ai.annotation.AiToolbox;

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
      server-enabled: true
```

2. Add the MCP configuration in Claude Code / Cursor / VS Code:

<img src="/ai/mcp-server-config.png" width="1269">

```json
{
  "mcpServers": {
    "erupt": {
      "type": "sse",
      "url": "http://localhost:9999/mcp",
      "headers": {
        "Authorization": "Bearer {{your secret}}"
      }
    }
  }
}
```

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

Compatible with the [Google A2A protocol](https://google.github.io/A2A/), allowing connection to any Agent service that implements the A2A standard. Go to menu **AI → A2A Agent**, enter the root address of the remote Agent, and the system automatically fetches the AgentCard from `{url}/.well-known/agent.json`. The **Skills** column in the list shows all capabilities declared by that Agent; if connection fails, the error reason is displayed. The Headers field can attach authentication headers in JSON format, e.g. `{"Authorization": "Bearer xxx"}`.

The AI has built-in A2A scheduling logic during conversations: tasks beyond its own capabilities are automatically discovered and delegated to the appropriate sub-agent; tasks it can handle will not trigger delegation. The system automatically refreshes connection status every 60 seconds with no manual restart needed.

## Cross-Session Memory <Badge type="tip" text="v1.14.3+" />

:::info
The AI has persistent memory capabilities, retaining user preferences and conversation context across sessions — creating a truly personalized AI assistant with memory. Different users' memories are isolated from each other; administrators can view and manage all users' memory entries in the backend.
:::

Memory capabilities work out of the box with no additional configuration. The AI automatically writes key information to memory at appropriate times and retrieves it on demand in subsequent conversations.

## agentPrompt and contextPrompt <Badge type="tip" text="v2.0.0+" />

`LlmRequest` gains two optional fields for injecting additional prompts into a single LLM call — useful for dynamic, context-aware scenarios.

| Field | Description |
|-------|-------------|
| `agentPrompt` | The agent-role prompt for this call — temporarily overrides the agent's system prompt |
| `contextPrompt` | Supplemental context appended to the conversation (e.g., a summary of the currently visible data) |

Both fields are passed by the frontend or integration layer when calling the chat API. Combined with `@Erupt(prompt = "...")` and `@Edit(prompt = "...")`, they allow the AI to understand the business semantics of each entity and field.

## Driving Erupt Claw

[Erupt AI Claw](/en/modules/erupt-ai-claw)
