# Inject System Prompts Dynamically

Beyond the global `system-prompt` and agent prompts, erupt-ai offers two finer-grained injection points: the application-level `SystemPromptProvider` and the request-level `LlmRequest`.

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

