# Expose Erupt as an MCP Server

Expose erupt's own AI Tools as an MCP Server so Cursor, Claude Code, VS Code and other clients can connect directly and read or write erupt entity data in natural language.

For the other direction — mounting external MCP Servers into erupt — see [Connect External MCP Servers](/en/modules/erupt-ai/mcp).

1. Enable the MCP configuration in `application.yml`:

```yaml
erupt:
  ai:
    mcp:
      # Whether to enable the built-in MCP Server (default: false)
      server-enabled: true
      # MCP Server name, default erupt-mcp
      name: erupt-mcp
      # MCP Server description (optional)
      description:
```

2. Add the MCP configuration in Claude Code / Cursor / VS Code:

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

:::warning Endpoints
The SSE endpoint is `/mcp/sse`; the JSON-RPC message endpoint is `/mcp` (POST). If your client appends `/sse` automatically, `http://localhost:9999/mcp` also works.
:::

The Authorization value can be generated from the Open API menu — it corresponds to the "Secret Key" column. Keep it safe and do not expose it.

<img src="/ai/openapi-key.png" width="1519">

3. Connection successful:

<img src="/ai/mcp-connected.png" width="656">

4. Cursor interaction demo:

<img src="/ai/cursor-1.png" width="293">

<img src="/ai/cursor-2.png" width="294">

<img src="/ai/cursor-3.png" width="431">
