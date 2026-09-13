# Long-Term Memory

erupt-ai-claw supports cross-session long-term memory persistence via the Memory tool.

During a conversation, the AI automatically judges and saves important information (technical decisions, user preferences, project context, etc.) as memory entries. At the start of the next session, relevant memories are automatically retrieved — no need to re-explain the background.

Memories are persisted in the database (`AiMemory` table), isolated per user — each user can only read and write their own memories.

<img src="/ai-claw/memory-1.png" width="783">

<img src="/ai-claw/memory-2.png" width="748">

<img src="/ai-claw/memory-3.png" width="769">

<img src="/ai-claw/memory-4.png" width="730">

