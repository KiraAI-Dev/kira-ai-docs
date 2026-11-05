# BiliBili 适配器

BiliBili 适配器可以接收账号私信、监听回复与 @ 评论，并通过 Feed 能力浏览、搜索和发布动态及发送评论。私信与 Feed 能力分别注册；关闭私信后，Feed 能力仍可使用。

## 登录与基本配置

1. 在 WebUI 的 **适配器**中添加 BiliBili 实例，设置唯一名称并保存。
2. 启用后按登录流程扫码，或手动填写账号 UID 与登录字段。
3. 根据用途配置私信和评论通知，再从日志确认登录与监听状态。

扫码登录可填写账号 UID 和凭据。手动登录字段包括 `sessdata`、`bili_jct`、`buvid3`、`dedeuserid`、`ac_time_value`；Cookie、LocalStorage 内容和登录二维码不要公开分享。

## 私信

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enable_im` | `true` | 是否注册并启动私信能力 |
| `permission_mode` | `allow_list` | 私信接收的白名单或黑名单模式 |
| `user_allow_list` | `[]` | 白名单模式下允许的用户 UID |
| `user_deny_list` | `[]` | 黑名单模式下拒绝的用户 UID |

默认白名单为空，不会接收普通用户私信。需要私信时应填写允许的 UID，或按实际需求选择黑名单模式。UID 应填写账号标识，不是昵称。

私信需要有效的 `sessdata`。当前输出支持文字、图片与表情，对应 XML 输出元素为 `text`、`img`、`emoji`；不要假定引用、提及或视频分享均可输出。

## 评论回复与提及通知

`enable_comment_notifications` 默认开启，监听启动后回复或 @ 此账号的新评论，需要登录凭据和账号 UID，**无需填写视频 BVID**。轮询间隔由 `listening_interval` 控制，默认 20 秒。

内置 **默认评论**（`default-comment`）插件会处理尚未被其他插件接管的评论，使用已配置的默认 LLM 生成人设回复。仅启用适配器并不代表模型和人设已配置完成。

`listening_bvid` 仍可用于指定视频的评论轮询，但只在账号评论通知监听未启动时使用；它不是与账号通知同时运行的第二个监听器。`message_process_interval` 默认 5 秒，用于视频评论处理间隔。

## 动态与开发接口

动态浏览、搜索、发布和评论通过 `FeedCapability` 提供，平台特有参数由该能力解释。不要再使用旧 `SocialMediaAdapter` 接口，也不要假定启用的 BiliBili 实例一定具有 `IMCapability`。

开发说明见[适配器开发](../../development/adapters)和[评论钩子](../../development/plugins/hooks#评论事件)。
