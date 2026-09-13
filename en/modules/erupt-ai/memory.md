# Long-Term Memory <Badge type="tip" text="v1.14.3+" />

:::info
The AI has persistent memory capabilities, retaining user preferences and conversation context across sessions — creating a truly personalized AI assistant with memory. Different users' memories are isolated from each other and are persisted in the `e_ai_memory` table.
:::

Memory capabilities work out of the box with no additional configuration. The AI automatically writes key information to memory at appropriate times and retrieves it on demand in subsequent conversations.

:::warning
`AiMemory` is not declared as an `@Erupt` entity and registers no menu, so there is no admin UI for it. To inspect or clean up memory entries, query the `e_ai_memory` table directly.
:::

