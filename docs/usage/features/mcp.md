# MCP Feature

Model Context Protocol (MCP) lets KiraAI connect to external tool servers. Once a server is enabled, its tools are registered for the agent and can be selected by the LLM when appropriate.

## Add an MCP server

1. Open **Plugins** in WebUI and select the **MCP** tab.
2. Click **Add MCP Server**.
3. Enter a display name, an optional description, and the server configuration JSON.
4. Save the server, verify its tool count, then turn on the server switch.

KiraAI stores the configuration in `data/config/mcp.json`. The WebUI manages the server identifier and enabled state; use the JSON editor for the connection settings.

## Supported transports

| Transport | Required fields | Typical use |
| --- | --- | --- |
| `stdio` | `command`, optional `args` and `env` | Start a local MCP server as a subprocess. |
| `sse` | `url`, optional `headers` | Connect to an SSE MCP endpoint. |
| `streamable_http` | `url`, optional `headers` | Connect to a Streamable HTTP MCP endpoint. |

Examples:

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/safe-workspace"]
}
```

```json
{
  "type": "streamable_http",
  "url": "https://example.com/mcp",
  "headers": {
    "Authorization": "Bearer <token>"
  }
}
```

When `type` is omitted, KiraAI can infer `stdio` from `command`, `sse` from a URL ending in `/sse`, and Streamable HTTP from a URL ending in `/mcp` or `/message`. Specify `type` explicitly when possible.

## Manage a server

- **Enable**: KiraAI connects to the server and fetches its tools. If no tools can be fetched, the server remains disabled.
- **Edit**: Updating connection settings closes the current connection; the next tool use reconnects with the new settings.
- **Disable**: Registered tools are removed and the active connection is closed.
- **Delete**: Removes the server configuration and its registered tools.

The **Scope** tab can make an MCP server global, allow it only for selected sessions, or deny it for selected sessions. Use a narrow scope for tools that access sensitive systems.

## Security and troubleshooting

An MCP server can expose powerful actions. Only connect to servers you trust, use least-privilege credentials, and restrict local filesystem paths and network access in the server's own configuration.

| Symptom | Check |
| --- | --- |
| Server cannot be enabled | Confirm the JSON is valid, the transport and URL/command are correct, and the server is reachable or executable. |
| Tool count is zero | Confirm the MCP server actually exposes tools and inspect KiraAI logs for handshake errors. |
| A tool is unavailable in one conversation | Check that the server is enabled and that its session scope permits that session. |
| Updated credentials have no effect | Save the edited configuration, then retry the tool so KiraAI opens a fresh connection. |
