# 对外提供 MCP Server

把 erupt 自身的 AI Tools 作为 MCP Server 对外暴露，Cursor、Claude Code、VS Code 等客户端即可直连，用自然语言读写 erupt 的实体数据。

反向能力（把外部 MCP 挂进 erupt）见 [接入外部 MCP Server](/zh/modules/erupt-ai/mcp)。

1. 在 `application.yml` 中开启 MCP 配置：

```yaml
erupt:
  ai:
    mcp:
      # 是否启用内置 MCP Server（默认 false）
      server-enabled: true
      # MCP Server 名称，默认 erupt-mcp
      name: erupt-mcp
      # MCP Server 描述（可选）
      description:
```

2. 在 Claude Code / Cursor / VS Code 中增加 MCP 配置：

<img src="/ai/mcp-server-config.png" width="1269">

```json
{
  "mcpServers": {
    "erupt": {
      "type": "sse",
      "url": "http://localhost:9999/mcp/sse",
      "headers": {
        "Authorization": "Bearer {{your secret}}"
      }
    }
  }
}
```

:::warning 端点说明
SSE 端点为 `/mcp/sse`，JSON-RPC 消息端点为 `/mcp`（POST）。若客户端会自动补全 `/sse`，则填写 `http://localhost:9999/mcp` 也可以。
:::

Authorization 可进入 Open API 菜单生成，值对应"秘钥"列，请注意妥善保管切勿泄露。

<img src="/ai/openapi-key.png" width="1519">

3. 连接成功：

<img src="/ai/mcp-connected.png" width="656">

4. Cursor 交互效果演示：

<img src="/ai/cursor-1.png" width="293">

<img src="/ai/cursor-2.png" width="294">

<img src="/ai/cursor-3.png" width="431">

## 模块级授权 McpAuthenticator

MCP 端点除了接受 Open API 秘钥，还会把 token 交给容器中所有 `McpAuthenticator` Bean 逐个认证，因此一个模块可以给自己的调用方签发 token，并精确授权一组工具——例如 [erupt-ai-dev](/zh/modules/erupt-ai-dev) 为每次编码 Agent 运行签发一枚 token，让它上报进度与 QA 结论。模块 token **不依赖** `server-enabled`：开关关闭时用户秘钥不可用，模块 token 依然有效。

```java
public interface McpAuthenticator {

    /**
     * 该 token 的授权；不是本认证器签发的 token 时返回 null
     */
    McpGrant authenticate(String token);

}

/**
 * @param uid        调用以哪个用户身份执行，null 表示不代表任何用户
 * @param tools      允许列出和调用的工具名
 * @param attachment 签发方自己的上下文，工具内通过 McpContext.attachment(Class) 读取
 */
public record McpGrant(Long uid, Set<String> tools, Object attachment) {
}
```

工具方法通过 `McpContext.attachment(Grant.class)` 拿到签发方放入的上下文；从对话或其他模块 token 调用时得到 `null`，可据此拒绝。

:::tip 只对授权可见的工具
`@AiToolbox(exposed = false)` 标记的 Bean 不会出现在对话 Agent、AI 角色设置与用户 token 的工具列表中，只能通过 `McpAuthenticator` 的授权调用。适合"只有某个流程的 Agent 才能调用"的回调类工具。
:::

本版本 MCP 端点的其他变化：

- **输入 schema 来自 langchain4j**：`tools/list` 返回的参数 schema 与对话模型看到的一致，`List`、`Map` 与 Bean 参数分别是类型化的数组与对象，不再统一为字符串。
- **JSON 文本参数自动解析**：有些 MCP 客户端会把结构化参数序列化成字符串发送（`"[...]"`、`"{...}"`），端点会按 JSON 解析后再传给工具；字符串参数保持原文。
- **以用户身份调用时在其租户内执行**：每次 `tools/call` 会为该用户开一段短暂的登录会话（5 分钟，调用结束即注销），因此检查菜单与权限的工具行为与对话中一致。
- **锁定的 Open API 记录被拒绝**：记录停用后秘钥保留但不再能认证，与 Open API 登录行为一致。
