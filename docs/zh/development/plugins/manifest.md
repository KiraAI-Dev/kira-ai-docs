# manifest.json

描述插件的基本信息，**必须存在**，否则插件将以文件夹名作为 `plugin_id`。

```json
{
  "display_name": "我的插件",
  "plugin_id": "my_plugin",
  "version": "1.0",
  "core_version": ">=3.0.0",
  "author": "Your Name",
  "description": "插件功能描述",
  "tags": ["utility", "automation"],
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
| `tags`         | 用于分类插件的标签列表                    | 否   |
| `repo`         | 仓库地址                                  | 否   |
| `icon`         | 相对于插件目录的图片路径，浅色模式使用    | 否   |
| `icon-dark`    | 相对于插件目录的图片路径，深色模式使用；省略时回退到 `icon` | 否 |
| `locales`      | 按语言代码（如 `zh`）提供本地化覆盖，支持字段：`display_name`、`description` | 否   |

> `locales` 字段允许为 `display_name` 和 `description` 提供翻译值，WebUI 会根据用户语言偏好自动显示对应语言的版本。

> `core_version` 使用 Python `requirements.txt` 的版本说明符语法，支持 `>=`、`<=`、`>`、`<`、`==`、`!=`、`~=` 等操作符，也可以组合使用（用逗号分隔）。省略此字段表示不限制 KiraAI 版本。

> 图标路径必须位于插件目录内；绝对路径及目录外路径会被忽略。支持 SVG、PNG、JPEG、GIF、WebP、AVIF 和 ICO。插件图标会显示在 WebUI 的插件卡片中。

## v2 / v3 发布与版本约束

版本约束写在 **manifest.json** 的 `core_version` 中，`schema.json` 只声明插件配置项，不参与核心版本兼容检查。下限必须是插件实际依赖且已验证的最早版本，不要仅因为插件能导入就声明支持全部旧版本。

如果插件无法同时兼容 v2 和 v3，先发布并保留最后一个 v2 Release，再进行 v3 迁移：

| 发布对象 | `core_version` 示例 | 边界 |
| --- | --- | --- |
| 已验证最低为 v2.34.8 的 v2 插件 | `>=2.34.8,<3.0.0a1` | 排除所有 v3 alpha、rc 和正式版 |
| 依赖 rc.1 异步会话接口且验证过 rc.1 的插件 | `>=3.0.0rc1` | 包含 rc.1，排除 v2 与更早 alpha |
| 只验证或支持正式 v3 的插件 | `>=3.0.0` | 排除 v3.0.0 的预发布版 |

这些最低版本都是示例，实际应保留原有支持范围并按验证结果调整。需要包含最低版本时使用 `>=`；`>3.0.0` 不包含 v3.0.0 本身。

版本格式由 `packaging` 解析，可写 `3.0.0a1`、`3.0.0rc1`。加载器启用预发布匹配，但仍遵守比较符的边界。

在 README 和两个 Release 的说明中分别保留 v2 固定版本与 v3 适配版的安装链接，写清最低核心版本、是否停止支持 v2、配置/数据调整和验证过的版本。`core_version` 只阻止不兼容加载，不会自动选择旧 Release 或转换插件代码。

迁移内容见[开发指南](../guide)。若自行实现跨版本兼容，需说明具体兼容范围和处理行为，不要仅扩大版本区间。
