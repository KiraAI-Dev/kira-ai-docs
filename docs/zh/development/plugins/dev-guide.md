# 插件开发指南

欢迎参与 KiraAI 插件开发！KiraAI拥有强大的插件扩展能力，开发者可以通过开发插件来扩展KiraAI的功能，扩展数字生命的能力边界。

作为 AI 数字生命项目，KiraAI 插件应尽量做到以下几点：
- **可感知**：让 AI 知道发生了什么，以及自己发了什么。尽量不要硬编码发送内容，应该由 AI 自己生成。涉及外部集成时应当让 AI 感知到外部事件
- **可操作**：AI 可以主观调用能力，如函数工具，XML tag等。原则上不使用斜杠指令等机械性的方式与 AI 数字生命进行交互（且系统内没有内置指令系统）

## 概述

KiraAI 的插件系统基于事件驱动架构，允许插件通过以下三种方式扩展系统功能：

- **Hook**：监听消息到达、LLM 请求/响应等系统事件，插入自定义逻辑
- **Tool**：向 LLM 注册可调用的工具函数
- **Tag**：注册自定义 XML 标签处理器，控制消息输出格式

插件放置于 `data/plugins/` 目录下，系统启动时自动发现并加载。

## 插件目录结构

```
data/plugins/
└── my_plugin/              # 插件文件夹（即 plugin_id，除非 manifest.json 中另有指定）
    ├── manifest.json       # 插件元信息（必填）
    ├── main.py             # 插件主入口（必填，也可用 plugin.py 或 __init__.py）
    ├── schema.json         # 配置字段定义（可选，有配置项时填写）
    └── ...                 # 其他辅助模块
```

> 插件加载时按以下顺序查找入口文件：`main.py` → `plugin.py` → `__init__.py`

## 开发注意事项

1. **Hook 函数签名**：必须接受 `(self, event, *args, **kwargs)`，额外参数（如 `req`、`resp`）通过位置参数传入，建议使用具名参数接收。
2. **Tool 函数签名**：`(self, event: KiraMessageBatchEvent, param1: type, param2: type)` — 第一个参数固定为触发该工具调用的事件对象。
3. **优先级**：`SYS_HIGH` 和 `SYS_LOW` 为系统保留，用户插件使用 `HIGH / MEDIUM / LOW` 或自定义整数。
4. **不要阻塞事件循环**：所有 I/O 操作使用 `await`，CPU 密集型任务用 `asyncio.to_thread()`。
5. **terminate 必须清理**：取消后台任务、关闭连接，避免资源泄漏。通过 `self.ctx` 注册的 Provider 和 Adapter 类型会由 KiraAI 自动注销；除非已在运行期提前撤回组件，否则不要在 `terminate()` 中再次注销它们。
6. **配置热重载**：修改配置后系统会重新调用 `initialize()`，插件应支持重入初始化。
