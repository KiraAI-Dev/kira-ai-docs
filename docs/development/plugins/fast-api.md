# API Registration

The `@register.api` decorator allows plugins to expose HTTP REST API endpoints that are automatically integrated into the WebUI's FastAPI application. All plugin API endpoints are prefixed with `/api/plugin/{plugin_id}/`.

## Import

```python
from core.plugin import register
```

## Decorator Parameters

| Parameter | Type      | Required | Default | Description                                                        |
| --------- | --------- | -------- | ------- | ------------------------------------------------------------------ |
| `method`  | `str`     | Yes      | —       | HTTP method: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`, `"PATCH"`    |
| `path`    | `str`     | Yes      | —       | Endpoint path (e.g., `"/items"`, `"/users/{user_id}"`)             |
| `auth`    | `bool`    | No       | `True`  | Require JWT authentication                                         |
| `**kwargs`| dict      | No       | —       | Additional arguments passed to FastAPI's `add_api_route` method    |

## Basic Usage

```python
class MyPlugin(BasePlugin):
    @register.api(method="GET", path="/status", auth=True)
    async def get_status(self):
        return {"status": "running"}

    @register.api(method="GET", path="/users/{user_id}", auth=True)
    async def get_user(self, user_id: int):
        return {"user_id": user_id}

    @register.api(method="POST", path="/items", auth=True)
    async def create_item(self, name: str, description: str = ""):
        return {"id": 123, "name": name}
```

**Final Routes:**
- `GET /api/plugin/my_plugin/status`
- `GET /api/plugin/my_plugin/users/{user_id}`
- `POST /api/plugin/my_plugin/items`

## Path Parameters and Query Parameters

FastAPI-style path parameters (with type annotations) become path parameters; other function parameters become query parameters:

```python
@register.api(method="GET", path="/search", auth=True)
async def search(self, q: str, limit: int = 10, offset: int = 0):
    # q -> query parameter (required)
    # limit, offset -> query parameters (optional with defaults)
    return {"query": q, "results": []}
```

## Request Body with Pydantic Models

For POST/PUT requests, use Pydantic models for request validation:

```python
from pydantic import BaseModel

class CreateUserRequest(BaseModel):
    username: str
    email: str
    age: int | None = None

@register.api(method="POST", path="/users", auth=True)
async def create_user(self, request: CreateUserRequest):
    return {"id": 123, "username": request.username}
```

## Error Handling

Raise HTTP exceptions using FastAPI's `HTTPException`:

```python
from fastapi import HTTPException

@register.api(method="GET", path="/users/{user_id}", auth=True)
async def get_user(self, user_id: int):
    user = await self._fetch_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## Response Models and Documentation

Specify response models for automatic OpenAPI documentation:

```python
from pydantic import BaseModel
from typing import List

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

@register.api(
    method="GET",
    path="/users",
    auth=True,
    response_model=List[UserResponse],
    summary="Get all users",
    description="Returns a list of all users"
)
async def list_users(self):
    return [{"id": 1, "username": "kira", "email": "kira@example.com"}]
```

## Public Endpoints (No Authentication)

```python
@register.api(method="GET", path="/public/info", auth=False)
async def public_info(self):
    return {"version": "1.0.0"}
```

# WebSocket Registration

The `@register.ws` decorator allows plugins to expose WebSocket endpoints, automatically integrated into the WebUI's FastAPI application. All plugin WebSocket endpoints are prefixed with `/ws/plugin/{plugin_id}/`.

## Import

```python
from core.plugin import register
```

## Decorator Parameters

| Parameter | Type   | Required | Default | Description                            |
| --------- | ------ | -------- | ------- | -------------------------------------- |
| `path`    | `str`  | Yes      | —       | Endpoint path (e.g., `"/chat"`, `"/sync"`) |
| `auth`    | `bool` | No       | `True`  | Require JWT authentication             |

## Basic Usage

```python
from fastapi import WebSocket, WebSocketDisconnect

@register.ws("/chat")
async def ws_chat(self, ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            await ws.send_text(f"Received: {data}")
    except WebSocketDisconnect:
        pass
```

The endpoint is accessible at `ws://<host>/ws/plugin/<plugin_id>/chat`.

## Authentication

When `auth=True` (default), the framework validates the JWT token during the WebSocket handshake **before** the endpoint executes. The client must provide the token via one of:

1. **Query parameter** (recommended for browser clients):
   ```
   ws://localhost:8080/ws/plugin/my_plugin/chat?token=<jwt>
   ```

2. **Authorization header:**
   ```
   Authorization: Bearer <jwt>
   ```

On auth failure, the connection is closed with code `4003`.

When `auth=False`, the endpoint is publicly accessible without authentication:

```python
@register.ws("/echo", auth=False)
async def ws_echo(self, ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            await ws.send_text(f"echo: {data}")
    except WebSocketDisconnect:
        pass
```

## JSON Communication

For structured data exchange, use `receive_json` / `send_json`:

```python
@register.ws("/sync")
async def ws_sync(self, ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_json()
            result = process(data)
            await ws.send_json({"status": "ok", "result": result})
    except WebSocketDisconnect:
        pass
```

## Notes

- Methods in the main class use `self` as the first parameter, same as `@register.api`
- If the plugin is disabled at runtime, incoming connections are automatically closed with code `1011`
- WebSocket endpoints are re-registered when a plugin is re-enabled after being disabled

# Page and Static Registration

Plugins can register custom WebUI pages and serve static resources using `@register.page` and `@register.static` decorators.

## Page Registration

The `@register.page` decorator registers plugin pages. The handler returns a `PluginPage` object that describes the page source. All plugin pages are prefixed with `/page/plugin/{plugin_id}/`.

### Import

```python
from core.plugin import register, PluginPage, PageMenu
```

### Decorator Parameters

| Parameter | Type                 | Required | Default | Description              |
| --------- | -------------------- | -------- | ------- | ------------------------ |
| `route`   | `str`                | Yes      | —       | URL path (e.g., `"/dashboard"`) |
| `auth`    | `bool`               | No       | `True`  | Require user authentication |
| `menu`    | `PageMenu` or `dict` | No       | `None`  | Sidebar menu config      |

### PluginPage Factory Methods

`PluginPage` provides three ways to create a page:

#### `from_folder` — Recommended

Serves static files from a directory. Ideal for pre-built SPAs or plain HTML. **Path traversal protection**: only directories inside the plugin root are accessible.

```python
@register.page("/dashboard", menu=PageMenu(label="Dashboard", icon="DataAnalysis"))
def dashboard(self):
    return PluginPage.from_folder("./web")
```

#### `from_url` — Redirect

Redirects the iframe to an external URL.

```python
@register.page("/external", menu=PageMenu(label="External", icon="Link"))
def external(self):
    return PluginPage.from_url("https://example.com")
```

#### `from_html` — Inline HTML

Serves an HTML string. Suitable for simple pages.

```python
@register.page("/info", menu=PageMenu(label="Info", icon="Document"))
def info_page(self):
    return PluginPage.from_html("""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Info</title></head>
    <body><h1>Plugin Info</h1></body>
    </html>
    """)
```

### PageMenu

`PageMenu` controls how a page appears in the WebUI sidebar. If `menu` is omitted, the page won't appear in the sidebar but remains accessible via direct URL.

| Parameter | Type                       | Default | Description                                  |
| --------- | -------------------------- | ------- | -------------------------------------------- |
| `label`   | `str` or `dict[str, str]` | Required | Display text, supports i18n dict            |
| `icon`    | `str`                      | `None`  | Element Plus icon component name             |
| `order`   | `int`                      | `100`   | Sort order (lower = higher)                  |

#### Multi-language label

`label` accepts a locale dict. The WebUI automatically selects the matching translation with fallback chain: current locale → `en` → first available value.

```python
@register.page("/dashboard", menu=PageMenu(
    label={"zh": "仪表盘", "en": "Dashboard"},
    icon="DataAnalysis",
    order=10
))
def dashboard(self):
    return PluginPage.from_folder("./web")
```

#### Dict compatibility

`menu` also accepts a plain dict (auto-converted to `PageMenu`):

```python
@register.page("/info", menu={"label": "Info", "icon": "Document"})
def info_page(self):
    return PluginPage.from_html("<h1>Hello</h1>")
```

### PluginPage Object Registration

`PluginPage` objects do not carry `auth` or `menu` — these are controlled exclusively by the decorator:

```python
@register.page("/dashboard", auth=False, menu=PageMenu(
    label={"zh": "仪表盘", "en": "Dashboard"},
    icon="DataAnalysis"
))
def dashboard(self):
    return PluginPage.from_folder("./web")
```

### Recommended Directory Structure

When using `from_folder`, the recommended plugin structure is:

```
my_plugin/
├── manifest.json
├── main.py
└── web/
    ├── index.html
    ├── style.css
    └── app.js
```

```python
@register.page("/", menu=PageMenu(label="My Page", icon="Box"))
def main_page(self):
    return PluginPage.from_folder("./web")
```

`web/index.html` is automatically served as the page entry point. The WebUI automatically injects the `PluginPageContext` bridge SDK (see below).

## PluginPageContext Bridge SDK

Pages provided via `from_folder` or `from_html` run inside a WebUI iframe. The WebUI automatically injects the `PluginPageContext` bridge SDK, allowing pages to access context information and call plugin APIs.

### Usage

The bridge SDK is auto-injected — no manual `<script>` tag needed. Use it directly in your page JS:

```html
<script>
// Wait for bridge to be ready, then get context
window.PluginPageContext.ready().then(function (ctx) {
    console.log(ctx.pluginId)   // Plugin ID
    console.log(ctx.isDark)     // Dark mode flag
    console.log(ctx.locale)     // Current locale (e.g., "zh")
    console.log(ctx.pageRoute)  // Page route
})
</script>
```

### API

| Method                                    | Return Value      | Description                                        |
| ----------------------------------------- | ----------------- | -------------------------------------------------- |
| `ready()`                                 | `Promise<ctx>`    | Returns a Promise that resolves when bridge is ready |
| `getContext()`                            | `object \| null`  | Synchronous context access (null before ready)     |
| `onContext(fn)`                           | `() => void`      | Subscribe to context changes; returns unsubscribe  |
| `onThemeChange(fn)`                       | `() => void`      | Subscribe to theme changes; callback `(isDark: bool)` |
| `createWebSocket(path, protocols?)`      | `WebSocket`       | Create an authenticated WebSocket with `?token=<JWT>` appended automatically |
| `api.get(endpoint, params?)`              | `Promise<any>`    | GET to `/api/plugin/{id}/{endpoint}`               |
| `api.post(endpoint, body?)`               | `Promise<any>`    | POST request                                       |
| `api.upload(endpoint, file, fieldName?)`  | `Promise<any>`    | Upload file via FormData                           |
| `api.delete(endpoint)`                    | `Promise<any>`    | DELETE request                                     |

### WebSocket Authentication

When a plugin registers a WebSocket endpoint with `auth=True`:

```python
@register.ws("/call", auth=True)
async def ws_call(self, ws: WebSocket):
    ...
```

Use `createWebSocket(path)` to connect — it automatically reads the JWT token from `localStorage` and appends it as a `?token=` query parameter:

```html
<script>
var PPC = window.PluginPageContext

PPC.ready().then(function () {
    var ws = PPC.createWebSocket('/call')

    ws.onmessage = function (event) {
        var data = JSON.parse(event.data)
        console.log(data)
    }

    ws.onopen = function () {
        ws.send(JSON.stringify({ type: 'hello' }))
    }
})
</script>
```

> **Note:** Always call `createWebSocket(path)` **after** `ready()` resolves — `buildWsUrl()` (used internally) throws if context is not yet initialized. The token is sourced from `localStorage.jwt_token`, which is set during WebUI login.

### Theme Adaptation

The bridge automatically sets `data-theme="dark"` or `data-theme="light"` on `<html>`. Plugin pages adapt to dark mode via CSS:

```css
body { background: #fff; color: #333; }

[data-theme="dark"] body {
    background: #1a1a2e;
    color: #eee;
}
```

Or listen for theme changes in JS:

```javascript
window.PluginPageContext.onThemeChange(function (isDark) {
    document.body.classList.toggle('dark', isDark)
})
```

### Calling Plugin APIs

The bridge's `api` methods directly call plugin-registered REST API endpoints (same-origin cookie auth, no extra handling needed):

```javascript
// Calls an endpoint registered with @register.api(method="GET", path="/hello")
window.PluginPageContext.api.get('/hello').then(function (data) {
    console.log(data)
})
```

### Complete Example

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="utf-8">
    <title>My Plugin Page</title>
    <style>
        body { font-family: system-ui; padding: 2rem; background: #f5f5f5; }
        [data-theme="dark"] body { background: #1a1a2e; color: #eee; }
    </style>
</head>
<body>
    <h1 id="title">Loading...</h1>
    <button id="btn">Call API</button>
    <pre id="result"></pre>

    <script>
        var PPC = window.PluginPageContext

        PPC.ready().then(function (ctx) {
            document.getElementById('title').textContent =
                'Plugin: ' + ctx.pluginId + ' | Locale: ' + ctx.locale
        })

        PPC.onThemeChange(function (isDark) {
            console.log('Theme changed:', isDark ? 'dark' : 'light')
        })

        document.getElementById('btn').addEventListener('click', function () {
            PPC.api.get('/hello').then(function (data) {
                document.getElementById('result').textContent = JSON.stringify(data, null, 2)
            })
        })
    </script>
</body>
</html>
```

## Static Resource Registration

The `@register.static` decorator registers a directory for serving static files (CSS, JavaScript, images, etc.). Static files are publicly accessible without authentication.

### Parameters

| Parameter   | Type    | Required | Default | Description                                              |
| ----------- | ------- | -------- | ------- | -------------------------------------------------------- |
| `path`      | `str`   | Yes      | —       | URL path prefix (e.g., `"/static"`)                      |
| `directory` | `str`   | Yes      | —       | Local directory path relative to plugin root             |
| `html`      | `bool`  | No       | `False` | If `True`, serve `index.html` for directory requests     |

### Basic Usage

```python
class MyPlugin(BasePlugin):
    @register.static(path="/static", directory="static")
    async def _init_static(self):
        pass

    @register.page(route="/")
    async def main_page(self):
        return HTMLResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <link rel="stylesheet" href="/page/plugin/my_plugin/static/css/style.css">
        </head>
        <body>
            <h1>My Plugin</h1>
            <script src="/page/plugin/my_plugin/static/js/app.js"></script>
        </body>
        </html>
        """)
```

**Final URLs:**
- Page: `/page/plugin/my_plugin/`
- Static CSS: `/page/plugin/my_plugin/static/css/style.css`
- Static JS: `/page/plugin/my_plugin/static/js/app.js`

### Multiple Static Directories

```python
class MyPlugin(BasePlugin):
    @register.static(path="/css", directory="resources/css")
    @register.static(path="/js", directory="resources/js")
    @register.static(path="/images", directory="resources/images")
    async def _init_static(self):
        pass
```

**Final URLs:**
- `/page/plugin/my_plugin/css/*`
- `/page/plugin/my_plugin/js/*`
- `/page/plugin/my_plugin/images/*`

### HTML Mode for SPA

With `html=True`, accessing `/page/plugin/my_plugin/` will serve `dist/index.html`:

```python
@register.static(path="/", directory="dist", html=True)
async def _init_static(self):
    pass
```

# Widget Registration

The `@register.widget` decorator allows plugins to register dynamic widgets on the Overview dashboard page. Widget functions are called on each `GET /api/overview` request, enabling real-time data display.

## Import

```python
from core.plugin import register
```

## Decorator Parameters

| Parameter | Type                         | Required | Default   | Description                                                  |
| --------- | ---------------------------- | -------- | --------- | ------------------------------------------------------------ |
| `label`   | `str` or `dict[str, str]`   | Yes      | —         | Widget title, supports i18n dict                             |
| `icon`    | `str`                        | No       | `"Box"`   | Element Plus icon name (small widgets only)                  |
| `color`   | `str`                        | No       | `"blue"`  | Theme color: `blue` / `green` / `purple` / `yellow` / `red` / `gray` |
| `order`   | `int`                        | No       | `100`     | Sort position (lower = higher)                               |
| `size`    | `str`                        | No       | `"small"` | `"small"` (stat card) or `"wide"` (full-width card)          |

## Function Return Value

The decorated function must be a **synchronous** method that returns a **plain string**:

- **Small widgets**: Return the display value (e.g. `"42"`, `"3h 20m 15s"`)
- **Wide widgets**: Return HTML content (e.g. `"<table>...</table><a class='...'>Link</a>"`)

:::tip Dynamic Refresh
Widget functions are called on each API request (default 30-second polling interval). Return values update in real-time without page reload.
:::

## Small Widgets

Small widgets render as stat cards in a 4-column grid, matching the built-in system stat cards (uptime, messages, adapters, memory).

```
┌──────────────────────────┐
│ Label            [icon]  │
│ Value                    │
└──────────────────────────┘
```

### Basic Example

```python
import time

class MyPlugin(BasePlugin):
    def __init__(self, ctx, cfg):
        super().__init__(ctx, cfg)
        self._start_ts = int(time.time())

    @register.widget(
        label={"zh": "运行时长", "en": "Uptime"},
        icon="Timer",
        color="blue",
        order=200,
    )
    def widget_uptime(self) -> str:
        elapsed = int(time.time()) - self._start_ts
        m, s = divmod(elapsed, 60)
        h, m = divmod(m, 60)
        return f"{h}h {m}m {s}s"
```

### Multiple Small Widgets

```python
@register.widget(
    label={"zh": "事件计数", "en": "Event Count"},
    icon="Histogram",
    color="purple",
    order=201,
)
def widget_event_count(self) -> str:
    return str(self._event_count)
```

## Wide Widgets

Wide widgets render as full-width cards below the stat card grid. The `icon` parameter is ignored for wide widgets.

```
┌──────────────────────────────────────────────────┐
│ Label                                            │
│ [HTML content rendered via v-html]               │
└──────────────────────────────────────────────────┘
```

### Basic Example

```python
@register.widget(
    label={"zh": "服务状态", "en": "Service Status"},
    size="wide",
    order=300,
)
def widget_status(self) -> str:
    rows = ""
    for svc in self._get_services():
        status = "✅" if svc.ok else "❌"
        rows += f"<tr><td style='padding:4px 12px'>{svc.name}</td>"
        rows += f"<td style='padding:4px 12px'>{status}</td></tr>"
    return f"<table style='border-collapse:collapse'>{rows}</table>"
```

### Wide Widget with Buttons and Links

Wide widgets support rich HTML content including buttons and links. Use **Tailwind CSS classes** for styling — they automatically adapt to dark mode via the global `.dark` overrides.

```python
@register.widget(
    label={"zh": "插件注册摘要", "en": "Plugin Registration Summary"},
    size="wide",
    order=302,
)
def widget_summary(self) -> str:
    table = "<table style='border-collapse:collapse;margin-bottom:12px'>"
    table += "<tr><td style='padding:4px 12px'>Tools</td>"
    table += "<td style='padding:4px 12px;font-weight:600'>5</td></tr>"
    table += "</table>"
    btn = (
        '<a href="https://example.com" target="_blank" rel="noopener" '
        'class="inline-block px-4 py-2 rounded text-sm font-medium no-underline '
        'bg-blue-500 hover:bg-blue-600 text-white '
        'dark:bg-blue-400 dark:hover:bg-blue-300 dark:text-gray-900 '
        'transition-colors">📖 Documentation</a>'
    )
    return table + btn
```

## Dark Mode Support

Widget content is rendered via `v-html` inside the WebUI. The framework handles dark mode in two ways:

1. **Bare HTML elements** (`<td>`, `<p>`, `<span>`, etc.) without CSS classes automatically get light-colored text in dark mode
2. **Elements with Tailwind CSS classes** (e.g. `dark:bg-blue-400`, `dark:text-gray-100`) are handled by the global dark-mode rules

:::warning Avoid Inline Styles for Colors
Do not use inline `style="color: ..."` for colors — inline styles cannot respond to dark mode. Use Tailwind CSS classes instead:

```html
<!-- ✅ Correct: adapts to dark mode -->
<a class="text-gray-900 dark:text-gray-100">...</a>

<!-- ❌ Wrong: always dark text, breaks in dark mode -->
<a style="color: #1a1a1a">...</a>
```

For bare `<td>`, `<p>`, etc. without any class, dark mode text color is handled automatically — no extra styling needed.
:::

## Icon Names

Icons use [Element Plus icon component names](https://element-plus.org/en-US/component/icon.html#icon-collection). Common choices:

| Icon Name        | Description       |
| ---------------- | ----------------- |
| `Box`            | Default / generic |
| `Timer`          | Clock / duration  |
| `Histogram`      | Statistics        |
| `ChatDotRound`   | Messages          |
| `DataAnalysis`   | Dashboard         |
| `Monitor`        | System            |
| `Star`           | Favorites         |
| `Warning`        | Alerts            |
| `Coin`           | Currency          |
| `Connection`     | Network           |

:::tip Fallback
If the icon name is not found in the mapping, it falls back to `Box`.
:::

## Multi-language Label

`label` supports the same i18n format as `PageMenu.label`. The WebUI automatically selects the matching translation with fallback chain: current locale → `en` → first available value.

```python
@register.widget(
    label={"zh": "消息速率", "en": "Message Rate"},
    icon="ChatDotRound",
    color="green",
)
def widget_rate(self) -> str:
    return "120/min"
```

A plain string is also accepted (no translation):

```python
@register.widget(label="Simple Counter", icon="Histogram")
def widget_count(self) -> str:
    return "42"
```

## Widget Lifecycle

- Widget registration happens at **import time** (when the decorator fires)
- Widget functions are called at **request time** (on each `GET /api/overview`)
- Widgets from **disabled plugins** are automatically hidden
- Widget data is cleaned up when a plugin is unloaded or reloaded