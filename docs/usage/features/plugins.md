# Plugin System

KiraAI supports rich plugin extensions, allowing you to easily customize and enhance the functionality of AI digital life.

## What is a Plugin?

A plugin is a modular extension that allows you to add new features to KiraAI without modifying the core code. Each plugin can provide specific functionality, expanding the capabilities of digital life.

## Plugin Features

### Event Hooks

Plugins can listen to system events at every stage of message processing — from receiving an IM message, through LLM processing, to sending replies. This allows plugins to inject prompts, modify responses, and react to system events.

### Custom Tools

Plugins can register callable tools that the LLM can invoke during conversations. For example, a search plugin can register a `web_search` tool that the LLM calls when it needs to look up information.

### Custom Tags

Plugins can register custom XML tag handlers. When the LLM outputs XML tags (e.g., `<sticker>`), the corresponding handler processes them into message elements like images or audio.

### REST API Endpoints

Plugins can expose HTTP API endpoints via FastAPI, enabling external systems to interact with the plugin.

### WebUI Pages

Plugins can register custom web pages that are embedded into KiraAI's WebUI, with built-in theme adaptation and a Bridge SDK for seamless frontend-backend communication.

### Overview Widgets

Plugins can register dynamic widgets on the Overview dashboard page — both compact stat cards and full-width HTML cards. Widget functions are called in real-time on each dashboard refresh, with built-in dark mode support via Tailwind CSS.

### Configuration System

Plugins can define a configuration schema (`schema.json`) with 15+ field types, providing a rich settings UI in the WebUI without writing any frontend code.

## Builtin Plugins

KiraAI ships with several builtin plugins:

| Plugin          | Description                                      |
| --------------- | ------------------------------------------------ |
| `chat`          | Core message routing, buffering, and strategy    |
| `kira-ai`       | XML tag injection and LLM response auto-repair   |
| `memory`        | Long-term memory management for the AI           |
| `sticker`       | Sticker/emoji support in conversations           |
| `search`        | Web search capability for the LLM                |
| `file`          | File operations (read, write, list)              |
| `session_tools` | Cross-session awareness and management           |

## Install and manage plugins

Open **Plugins** in WebUI and use the **Plugins** tab to manage installed plugins:

1. Click **Add Plugin** to install from a GitHub repository URL or upload a plugin ZIP archive.
2. Review the plugin's name, author, version, required KiraAI version, repository, and requested behavior before installing it.
3. Use the switch on its card to enable or disable it. Use **Configure** when the plugin provides a configuration schema, and **Reload** after changing plugin files or settings.
4. Use **Update** when an update is available. Only uninstall plugins marked as uninstallable; builtin plugins are part of KiraAI and cannot be removed from WebUI.

The **Plugin Store** tab lists plugins from the selected store source. It can install or update listed plugins and lets you add, select, or remove store sources. Store data may be cached temporarily when a source is unavailable.

> Only install plugins from sources you trust. A plugin can run code, register tools, access configured services, and install its declared dependencies.

## MCP, Skills, and scope

The **MCP** and **Skills** tabs are managed alongside plugins:

- [MCP](/usage/features/mcp) connects external tool servers to KiraAI.
- [Skills](/usage/features/skills) adds reusable task instructions for the agent.
- The **Scope** tab controls whether each MCP server or Skill is global, allowed only for selected sessions, or denied for selected sessions.

Use a narrow scope for capabilities that access files, external services, or private information.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Installation fails | Verify the repository/archive is valid, reachable, and compatible with the current KiraAI version; then inspect **Logs** for dependency or load errors. |
| Plugin is installed but inactive | Confirm its switch is enabled. If it has configuration, save valid values and reload the plugin. |
| A plugin page or widget is missing | Check that the plugin is enabled and loaded successfully; then refresh the browser and inspect **Logs**. |
| A tool is unavailable in one session | Check the MCP/Skill scope and the enabled state of the corresponding capability. |

## Plugin Development

You can develop your own plugins according to the [Plugin Development Guide](/development/plugins/dev-guide).

Key documentation:

- [Development Guide](/development/plugins/dev-guide) — Overview and quick start
- [manifest.json](/development/plugins/manifest) — Plugin metadata and versioning
- [Configuration System](/development/plugins/config-system) — schema.json and UI fields
- [Main Class](/development/plugins/main-class) — BasePlugin lifecycle
- [Hook System](/development/plugins/hooks) — Events, tools, and tags
- [API Registration](/development/plugins/fast-api) — REST APIs, pages, and static resources
- [Plugin Context](/development/plugins/context) — PluginContext API reference
