# 表单 AI 写作助手 <Badge type="tip" text="v2.2.0+" />

表单里的文本字段旁多出一个 AI 图标：点开即可让大模型把这个字段写出来、润色、续写、缩写或扩写。生成内容以 SSE 流式返回，**不落库**——只有用户保留它并提交表单，值才真正生效。

![AI 写作助手](/ai/ai-field-assistant-dark.jpg)

# 它知道自己在写什么

模型收到的不只是一句「写点什么」：Erupt 的注解本身就描述了这条记录——`@Erupt(name/desc)` 说明记录类型，`@Edit(title/desc)` 说明字段含义，同表单的其他字段值作为背景一并提供，`@Edit(prompt)` 则是模型所有者对这个字段的写作指引。

```java
@EruptField(
    views = @View(title = "商品详情"),
    edit = @Edit(
        title = "商品详情", type = EditType.MARKDOWN,
        prompt = "面向 C 端消费者，突出卖点与使用场景，不要罗列参数表，300 字以内"
    )
)
private String detail;
```

字段长度限制会作为硬约束写进提示词；输出格式按组件类型自动约定（`CODE_EDITOR` 只出源码，`MARKDOWN` 出 markdown，`HTML_EDITOR` 出 HTML 片段，`INPUT` 出单行纯文本）。

# 支持的动作

| 动作 | 说明 |
| --- | --- |
| `GENERATE` | 根据记录信息从零写出该字段 |
| `POLISH` | 在保持原意与语种的前提下改写得更通顺 |
| `CONTINUE` | 从现有文本断点处续写，只输出续写部分 |
| `SHORTEN` | 用明显更少的字数说完，保留全部事实 |
| `EXPAND` | 在忠于原文的前提下展开细节 |
| `CUSTOM` | 按用户当场输入的指令改写 |

# 适用范围与开关

仅**自由文本类**组件提供该能力：`INPUT`、`TEXTAREA`、`HTML_EDITOR`、`CODE_EDITOR`、`MARKDOWN`。其余组件上 `@Edit(ai)` 由 `@Match` 直接屏蔽。

| 层级 | 开关 | 默认值 |
| --- | --- | --- |
| 模型 | `@Erupt(power = @Power(ai = false))` | `true`，关闭后整个模型不提供助手 |
| 字段 | `@Edit(ai = false)` | `true` |

调用还需满足：当前用户对该模型拥有 `add` 或 `edit` 权限（写入侧的能力，只读用户拿不到），且系统中存在已启用的默认对话模型。

:::warning 上下文里不会出现什么
`PASSWORD`、`ATTACHMENT`、`SIGNATURE`、`MAP`、`TPL`、`BUTTON` 等字段的值**不会**作为上下文发给模型；过长的同表单字段值会截断到 300 字符。
:::

每次调用留下一条审计日志：谁、哪个模型、哪个字段、token 数、耗时——**不记录提示词与生成内容**，那属于业务数据，日志文件不是它该待的地方。

