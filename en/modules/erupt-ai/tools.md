# Tools & Role Authorization

Tools are the bridge between the AI and your business system: any Spring Bean method can be registered as a tool and invoked by intent, and role-level authorization draws a separate tool boundary for each position.

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

