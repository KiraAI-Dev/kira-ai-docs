# manifest.json

描述插件的基本信息，**必须存在**，否则插件将以文件夹名作为 `plugin_id`。

```json
{
  "display_name": "我的插件",
  "plugin_id": "my_plugin",
  "version": "1.0",
  "core_version": ">=1.0.0",
  "author": "Your Name",
  "description": "插件功能描述",
  "repo": "https://github.com/...",
  "icon": "icon.svg",
  "icon-dark": "icon-dark.svg",
  "locales": {
    "en/zh": {
      "display_name": "我的插件",
      "description": "插件功能描述"
    }
  }
}
```

| 字段           | 说明                                      | 必填 |
| -------------- | ----------------------------------------- | ---- |
| `plugin_id`    | 插件唯一 ID，影响配置文件名和数据目录名   | 推荐 |
| `display_name` | WebUI 中显示的插件名称                    | 否   |
| `version`      | 版本号                                    | 否   |
| `core_version` | 所需的 KiraAI 版本要求，遵循 [PEP 508](https://peps.python.org/pep-0508/) 版本说明符语法（如 `>=1.0.0`、`>=1.0,<2.0`、`~=1.2`）。不满足时插件不会被加载，WebUI 将显示错误信息 | 否   |
| `author`       | 作者                                      | 否   |
| `description`  | 插件描述                                  | 否   |
| `repo`         | 仓库地址                                  | 否   |
| `icon`         | 相对于插件目录的图片路径，浅色模式使用    | 否   |
| `icon-dark`    | 相对于插件目录的图片路径，深色模式使用；省略时回退到 `icon` | 否 |
| `locales`      | 按语言代码（如 `zh`）提供本地化覆盖，支持字段：`display_name`、`description` | 否   |

> `locales` 字段允许为 `display_name` 和 `description` 提供翻译值，WebUI 会根据用户语言偏好自动显示对应语言的版本。

> `core_version` 使用 Python `requirements.txt` 的版本说明符语法，支持 `>=`、`<=`、`>`、`<`、`==`、`!=`、`~=` 等操作符，也可以组合使用（用逗号分隔）。省略此字段表示不限制 KiraAI 版本。

> 图标路径必须位于插件目录内；绝对路径及目录外路径会被忽略。支持 SVG、PNG、JPEG、GIF、WebP、AVIF 和 ICO。插件图标会显示在 WebUI 的插件卡片中。
