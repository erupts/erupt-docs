# 多 Agent 协作（A2A） <Badge type="tip" text="v1.14.3+" />

兼容 [Google A2A 协议](https://google.github.io/A2A/)，可接入任意实现了 A2A 标准的 Agent 服务。进入菜单 **AI Manager → A2A**，填写远端 Agent 的根地址，系统自动从 `{url}/.well-known/agent.json` 拉取 AgentCard，列表中的 **Skills** 列会展示该 Agent 声明的所有能力，连接失败时显示错误原因。Headers 字段可附加鉴权头，格式为 JSON，例如 `{"Authorization": "Bearer xxx"}`。

AI 在对话中内置 A2A 调度逻辑：任务超出自身能力范围时自动发现并委派给合适的子 Agent，可自行处理的任务不会触发委派。系统每 60 秒自动刷新一次连接状态，无需手动重启。

