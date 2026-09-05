# Configuration System (schema.json)

Define plugin configuration fields via `schema.json`. The system automatically generates a WebUI configuration panel and persists the settings.

## Location

`data/plugins/my_plugin/schema.json`

## Reading Config in Plugin Code

```python
class MyPlugin(BasePlugin):
    async def initialize(self):
        api_key = self.plugin_cfg.get("api_key", "")
        enabled = self.plugin_cfg.get("enabled", True)
        max_count = self.plugin_cfg.get("max_count", 10)
```

## Supported Field Types

| type           | Description                          | Extra Parameters          |
| -------------- | ------------------------------------ | ------------------------- |
| `string`       | Single-line text input, or a dropdown when `options` is set | `options: [...]` |
| `integer`      | Integer input, or a dropdown when `options` is set | `options: [...]` |
| `float`        | Float input, or a dropdown when `options` is set | `options: [...]` |
| `sensitive`    | Password-style hidden input (API keys) | —                       |
| `switch`       | Boolean toggle (aliases: `bool`, `boolean`) | —                 |
| `list`         | Multi-line list (one item per line)  | —                         |
| `enum`         | **Deprecated.** Dropdown selector, kept for backward compatibility. Use `string`/`integer`/`float` with `options` instead | `options: [...]` |
| `multi_select` | Multi-selection dropdown             | `options: [...]`, or `source: "model"/"persona"/"session"` (+ `model_type` when `source: "model"`) |
| `json`         | JSON editor                          | —                         |
| `yaml`         | YAML editor                          | —                         |
| `editor`       | Code/text editor                     | `language: "python"`      |
| `textarea`     | Multi-line plain text input          | —                         |
| `markdown`     | Markdown editor                      | —                         |
| `model_select` | Model selector                       | `model_type: "llm"/"tts"/"stt"/"image"/"embedding"/"rerank"/"video"` |
| `persona_select` | Persona selector (saves persona ID) | —                       |
| `session_select` | Session selector (saves the session ID, e.g. `qq:dm:123`) | — |
| `section`      | Collapsible section for grouping fields | `collapsed`, `fields`  |
| `info`         | Read-only informational callout (no data storage) | `level: "info"/"warning"` |

> Type aliases are normalized when the schema is loaded: `text` → `string`, `int` → `integer`, `bool`/`boolean` → `switch`.

### Dropdown Options

`string`, `integer` and `float` fields render as a dropdown when an `options` list is provided, and as a plain input otherwise. If `default` is not one of the options, the first option is used instead.

### Dynamic Select Sources

`multi_select` can load its candidates dynamically via `source` instead of a static `options` list:

| `source`    | Candidates                                          | Saved value                  |
| ----------- | --------------------------------------------------- | ---------------------------- |
| (omitted)   | static `options: [...]`                             | the option values            |
| `"model"`   | configured models of `model_type` (default `"llm"`) | `provider:model` identifiers |
| `"persona"` | all personas                                        | persona IDs                  |
| `"session"` | active sessions                                     | session IDs like `qq:dm:123` |

## Example schema.json

```json
{
  "api_key": {
    "type": "sensitive",
    "name": "API Key",
    "default": "",
    "hint": "API key for the service",
    "locales": {
      "zh": { "name": "API 密钥", "hint": "服务的 API 密钥" }
    }
  },
  "filed_enabled": {
    "type": "switch",
    "name": "Enabled",
    "default": true,
    "hint": "Whether to enable this feature",
    "locales": {
      "zh": { "name": "启用", "hint": "是否启用该功能" }
    }
  },
  "max_results": {
    "type": "integer",
    "name": "Max Results",
    "default": 10,
    "hint": "Maximum number of results returned per query"
  },
  "mode": {
    "type": "string",
    "name": "Mode",
    "default": "auto",
    "options": ["auto", "manual", "disabled"],
    "hint": "Operating mode"
  },
  "target_session": {
    "type": "session_select",
    "name": "Target Session",
    "default": "",
    "hint": "Internal session ID, e.g. qq:dm:123"
  },
  "allowed_sessions": {
    "type": "list",
    "name": "Allowed Sessions",
    "default": [],
    "hint": "Leave empty to allow all sessions; one session ID per line"
  },
  "llm_model": {
    "type": "model_select",
    "name": "Language Model",
    "model_type": "llm",
    "default": "",
    "hint": "Leave empty to use the system default model"
  },
  "features": {
    "type": "multi_select",
    "name": "Features",
    "default": ["chat"],
    "options": ["chat", "search", "tools", "vision"],
    "hint": "Select enabled features"
  },
  "tts_models": {
    "type": "multi_select",
    "name": "TTS Models",
    "default": [],
    "source": "model",
    "model_type": "tts",
    "hint": "Models available for text-to-speech"
  },
  "section_advanced": {
    "type": "section",
    "name": "Advanced Settings",
    "hint": "Advanced options, change with caution",
    "collapsed": true,
    "fields": {
      "retries": {
        "type": "integer",
        "name": "Retries",
        "hint": "Max retry attempts",
        "default": 3
      },
      "extra_headers": {
        "type": "json",
        "name": "Extra Headers",
        "hint": "Additional HTTP headers",
        "default": {}
      }
    }
  }
}
```

## Section Type

`section` is a special type that groups nested fields into a collapsible section. Fields inside are saved as a nested object under the section key.

**Parameters:**

| Parameter  | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| `collapsed`| boolean | Whether the section is collapsed by default |
| `fields`   | object  | Nested field definitions (same format as top-level fields) |

**Saved config format:**

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

**Reading nested config in plugin code:**

```python
class MyPlugin(BasePlugin):
    async def initialize(self):
        basic = self.plugin_cfg.get("section_basic", {})
        api_key = basic.get("api_key", "")
        timeout = basic.get("timeout", 30)

        advanced = self.plugin_cfg.get("section_advanced", {})
        retries = advanced.get("retries", 3)
```

Section child fields also support `locales` for i18n.

## Info Type

`info` is a read-only field that displays an informational callout in the config panel. It does not store any data and is purely for providing hints or guidance to the user.

**Parameters:**

| Parameter | Type   | Description                                            |
| --------- | ------ | ------------------------------------------------------ |
| `level`   | string | `"info"` (default) for blue callout, `"warning"` for amber callout |

**Example:**

```json
{
  "notice": {
    "type": "info",
    "name": "Notice",
    "hint": "This setting does not affect existing conversations.",
    "level": "info",
    "locales": {
      "zh": { "name": "提示", "hint": "此设置不会影响已有的对话。" }
    }
  },
  "warn_deprecated": {
    "type": "info",
    "name": "Deprecated",
    "hint": "This option will be removed in a future version.\nPlease migrate to the new plugin config.",
    "level": "warning",
    "locales": {
      "zh": { "name": "即将废弃", "hint": "此选项将在未来版本中移除。\n请迁移到新的插件配置。" }
    }
  }
}
```

> `info` fields are skipped during config save/load and validation. They support `\n` in `hint` for line breaks.

## Locales

Each field in `schema.json` supports a `locales` object for providing localized `name` and `hint` values. The key is the locale code (e.g. `zh`), and the value contains `name` and/or `hint` overrides.

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

| Locale Key | Description                  | Supported Fields       |
| ---------- | ---------------------------- | ---------------------- |
| `zh`       | Chinese (Simplified)         | `name`, `hint`         |
| (any)      | Any ISO 639-1 locale code    | `name`, `hint`         |

> The WebUI will use the localized `name` and `hint` based on the user's language preference, falling back to the top-level `name`/`hint` if no locale match is found.

---

> Config is saved to `data/config/plugins/{plugin_id}.json` and default values are generated automatically on first initialization.