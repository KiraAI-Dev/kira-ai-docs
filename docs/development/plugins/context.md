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