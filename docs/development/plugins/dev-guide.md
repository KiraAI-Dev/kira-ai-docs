# Plugin Development Guide

Welcome to KiraAI plugin development! KiraAI has powerful plugin extension capabilities, allowing developers to extend KiraAI's functionality and expand the capabilities of digital life by developing plugins.

As an AI digital-life project, KiraAI plugins should aim to be:

- **Perceptive**: Let the AI know what has happened and what the AI itself has sent. Avoid hard-coding message content whenever possible; the AI should generate it itself. For external integrations, ensure the AI can perceive external events.
- **Actionable**: Let the AI autonomously invoke capabilities, such as function tools and XML tags. In principle, avoid mechanical interactions with the AI digital life through slash commands or similar mechanisms (and the system has no built-in command system).

## Overview

KiraAI's plugin system is based on an event-driven architecture, allowing plugins to extend the system through three mechanisms:

- **Hook**: Listen to system events such as message arrival and LLM request/response to insert custom logic
- **Tool**: Register callable functions for the LLM
- **Tag**: Register custom XML tag handlers to control message output format

Plugins are placed in the `data/plugins/` directory and are automatically discovered and loaded at startup.

## Plugin Directory Structure

```
data/plugins/
└── my_plugin/              # Plugin folder (used as plugin_id unless overridden in manifest.json)
    ├── manifest.json       # Plugin metadata (required)
    ├── main.py             # Plugin entry point (required; plugin.py or __init__.py also accepted)
    ├── schema.json         # Configuration field definitions (optional)
    └── ...                 # Other auxiliary modules
```

> Entry file lookup order: `main.py` → `plugin.py` → `__init__.py`

## Development Notes

1. **Hook function signature**: Must accept `(self, event, *args, **kwargs)`. Extra parameters (e.g. `req`, `resp`) are passed as positional arguments — use named parameters to receive them.
2. **Tool function signature**: `(self, event: KiraMessageBatchEvent, param1: type, param2: type)` — the first parameter is always the event object that triggered the tool call.
3. **Priority**: `SYS_HIGH` and `SYS_LOW` are reserved for the system. Plugin developers should use `HIGH / MEDIUM / LOW` or custom integers.
4. **Do not block the event loop**: Use `await` for all I/O operations; use `asyncio.to_thread()` for CPU-intensive work.
5. **Clean up in terminate**: Cancel background tasks and close connections — avoid resource leaks. Provider and Adapter types registered through `self.ctx` are unregistered by KiraAI automatically; do not unregister them again from `terminate()` unless they were withdrawn earlier at runtime.
6. **Config hot-reload**: The system calls `initialize()` again after a config change. Plugins must support re-entrant initialization.
