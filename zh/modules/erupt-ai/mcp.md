# 接入外部 MCP Server

把外部 MCP Server 挂进 erupt，大模型即可在对话中调用它们的工具——控制浏览器、操作桌面文件、调用第三方服务，与 erupt 自身的 Tool 混合编排。

:::info
支持完整的 MCP 协议，接入后可在 erupt 平台内操作任意 MCP。
:::

反向能力（把 erupt 的 AI Tools 暴露给 Cursor、Claude Code 等客户端）见 [对外提供 MCP Server](/zh/modules/erupt-ai/mcp-server)。

## 添加 MCP Server

<img src="/ai/mcp-config.png" width="1680">

<img src="/ai/mcp-list.png" width="1680">

## 调用示例

操控 Google 浏览器，并且与当前系统 Tool 配合使用：

<img src="/ai/mcp-browser.png" width="1861">
