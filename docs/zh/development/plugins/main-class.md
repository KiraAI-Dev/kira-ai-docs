# 插件主类

所有插件必须继承 `BasePlugin` 并实现 `initialize()` 和 `terminate()` 两个生命周期方法。

```python
from core.plugin import BasePlugin, PluginContext

class MyPlugin(BasePlugin):
    def __init__(self, ctx: PluginContext, cfg: dict):
        super().__init__(ctx, cfg)
        # self.ctx  -> PluginContext，访问系统各服务
        # self.plugin_cfg  -> dict，插件配置（来自 schema.json 或配置文件）

    async def initialize(self):
        """插件加载时调用，在此初始化资源、注册事件等"""
        pass

    async def terminate(self):
        """插件卸载时调用，在此释放资源、取消任务等"""
        pass
```

> `initialize()` 执行成功后，系统才会注册该插件的 Hook、Tool、Tag。