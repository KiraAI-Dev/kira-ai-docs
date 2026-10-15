# Hook 系统

Hook 允许插件监听系统事件，使用 `@on.<event>()` 装饰器注册。Hook 函数必须是 `async` 方法。

## 导入

```python
from core.plugin import on, Priority
```

## 事件类型

:::warning
本项目处于活跃开发期，装饰器系统可能会有变化。
:::

### 消息处理事件

| 装饰器                   | 触发时机                           | 处理函数签名                                       |
| ------------------------ | ---------------------------------- | -------------------------------------------------- |
| `@on.im_message()`       | IM 消息到达时（最早）              | `(self, event: KiraMessageEvent, *args, **kwargs)`            |
| `@on.message_buffered()` | 消息进入缓冲区后                   | `(self, sid: str, *args, **kwargs)`                           |
| `@on.im_batch_message()` | 消息经 debounce 合并后             | `(self, event: KiraMessageBatchEvent, *args, **kwargs)`       |
| `@on.llm_request()`      | 向 LLM 发送请求前（注入 Prompt）   | `(self, event: KiraMessageBatchEvent, req: LLMRequest, tag_set: TagSet, *args, **kwargs)` |
| `@on.llm_response()`     | LLM 原始响应返回后                 | `(self, event: KiraMessageBatchEvent, resp: LLMResponse, *args, **kwargs)` |
| `@on.after_xml_parse()`  | XML 解析完成后（得到 actions 列表）| `(self, event: KiraMessageBatchEvent, actions: list, *args, **kwargs)` |
| `@on.tool_result()`      | 工具调用返回结果后                 | `(self, event: KiraMessageBatchEvent, result: ToolResult, *args, **kwargs)` |
| `@on.message_sent()`     | 单条消息发送到 IM 平台后           | `(self, event: KiraMessageBatchEvent, action: MessageChain, result: KiraIMSentResult, *args, **kwargs)` |
| `@on.step_result()`      | Agent 每步结束后                   | `(self, event: KiraMessageBatchEvent, step_result: KiraStepResult, *args, **kwargs)` |
| `@on.final_result()`     | 最终消息结果生成后                 | `(self, event: KiraMessageBatchEvent, result: KiraFinalResult, *args, **kwargs)`                    |

### 评论事件

`@on.comment()` 对应 `EventType.ON_COMMENT`，处理函数接收 `KiraCommentEvent`，与普通 IM 消息使用不同入口。事件中的 `comment_id`、`comment_content` 表示当前评论，`target` 表示目标资源，`root_comment_id` 表示根评论；顶层评论默认以自身 ID 作为根评论。

```python
from core.adapter import FeedCapability
from core.chat import KiraCommentEvent, MessageChain
from core.chat.message_elements import Text
from core.plugin import BasePlugin, Priority, on

class MyCommentPlugin(BasePlugin):
    @on.comment(priority=Priority.HIGH)
    async def reply_comment(self, event: KiraCommentEvent, *args, **kwargs):
        adapter = self.ctx.adapter_mgr.get_adapter(event.adapter_name)
        if adapter is None:
            return
        try:
            feed = adapter.get_capability(FeedCapability)
        except ValueError:
            return
        event.stop()
        await feed.send_comment(
            MessageChain([Text("Received")]),
            event.target,
            root=event.root_comment_id,
            parent=event.comment_id,
        )
```

这是 Hook 片段，插件还需实现生命周期方法。确定接管评论后，在首次外部 `await` 前调用 `event.stop()`，避免后续插件重复回复。示例的固定文字用于展示路由；实际交互内容应按插件需求交给模型生成。内置默认评论插件以 `SYS_LOW` 处理尚未被接管的评论，用户插件应使用普通优先级。

### 最终结果事件

`@on.final_result()` 已实际启用，在一轮 Agent 执行结束后触发，接收 `KiraFinalResult`（从 `core.chat.message_utils` 导入），其 `step_results` 汇总本轮各步结果。它位于上下文持久化之前；此处 `event.stop()` 只阻止剩余最终结果处理器，无法撤回已经发送的消息，也不会跳过工作流的上下文写入。

### 生命周期事件

| 装饰器               | 触发时机                           | 处理函数签名                       |
| -------------------- | ---------------------------------- | ---------------------------------- |
| `@on.loaded()`       | 所有插件加载完成后（无参数）       | `(self, *args, **kwargs)`          |
| `@on.shutdown()`     | 系统即将关闭时（无参数）           | `(self, *args, **kwargs)`          |

### 错误事件

| 装饰器                | 触发时机                           | 处理函数签名                                       |
| --------------------- | ---------------------------------- | -------------------------------------------------- |
| `@on.exception()`     | 任意 Hook 处理函数抛出异常时       | `(self, event, exc_event: KiraExceptionEvent, *args, **kwargs)` |

:::tip
所有处理函数必须是 `BasePlugin` 子类的 `async` 方法。建议始终接受 `*args, **kwargs` 以保持前向兼容。
:::

## 消息处理流水线

下图展示了消息处理过程中各事件的触发顺序：

```
IM 消息到达
     │
     ▼
  @on.im_message()        ← 设置策略：trigger / buffer / flush / discard
     │
     ▼
  [消息缓冲]
     │
     ▼
  @on.message_buffered()  ← 仅传递 sid（轻量通知）
     │
     ▼
  [防抖 / 合并]
     │
     ▼
  @on.im_batch_message()  ← 可访问所有合并后的消息
     │
     ▼
  @on.llm_request()       ← 注入 prompt、tag、tool
     │
     ▼
  [LLM 调用]
     │
     ▼
  @on.llm_response()      ← 读取原始输出、自动修复 XML
     │
     ▼
  [工具执行] ◄──────────► @on.tool_result()  ← 每次工具调用
     │
     ▼
  [XML 解析]
     │
     ▼
  @on.after_xml_parse()   ← 检查/修改解析后的 actions
     │
     ▼
  [发送消息]
     │
     ▼
  @on.message_sent()      ← 每条消息，含发送结果
     │
     ▼
  @on.step_result()       ← Agent 每步结束后
     │
     ▼
  [循环或结束]
```

## 优先级

```python
class Priority(IntEnum):
    SYS_HIGH = 100   # 系统保留，勿用
    HIGH     = 50    # 高优先级（消息预处理等）
    MEDIUM   = 0     # 默认
    LOW      = -50   # 低优先级（后置处理等）
    SYS_LOW  = -100  # 系统保留，勿用
```

**数字越大，越先执行。** 未指定时默认为 `MEDIUM`。

:::warning
`SYS_HIGH` 和 `SYS_LOW` 为内置插件保留，用户插件应使用 `HIGH`、`MEDIUM`、`LOW` 或任意整数值。
:::

`priority` 参数接受任意整数，不限于 `Priority` 枚举值。例如 `priority=30` 是合法的，会将你的处理函数排在 `MEDIUM(0)` 和 `HIGH(50)` 之间。

## 示例：监听消息

```python
from core.plugin import on, Priority
from core.chat import KiraMessageEvent
from core.chat.message_elements import Text

class MyPlugin(BasePlugin):
    @on.im_message(priority=Priority.HIGH)
    async def on_message(self, event: KiraMessageEvent, *args, **kwargs):
        # 方式一：message_repr，所有元素的 repr 拼接（立即可用）
        text = event.message_repr

        # 方式二：从 chain 中提取纯文本（只取 Text 元素）
        text = "".join(ele.text for ele in event.message.chain if isinstance(ele, Text))

        if "关键词" in text:
            # 处理逻辑...
            pass
```

## 消息处理策略

在 `@on.im_message()` 钩子中，可以通过调用 `event` 上的方法来决定消息的后续处理方式。默认策略为 `discard`（丢弃）。默认消息插件会将其设置为 `buffer`，达到指定数量会时间后会触发 LLM 处理消息。

| 方法                  | 策略      | 说明                                                              |
| --------------------- | --------- | ----------------------------------------------------------------- |
| `event.trigger()`     | `trigger` | 立即处理，跳过 debounce，直接进入 LLM 流程                        |
| `event.buffer()`      | `buffer`  | 进入缓冲区等待，触发 `ON_MESSAGE_BUFFERED` 钩子                   |
| `event.flush()`       | `flush`   | 将当前消息加入缓冲区，并立即刷出所有缓冲消息一起处理              |
| `event.discard()`     | `discard` | 丢弃此消息，不做任何处理（但调用完当前阶段的所有钩子）            |
| `event.stop()`        | —         | 立刻中止后续所有钩子的处理，消息不再继续传递                      |

所有策略方法均接受可选参数 `force=True`，设置后后续钩子无法再覆盖该策略。

## 示例：注入 Prompt

```python
from core.plugin import on
from core.provider import LLMRequest
from core.prompt_manager import Prompt

class MyPlugin(BasePlugin):
    @on.llm_request()
    async def inject_prompt(self, event, req: LLMRequest, tag_set, *args, **kwargs):
        # 方式一：向已有 section 追加字符串内容
        for p in req.system_prompt:
            if p.name == "tools":
                p.content += "\n你可以使用 my_tool 工具来..."
                break

        # 方式二：追加一个新的 Prompt 对象
        # name 为该 Prompt 的名称，source 为来源，建议设置为插件 ID
        req.system_prompt.append(Prompt(
            content="以下是插件注入的额外上下文：...",
            name="my_plugin_context",
            source="my_plugin",
        ))
```

> 两种方式可以混用。方式一适合向已有固定 section（如 `"tools"`、`"memory"`）追加内容；方式二适合插件完整地插入一段独立上下文。

## 示例：生命周期事件

使用 `@on.loaded()` 和 `@on.shutdown()` 处理系统级别的初始化或清理（独立于单个插件的 `initialize()`/`terminate()` 生命周期）：

```python
from core.plugin import on

class MyPlugin(BasePlugin):
    @on.loaded()
    async def on_system_ready(self, *args, **kwargs):
        # 所有插件已加载完毕 —— 可安全地与其他插件交互
        other = self.ctx.get_plugin_inst("other_plugin")
        if other:
            # 跨插件初始化...
            pass

    @on.shutdown()
    async def on_system_shutdown(self, *args, **kwargs):
        # 系统即将关闭 —— 释放外部资源
        await self._close_connections()
```

## 示例：异常处理

使用 `@on.exception()` 捕获并处理其他 Hook 处理函数中的异常，适合用于日志记录、告警或回退逻辑：

```python
from core.plugin import on
from core.chat import KiraExceptionEvent

class MyPlugin(BasePlugin):
    @on.exception()
    async def on_error(self, event, exc_event: KiraExceptionEvent, *args, **kwargs):
        # exc_event 包含结构化的错误信息
        print(f"异常发生在 {exc_event.stage}：{exc_event.name}: {exc_event.message}")
        # 可用字段：
        #   exc_event.name      — 异常类名（如 "ValueError"）
        #   exc_event.message   — str(e)
        #   exc_event.traceback — 完整的 traceback 字符串
        #   exc_event.stage     — 触发异常的 EventType（如 "on_llm_request"）
        #   exc_event.source    — "plugin" 或 "core"
        #   exc_event.comp_id   — 出错处理函数所属的插件 ID
        #   exc_event.e         — 原始异常对象
```

:::tip
异常处理函数本身受到保护：如果 `@on.exception()` 处理函数抛出异常，错误会被记录但不会再次触发分发（防止无限递归）。
:::

## 示例：消息发送

使用 `@on.message_sent()` 追踪或响应每条消息的发送状态：

```python
from core.plugin import on
from core.chat import KiraMessageBatchEvent, MessageChain, KiraIMSentResult

class MyPlugin(BasePlugin):
    @on.message_sent()
    async def on_sent(self, event: KiraMessageBatchEvent, action: MessageChain, result: KiraIMSentResult, *args, **kwargs):
        if result.ok:
            print(f"消息发送成功：{result.message_id}")
        else:
            print(f"消息发送失败：{result.err}")
```

# Tool 注册

Tool 向 LLM 暴露可调用的函数，有两种注册方式。

## 方式一：`@register.tool` 装饰器

适用于逻辑简单、直接写在插件类方法上的工具。

```python
from core.plugin import register

class MyPlugin(BasePlugin):
    @register.tool(
        name="my_tool",
        description="工具的用途说明（LLM 根据此决定是否调用）",
        params={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "查询内容"
                },
                "limit": {
                    "type": "integer",
                    "description": "返回条数，默认 10"
                }
            },
            "required": ["query"]
        }
    )
    async def my_tool(self, event: KiraMessageBatchEvent, *_, query: str, limit: int = 10) -> str:
        # 工具逻辑，返回字符串结果
        return f"查询结果：{query}"
```

> `params` 遵循 JSON Schema 格式（OpenAI 工具调用规范）。
> 函数第一个参数为 `event: KiraMessageBatchEvent`，工具参数均通过关键字参数传入。使用 `*_` 兼容未来可能新增的位置参数。

## 方式二：`BaseTool` 类（适合复杂工具）

适用于工具逻辑较复杂、需要独立封装或复用的场景。继承 `BaseTool`，然后在 `@on.llm_request()` 钩子中通过 `req.tool_set.add()` **按需**注入到当次请求：

```python
from core.utils.tool_utils import BaseTool
from core.provider import LLMRequest
from core.plugin import on

class MySearchTool(BaseTool):
    name = "my_search"
    description = "搜索指定关键词并返回结果"
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "搜索关键词"}
        },
        "required": ["query"]
    }

    async def execute(self, query: str) -> str:
        # 工具执行逻辑
        return f"搜索结果：{query}"


class MyPlugin(BasePlugin):
    @on.llm_request()
    async def add_tools(self, event, req: LLMRequest, tag_set, *args, **kwargs):
        req.tool_set.add(MySearchTool(ctx=self.ctx))
```

> 与 `@register.tool` 全局注册不同，`tool_set.add()` 只对当次请求生效，适合需要根据条件动态决定是否提供某工具的场景。

## 返回附件：ToolResult

工具函数默认返回字符串，若需要同时返回文件（图片、音频、文件等），可返回 `ToolResult` 对象。LLM 收到结果后，可通过 `<file>` 标签将附件发送给用户。

```python
from core.provider import ToolResult
from core.chat.message_elements import Image, Record, File

class MyPlugin(BasePlugin):
    @register.tool(
        name="take_screenshot",
        description="截图并返回图片",
        params={"type": "object", "properties": {}, "required": []}
    )
    async def take_screenshot(self, event: KiraMessageBatchEvent, *_) -> ToolResult:
        path = await self._do_screenshot()  # 返回本地文件路径
        return ToolResult(
            text="截图完成",
            attachments=[Image(path=path)]
        )
```

`ToolResult` 字段说明：

| 字段          | 类型                              | 说明                                    |
| ------------- | --------------------------------- | --------------------------------------- |
| `text`        | `str`                             | 返回给 LLM 的文字描述                   |
| `attachments` | `list[Image \| Record \| File]`   | 附件列表，LLM 可用 `<file>` 标签发送    |

# Tag 注册

Tag 注册自定义的 XML 标签处理器，当 LLM 输出中包含对应标签时触发，同样有两种方式。

## 方式一：`@register.tag` 装饰器（推荐）

```python
from core.plugin import register
from core.chat.message_elements import Text

class MyPlugin(BasePlugin):
    @register.tag(
        name="my_tag",
        description="标签的描述，会注入到 LLM 的工具说明中"
    )
    async def handle_my_tag(self, value: str, **kwargs) -> list:
        # value 是标签内容，如 <my_tag>value</my_tag>
        # 返回 list[BaseMessageElement]
        return [Text(value)]
```

## 方式二：`BaseTag` 类（适合复杂或按需注入的标签）

适用于标签处理逻辑较重、需要独立封装的场景。继承 `BaseTag`，然后在 `@on.llm_request()` 钩子中通过 `tag_set.register()` **按需**注入到当次请求：

```python
from core.tag import BaseTag
from core.provider import LLMRequest
from core.chat.message_elements import Image
from core.plugin import on

class MyTag(BaseTag):
    name = "my_tag"
    description = "处理自定义标签并渲染为图片"

    async def handle(self, value: str, **kwargs) -> list:
        # self.ctx 可用（注册时传入）
        image_path = await self._render(value)
        return [Image(path=image_path)]

    async def _render(self, content: str) -> str:
        # 复杂渲染逻辑...
        return "/tmp/output.png"


class MyPlugin(BasePlugin):
    @on.llm_request()
    async def add_tags(self, event, req: LLMRequest, tag_set, *args, **kwargs):
        tag_set.register(MyTag(ctx=self.ctx))
```

> `tag_set` 是 `@on.llm_request()` 钩子的第三个位置参数，类型为 `TagSet`。与 `@register.tag` 全局注册不同，此方式只对当次请求生效，适合按会话/条件动态启用标签。