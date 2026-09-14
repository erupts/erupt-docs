# 🦞 长期记忆

erupt-ai-claw 支持通过 Memory 工具实现跨会话的长期记忆持久化。

对话过程中，AI 会自动判断并将重要信息（技术决策、用户偏好、项目上下文等）保存为记忆条目，下次会话开始时自动检索相关记忆，无需重复说明背景。

记忆持久化在数据库中（`AiMemory` 表），按用户隔离——每个用户只能读写自己的记忆。

<img src="/ai-claw/memory-1.png" width="783">

<img src="/ai-claw/memory-2.png" width="748">

<img src="/ai-claw/memory-3.png" width="769">

<img src="/ai-claw/memory-4.png" width="730">

