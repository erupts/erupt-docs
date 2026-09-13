# Connect External Agents (A2A) <Badge type="tip" text="v1.14.3+" />

Compatible with the [Google A2A protocol](https://google.github.io/A2A/), allowing connection to any Agent service that implements the A2A standard. Go to menu **AI Manager → A2A**, enter the root address of the remote Agent, and the system automatically fetches the AgentCard from `{url}/.well-known/agent.json`. The **Skills** column in the list shows all capabilities declared by that Agent; if connection fails, the error reason is displayed. The Headers field can attach authentication headers in JSON format, e.g. `{"Authorization": "Bearer xxx"}`.

The AI has built-in A2A scheduling logic during conversations: tasks beyond its own capabilities are automatically discovered and delegated to the appropriate sub-agent; tasks it can handle will not trigger delegation. The system automatically refreshes connection status every 60 seconds with no manual restart needed.

