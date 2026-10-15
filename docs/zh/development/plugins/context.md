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
self.ctx.sticker_mgr      # StickerManager：贴纸管理
```

还可以使用 `self.ctx.prompt_mgr`、`skills_mgr`、`mcp_mgr`、`message_history`、`image_desc_cache`、`session_buffer_mgr` 和 `message_delivery` 等注入服务；MCP 管理器可能为 `None`。

`sticker_mgr` 是规范名称。旧 `sticker_manager` 仅保留只读属性别名，不能作为构造关键字或赋值入口。运行中的上下文由系统创建；自行构造上下文的测试必须提供新增必填服务。

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
llm = self.ctx.get_llm_client(model_uuid=f"{provider_id}:{model_id}")
```

`provider_id` 和 `model_id` 应取自已配置模型的实际引用；`model_id` 是稳定的内部 ID，不是上游名称。上游请求名称在 `ModelInfo.model_name` 中。旧名称仅在迁移时被保留为无歧义的 `legacy_ids` 时可解析，不要用展示名称重新拼接引用。

提供商停用后，通过管理器获取的客户端不能发起新的调用，包括之前已缓存的客户端。获取默认客户端时应考虑未配置模型或提供商不可用的情况。

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

可以只发布匹配的缓冲消息：

```python
published = await self.ctx.flush_session_messages(
    session_id,
    filter_fn=lambda event: not event.is_notice,
)
```

`filter_fn` 是接收 `KiraMessageEvent` 的同步谓词；未匹配的事件留在缓冲区。返回 `True` 表示已发布批次，`False` 表示没有匹配消息；发布成功不代表 Agent 已执行完成，错误会向上传播。

## 会话读写与能力覆盖

v3.0.0-rc.1 起，会话读写和能力查询均为异步。读取返回独立 `Session` 快照，修改快照不会自动写回数据库。

```python
sessions = await self.ctx.session_mgr.get_sessions(include_content=False)
session = await self.ctx.session_mgr.get_session(session_id, ensure_session=True)
chunks = session.content
flat_messages = session.flatten_content()
await self.ctx.session_mgr.update_session(session_id, title="Updated title")
await self.ctx.session_mgr.update_session(session_id, content=chunks)
capabilities = await self.ctx.get_session_capabilities(session_id)
```

普通 `get_session(session_id)` 不创建会话，不存在时返回 `None`。`include_content=False` 省略正文加载，不代表会话实际上下文为空，不应把这种快照的空 `content` 写回。`content` 的结构为 `list[list[dict]]`。

| 旧接口或行为 | 当前用法 |
| --- | --- |
| `get_session_info()` | `await get_sessions(include_content=False)` |
| `get_session_info(sid)` | `await get_session(sid)` |
| `read_memory(sid)` / `fetch_memory(sid)` | 获取会话后读取 `content` / 调用 `flatten_content()` |
| `update_session_info(sid, ...)` | `await update_session(sid, title=..., description=...)` |
| `write_memory(sid, chunks)` | `await update_session(sid, content=chunks)` |
| `update_memory(sid, chunk)` | 同名方法必须 `await`，追加一轮上下文并执行裁剪 |
| `get_memory_count(sid)` | `len(session.content)`；批量用 `await get_session_message_counts()` |
| `delete_session(sid)` | 同名方法必须 `await` |
| 直接修改 `chat_memory` / `_save_memory()` | 改用会话读写接口，旧缓存及同步保存入口不再提供 |

`update_session()` 支持 `title`、`description`、`content`、`data`。省略字段保持原值；`content` 和 `data` 是整体替换，不是增量合并。

能力覆盖使用 `await self.ctx.session_mgr.update_session_capabilities(session_id, overrides)`；传 `None` 恢复全局默认。`get_effective_capabilities()` 同样必须 `await`，插件通常直接使用上面的 `ctx.get_session_capabilities()`。

`Session.sid` 仍是 `adapter_name:dm|gm:target_id`，用于路由；新增 `internal_id` 是数据库身份，不能替代 SID。升级与存储行为见[记忆设置](../../configuration/memory)。

## 结构化消息历史

`message_history` 查询的是本地实际收发存档，不会到平台拉取消息，也不等于 LLM 上下文。

```python
page = await self.ctx.message_history.list_messages(session_id, limit=50)
for record in page.messages:
    chain = record.chain
    linked_memory = await self.ctx.message_history.get_linked_memory(record)
    archive_json = record.to_dict()
next_cursor = page.next_cursor
```

当前正式版返回 `MessageHistoryPage`，其中 `messages` 是 `MessageHistoryRecord` 列表，`chain` 为 `MessageChain`。需要 JSON 安全的存档快照时调用 `record.to_dict()` 或 `page.to_dict()`，不要把 Python 返回对象直接当字典访问。

- `get_message(internal_message_id=...)`：按内部历史 ID 查询单条，找不到时返回 `None`。也可用 `session_id`、`platform_message_id`、`self_id`、`direction` 组合过滤；平台 ID 应限定会话。
- `get_messages(...)`：按相同过滤条件分页查询，至少提供一个过滤条件。
- `list_messages(session_id, cursor=..., limit=...)`：按存档时间、内部 ID 倒序分页；`limit` 范围为 1–200，后续请求应使用相同过滤条件与 `next_cursor`。
- `get_messages_by_llm_message_id(session_id, llm_message_id, ...)`：查询关联到指定上下文消息的存档。
- `get_linked_memory(record)`：返回仍保留的关联上下文条目；上下文已裁剪或没有关联时返回 `None`。

通过 `await self.ctx.send_message_chain(session_id, chain)` 发送可经过统一投递与历史流程。结果中的 `history_id` 是内部存档 ID，`message_id` 是平台消息 ID；上下文中的 `_extra.llm_message_id` 则用于关联，三者不可混用。

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
    ├── adapter.py        # 也可使用 __init__.py；定义 BaseAdapter 子类
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

每个组件目录都必须包含 `manifest.json`，并提供非空的 `name`。该名称分别成为 Provider format 或 Adapter platform，不能与其他已注册类型冲突。`provider.py` 必须定义 `BaseProvider` 子类；`adapter.py` 必须定义 `BaseAdapter` 子类。系统只会选择由该组件模块自身定义的类。

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