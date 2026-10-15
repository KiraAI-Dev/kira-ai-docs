# Memory Settings

KiraAI v3 stores and cleans **LLM context** separately from **actual incoming and outgoing message history**. Core memories maintained by a long-term memory plugin are a third kind of data.

## Three kinds of data

| Data | Purpose | Management |
| --- | --- | --- |
| LLM context | User, assistant, and tool messages sent to models, grouped into chunks by turn | Inspect and edit **LLM Context** in session details; chat settings control its length |
| Message history | Actual message chains, senders, media, direction, and delivery status | Inspect **Message History** in session details; a separate retention policy cleans it |
| Long-term memory | Information extracted and supplied to models by memory plugins | Manage through the corresponding plugin's tools and configuration |

History can remain after context is trimmed. Cleaning history does not trim LLM context. Neither context entry counts nor chunk counts represent the number of platform messages.

## Context length

Configure these under **Configuration → Digital Life → Chat Settings**:

- `max_memory_length`: retains 10 context chunks by default. One turn can contain several messages, especially when tools are called repeatedly.
- `memory_overflow_discard_count`: discards 1 oldest chunk by default. A larger overflow removes additional chunks to bring the context back within its limit.

Context affects model input, latency, and cost. See [Chat Settings](./chat) for details.

## History cleanup

Use the message history cleanup section of WebUI configuration. The corresponding runtime setting is `bot_config.message_history_cleanup`:

```json
{
  "enabled": true,
  "max_age_days": 0,
  "max_messages_per_session": 500,
  "cleanup_interval_seconds": 3600
}
```

| Field | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Enables periodic cleanup |
| `max_age_days` | `0` | Zero disables the age limit |
| `max_messages_per_session` | `500` | Maximum retained history records per session |
| `cleanup_interval_seconds` | `3600` | Cleanup check interval in seconds |

Cleanup also reclaims unreferenced archived media. General session media archives live in `data/session_media/archive/`; do not delete the whole directory as temporary files.

## Upgrading from v2 or early v3

Stop KiraAI and back up the entire `data/` directory before upgrading.

On its first initialization, the session manager imports `data/memory/chat_memory.json` into the database's `chat_sessions` table and records completion in `database_migrations`. Existing database sessions are not overwritten. Later starts do not import the file again.

The original JSON file is kept but no longer updated. Editing it does not change current sessions, and backing up only that file does not preserve the latest v3 context. Invalid top-level JSON causes an import error; check the logs and repair the source data first.

Plugin developers must also migrate to asynchronous session APIs and explicitly save snapshot changes. See [PluginContext API](../development/plugins/context#session-access-and-capability-overrides).

## Clearing data

- **Clear LLM Context** in a session clears model context while retaining archived messages.
- Deleting records in WebChat removes its separate chat archive and media while retaining chat settings and LLM context.
- History cleanup manages structured history and unreferenced media; it does not affect a long-term memory plugin's content.
