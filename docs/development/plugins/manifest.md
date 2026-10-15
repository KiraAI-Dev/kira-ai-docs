# manifest.json

Describes the plugin's basic information. **Must be present**; otherwise the folder name is used as `plugin_id`.

```json
{
  "display_name": "My Plugin",
  "plugin_id": "my_plugin",
  "version": "1.0",
  "core_version": ">=3.0.0",
  "author": "Your Name",
  "description": "Plugin description",
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

| Field          | Description                                                  | Required    |
| -------------- | ------------------------------------------------------------ | ----------- |
| `plugin_id`    | Unique plugin ID; determines config filename and data directory | Recommended |
| `display_name` | Plugin name displayed in WebUI                               | No          |
| `version`      | Version number                                               | No          |
| `core_version` | Required KiraAI version specifier, following [PEP 508](https://peps.python.org/pep-0508/) version specifier syntax (e.g. `>=1.0.0`, `>=1.0,<2.0`, `~=1.2`). If the requirement is not met, the plugin will not be loaded and an error message will be displayed in WebUI | No          |
| `author`       | Author                                                       | No          |
| `description`  | Plugin description                                           | No          |
| `tags`         | List of tags used to categorize the plugin                   | No          |
| `repo`         | Repository URL                                               | No          |
| `icon`         | Image path relative to the plugin directory, used in light mode | No       |
| `icon-dark`    | Image path relative to the plugin directory, used in dark mode; falls back to `icon` when omitted | No |
| `locales`      | Localization overrides per locale, keyed by locale code (e.g. `zh`). Supported fields: `display_name`, `description` | No          |

> The `locales` field allows providing translated values for `display_name` and `description`. The WebUI will automatically display the localized version based on the user's language preference.

> `core_version` uses Python `requirements.txt` version specifier syntax, supporting operators like `>=`, `<=`, `>`, `<`, `==`, `!=`, `~=`, and combinations separated by commas. Omitting this field means no KiraAI version restriction.

> Icon paths must stay inside the plugin directory. Absolute paths and paths outside that directory are ignored. SVG, PNG, JPEG, GIF, WebP, AVIF, and ICO are supported. Plugin icons are shown on WebUI plugin cards.

## v2 / v3 releases and version constraints

Declare compatibility in **manifest.json** using `core_version`. `schema.json` defines plugin configuration and does not control core compatibility checks. Set the minimum to the earliest version actually required and verified, rather than declaring support for old versions just because imports succeed.

If the plugin cannot support both v2 and v3, publish and keep a final v2 Release before migrating:

| Release target | Example `core_version` | Boundary |
| --- | --- | --- |
| v2 plugin verified from v2.34.8 | `>=2.34.8,<3.0.0a1` | Excludes all v3 alpha, rc, and stable releases |
| Plugin using rc.1 asynchronous session APIs and verified on rc.1 | `>=3.0.0rc1` | Includes rc.1, excludes v2 and earlier alpha releases |
| Plugin verified only on, or supporting only, stable v3 | `>=3.0.0` | Excludes v3.0.0 prereleases |

The minimum versions are examples. Preserve existing support boundaries and adjust them according to actual verification. Use `>=` to include the minimum; `>3.0.0` excludes v3.0.0 itself.

`packaging` parses version strings such as `3.0.0a1` and `3.0.0rc1`. The loader enables prerelease matching but still respects comparison boundaries.

Keep links to the fixed v2 Release and the v3-compatible Release in the README and both release notes. State the minimum core version, whether v2 support ends, configuration/data changes, and verified versions. `core_version` only blocks incompatible loading; it neither chooses an older Release nor converts plugin code.

See the [Development Guide](../guide) for migration. If you implement compatibility across versions, document its actual scope and behavior rather than merely widening the version range.
