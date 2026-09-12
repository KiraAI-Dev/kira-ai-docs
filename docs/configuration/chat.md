# Chat Settings

Chat settings control how KiraAI retains context, merges consecutive messages, sends replies, and enables image, speech, and generation capabilities. They are global defaults; **Sessions** can override selected capability switches for an individual conversation.

## Before you start

1. Add available models in [Provider Configuration](/configuration/provider).
2. Open **Configuration → Models** in the WebUI and select at least a **Default LLM**. It is the main model required for normal text chats.
3. To use image understanding, speech recognition, speech synthesis, image generation, or video generation, select the corresponding default VLM, STT, TTS, image, or video model there as well.
4. Open **Configuration → Digital Life → Chat Settings**, adjust the global chat behavior below, and save it.

## Context and message pacing

Keep the defaults at first. Change them only when actual conversations show that context is insufficient, replies are fragmented, or the response pace is unsuitable.

| Setting | Default | How to configure it |
| --- | --- | --- |
| Max Context Length | 10 messages | Limits the messages retained for each session. A larger value preserves more context but increases model input, latency, and cost; a smaller value lowers overhead. |
| Overflow Discard Count | 1 message | The number of oldest messages removed whenever the context exceeds its limit. Keep 1 in most cases; raise it modestly when a large context limit needs to free space faster. |
| Message Merge Interval | 2 seconds | The wait after a message arrives; later messages within the window are processed together. Use a shorter value for faster responses, or a longer value when users often send several fragments in succession. |
| Max Buffer Messages | 5 messages | The maximum messages that may accumulate before a batch is processed. Reaching the limit triggers processing promptly instead of waiting indefinitely. |
| Min/Max Message Delay | 2 / 5 seconds | The random delay range between consecutive outgoing reply messages. Lower it for faster delivery; never set the maximum below the minimum. |

## Prompt and memory injection position

**Dynamic Content Position** controls where session lists, chat environment details, and time information are placed. **Memory Injection Position** controls where core memory is placed. Each can use either the system prompt or the latest user message.

In most cases, use **Latest User Message**. It keeps the system prompt stable, which helps models with prompt caching achieve better cache reuse. Choose **System Prompt** only when a model or custom prompt explicitly requires that placement.

## Chat capabilities

Enable only the capabilities for which you have configured suitable models under **Configuration → Digital Life → Capabilities Settings**.

| Capability | When to enable it | Configuration notes |
| --- | --- | --- |
| Image recognition | When the bot should understand images and stickers in messages. | **VLM Description** first converts an image to text with the default VLM. **Native Multimodal** sends the image directly to the main LLM, which must support image input. An empty custom description prompt uses the built-in prompt. |
| Speech recognition (STT) | When incoming voice messages should be transcribed to text. | Requires a Default STT model. |
| Voice synthesis (TTS) | When the bot should be able to send voice replies. | Requires a Default TTS model. |
| Image/video generation | When text prompts should generate images or videos. | Require Default Image or Default Video models respectively; disable a capability if its model is not configured. |
| Forward message parsing | When the bot should read forwarded content. | When disabled, forwarded messages retain only placeholder information, reducing processing. |

## Agent and image compression

**Agent Settings** limit tool execution for a single reply: by default, at most 5 Agent loops, 5 tool calls per turn, and 60 seconds for each tool call. Increasing the limits can let complex tasks complete more steps, but increases response time and model/tool-call cost. A tool-call timeout of `0` means no timeout; use it only with trusted, controlled tools.

**Image Compression** is off by default. When enabled, large or high-resolution incoming images are compressed before being sent to a VLM or a native multimodal model. The defaults are a 1280-pixel longest edge, JPEG quality 95, and a 1 MB file threshold. Enable it when bandwidth or model-input cost is constrained; leave it disabled or raise the edge and quality when small text or fine details matter.

## Chat plugin settings

In addition to global settings, chat behavior is configured through chat plugins. The built-in, default plugin is **Default Chat** (`default-chat`). It merges instant-messaging events and decides how group messages that do not mention the bot participate in context.

Open **Add-ons → Plugins** in the WebUI and configure **Default Chat**. You can also install third-party chat plugins from the KiraAI Plugin Store. If you enable another chat plugin, follow that plugin's own configuration documentation instead.

| Setting | Default | How to configure it |
| --- | --- | --- |
| Wake words | Empty | A message containing any wake word is treated as mentioning the bot. Use this when `@` mentions are unavailable or when a nickname should wake the bot. Avoid common words that could trigger it accidentally. |
| Receive Unmentioned Messages | Off | When enabled, messages that do not mention the bot enter a context buffer; this setting alone does not necessarily cause a reply. Keep it off in busy groups or when the bot should not read bystander conversations. |
| Max Unmentioned Messages | 5 messages | Limits unmentioned messages retained in the context buffer. Adjust only when **Receive Unmentioned Messages** is enabled. |
| Group Chat Prompt | Empty | Appends a group-chat-specific prompt to the chat environment, for group tone, participation style, or boundaries. Put general persona rules in Persona instead. |
| Group Proactive Chat | Off | Lets the bot proactively speak in a group based on unmentioned messages. Enable it only after **Receive Unmentioned Messages** is enabled and group members have agreed to it. |
| Group Proactive Chat Probability | 0.1 | The probability of triggering a proactive reply whenever the conditions are met. Start low and increase only after observing the frequency. |

Save the chat-plugin configuration after editing it. Restart KiraAI before testing to ensure parameters such as message merging, which are read at initialization, are active.

## Per-session overrides and verification

In **Sessions**, edit a conversation and choose **Custom Capabilities** to enable or disable image recognition, STT, TTS, image/video generation, and forwarded-message parsing just for that session. Choose **Global** to inherit this page's defaults.

Selecting **Save** writes the settings to the runtime configuration. Send a new test message to verify the result. For settings such as message merging and send delay that components read when they start, restart KiraAI before testing to ensure the change is active. For additional chat options supplied by message plugins, open the configuration of enabled plugins under **Add-ons → Plugins**.
