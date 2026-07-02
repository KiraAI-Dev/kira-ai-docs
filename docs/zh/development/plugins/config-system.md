# 配置系统（schema.json）

通过 `schema.json` 定义插件的配置字段，系统会自动生成 WebUI 配置界面并持久化配置。

## 位置

`data/plugins/my_plugin/schema.json`

## 配置在插件中的读取

```python
class MyPlugin(BasePlugin):
    async def initialize(self):
        api_key = self.plugin_cfg.get("api_key", "")
        enabled = self.plugin_cfg.get("enabled", True)
        max_count = self.plugin_cfg.get("max_count", 10)
```

## 支持的字段类型

| type           | 说明                           | 额外参数                  |
| -------------- | ------------------------------ | ------------------------- |
| `string`       | 单行文本输入框                 | —                         |
| `integer`      | 整数输入框                     | —                         |
| `float`        | 浮点数输入框                   | —                         |
| `sensitive`    | 密码形式隐藏（用于 API Key 等）| —                         |
| `switch`       | 布尔开关                       | —                         |
| `list`         | 多行列表（每行一条）           | —                         |
| `enum`         | 下拉选项                       | `options: [...]`          |
| `multi_select` | 多选下拉框                     | `options: [...]`          |
| `json`         | JSON 编辑器                    | —                         |
| `yaml`         | YAML 编辑器                    | —                         |
| `editor`       | 代码/文本编辑器                | `language: "python"`      |
| `textarea`     | 多行纯文本输入                 | —                         |
| `markdown`     | Markdown 编辑器                | —                         |
| `model_select` | 模型选择器                     | `model_type: "llm"/"tts"/"stt"/"image"/"embedding"/"rerank"/"video"` |
| `persona_select` | 人设选择器（保存人设 ID）    | —                                                       |
| `section`      | 可折叠分组区域                 | `collapsed`, `fields`     |
| `info`         | 只读信息提示（不存储数据）     | `level: "info"/"warning"` |

## 示例 schema.json

```json
{
  "api_key": {
    "type": "sensitive",
    "name": "API Key",
    "default": "",
    "hint": "服务的 API 密钥",
    "locales": {
      "zh": { "name": "API 密钥", "hint": "服务的 API 密钥" }
    }
  },
  "filed_enabled": {
    "type": "switch",
    "name": "启用",
    "default": true,
    "hint": "是否启用xxx",
    "locales": {
      "zh": { "name": "启用", "hint": "是否启用该功能" }
    }
  },
  "max_results": {
    "type": "integer",
    "name": "最大结果数",
    "default": 10,
    "hint": "每次最多返回的结果条数"
  },
  "mode": {
    "type": "enum",
    "name": "模式",
    "default": "auto",
    "options": ["auto", "manual", "disabled"],
    "hint": "运行模式"
  },
  "allowed_sessions": {
    "type": "list",
    "name": "允许的会话",
    "default": [],
    "hint": "留空表示不限制，每行一个会话 ID"
  },
  "llm_model": {
    "type": "model_select",
    "name": "使用的语言模型",
    "model_type": "llm",
    "default": "",
    "hint": "留空则使用系统默认模型"
  },
  "features": {
    "type": "multi_select",
    "name": "功能",
    "default": ["chat"],
    "options": ["chat", "search", "tools", "vision"],
    "hint": "选择启用的功能"
  },
  "section_advanced": {
    "type": "section",
    "name": "高级设置",
    "hint": "高级选项，修改需谨慎",
    "collapsed": true,
    "fields": {
      "retries": {
        "type": "integer",
        "name": "重试次数",
        "hint": "最大重试次数",
        "default": 3
      },
      "extra_headers": {
        "type": "json",
        "name": "额外请求头",
        "hint": "额外的 HTTP 请求头",
        "default": {}
      }
    }
  }
}
```

## Section 类型

`section` 是一种特殊类型，用于将嵌套字段分组到可折叠区域中。内部字段以嵌套对象的形式保存在 section 键下。

**参数：**

| 参数       | 类型    | 说明                       |
| ---------- | ------- | -------------------------- |
| `collapsed`| boolean | 是否默认折叠               |
| `fields`   | object  | 嵌套字段定义（格式与顶层字段相同） |

**保存后的配置格式：**

```json
{
  "section_basic": {
    "api_key": "sk-xxx",
    "timeout": 30
  },
  "section_advanced": {
    "retries": 3
  }
}
```

**在插件代码中读取嵌套配置：**

```python
class MyPlugin(BasePlugin):
    async def initialize(self):
        basic = self.plugin_cfg.get("section_basic", {})
        api_key = basic.get("api_key", "")
        timeout = basic.get("timeout", 30)

        advanced = self.plugin_cfg.get("section_advanced", {})
        retries = advanced.get("retries", 3)
```

Section 的子字段同样支持 `locales` 国际化。

## Info 类型

`info` 是一种只读字段，用于在配置面板中显示信息提示。不会存储任何数据，仅用于向用户展示提示或引导信息。

**参数：**

| 参数    | 类型   | 说明                                           |
| ------- | ------ | ---------------------------------------------- |
| `level` | string | `"info"`（默认）蓝色信息提示，`"warning"`琥珀色警告提示 |

**示例：**

```json
{
  "notice": {
    "type": "info",
    "name": "提示",
    "hint": "此设置不会影响已有的对话。",
    "level": "info",
    "locales": {
      "zh": { "name": "提示", "hint": "此设置不会影响已有的对话。" }
    }
  },
  "warn_deprecated": {
    "type": "info",
    "name": "即将废弃",
    "hint": "此选项将在未来版本中移除。\n请迁移到新的插件配置。",
    "level": "warning",
    "locales": {
      "zh": { "name": "即将废弃", "hint": "此选项将在未来版本中移除。\n请迁移到新的插件配置。" }
    }
  }
}
```

> `info` 字段在配置保存/加载和校验时会被跳过。`hint` 支持 `\n` 换行。

## Locales

`schema.json` 中的每个字段都支持 `locales` 对象，用于提供本地化的 `name` 和 `hint` 值。键为语言代码（如 `zh`），值包含 `name` 和/或 `hint` 的覆盖。

```json
{
  "waking_words": {
    "name": "Waking words",
    "type": "list",
    "default": [],
    "hint": "Treat message as mentioned if any wake word appears",
    "locales": {
      "zh": { "name": "唤醒词", "hint": "如果消息中包含任一唤醒词，则视为被提及" }
    }
  }
}
```

| Locale 键    | 说明                   | 支持的字段             |
| ------------ | ---------------------- | ---------------------- |
| `zh`         | 简体中文               | `name`, `hint`         |
| (任意)       | 任意 ISO 639-1 语言代码 | `name`, `hint`         |

> WebUI 会根据用户语言偏好使用本地化的 `name` 和 `hint`，如果没有匹配的 locale 则回退到顶层的 `name`/`hint`。

---

> 配置文件保存在 `data/config/plugins/{plugin_id}.json`，会在插件初始化时自动生成默认值。