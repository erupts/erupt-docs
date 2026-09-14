# 动态注入系统提示词

除了全局 `system-prompt` 与 Agent 提示词，erupt-ai 还提供两个更细粒度的提示词注入点：应用级的 `SystemPromptProvider` 与请求级的 `LlmRequest`。

## 动态 System Prompt 注入

:::tip
支持**动态扩展**系统提示词，在用户发起提问时按需注入，精准控制 Token 消耗，同时提升回答的相关性与准确性。
:::

1. 实现 `SystemPromptProvider` 接口
2. 注册 `registerProvider`
3. 实现 `getPrompt` 方法体

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
                ## 订单助手
                当用户询问订单相关问题时，优先通过 queryOrder 工具查询数据后再作答，
                不要凭空捏造订单信息。金额单位为人民币元，时间格式为 yyyy-MM-dd HH:mm。
                """;
    }

}
```

## LlmRequest 请求级扩展 <Badge type="tip" text="v2.0.0+" />

`LlmRequest` 支持在单次 LLM 调用时注入额外提示词与行为开关，适合动态场景下的上下文感知。

| 字段 | 说明 |
|------|------|
| `agentPrompt` | 本次调用的 Agent 角色提示词，相当于临时覆盖 Agent 的 system prompt |
| `contextPrompt` | 本次调用的上下文补充说明，追加在对话上下文末尾（如当前页面数据摘要） |
| `thinking` | 是否开启模型思考模式（默认 `false`） <Badge type="tip" text="v2.1.0+" /> |
| `responseFormat` | 响应格式：`text`（默认）或 `json_object` <Badge type="tip" text="v2.1.0+" /> |
| `tools` | 请求级工具对象列表（携带 langchain4j `@Tool` 方法），仅在本次调用中驱动 ReAct 循环，与暴露全局工具箱的 `autoCallTool` 相互独立 <Badge type="tip" text="v2.1.0+" /> |

这些字段由前端或集成方在调用聊天 API 时传入，可实现页面级、字段级的 AI 感知。与 `@Erupt(prompt = "...")` 和 `@Edit(prompt = "...")` 配合使用，可让 AI 理解每个实体和字段的业务语义。

