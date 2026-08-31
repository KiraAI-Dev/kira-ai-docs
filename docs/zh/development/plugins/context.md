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

## 注册插件自有的 Provider 和 Adapter

插件可以提供自己的 Provider 和 Adapter 类型，无需把文件放到 KiraAI 核心目录。应在插件生命周期中通过 `self.ctx` 显式注册组件；不要写死绝对路径，也不要自行推导其他插件的 ID。

```text
data/plugins/my_plugin/
├── main.py
├── provider/
│   ├── manifest.json
│   ├── provider.py       # 也可使用 __init__.py；定义 BaseProvider 子类
│   ├── schema.json       # 可选
│   └── icon.svg          # 可选的 manifest 图标
└── adapter/
    ├── manifest.json
    ├── adapter.py        # 也可使用 __init__.py；定义 IMAdapter 或 SocialMediaAdapter 子类
    ├── schema.json       # 可选
    └── icon.svg          # 可选的 manifest 图标
```

传给 API 的路径相对于调用该 API 的插件根目录。KiraAI 会根据调用模块解析插件 ID，并把注册记录到该插件拥有的组件注册表中。

```python
class MyPlugin(BasePlugin):
    async def initialize(self):
        await self.ctx.register_provider("provider")
        await self.ctx.register_adapter("adapter")
```

每个组件目录都必须包含 `manifest.json`，并提供非空的 `name`。该名称分别成为 Provider format 或 Adapter platform，不能与其他已注册类型冲突。`provider.py` 必须定义 `BaseProvider` 子类；`adapter.py` 必须定义 `IMAdapter` 或 `SocialMediaAdapter` 子类。系统只会选择由该组件模块自身定义的类。

Provider 和 Adapter 的 manifest 同样支持可选的 `icon` 和 `icon-dark`。路径相对于组件的 `manifest.json`，必须保持在组件目录内；类型可用时，WebUI 会显示这些图标。

### 生命周期与显式注销

KiraAI 会把已注册类型记录到所属插件的组件注册表。插件被禁用或终止时，KiraAI 会自动停止 Adapter 运行实例、注销 Adapter 类型，然后注销 Provider 类型。已保存的 Provider 和 Adapter 配置会保留，但在插件重新启用前，对应类型无法启用或实例化。

通常**不需要**在插件的 `terminate()` 中调用这些方法。只有插件仍在运行、但需要主动撤回某个组件时，才使用显式注销：

```python
await self.ctx.unregister_adapter("my_adapter_platform")
await self.ctx.unregister_provider("my_provider_format")
```

注册与注销均为异步操作；路径不合法、组件类不合法、管理器不可用或类型名称冲突时会抛出异常。不要静默忽略初始化错误，应让它们出现在插件日志中。
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