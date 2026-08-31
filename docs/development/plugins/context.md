# PluginContext API

`self.ctx` provides access to all core system services:

```python
self.ctx.config           # KiraConfig: global configuration
self.ctx.event_bus        # EventBus: event bus
self.ctx.session_mgr      # SessionManager: session management
self.ctx.adapter_mgr      # AdapterManager: adapter management
self.ctx.persona_mgr      # PersonaManager: persona management
self.ctx.provider_mgr     # ProviderManager: model provider management
self.ctx.tool_mgr         # FuncToolManager: function tool management
self.ctx.sticker_manager  # StickerManager: sticker management
```

## Get Plugin Data Directory

```python
async def initialize(self):
    data_dir = self.ctx.get_plugin_data_dir()
    # Returns a Path object pointing to data/plugin_data/{plugin_id}/, created automatically
```

## Get LLM Client

```python
# Use the default LLM
llm = self.ctx.get_default_llm_client()

# Use the fast LLM
fast_llm = self.ctx.get_default_fast_llm_client()

# Use a specific model (provider_id:model_id format)
llm = self.ctx.get_llm_client(model_uuid="openai:gpt-4o")
```

## Get Embedding Client

```python
emb = self.ctx.get_default_embedding_client()
```

## Get Another Plugin Instance

```python
other_plugin = self.ctx.get_plugin_inst("other_plugin_id")
```

## Access the Message Buffer

```python
buffer = self.ctx.get_buffer(session_id)
await self.ctx.flush_session_messages(session_id)
```

## Data Storage

Store persistent data in the plugin's dedicated data directory to avoid conflicts with other plugins:

```python
import json
from pathlib import Path

class MyPlugin(BasePlugin):
    def __init__(self, ctx, cfg):
        super().__init__(ctx, cfg)
        self.data_dir: Path = None
        self.data_file: Path = None

    async def initialize(self):
        self.data_dir = self.ctx.get_plugin_data_dir()
        # Path: data/plugin_data/my_plugin/

        self.data_file = self.data_dir / "data.json"
        if not self.data_file.exists():
            self.data_file.write_text("{}", encoding="utf-8")

    def load_data(self) -> dict:
        return json.loads(self.data_file.read_text(encoding="utf-8"))

    def save_data(self, data: dict):
        self.data_file.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
```

## Register Plugin-Owned Providers and Adapters

A plugin can expose its own Provider and Adapter types without placing files in KiraAI core directories. Register a component from the plugin lifecycle through `self.ctx`; do not hard-code an absolute path or derive another plugin's ID.

```text
data/plugins/my_plugin/
├── main.py
├── provider/
│   ├── manifest.json
│   ├── provider.py       # Or __init__.py; defines a BaseProvider subclass
│   ├── schema.json       # Optional
│   └── icon.svg          # Optional manifest icon
└── adapter/
    ├── manifest.json
    ├── adapter.py        # Or __init__.py; defines an IMAdapter or SocialMediaAdapter subclass
    ├── schema.json       # Optional
    └── icon.svg          # Optional manifest icon
```

The path passed to the API is relative to the calling plugin root. The plugin ID is resolved by KiraAI from the calling module, and the registration is recorded as a component owned by that plugin.

```python
class MyPlugin(BasePlugin):
    async def initialize(self):
        await self.ctx.register_provider("provider")
        await self.ctx.register_adapter("adapter")
```

Each component directory must contain a `manifest.json` with a non-empty `name`. The name becomes the Provider format or Adapter platform and must not collide with another registered type. `provider.py` must define a `BaseProvider` subclass; `adapter.py` must define an `IMAdapter` or `SocialMediaAdapter` subclass. Only classes defined by that component module are selected.

Provider and Adapter manifests use the same optional `icon` and `icon-dark` fields as built-in components. Paths are relative to the component's `manifest.json`, must remain inside that component directory, and are displayed by the WebUI when the type is available.

### Lifecycle and Explicit Unregistration

KiraAI records registered types in the owning plugin's component registry. When the plugin is disabled or terminated, KiraAI stops runtime Adapter instances, unregisters Adapter types, and then unregisters Provider types automatically. Stored Provider and Adapter configuration is kept, but a type cannot be enabled or instantiated until its plugin is enabled again.

A plugin normally does **not** call these methods from `terminate()`. Use explicit unregistration only when the plugin wants to withdraw a component while it is still running:

```python
await self.ctx.unregister_adapter("my_adapter_platform")
await self.ctx.unregister_provider("my_provider_format")
```

Both registration and unregistration are asynchronous and raise an error for invalid paths, invalid component classes, unavailable managers, or conflicting type names. Let initialization failures surface in the plugin logs instead of silently ignoring them.
## Background Tasks

For polling or long-running tasks, use `asyncio.create_task()` and cancel in `terminate()`:

```python
import asyncio

class MyPlugin(BasePlugin):
    def __init__(self, ctx, cfg):
        super().__init__(ctx, cfg)
        self._task: asyncio.Task = None

    async def initialize(self):
        self._task = asyncio.create_task(self._background_loop())

    async def terminate(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _background_loop(self):
        while True:
            try:
                await self._do_work()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background task error: {e}")
            await asyncio.sleep(60)  # Run every 60 seconds
```

## Proactive Message Push

Plugins can proactively send messages to a session without waiting for a user trigger, via `ctx.publish_notice()`:

```python
from core.chat import MessageChain
from core.chat.message_elements import Text

class MyPlugin(BasePlugin):
    async def send_notice(self, session_id: str, content: str):
        """
        session_id format: {adapter_name}:{type}:{id}
          - Direct message: "napcat:dm:123456"
          - Group message:  "napcat:gm:654321"
        """
        chain = MessageChain([Text(content)])
        await self.ctx.publish_notice(
            session=session_id,
            chain=chain,
            is_mentioned=True
        )
```