# WebUI Usage Guide

KiraAI WebUI is the administration panel for configuring and operating an instance. It provides a guided first-run setup as well as management for providers, adapters, personas, plugins, sessions, and logs.

## Open WebUI

Start KiraAI, then open the address printed in the startup log. With the default configuration, WebUI listens on port `5267`:

```text
http://127.0.0.1:5267
```

The listening host and port are stored in `data/webui.json`; the defaults are `0.0.0.0` and `5267`. When accessing an instance through a LAN address or reverse proxy, use the corresponding address shown in the log.

WebUI is protected by an access token by default. The current token is printed in the terminal startup log when KiraAI starts; copy it into the login page if prompted. Keep the token private: it grants administrative access to the instance. Do not disable WebUI authentication for a network-accessible deployment.

## First-run setup

The onboarding flow appears the first time WebUI is opened. Complete the steps in this order:

1. Add a provider and at least one LLM model.
2. Select the default models in **Configuration**.
3. Create or select a persona.
4. Add and enable a chat-platform adapter.

Use the **Logs** page to confirm that the provider and adapter connect successfully. Detailed setup instructions are available in [Provider Configuration](/configuration/provider) and [Adapter Configuration](/configuration/adapter/qq).

## Main pages

| Page | What you can do |
| --- | --- |
| **Overview** | Inspect service status and dashboard widgets supplied by plugins. |
| **Providers** | Add providers, configure models, and run supported model health checks. |
| **Adapters** | Configure and enable connections to chat platforms. |
| **Personas** | Create and manage the personas used by conversations. |
| **Stickers** | Manage the local sticker library. |
| **Configuration** | Set system-wide options, including model defaults and network-related settings. |
| **Add-ons** | Manage installed plugins, the plugin store, MCP servers, Skills, and their session scope. |
| **Sessions** | Inspect and manage conversation sessions. |
| **Logs** | Review runtime output and diagnose connection or configuration errors. |
| **Settings** | Manage WebUI settings and instance data operations exposed by the application. |

The language selector at the bottom of the sidebar switches the WebUI language between English and Chinese. Plugin pages may also provide their own localized labels.

## Safe operation

- Save a configuration change before enabling the related provider, adapter, MCP server, or plugin.
- Treat plugin packages, Skills archives, MCP server definitions, and provider endpoints as trusted-code or trusted-service inputs. Review their source and permissions before adding them.
- If a change does not take effect, refresh the relevant list, review **Logs**, and verify that the corresponding item is enabled.
- Back up the `data/` directory before upgrades or large configuration changes.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| WebUI cannot be opened | Confirm that KiraAI is running, then check the host and port in the startup log and `data/webui.json`. |
| The login page rejects the token | Use the current token from the startup log or update it through **Settings**; do not reuse a token from another instance. |
| A page shows no data | Ensure onboarding is complete, refresh the page, and check **Logs** for backend errors. |
| A remote device cannot connect | Confirm the configured host, firewall and reverse-proxy settings, then use the LAN address printed at startup. Keep authentication enabled. |
