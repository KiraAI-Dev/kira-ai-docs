# Development Guide

This section covers KiraAI v3 extensions. Prefer model-native tools and XML tags for new plugin capabilities: use `@register.tool` and `@register.tag` for user-facing capabilities, and `@on` for event handling.

## Development entry points

- [Plugin Development](./plugins/dev-guide): layout, lifecycle, and registration.
- [PluginContext API](./plugins/context): injected services, model clients, asynchronous sessions, and structured history.
- [Hook System](./plugins/hooks): IM, comment, and Agent result events.
- [Adapter Development](./adapters): platform lifecycle, capability objects, access control, and Feed.
- [Provider Development](./providers): model clients, stable internal IDs, and upstream names.

## Migration checklist from v2

1. Replace removed module imports. Prefer `core.plugin` for `BasePlugin`, `PluginContext`, `PluginManager`, `PluginInfo`, `PluginPage`, `PageMenu`, `register`, `register_tool`, `on`, `EventType`, and `Priority`.
2. Replace old adapter bases with `BaseAdapter`, `AdapterContext`, and capability objects. Check long-running `start()`, shutdown cleanup, permissions, and output declarations.
3. Await session reads, writes, and capability queries. Save snapshot edits explicitly and remove dependencies on the `chat_memory` cache or live JSON writes.
4. Store internal IDs in model selections; send `model_name` upstream from Providers. Handle disabled providers and unresolved legacy references.
5. Distinguish session internal IDs, routing SIDs, archive IDs, platform IDs, and LLM message identities. Use the stable release's typed history return objects.
6. Keep a final v2 Release, then set the verified minimum `core_version` for v3. See [manifest.json](./plugins/manifest#v2-v3-releases-and-version-constraints).

Move common imports from `core.plugin.plugin`, `plugin_registry`, and `plugin_handlers` to the package-level API. Do not replace old internal file dependencies with new internal file dependencies. `core/plugin/__init__.py` defines the public exports.

## Custom IM workflows

The default workflow injects services with `IMWorkflowContext` and is constructed as `DefaultIMWorkflow(ctx, max_concurrent_messages=3)`. `MessageProcessor(im_workflow)` mainly forwards events and provides plugin entry points.

Event stages are `ReceiveStage → RouteStage`. Batch stages are `PrepareBatchStage → BuildRequestStage → AssembleRequestStage → ExecuteAgentStage → FinalizeStage`. Custom stages inherit `BaseStage[ContextT]` and implement `async run(ctx) -> bool`: `True` continues and `False` ends the pipeline. Store per-request mutable state in the context, not shared stage instances.

After an Agent starts, handling a stopped turn must preserve final-result hooks and context writes rather than skipping all cleanup on `event.stop()`. Formatting, media, buffering, delivery, and image description caching are provided by `MessageFormatter`, `MessageMediaService`, `SessionBufferManager`, `MessageDeliveryService`, and `ImageDescCache` respectively.

The old `core.workflow.workflow_registry` is removed. `register_workflow` and `WorkflowType` are no longer exported from `core.workflow`. `WorkflowContext` still exists, but the default IM workflow uses `IMWorkflowContext`; this does not make old decorator-based workflow registration compatible.

`MessageProcessor.flush_session_messages()`, `send_message_chain()`, and `handle_im_message()` remain deprecated entry points. Plugins should use `ctx.flush_session_messages()`, `ctx.send_message_chain()`, and `await ctx.event_bus.publish(event)` respectively.

## Migration verification

Verify the capabilities your extension uses: message delivery, filtered buffer publication, comment ownership, provider disabling, context persistence across restarts, first-time legacy import, and shutdown cleanup. For WebChat integrations, also check file/command permissions and the difference between clearing records and clearing context.

Compatibility aliases allow gradual migration; they do not restore removed base classes, registries, or synchronous session APIs. Document the target, behavior, and reason for any compatibility logic introduced by your plugin.
