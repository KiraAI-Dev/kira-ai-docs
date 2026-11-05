# Adapter Development Guide

Built-in adapters live in the core source tree. A plugin can package an Adapter in its own directory and register it with `await self.ctx.register_adapter("relative/path")`; see [PluginContext API](./plugins/context#register-plugin-owned-providers-and-adapters) for the required layout, lifecycle, and explicit unregistration.

## v3 capability architecture

Adapters inherit `BaseAdapter` and accept an `AdapterContext`. The adapter owns shared clients, resources, and lifecycle; capability objects expose platform operations. The old `IMAdapter`, `SocialMediaAdapter`, and `LiveStreamAdapter` in `core.adapter.adapter_utils` have been removed.

```python
from core.adapter import AdapterContext, BaseAdapter, IMCapability

class MyAdapter(BaseAdapter):
    def __init__(self, ctx: AdapterContext):
        super().__init__(ctx)
        self.register_capability(IMCapability, MyIMCapability(self))
```

This is a constructor excerpt. Implement `MyIMCapability` in your component; a complete adapter also implements `start()`, `stop()`, and `get_client()`. `ctx.info` supplies adapter information and configuration, and `ctx.event_queue` supplies the event queue. Plugin-owned components must define a `BaseAdapter` subclass in their module; see [PluginContext API](./plugins/context#register-plugin-owned-providers-and-adapters) for the layout.

| API | Behavior |
| --- | --- |
| `register_capability(type, instance)` | Registers an owned instance; duplicate capability kinds are rejected |
| `get_capability(type)` | Returns the unique matching capability; raises `ValueError` if missing or ambiguous |
| `get_capabilities()` | Returns a registry copy, while capability objects remain shared |
| `capabilities` | Read-only mapping view |
| `publish(event)` | Synchronously enqueues an event, including non-IM events |
| `create_qrcode_login_handler(config)` | Class method returning `None` by default; implement it for QR login |

Do not infer chat support from a concrete adapter class. Query `IMCapability` and handle missing capabilities. BiliBili, for example, can retain Feed support with DMs disabled.

## Lifecycle

`async start()` is the complete running coroutine. It stays active until stopped, cancelled, or failed; returning means the run has ended. Do not create a background task and immediately return. The manager schedules and observes it, but a return from `start_adapter()` does not indicate successful login.

`stop()` must stop and await owned tasks and release clients and connections. The running coroutine also needs reliable cleanup on exit. Propagate unrecoverable errors to the manager, and prevent repeated or concurrent starts from creating duplicate listeners.

## IM capability and output formats

An `IMCapability` subclass implements:

```python
async def get_message_metadata(self) -> MessageFormatMetadata: ...
async def send_direct_message(self, user_id, message) -> KiraIMSentResult | None: ...
async def send_group_message(self, group_id, message) -> KiraIMSentResult | None: ...
```

Import `MessageFormatMetadata` from `core.adapter`, and `KiraIMSentResult` and `MessageChain` from `core.chat`. Metadata contains `supported_elements: list[str]` and `emojis: dict[str, str] | None`. It declares output formats, not permissions or login state. `emojis=None` means emoji are unsupported; an empty dictionary means there is no enumerable catalogue.

The image output tag is `img`, while the archived message element type is `image`. Declare only output elements the platform actually supports.

Construct `KiraMessageEvent` and `KiraMessageBatchEvent` with `supported_elements`, normally taken from `await im.get_message_metadata()`. The deprecated `message_types=` keyword and read/write alias remain accepted, but the old keyword cannot be mixed with the new keyword or positional arguments. The adapter's old `message_types` property is also transitional. These aliases do not restore the removed adapter base classes.

For proactive plugin messages, prefer `await self.ctx.send_message_chain(sid, chain)` for unified delivery and history handling. Call capability send methods directly when you specifically need a platform operation.

## Access control

Use `core.adapter.access.ListAccessPolicy` for lists. Policies are scoped by registered capability type and permission string; missing policies deny access.

```python
from core.adapter import IMCapability
from core.adapter.access import ListAccessPolicy

self.access.set_policy(
    capability_type=IMCapability,
    permission="im.direct.receive",
    policy=ListAccessPolicy.from_lists("allow_list", allow_list=["123456"]),
)
```

Place this in adapter instance initialization. Before accepting an event, check `im.is_allowed(user_id, permission="im.direct.receive")`; group reception uses `im.group.receive`. Migrate away from the old base classes' `user_list` and `group_list` attributes.

## Feed and comment capability

Posts, search, and comments use `FeedCapability`. Import the types from `core.adapter`:

| Operation | API |
| --- | --- |
| Browse | `await feed.get_feed(FeedQuery(...)) -> FeedPage` |
| Search | `await feed.search_feed(FeedSearchQuery(...)) -> FeedPage` |
| Publish | `await feed.send_post(FeedPost(content=chain, extra=...))` |
| Comment | `await feed.send_comment(chain, target, root=..., parent=...)` |
| Output metadata | `await feed.get_comment_metadata()` / `get_post_metadata()` |

`FeedPage` contains `items`, `next_cursor`, and `has_more`. `FeedItem` supplies resource references, content, author, and attachments. The platform interprets `FeedRef(resource_type, id)`. Cursors belong to the issuing adapter instance; keep platform-specific filters and publishing options in `extra`.

Publish `KiraCommentEvent` for received comments. Plugins take ownership through [`@on.comment()`](./plugins/hooks#comment-events); preserve the meanings of `target`, `root_comment_id`, and `comment_id` when replying.

The currently exported generic capabilities are `IMCapability` and `FeedCapability`. Reserved live-event and voice-channel capabilities are not exported and must not be treated as available APIs.

## Manifest Icons

Adapters can optionally define icons in their `manifest.json`:

```json
{
  "icon": "icon.svg",
  "icon-dark": "icon-dark.svg"
}
```

Both paths are relative to the adapter directory containing `manifest.json`. The WebUI displays them in the adapter platform selector and on adapter cards.

- `icon`: icon used in light mode.
- `icon-dark`: icon used in dark mode. If omitted, `icon` is used in both themes.

Icon paths must resolve inside the adapter directory. Absolute paths and paths outside that directory are ignored. SVG, PNG, JPEG, GIF, WebP, AVIF, and ICO are supported. Use a square asset with sufficient contrast for its intended theme.
