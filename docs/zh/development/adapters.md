# 适配器开发指南

内置适配器位于核心源码目录。插件可以把 Adapter 打包在自己的目录中，并通过 `await self.ctx.register_adapter("相对路径")` 注册；所需目录结构、生命周期和显式注销请参阅 [PluginContext API](./plugins/context#注册插件自有的-provider-和-adapter)。

## v3 能力架构

适配器继承 `BaseAdapter`，构造函数接收 `AdapterContext`。适配器负责共享客户端、资源和生命周期；平台操作由能力对象提供。旧 `core.adapter.adapter_utils` 中的 `IMAdapter`、`SocialMediaAdapter` 和 `LiveStreamAdapter` 已删除。

```python
from core.adapter import AdapterContext, BaseAdapter, IMCapability

class MyAdapter(BaseAdapter):
    def __init__(self, ctx: AdapterContext):
        super().__init__(ctx)
        self.register_capability(IMCapability, MyIMCapability(self))
```

这是构造片段，`MyIMCapability` 需由组件实现；完整适配器还必须实现 `start()`、`stop()`、`get_client()`。`ctx.info` 提供适配器信息和配置，`ctx.event_queue` 提供事件队列。插件自有组件须在模块中定义 `BaseAdapter` 子类，目录要求见 [PluginContext API](./plugins/context#注册插件自有的-provider-和-adapter)。

| 接口 | 行为 |
| --- | --- |
| `register_capability(type, instance)` | 注册属于当前适配器的能力实例；同种能力不可重复注册 |
| `get_capability(type)` | 返回唯一匹配能力；不存在或不唯一时抛出 `ValueError` |
| `get_capabilities()` | 返回登记表副本；能力对象本身仍共享 |
| `capabilities` | 只读映射视图 |
| `publish(event)` | 同步将事件放入事件队列，不限于 IM 事件 |
| `create_qrcode_login_handler(config)` | 类方法，默认返回 `None`；支持扫码登录时由适配器实现 |

不要按具体适配器类型判断能否聊天。应查询 `IMCapability`，并处理能力不存在的情况；例如 BiliBili 关闭私信后仍可提供 Feed 能力。

## 生命周期

`async start()` 是完整运行协程，应持续到停止、取消或失败，返回表示本次运行结束。不要创建后台任务后立即返回。管理器负责调度与观察，但 `start_adapter()` 返回不表示登录已经完成。

`stop()` 应终止并等待所属任务，释放客户端和连接；运行协程退出时也应可靠收尾。不可恢复错误需要传播给管理器，重复或并发启动不应创建重复监听任务。

## IM 能力与输出格式

`IMCapability` 子类需要实现：

```python
async def get_message_metadata(self) -> MessageFormatMetadata: ...
async def send_direct_message(self, user_id, message) -> KiraIMSentResult | None: ...
async def send_group_message(self, group_id, message) -> KiraIMSentResult | None: ...
```

`MessageFormatMetadata` 从 `core.adapter` 导入；`KiraIMSentResult` 和 `MessageChain` 从 `core.chat` 导入。元数据包含 `supported_elements: list[str]` 和 `emojis: dict[str, str] | None`，描述可输出格式，不表示访问权限或登录状态。`emojis=None` 表示不支持表情，空字典表示没有可枚举目录。

图片输出标签是 `img`，存档消息元素类型是 `image`，两者不要混用。只声明平台实际支持的输出元素，避免模型生成无法发送的内容。

构造 `KiraMessageEvent` 或 `KiraMessageBatchEvent` 时，使用 `supported_elements`，通常取自 `await im.get_message_metadata()`。事件仍接受弃用的 `message_types=` 和读写别名，但旧关键字不能与新关键字或位置参数混用；适配器的旧 `message_types` 属性也仅为过渡保留。这些兼容入口不会恢复已删除的旧基类。

插件主动发送优先使用 `await self.ctx.send_message_chain(sid, chain)`，以便通过统一投递和历史存档流程发送消息。直接调用能力发送接口适用于明确需要平台操作的场景。

## 访问控制

使用 `core.adapter.access.ListAccessPolicy` 设置名单。策略按“注册能力类型 + 权限字符串”隔离，未配置策略时拒绝访问。

```python
from core.adapter import IMCapability
from core.adapter.access import ListAccessPolicy

self.access.set_policy(
    capability_type=IMCapability,
    permission="im.direct.receive",
    policy=ListAccessPolicy.from_lists("allow_list", allow_list=["123456"]),
)
```

这段配置放在适配器实例初始化中。接收事件前，通过 `im.is_allowed(user_id, permission="im.direct.receive")` 检查；群聊接收权限为 `im.group.receive`。不要再依赖旧基类的 `user_list` 或 `group_list`。

## Feed 与评论能力

动态、搜索和评论使用 `FeedCapability`，类型从 `core.adapter` 导入：

| 操作 | 接口 |
| --- | --- |
| 浏览 | `await feed.get_feed(FeedQuery(...)) -> FeedPage` |
| 搜索 | `await feed.search_feed(FeedSearchQuery(...)) -> FeedPage` |
| 发布 | `await feed.send_post(FeedPost(content=chain, extra=...))` |
| 评论 | `await feed.send_comment(chain, target, root=..., parent=...)` |
| 格式声明 | `await feed.get_comment_metadata()` / `get_post_metadata()` |

`FeedPage` 包含 `items`、`next_cursor`、`has_more`。`FeedItem` 提供资源引用、内容、作者和附件；`FeedRef(resource_type, id)` 由具体平台解释。游标属于签发它的适配器实例，平台特有筛选与发布参数放在 `extra` 中。

收到评论时发布 `KiraCommentEvent`，插件使用 [`@on.comment()`](./plugins/hooks#评论事件) 接管；回复应保留 `target`、`root_comment_id` 和 `comment_id` 的语义。

当前公开通用能力为 `IMCapability` 和 `FeedCapability`。直播事件与语音频道的预留能力没有公开导出，不应作为已可用接口依赖。

## Manifest 图标

适配器可以在 `manifest.json` 中可选配置图标：

```json
{
  "icon": "icon.svg",
  "icon-dark": "icon-dark.svg"
}
```

两个路径均相对于包含 `manifest.json` 的适配器目录。WebUI 会在适配器平台下拉框和适配器卡片中显示这些图标。

- `icon`：浅色模式使用的图标。
- `icon-dark`：深色模式使用的图标；省略时，深色模式会使用 `icon`。

图标路径必须解析到适配器目录内；绝对路径及目录外路径会被忽略。支持 SVG、PNG、JPEG、GIF、WebP、AVIF 和 ICO。建议使用正方形资源，并确保在目标主题中具有足够对比度。
