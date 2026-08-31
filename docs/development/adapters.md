# Adapter Development Guide

Built-in adapters live in the core source tree. A plugin can package an Adapter in its own directory and register it with `await self.ctx.register_adapter("relative/path")`; see [PluginContext API](./plugins/context#register-plugin-owned-providers-and-adapters) for the required layout, lifecycle, and explicit unregistration.

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
