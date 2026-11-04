# Experts (Preset AI Roles)

An **Expert** freezes "one system prompt + one model + one set of runtime parameters" into a reusable identity. Once configured, users pick it at the top of the chat box and the AI answers as a support agent, a SQL engineer, a finance reviewer — instead of everyone restating the same brief every time.

Experts are maintained under **AI Manager → Expert**, and drag-sorting them sets the order they appear in the chat box.

## What it solves

| Without experts | With experts |
| --- | --- |
| Everyone writes their own prompt; quality varies and results are unstable | Prompts are maintained centrally, so everyone works from the same standard |
| Every new scenario means restating the background | Switching expert switches the role and the tone |
| Using a stronger model for one scenario means changing the global default | Each expert binds its own model, so the expensive one is used only where it matters |
| Temperature and thinking mode are global settings | Parameters travel with the expert: low temperature for precise work, high for creative |

## Configuration

| Field | Meaning |
| --- | --- |
| Name | The expert's name in the chat box |
| Enabled | Disabled experts do not appear in the selector |
| LLM | The model this expert uses — **leave blank to use the default chat model** |
| Prompt | The system prompt: who this expert is, what it is responsible for, how it should answer |
| Prompt Handler | Optional, rewrites the prompt at runtime — see below |
| Hint List | Starter questions shown once the expert is selected, so users are not left wondering what to ask |
| Description | What the expert is for |
| Expert Config | Runtime parameters as JSON: `temperature`, `top_p`, `strictTools` (strict tool calling) and `thinking` (reasoning mode, for models like DeepSeek-R1) |

## Dynamic prompts

A prompt fixed in the configuration often is not enough — the same expert facing different tenants or differently privileged users needs different context. Implement `EruptPromptHandler` to rewrite the prompt before each conversation; register it as a Spring Bean and it becomes selectable in the expert form:

```java
@Component
public class TenantPromptHandler implements EruptPromptHandler {

    @Override
    public String name() {
        return "Tenant context";
    }

    @Override
    public String handle(String prompt) {
        // append runtime context after the prompt the administrator wrote
        return prompt + "\nCurrent tenant: " + TenantContext.name()
                + "\nToday: " + LocalDate.now();
    }

}
```

Typical uses: injecting the current user and roles, the tenant and its data scope, a date-sensitive note, or knowledge-base retrieval results.

:::tip Layers of prompting
The global `system-prompt` applies to every conversation, [prompt engineering](/en/modules/erupt-ai/prompt) adds application- and request-level injection points, and an expert is the identity-level prompt **the user picks**. All of them stack into the system prompt for the turn.
:::
