# 适配器开发指南

内置适配器位于核心源码目录。插件可以把 Adapter 打包在自己的目录中，并通过 `await self.ctx.register_adapter("相对路径")` 注册；所需目录结构、生命周期和显式注销请参阅 [PluginContext API](./plugins/context#注册插件自有的-provider-和-adapter)。

## Manifest 图标

适配器可以在 `manifest.json` 中可选配置图标：

```json
{
  "icon": "icon.svg",
  "icon-dark": "icon-dark.svg"
}
```

两个路径均相对于包含 `manifest.json` 的适配器目录。WebUI 会在适配器平台下拉框和适配器卡片中显示这些图标。

- `icon`：浅色模式使用的图标。
- `icon-dark`：深色模式使用的图标；省略时，深色模式会使用 `icon`。

图标路径必须解析到适配器目录内；绝对路径及目录外路径会被忽略。支持 SVG、PNG、JPEG、GIF、WebP、AVIF 和 ICO。建议使用正方形资源，并确保在目标主题中具有足够对比度。
