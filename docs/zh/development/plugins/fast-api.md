# API 注册

`@register.api` 装饰器可以使插件暴露 HTTP REST API 端点，自动集成到 WebUI 的 FastAPI 应用中。所有插件 API 端点都以 `/api/plugin/{plugin_id}/` 为前缀。

## 导入

```python
from core.plugin import register
```

## 装饰器参数

| 参数      | 类型    | 必填 | 默认值 | 说明                                                   |
| --------- | ------- | ---- | ------ | ------------------------------------------------------ |
| `method`  | `str`   | 是   | —      | HTTP 方法: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`, `"PATCH"` |
| `path`    | `str`   | 是   | —      | 端点路径（如 `"/items"`, `"/users/{user_id}"`）       |
| `auth`    | `bool`  | 否   | `True` | 是否需要 JWT 认证                                       |
| `**kwargs`| dict    | 否   | —      | FastAPI `add_api_route` 方法的其他参数                 |

## 基础用法

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

**最终路由：**
- `GET /api/plugin/my_plugin/status`
- `GET /api/plugin/my_plugin/users/{user_id}`
- `POST /api/plugin/my_plugin/items`

## 路径参数和查询参数

FastAPI 风格的路径参数（带类型注解）对应路径参数；其他函数参数对应查询参数：

```python
@register.api(method="GET", path="/search", auth=True)
async def search(self, q: str, limit: int = 10, offset: int = 0):
    # q -> 查询参数（必填）
    # limit, offset -> 查询参数（可选）
    return {"query": q, "results": []}
```

## 使用 Pydantic 模型的请求体

对于 POST/PUT 请求，使用 Pydantic 模型进行请求验证：

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

## 错误处理

使用 FastAPI 的 `HTTPException` 抛出 HTTP 异常：

```python
from fastapi import HTTPException

@register.api(method="GET", path="/users/{user_id}", auth=True)
async def get_user(self, user_id: int):
    user = await self._fetch_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
```

## 响应模型和文档

指定响应模型以生成自动 OpenAPI 文档：

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
    summary="获取所有用户",
    description="返回一个完整的用户列表"
)
async def list_users(self):
    return [{"id": 1, "username": "kira", "email": "kira@example.com"}]
```

## 公开端点（无需认证）

```python
@register.api(method="GET", path="/public/info", auth=False)
async def public_info(self):
    return {"version": "1.0.0"}
```

# WebSocket 注册

`@register.ws` 装饰器允许插件暴露 WebSocket 端点，自动集成到 WebUI 的 FastAPI 应用中。所有插件 WebSocket 端点的路径前缀为 `/ws/plugin/{plugin_id}/`。

## 导入

```python
from core.plugin import register
```

## 装饰器参数

| 参数   | 类型    | 必填 | 默认值 | 说明                                     |
| ------ | ------- | ---- | ------ | ---------------------------------------- |
| `path` | `str`   | 是   | —      | 端点路径（如 `"/chat"`、`"/sync"`）       |
| `auth` | `bool`  | 否   | `True` | 是否需要 JWT 认证                        |

## 基础用法

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

端点可通过 `ws://<host>/ws/plugin/<plugin_id>/chat` 访问。

## 认证

当 `auth=True`（默认）时，框架会在 WebSocket 握手阶段 **先于** 端点执行验证 JWT 令牌。客户端必须通过以下方式之一提供令牌：

1. **查询参数**（推荐用于浏览器客户端）：
   ```
   ws://localhost:8080/ws/plugin/my_plugin/chat?token=<jwt>
   ```

2. **Authorization 请求头：**
   ```
   Authorization: Bearer <jwt>
   ```

认证失败时，连接将以 `4003` 关闭码关闭。

当 `auth=False` 时，端点无需认证即可公开访问：

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

## JSON 通信

进行结构化数据交换时，使用 `receive_json` / `send_json`：

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

## 注意事项

- 主类中的方法以 `self` 作为第一个参数，与 `@register.api` 一致
- 如果插件在运行时被禁用，新接入的连接将自动以 `1011` 关闭码关闭
- 插件重新启用后，WebSocket 端点会自动重新注册

# 页面和静态资源注册

插件可以使用 `@register.page` 和 `@register.static` 装饰器来注册自定义 WebUI 页面和提供静态资源。

## 页面注册

`@register.page` 装饰器注册插件页面。处理函数返回一个 `PluginPage` 对象，描述页面的来源。所有插件页面以 `/page/plugin/{plugin_id}/` 为前缀。

### 导入

```python
from core.plugin import register, PluginPage, PageMenu
```

### 装饰器参数

| 参数    | 类型                    | 必填 | 默认值  | 说明                 |
| ------- | ----------------------- | ---- | ------- | -------------------- |
| `route` | `str`                   | 是   | —       | URL 路径（如 `"/dashboard"`） |
| `auth`  | `bool`                  | 否   | `True`  | 是否需要用户认证     |
| `menu`  | `PageMenu` 或 `dict`    | 否   | `None`  | 侧边栏菜单配置       |

### PluginPage 工厂方法

`PluginPage` 提供三种创建方式：

#### `from_folder` — 推荐

serve 一个目录下的静态文件，适合预构建的 SPA 或纯 HTML 页面。**路径穿越保护**：只能访问插件目录内的文件夹。

```python
@register.page("/dashboard", menu=PageMenu(label="仪表盘", icon="DataAnalysis"))
def dashboard(self):
    return PluginPage.from_folder("./web")
```

#### `from_url` — 重定向

将 iframe 重定向到外部 URL。

```python
@register.page("/external", menu=PageMenu(label="外部页面", icon="Link"))
def external(self):
    return PluginPage.from_url("https://example.com")
```

#### `from_html` — 内联 HTML

serve 一段 HTML 字符串，适合简单页面。

```python
@register.page("/info", menu=PageMenu(label="信息", icon="Document"))
def info_page(self):
    return PluginPage.from_html("""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Info</title></head>
    <body><h1>插件信息</h1></body>
    </html>
    """)
```

### PageMenu

`PageMenu` 控制页面在 WebUI 侧边栏的显示。省略 `menu` 参数时页面不出现在侧边栏，但仍可通过 URL 访问。

| 参数    | 类型                          | 默认值 | 说明                                     |
| ------- | ----------------------------- | ------ | ---------------------------------------- |
| `label` | `str` 或 `dict[str, str]`    | 必填   | 显示文本，支持多语言 dict                |
| `icon`  | `str`                         | `None` | Element Plus 图标组件名                  |
| `order` | `int`                         | `100`  | 排序值（越小越靠前）                     |

#### 多语言 label

`label` 支持传入 locale dict，WebUI 根据当前语言自动选取，fallback 链：当前语言 → `en` → 第一个可用值。

```python
@register.page("/dashboard", menu=PageMenu(
    label={"zh": "仪表盘", "en": "Dashboard"},
    icon="DataAnalysis",
    order=10
))
def dashboard(self):
    return PluginPage.from_folder("./web")
```

#### dict 兼容

`menu` 也接受普通 dict（自动转换为 `PageMenu`）：

```python
@register.page("/info", menu={"label": "信息", "icon": "Document"})
def info_page(self):
    return PluginPage.from_html("<h1>Hello</h1>")
```

### 使用 PageMenu 对象直接注册

`PluginPage` 对象本身不携带 `auth` 和 `menu`，这些由 decorator 统一控制：

```python
@register.page("/dashboard", auth=False, menu=PageMenu(
    label={"zh": "仪表盘", "en": "Dashboard"},
    icon="DataAnalysis"
))
def dashboard(self):
    return PluginPage.from_folder("./web")
```

### 推荐目录结构

使用 `from_folder` 时，推荐的插件目录结构：

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
@register.page("/", menu=PageMenu(label="我的页面", icon="Box"))
def main_page(self):
    return PluginPage.from_folder("./web")
```

`web/index.html` 会被自动 serve 为页面入口。WebUI 会自动注入 `PluginPageContext` bridge SDK（见下文）。

## PluginPageContext Bridge SDK

通过 `from_folder` 或 `from_html` 提供的页面运行在 WebUI 的 iframe 中。WebUI 会自动注入 `PluginPageContext` bridge SDK，让页面可以获取上下文信息和调用插件 API。

### 使用方式

Bridge SDK 由 WebUI 自动注入，无需手动引入。在页面 JS 中直接使用：

```html
<script>
// 等待 bridge 就绪，获取上下文
window.PluginPageContext.ready().then(function (ctx) {
    console.log(ctx.pluginId)   // 插件 ID
    console.log(ctx.isDark)     // 是否深色模式
    console.log(ctx.locale)     // 当前语言（如 "zh"）
    console.log(ctx.pageRoute)  // 页面路由
})
</script>
```

### API

| 方法                                    | 返回值            | 说明                                     |
| --------------------------------------- | ----------------- | ---------------------------------------- |
| `ready()`                               | `Promise<ctx>`    | 返回 Promise，bridge 就绪后 resolve      |
| `getContext()`                          | `object \| null`  | 同步获取当前 context（未就绪时为 null）  |
| `onContext(fn)`                         | `() => void`      | 监听 context 变化，返回取消监听函数      |
| `onThemeChange(fn)`                     | `() => void`      | 监听主题切换，回调参数 `(isDark: bool)`  |
| `createWebSocket(path, protocols?)`    | `WebSocket`       | 创建已鉴权的 WebSocket，自动附加 `?token=<JWT>` |
| `api.get(endpoint, params?)`            | `Promise<any>`    | GET 请求 `/api/plugin/{id}/{endpoint}`   |
| `api.post(endpoint, body?)`             | `Promise<any>`    | POST 请求                                |
| `api.upload(endpoint, file, fieldName?)`| `Promise<any>`    | 上传文件（FormData）                     |
| `api.delete(endpoint)`                  | `Promise<any>`    | DELETE 请求                              |

### WebSocket 鉴权

当插件注册 `auth=True` 的 WebSocket 端点时：

```python
@register.ws("/call", auth=True)
async def ws_call(self, ws: WebSocket):
    ...
```

使用 `createWebSocket(path)` 连接——它会自动从 `localStorage` 读取 JWT token，并拼接到 `?token=` 查询参数中：

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

> **注意：** 必须在 `ready()` resolve 之后再调用 `createWebSocket(path)`——`buildWsUrl()`（内部使用）在 context 未就绪时会抛出异常。token 来源是 `localStorage.jwt_token`，在 WebUI 登录时自动写入。

### 主题适配

Bridge 会自动在 `<html>` 上设置 `data-theme="dark"` 或 `data-theme="light"`。插件页面通过 CSS 适配深色模式：

```css
body { background: #fff; color: #333; }

[data-theme="dark"] body {
    background: #1a1a2e;
    color: #eee;
}
```

也可以在 JS 中监听主题变化：

```javascript
window.PluginPageContext.onThemeChange(function (isDark) {
    document.body.classList.toggle('dark', isDark)
})
```

### 调用插件 API

Bridge 的 `api` 方法直接调用插件注册的 REST API 端点（同源 cookie 认证，无需额外处理）：

```javascript
// 调用 @register.api(method="GET", path="/hello") 注册的端点
window.PluginPageContext.api.get('/hello').then(function (data) {
    console.log(data)
})
```

### 完整示例

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
    <button id="btn">调用 API</button>
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

## 静态资源注册

`@register.static` 装饰器注册目录以提供静态文件（CSS、JavaScript、图片等）。静态文件无需认证即可公开访问。

### 参数说明

| 参数        | 类型   | 必填 | 默认值 | 说明                                             |
| ----------- | ------ | ---- | ------ | ------------------------------------------------ |
| `path`      | `str`  | 是   | —      | URL 路径前缀（如 `"/static"`）                   |
| `directory` | `str`  | 是   | —      | 本地目录路径（相对于插件根目录）                 |
| `html`      | `bool` | 否   | `False`| 若为 `True`，目录请求时 serve `index.html`      |

### 基础用法

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
            <h1>我的插件</h1>
            <script src="/page/plugin/my_plugin/static/js/app.js"></script>
        </body>
        </html>
        """)
```

**最终 URL：**
- 页面：`/page/plugin/my_plugin/`
- 静态 CSS：`/page/plugin/my_plugin/static/css/style.css`
- 静态 JS：`/page/plugin/my_plugin/static/js/app.js`

### 多个静态目录

```python
class MyPlugin(BasePlugin):
    @register.static(path="/css", directory="resources/css")
    @register.static(path="/js", directory="resources/js")
    @register.static(path="/images", directory="resources/images")
    async def _init_static(self):
        pass
```

**最终 URL：**
- `/page/plugin/my_plugin/css/*`
- `/page/plugin/my_plugin/js/*`
- `/page/plugin/my_plugin/images/*`

### SPA 的 HTML 模式

设置 `html=True` 时，访问 `/page/plugin/my_plugin/` 会 serve `dist/index.html`：

```python
@register.static(path="/", directory="dist", html=True)
async def _init_static(self):
    pass
```

# Widget 注册

`@register.widget` 装饰器允许插件在概览（Overview）仪表盘页面注册动态 Widget。Widget 函数在每次 `GET /api/overview` 请求时调用，实现数据的实时展示。

## 导入

```python
from core.plugin import register
```

## 装饰器参数

| 参数    | 类型                         | 必填 | 默认值    | 说明                                                        |
| ------- | ---------------------------- | ---- | --------- | ----------------------------------------------------------- |
| `label` | `str` 或 `dict[str, str]`   | 是   | —         | Widget 标题，支持多语言 dict                                |
| `icon`  | `str`                        | 否   | `"Box"`   | Element Plus 图标名（仅小卡片有效）                         |
| `color` | `str`                        | 否   | `"blue"`  | 主题色：`blue` / `green` / `purple` / `yellow` / `red` / `gray` |
| `order` | `int`                        | 否   | `100`     | 排序值（越小越靠前）                                        |
| `size`  | `str`                        | 否   | `"small"` | `"small"`（统计卡片）或 `"wide"`（宽卡片）                 |

## 函数返回值

被装饰的函数必须是**同步**方法，返回一个**普通字符串**：

- **小卡片 Widget**：返回显示值（如 `"42"`、`"3h 20m 15s"`）
- **宽 Widget**：返回 HTML 内容（如 `"<table>...</table><a class='...'>链接</a>"`）

:::tip 动态刷新
Widget 函数在每次 API 请求时被调用（默认 30 秒轮询间隔），返回值实时更新，无需刷新页面。
:::

## 小卡片 Widget

小卡片 Widget 以 4 列网格的形式渲染为统计卡片，与系统内置的统计卡片（运行时长、消息数、适配器数、内存）样式一致。

```
┌──────────────────────────┐
│ 标题              [图标]  │
│ 数值                      │
└──────────────────────────┘
```

### 基础示例

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

### 多个小卡片 Widget

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

## 宽 Widget

宽 Widget 以全宽卡片的形式渲染在统计卡片网格下方。宽 Widget 的 `icon` 参数会被忽略。

```
┌──────────────────────────────────────────────────┐
│ 标题                                             │
│ [HTML 内容通过 v-html 渲染]                      │
└──────────────────────────────────────────────────┘
```

### 基础示例

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

### 带按钮和链接的宽 Widget

宽 Widget 支持丰富的 HTML 内容，包括按钮和链接。使用 **Tailwind CSS 类名** 进行样式设置 —— 它们会通过全局 `.dark` 规则自动适配深色模式。

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

## 深色模式适配

Widget 内容通过 `v-html` 渲染在 WebUI 中。框架通过两种方式处理深色模式：

1. **裸 HTML 元素**（`<td>`、`<p>`、`<span>` 等）无 CSS 类时，深色模式下自动使用浅色文字
2. **带 Tailwind CSS 类的元素**（如 `dark:bg-blue-400`、`dark:text-gray-100`）由全局深色模式规则处理

:::warning 避免使用内联样式设置颜色
不要使用 `style="color: ..."` 设置颜色 —— 内联样式无法响应深色模式。请使用 Tailwind CSS 类名替代：

```html
<!-- ✅ 正确：自动适配深色模式 -->
<a class="text-gray-900 dark:text-gray-100">...</a>

<!-- ❌ 错误：始终深色文字，深色模式下不可见 -->
<a style="color: #1a1a1a">...</a>
```

对于没有添加任何类名的裸 `<td>`、`<p>` 等元素，深色模式文字颜色会被自动处理，无需额外样式。
:::

## 图标名称

图标使用 [Element Plus 图标组件名](https://element-plus.org/zh-CN/component/icon.html#图标集合)。常用选项：

| 图标名           | 说明         |
| ---------------- | ------------ |
| `Box`            | 默认 / 通用  |
| `Timer`          | 时钟 / 时长  |
| `Histogram`      | 统计         |
| `ChatDotRound`   | 消息         |
| `DataAnalysis`   | 仪表盘       |
| `Monitor`        | 系统         |
| `Star`           | 收藏         |
| `Warning`        | 警告         |
| `Coin`           | 金币         |
| `Connection`     | 网络         |

:::tip 回退机制
如果图标名称在映射中不存在，会回退到 `Box`。
:::

## 多语言 label

`label` 支持与 `PageMenu.label` 相同的多语言格式。WebUI 根据当前语言自动选取，fallback 链：当前语言 → `en` → 第一个可用值。

```python
@register.widget(
    label={"zh": "消息速率", "en": "Message Rate"},
    icon="ChatDotRound",
    color="green",
)
def widget_rate(self) -> str:
    return "120/min"
```

也支持普通字符串（不翻译）：

```python
@register.widget(label="Simple Counter", icon="Histogram")
def widget_count(self) -> str:
    return "42"
```

## Widget 生命周期

- Widget 注册发生在**导入时**（装饰器触发时）
- Widget 函数在**请求时**被调用（每次 `GET /api/overview`）
- **已禁用插件**的 Widget 会自动隐藏
- 插件卸载或重载时，Widget 数据会被自动清理