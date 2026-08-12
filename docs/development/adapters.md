# Adapter Development Guide

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
