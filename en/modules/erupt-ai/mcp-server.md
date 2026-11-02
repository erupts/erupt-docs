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

## Module-level Grants: McpAuthenticator

Besides Open API secrets, the MCP endpoint hands every token to the `McpAuthenticator` beans in the context, so a module can issue tokens to its own callers and grant exactly the tools they need. [erupt-ai-dev](/en/modules/erupt-ai-dev), for example, mints a token for each coding agent run so it can report progress and its QA verdict. Module tokens **do not depend** on `server-enabled`: with the switch off user secrets stop working, module tokens still do.

```java
public interface McpAuthenticator {

    /**
     * The grant of a token, or null when the token is not this authenticator's.
     */
    McpGrant authenticate(String token);

}

/**
 * @param uid        user the calls run as, null for a token that acts for no user
 * @param tools      names of the tools the token may list and call
 * @param attachment the issuer's own context, read by its tools through McpContext.attachment(Class)
 */
public record McpGrant(Long uid, Set<String> tools, Object attachment) {
}
```

A tool method reads the issuer's context with `McpContext.attachment(Grant.class)`; called from chat or by another issuer's token it gets `null` and can refuse.

:::tip Tools visible to grants only
A bean marked `@AiToolbox(exposed = false)` is left out of chat agents, AI role settings and user tokens; only an `McpAuthenticator` grant can call its tools. That suits callback-style tools meant for one workflow's agent only.
:::

Other changes to the MCP endpoint in this version:

- **Input schemas come from langchain4j**: the parameter schema in `tools/list` is the one chat models see, so `List`, `Map` and bean parameters are typed arrays and objects instead of plain strings.
- **JSON-text arguments are parsed**: some MCP clients stringify structured arguments (`"[...]"`, `"{...}"`); the endpoint parses them as JSON before the tool runs, while string parameters keep their text.
- **A call acting for a user runs in that user's tenant**: each `tools/call` opens a short login session for the user (5 minutes, logged out when the call returns), so tools that check menus and powers behave as they do in chat.
- **A locked Open API record is refused**: a disabled record keeps its secret but no longer authenticates, the same as the Open API login.
