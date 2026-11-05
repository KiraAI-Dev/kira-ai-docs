# Plugin Main Class

All plugins must extend `BasePlugin` and implement the `initialize()` and `terminate()` lifecycle methods.

```python
from core.plugin import BasePlugin, PluginContext

class MyPlugin(BasePlugin):
    def __init__(self, ctx: PluginContext, cfg: dict):
        super().__init__(ctx, cfg)
        # self.ctx  -> PluginContext, access to system services
        # self.plugin_cfg  -> dict, plugin configuration (from schema.json or config file)

    async def initialize(self):
        """Called when the plugin is loaded. Initialize resources and register events here."""
        pass

    async def terminate(self):
        """Called when the plugin is unloaded. Release resources and cancel tasks here."""
        pass
```

> The system will only register a plugin's Hooks, Tools, and Tags after `initialize()` completes successfully.