# 开发指南

本节面向 KiraAI v3 扩展开发。新插件应优先通过模型原生的工具和 XML 标签扩展能力；用户交互功能使用 `@register.tool`、`@register.tag`，事件处理使用 `@on`。

## 开发入口

- [插件开发](./plugins/dev-guide)：插件结构、生命周期和注册方式。
- [PluginContext API](./plugins/context)：注入服务、模型客户端、异步会话和结构化历史。
- [Hook 系统](./plugins/hooks)：IM、评论与 Agent 结果事件。
- [适配器开发](./adapters)：平台生命周期、能力对象、访问控制和 Feed。
- [Provider 开发](./providers)：模型客户端、稳定内部 ID 与上游名称。

## 从 v2 迁移的检查顺序

1. 修正已删除的模块导入。`BasePlugin`、`PluginContext`、`PluginManager`、`PluginInfo`、`PluginPage`、`PageMenu`、`register`、`register_tool`、`on`、`EventType`、`Priority` 均优先从 `core.plugin` 导入。
2. 将旧适配器基类改为 `BaseAdapter` + `AdapterContext` + 能力对象，检查 `start()` 持续运行、停止收尾、权限与输出声明。
3. 将会话读写及能力查询改为异步，显式保存快照修改，移除对 `chat_memory` 缓存和旧 JSON 实时写入的依赖。
4. 模型选择保存内部 ID；Provider 向上游发请求时使用 `model_name`。处理停用和无法解析的旧引用。
5. 区分会话内部 ID、路由 SID、历史存档 ID、平台消息 ID 和 LLM 消息身份；历史查询使用正式版的类型化返回对象。
6. 先保留 v2 Release，再为 v3 适配版设置已验证的最低 `core_version`，详见 [manifest.json](./plugins/manifest#v2-v3-发布与版本约束)。

旧 `core.plugin.plugin`、`plugin_registry` 和 `plugin_handlers` 的常用组件应改为包级导入；不要改成依赖新内部文件来替代旧内部文件。实际公开名称以 `core/plugin/__init__.py` 为准。

## 自定义 IM 工作流

默认工作流使用 `IMWorkflowContext` 注入服务，构造方式为 `DefaultIMWorkflow(ctx, max_concurrent_messages=3)`；`MessageProcessor(im_workflow)` 主要负责转发与插件入口。

事件阶段为 `ReceiveStage → RouteStage`；批次阶段为 `PrepareBatchStage → BuildRequestStage → AssembleRequestStage → ExecuteAgentStage → FinalizeStage`。扩展阶段继承 `BaseStage[ContextT]`，实现 `async run(ctx) -> bool`：`True` 继续，`False` 结束流程。每次请求的可变状态放在上下文中，不放在共享阶段实例上。

Agent 启动后的终止处理要保留最终结果钩子和上下文写入，不能因 `event.stop()` 跳过全部收尾。格式化、媒体、缓冲、投递和图片描述缓存分别由 `MessageFormatter`、`MessageMediaService`、`SessionBufferManager`、`MessageDeliveryService`、`ImageDescCache` 提供。

旧 `core.workflow.workflow_registry` 已删除，`register_workflow` 和 `WorkflowType` 不再从 `core.workflow` 导出。旧 `WorkflowContext` 仍存在，但默认 IM 工作流使用 `IMWorkflowContext`，旧装饰器注册式扩展不能据此视为兼容。

`MessageProcessor` 的 `flush_session_messages()`、`send_message_chain()` 和 `handle_im_message()` 仍是弃用入口。插件应分别使用 `ctx.flush_session_messages()`、`ctx.send_message_chain()` 和 `await ctx.event_bus.publish(event)`。

## 迁移验证

按扩展实际使用的能力验证普通消息收发、缓冲筛选、评论接管、Provider 停用、上下文保存与重启恢复、旧数据首次导入及关闭收尾。涉及网页聊天时，另外检查文件工具/命令权限和清空记录与清空上下文的差异。

兼容别名是渐进迁移入口，不代表已删除的基类、注册器或同步会话接口仍能使用。插件新增兼容逻辑时，应在发布说明中记录对象、行为和引入原因。
