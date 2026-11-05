# MCP 功能

模型上下文协议（MCP）允许 KiraAI 连接外部工具服务器。服务器启用后，其工具会注册给 Agent，LLM 可在合适时选择调用。

## 添加 MCP 服务器

1. 在 WebUI 中打开 **插件**，切换到 **MCP** 标签页。
2. 点击 **添加 MCP 服务器**。
3. 填写显示名称、可选描述和服务器配置 JSON。
4. 保存服务器，确认工具数量后，打开服务器开关。

KiraAI 将配置保存在 `data/config/mcp.json`。WebUI 会管理服务器标识和启用状态；连接参数请在 JSON 编辑器中填写。

## 支持的传输方式

| 传输方式 | 必填字段 | 典型用途 |
| --- | --- | --- |
| `stdio` | `command`，可选 `args`、`env` | 以子进程方式启动本地 MCP 服务器。 |
| `sse` | `url`，可选 `headers` | 连接 SSE MCP 端点。 |
| `streamable_http` | `url`，可选 `headers` | 连接 Streamable HTTP MCP 端点。 |

示例：

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

省略 `type` 时，KiraAI 可根据 `command` 推断为 `stdio`，根据以 `/sse` 结尾的 URL 推断为 `sse`，根据以 `/mcp` 或 `/message` 结尾的 URL 推断为 Streamable HTTP。仍建议明确填写 `type`。

## 管理服务器

- **启用**：KiraAI 会连接服务器并获取工具；如果无法获取工具，服务器会保持禁用状态。
- **编辑**：修改连接配置会关闭当前连接；下次调用工具时将使用新配置重新连接。
- **禁用**：已注册工具会被移除，活动连接会关闭。
- **删除**：删除服务器配置及其已注册工具。

使用 **范围** 标签页可将 MCP 服务器设为全局可用、仅允许指定会话，或拒绝指定会话使用。能访问敏感系统的工具应使用较小的会话范围。

## 安全与排障

MCP 服务器可以提供高权限操作。请只连接可信服务器，使用最小权限凭据，并在服务器自身配置中限制本地文件路径和网络访问范围。

| 现象 | 检查方式 |
| --- | --- |
| 无法启用服务器 | 确认 JSON 有效、传输方式和 URL/命令正确，并确认服务器可访问或可执行。 |
| 工具数为零 | 确认 MCP 服务器实际提供工具，并在 KiraAI 日志中查看握手错误。 |
| 某个会话无法使用工具 | 检查服务器是否已启用，以及会话范围是否允许该会话。 |
| 更新凭据后未生效 | 保存编辑后的配置，再次调用工具以建立新连接。 |
