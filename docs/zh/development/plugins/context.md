# PluginContext API

`self.ctx` 提供对系统各核心服务的访问：

```python
self.ctx.config           # KiraConfig：全局配置
self.ctx.event_bus        # EventBus：事件总线
self.ctx.session_mgr      # SessionManager：会话管理
self.ctx.adapter_mgr      # AdapterManager：适配器管理
self.ctx.persona_mgr      # PersonaManager：人格管理
self.ctx.provider_mgr     # ProviderManager：模型提供商管理
self.ctx.tool_mgr         # FuncToolManager：函数工具管理
self.ctx.sticker_manager  # StickerManager：贴纸管理
```

## 获取数据目录

```python
async def initialize(self):
    data_dir = self.ctx.get_plugin_data_dir()
    # 返回 data/plugin_data/{plugin_id}/ 的 Path 对象，自动创建
```

## 获取 LLM 客户端

```python
# 使用默认 LLM
llm = self.ctx.get_default_llm_client()

# 使用快速 LLM
fast_llm = self.ctx.get_default_fast_llm_client()

# 使用指定模型（provider_id:model_id 格式）
llm = self.ctx.get_llm_client(model_uuid="openai:gpt-4o")
```

## 获取 Embedding 客户端

```python
emb = self.ctx.get_default_embedding_client()
```

## 获取其他插件实例

```python
other_plugin = self.ctx.get_plugin_inst("other_plugin_id")
```

## 获取消息缓冲区

```python
buffer = self.ctx.get_buffer(session_id)
await self.ctx.flush_session_messages(session_id)
```

## 数据存储

插件应将持久化数据存放到专属数据目录，避免与其他插件冲突：

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
        # 路径：data/plugin_data/my_plugin/

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

## 后台任务

需要定时轮询或长期运行的任务，使用 `asyncio.create_task()` 并在 `terminate()` 中取消：

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
                logger.error(f"后台任务异常: {e}")
            await asyncio.sleep(60)  # 每 60 秒执行一次
```

## 主动推送消息

插件可以主动向指定会话发送消息（不依赖用户触发），通过 `ctx.publish_notice()` 实现：

```python
from core.chat import MessageChain
from core.chat.message_elements import Text

class MyPlugin(BasePlugin):
    async def send_notice(self, session_id: str, content: str):
        """
        session_id 格式：{adapter_name}:{type}:{id}
          - 私聊: "napcat:dm:123456"
          - 群聊: "napcat:gm:654321"
        """
        chain = MessageChain([Text(content)])
        await self.ctx.publish_notice(
            session=session_id,
            chain=chain,
            is_mentioned=True
        )
```