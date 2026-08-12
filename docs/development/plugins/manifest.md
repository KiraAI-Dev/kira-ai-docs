# manifest.json

Describes the plugin's basic information. **Must be present**; otherwise the folder name is used as `plugin_id`.

```json
{
  "display_name": "My Plugin",
  "plugin_id": "my_plugin",
  "version": "1.0",
  "core_version": ">=1.0.0",
  "author": "Your Name",
  "description": "Plugin description",
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

| Field          | Description                                                  | Required    |
| -------------- | ------------------------------------------------------------ | ----------- |
| `plugin_id`    | Unique plugin ID; determines config filename and data directory | Recommended |
| `display_name` | Plugin name displayed in WebUI                               | No          |
| `version`      | Version number                                               | No          |
| `core_version` | Required KiraAI version specifier, following [PEP 508](https://peps.python.org/pep-0508/) version specifier syntax (e.g. `>=1.0.0`, `>=1.0,<2.0`, `~=1.2`). If the requirement is not met, the plugin will not be loaded and an error message will be displayed in WebUI | No          |
| `author`       | Author                                                       | No          |
| `description`  | Plugin description                                           | No          |
| `repo`         | Repository URL                                               | No          |
| `icon`         | Image path relative to the plugin directory, used in light mode | No       |
| `icon-dark`    | Image path relative to the plugin directory, used in dark mode; falls back to `icon` when omitted | No |
| `locales`      | Localization overrides per locale, keyed by locale code (e.g. `zh`). Supported fields: `display_name`, `description` | No          |

> The `locales` field allows providing translated values for `display_name` and `description`. The WebUI will automatically display the localized version based on the user's language preference.

> `core_version` uses Python `requirements.txt` version specifier syntax, supporting operators like `>=`, `<=`, `>`, `<`, `==`, `!=`, `~=`, and combinations separated by commas. Omitting this field means no KiraAI version restriction.

> Icon paths must stay inside the plugin directory. Absolute paths and paths outside that directory are ignored. SVG, PNG, JPEG, GIF, WebP, AVIF, and ICO are supported. Plugin icons are shown on WebUI plugin cards.
