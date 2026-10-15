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
| **WebChat** | Talk directly with Kira using text, images, and files. |
| **Stickers** | Manage the local sticker library. |
| **Configuration** | Set system-wide options, including model defaults and network-related settings. |
| **Add-ons** | Manage installed plugins, the plugin store, MCP servers, Skills, and their session scope. |
| **Sessions** | Inspect message history and LLM context, and manage session details and capability overrides. |
| **Logs** | Review runtime output and diagnose connection or configuration errors. |
| **Settings** | Manage WebUI settings and instance data operations exposed by the application. |

The language selector at the bottom of the sidebar switches the WebUI language between English and Chinese. Plugin pages may also provide their own localized labels.

## WebChat

Use **WebChat** to talk directly with Kira without connecting an external chat platform. Before the first message, set your nickname, the peer nickname, and the chat description, and configure a default LLM and persona.

It supports text, images, and files. Replies use the existing plugins, Agent, and delivery pipeline. Each input permits up to 16000 characters and 10 attachments, with a combined attachment size of 20 MiB.

Chat settings control file tools and command execution separately. File tools are enabled by default, while command execution is disabled. Enable permissions as needed. Successful submission means the input was accepted; the model reply appears later in the message list.

The application-owned `webchat` adapter provides this feature using SID `webchat:dm:admin`. Do not create an ordinary adapter instance with the same name. Display records live in `data/webchat/webchat.db` and media in `data/webchat/media/`.

**Delete chat history** removes only WebChat's own archive and media. Chat settings and the session's LLM context remain. To reset model context, clear it separately in Sessions.

## Session history and LLM context

Session details separate **Message History** from **LLM Context**. History shows actual structured incoming and outgoing messages, media, and replies; context shows the chunks sent to the model.

They have independent retention. Trimming or clearing context does not delete chat history. Context counts in session lists refer to chunks; history counts refer to archive records. See [Memory Settings](../configuration/memory) for age and count limits.

## Persona reference images and scenario rules

Personas can define global, private-chat, and group-chat rules. Prompt construction combines global rules with the current scenario's rules. Each persona can also manage its own selfie reference image; switching personas selects the corresponding image.

Keep general behavior rules in the persona. The default chat plugin's group-chat prompt can still supply additional group environment instructions.

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
