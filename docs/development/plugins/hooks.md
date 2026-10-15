# Hook System

Hooks allow plugins to listen to system events using the `@on.<event>()` decorator. Hook functions must be `async` methods.

## Import

```python
from core.plugin import on, Priority
```

## Event Types

:::warning
This project is in active development; the decorator system may change.
:::

### Message Pipeline Events

| Decorator                | Triggered When                                       | Handler Signature                                             |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------- |
| `@on.im_message()`       | IM message arrives (earliest)                        | `(self, event: KiraMessageEvent, *args, **kwargs)`            |
| `@on.message_buffered()` | Message enters the buffer                            | `(self, sid: str, *args, **kwargs)`                           |
| `@on.im_batch_message()` | Messages merged after debounce                       | `(self, event: KiraMessageBatchEvent, *args, **kwargs)`       |
| `@on.llm_request()`      | Before sending a request to the LLM (inject prompt) | `(self, event: KiraMessageBatchEvent, req: LLMRequest, tag_set: TagSet, *args, **kwargs)` |
| `@on.llm_response()`     | After raw LLM response is received                   | `(self, event: KiraMessageBatchEvent, resp: LLMResponse, *args, **kwargs)` |
| `@on.after_xml_parse()`  | After XML parsing (actions list available)           | `(self, event: KiraMessageBatchEvent, actions: list, *args, **kwargs)` |
| `@on.tool_result()`      | After a tool call returns its result                 | `(self, event: KiraMessageBatchEvent, result: ToolResult, *args, **kwargs)` |
| `@on.message_sent()`     | After a single message is sent to the IM platform    | `(self, event: KiraMessageBatchEvent, action: MessageChain, result: KiraIMSentResult, *args, **kwargs)` |
| `@on.step_result()`      | After each agent step completes                      | `(self, event: KiraMessageBatchEvent, step_result: KiraStepResult, *args, **kwargs)` |
| `@on.final_result()`     | After the final message result is generated          | `(self, event: KiraMessageBatchEvent, result: KiraFinalResult, *args, **kwargs)` |

### Comment events

`@on.comment()` maps to `EventType.ON_COMMENT` and receives `KiraCommentEvent`, separately from ordinary IM messages. `comment_id` and `comment_content` describe the current comment, `target` identifies the resource, and `root_comment_id` identifies the root comment. A top-level comment defaults to its own ID as the root.

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

This is a Hook excerpt; implement the plugin lifecycle methods too. Once you decide to own the comment, call `event.stop()` before the first external `await` to prevent duplicate replies. The fixed text only demonstrates routing; let a model generate actual interaction content as appropriate. The built-in comment plugin uses `SYS_LOW` for unclaimed comments; user plugins should use ordinary priorities.

### Final result events

`@on.final_result()` is active and fires after the Agent finishes a turn. It receives `KiraFinalResult` (imported from `core.chat.message_utils`), whose `step_results` contains the turn's step results. It runs before context persistence. Calling `event.stop()` here only suppresses remaining final-result handlers; it cannot undo delivered messages or skip the workflow's context write.

### Lifecycle Events

| Decorator            | Triggered When                                   | Handler Signature              |
| -------------------- | ------------------------------------------------ | ------------------------------ |
| `@on.loaded()`       | All plugins finished loading (no arguments)      | `(self, *args, **kwargs)`      |
| `@on.shutdown()`     | System is about to shut down (no arguments)      | `(self, *args, **kwargs)`      |

### Error Events

| Decorator             | Triggered When                                    | Handler Signature                                       |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `@on.exception()`     | Any hook handler raises an exception              | `(self, event, exc_event: KiraExceptionEvent, *args, **kwargs)` |

:::tip
All handler functions must be `async` methods of a `BasePlugin` subclass. Always accept `*args, **kwargs` for forward compatibility.
:::

## Message Processing Pipeline

The following diagram shows how events are dispatched during message processing:

```
IM Message Arrives
        │
        ▼
  @on.im_message()        ← set strategy: trigger / buffer / flush / discard
        │
        ▼
  [Message Buffering]
        │
        ▼
  @on.message_buffered()  ← sid only (lightweight notification)
        │
        ▼
  [Debounce / Batch]
        │
        ▼
  @on.im_batch_message()  ← access to all batched messages
        │
        ▼
  @on.llm_request()       ← inject prompts, tags, tools
        │
        ▼
  [LLM Call]
        │
        ▼
  @on.llm_response()      ← read raw LLM output, auto-fix XML
        │
        ▼
  [Tool Execution] ◄──────────► @on.tool_result()  ← per tool call
        │
        ▼
  [XML Parsing]
        │
        ▼
  @on.after_xml_parse()   ← inspect/modify parsed actions
        │
        ▼
  [Send Messages]
        │
        ▼
  @on.message_sent()      ← per message, with send result
        │
        ▼
  @on.step_result()       ← after each agent step
        │
        ▼
  [Loop or Complete]
```

## Priority

```python
class Priority(IntEnum):
    SYS_HIGH = 100   # Reserved for system use
    HIGH     = 50    # High priority (e.g. message pre-processing)
    MEDIUM   = 0     # Default
    LOW      = -50   # Low priority (e.g. post-processing)
    SYS_LOW  = -100  # Reserved for system use
```

**Higher number = executed first.** Defaults to `MEDIUM` when not specified.

:::warning
`SYS_HIGH` and `SYS_LOW` are reserved for builtin plugins. User plugins should only use `HIGH`, `MEDIUM`, `LOW`, or any custom integer value.
:::

The `priority` parameter accepts any integer, not just the predefined `Priority` enum values. For example, `priority=30` is valid and will place your handler between `MEDIUM(0)` and `HIGH(50)`.

## Example: Listening to Messages

```python
from core.plugin import on, Priority
from core.chat import KiraMessageEvent
from core.chat.message_elements import Text

class MyPlugin(BasePlugin):
    @on.im_message(priority=Priority.HIGH)
    async def on_message(self, event: KiraMessageEvent, *args, **kwargs):
        # Option 1: message_repr — concatenated repr of all elements (immediately available)
        text = event.message_repr

        # Option 2: extract plain text from chain (Text elements only)
        text = "".join(ele.text for ele in event.message.chain if isinstance(ele, Text))

        if "keyword" in text:
            # Handle logic...
            pass
```

## Message Handling Strategies

Inside an `@on.im_message()` hook, call methods on `event` to control how the message is handled. The default strategy is `discard`. The built-in message plugin sets it to `buffer`, which triggers LLM processing after a configurable number of messages or time.

| Method              | Strategy  | Description                                                                       |
| ------------------- | --------- | --------------------------------------------------------------------------------- |
| `event.trigger()`   | `trigger` | Process immediately, skip debounce, go straight to LLM                            |
| `event.buffer()`    | `buffer`  | Enter the buffer and wait; triggers the `ON_MESSAGE_BUFFERED` hook                |
| `event.flush()`     | `flush`   | Add to buffer and immediately flush all buffered messages for processing           |
| `event.discard()`   | `discard` | Discard this message (remaining hooks in the current phase still run)             |
| `event.stop()`      | —         | Immediately stop all subsequent hooks; message is not propagated further          |

All strategy methods accept an optional `force=True` argument that prevents subsequent hooks from overriding the strategy.

## Example: Injecting a Prompt

```python
from core.plugin import on
from core.provider import LLMRequest
from core.prompt_manager import Prompt

class MyPlugin(BasePlugin):
    @on.llm_request()
    async def inject_prompt(self, event, req: LLMRequest, tag_set, *args, **kwargs):
        # Option 1: append to an existing section
        for p in req.system_prompt:
            if p.name == "tools":
                p.content += "\nYou can use my_tool to..."
                break

        # Option 2: append a new Prompt object
        # name identifies this prompt section; source should be your plugin ID
        req.system_prompt.append(Prompt(
            content="Additional context injected by the plugin: ...",
            name="my_plugin_context",
            source="my_plugin",
        ))
```

> The two options can be combined. Option 1 is suited for appending to well-known sections (e.g. `"tools"`, `"memory"`); Option 2 is suited for inserting a fully independent context block.

## Example: Lifecycle Events

Use `@on.loaded()` and `@on.shutdown()` for one-time initialization or cleanup that should happen at system level (outside of a single plugin's `initialize()`/`terminate()` lifecycle):

```python
from core.plugin import on

class MyPlugin(BasePlugin):
    @on.loaded()
    async def on_system_ready(self, *args, **kwargs):
        # All plugins have finished loading — safe to interact with other plugins
        other = self.ctx.get_plugin_inst("other_plugin")
        if other:
            # Cross-plugin initialization...
            pass

    @on.shutdown()
    async def on_system_shutdown(self, *args, **kwargs):
        # System is shutting down — release external resources
        await self._close_connections()
```

## Example: Exception Handling

Use `@on.exception()` to catch and handle errors from other hook handlers. This is useful for logging, alerting, or fallback behavior:

```python
from core.plugin import on
from core.chat import KiraExceptionEvent

class MyPlugin(BasePlugin):
    @on.exception()
    async def on_error(self, event, exc_event: KiraExceptionEvent, *args, **kwargs):
        # exc_event contains structured error info
        print(f"Exception in {exc_event.stage}: {exc_event.name}: {exc_event.message}")
        # Available fields:
        #   exc_event.name      — exception class name (e.g. "ValueError")
        #   exc_event.message   — str(e)
        #   exc_event.traceback — full traceback string
        #   exc_event.stage     — which EventType caused the error (e.g. "on_llm_request")
        #   exc_event.source    — "plugin" or "core"
        #   exc_event.comp_id   — plugin ID of the failing handler
        #   exc_event.e         — the original exception object
```

:::tip
The exception handler itself is protected: if an `@on.exception()` handler throws, the error is logged but not re-dispatched (preventing infinite recursion).
:::

## Example: Message Sent

Use `@on.message_sent()` to track or react to individual message deliveries:

```python
from core.plugin import on
from core.chat import KiraMessageBatchEvent, MessageChain, KiraIMSentResult

class MyPlugin(BasePlugin):
    @on.message_sent()
    async def on_sent(self, event: KiraMessageBatchEvent, action: MessageChain, result: KiraIMSentResult, *args, **kwargs):
        if result.ok:
            print(f"Message sent successfully: {result.message_id}")
        else:
            print(f"Message send failed: {result.err}")
```

# Tool Registration

Tools expose callable functions to the LLM. There are two registration methods.

## Method 1: `@register.tool` Decorator

Best for simple tools defined directly as plugin class methods.

```python
from core.plugin import register

class MyPlugin(BasePlugin):
    @register.tool(
        name="my_tool",
        description="Tool description (the LLM uses this to decide when to call it)",
        params={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Query content"
                },
                "limit": {
                    "type": "integer",
                    "description": "Number of results to return, default 10"
                }
            },
            "required": ["query"]
        }
    )
    async def my_tool(self, event: KiraMessageBatchEvent, *_, query: str, limit: int = 10) -> str:
        # Tool logic; return a string result
        return f"Query result: {query}"
```

> `params` follows JSON Schema format (OpenAI tool-calling spec).
> The first parameter is `event: KiraMessageBatchEvent`; tool parameters are passed as keyword arguments. Use `*_` to stay compatible with any future positional parameters.

## Method 2: `BaseTool` Class (for Complex Tools)

Best when tool logic is complex, needs independent encapsulation, or must be reused. Subclass `BaseTool`, then inject it per-request via `req.tool_set.add()` inside an `@on.llm_request()` hook:

```python
from core.utils.tool_utils import BaseTool
from core.provider import LLMRequest
from core.plugin import on

class MySearchTool(BaseTool):
    name = "my_search"
    description = "Search for a keyword and return results"
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search keyword"}
        },
        "required": ["query"]
    }

    async def execute(self, query: str) -> str:
        # Tool execution logic
        return f"Search result: {query}"


class MyPlugin(BasePlugin):
    @on.llm_request()
    async def add_tools(self, event, req: LLMRequest, tag_set, *args, **kwargs):
        req.tool_set.add(MySearchTool(ctx=self.ctx))
```

> Unlike `@register.tool` (globally registered), `tool_set.add()` applies only to the current request. Use this when you need to conditionally provide a tool based on session context or other runtime conditions.

## Returning Attachments: ToolResult

Tool functions return a string by default. To also return files (images, audio, etc.), return a `ToolResult` object. The LLM can then send the attachment to the user via a `<file>` tag.

```python
from core.provider import ToolResult
from core.chat.message_elements import Image, Record, File

class MyPlugin(BasePlugin):
    @register.tool(
        name="take_screenshot",
        description="Take a screenshot and return the image",
        params={"type": "object", "properties": {}, "required": []}
    )
    async def take_screenshot(self, event: KiraMessageBatchEvent, *_) -> ToolResult:
        path = await self._do_screenshot()  # Returns local file path
        return ToolResult(
            text="Screenshot taken",
            attachments=[Image(path=path)]
        )
```

`ToolResult` fields:

| Field         | Type                              | Description                                   |
| ------------- | --------------------------------- | --------------------------------------------- |
| `text`        | `str`                             | Text description returned to the LLM           |
| `attachments` | `list[Image \| Record \| File]`   | Attachments the LLM can send via `<file>` tag  |

# Tag Registration

Tags register custom XML tag handlers that are triggered when the LLM output contains a matching tag. Two methods are available.

## Method 1: `@register.tag` Decorator (Recommended)

```python
from core.plugin import register
from core.chat.message_elements import Text

class MyPlugin(BasePlugin):
    @register.tag(
        name="my_tag",
        description="Tag description, injected into the LLM's tool instructions"
    )
    async def handle_my_tag(self, value: str, **kwargs) -> list:
        # value is the tag content, e.g. <my_tag>value</my_tag>
        # Returns list[BaseMessageElement]
        return [Text(value)]
```

## Method 2: `BaseTag` Class (for Complex or Conditionally Injected Tags)

Best when tag handling logic is heavy or needs independent encapsulation. Subclass `BaseTag`, then inject it per-request via `tag_set.register()` inside an `@on.llm_request()` hook:

```python
from core.tag import BaseTag
from core.provider import LLMRequest
from core.chat.message_elements import Image
from core.plugin import on

class MyTag(BaseTag):
    name = "my_tag"
    description = "Process a custom tag and render it as an image"

    async def handle(self, value: str, **kwargs) -> list:
        # self.ctx is available (passed in at registration time)
        image_path = await self._render(value)
        return [Image(path=image_path)]

    async def _render(self, content: str) -> str:
        # Complex rendering logic...
        return "/tmp/output.png"


class MyPlugin(BasePlugin):
    @on.llm_request()
    async def add_tags(self, event, req: LLMRequest, tag_set, *args, **kwargs):
        tag_set.register(MyTag(ctx=self.ctx))
```

> `tag_set` is the third positional parameter of the `@on.llm_request()` hook, of type `TagSet`. Unlike `@register.tag` (globally registered), this method applies only to the current request — useful for enabling tags conditionally per session or context.