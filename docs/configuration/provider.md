# Provider Configuration

Providers connect KiraAI to model APIs. A provider instance stores credentials and an API endpoint once; the models you add under it select the model ID, capability, and model-level options.

## Add a provider

1. Open **Providers** in the WebUI and select **Add Provider**.
2. Enter a recognizable instance name, select a provider type, and complete its required fields. Usually this means an API key; keep the default Base URL unless you use a compatible gateway.
3. Create the provider, select it from the list, and add one or more models in the capability groups it supports.
4. Enter the model ID exactly as the provider publishes it. Use **Fetch Remote Models** when the provider exposes a model catalogue, or add the ID manually.
5. Save the model configuration. Then select the desired defaults in **Configuration → Models**.

::: warning Keep credentials private
API keys and custom headers are stored in KiraAI's runtime configuration. Do not put keys in screenshots, logs, or shared configuration files. A custom header with the same name as a default header overrides that default.
:::

## Built-in provider types

| Provider type | Supported model types | Shared configuration |
| --- | --- | --- |
| OpenAI | LLM, TTS, image, embedding | Base URL, API key, optional custom headers |
| Anthropic | LLM | Base URL, API key, Anthropic API version, optional custom headers |
| DeepSeek | LLM | Base URL, API key, optional custom headers |
| Aliyun Bailian | LLM, TTS, STT, image, embedding, rerank | API key, region, optional workspace ID, optional Base URL override, optional custom headers |
| SiliconFlow CN | LLM, TTS, STT, image, embedding, rerank | Base URL, API key |
| Volcengine | LLM, image, video, embedding | Base URL, API key |
| ModelScope | LLM, image, embedding | Base URL, API key |
| GPT-SoVITS | TTS | API URL, optional reference-audio path and transcript |

Model types describe the integration capability, not a promise that every model from a provider supports it. For example, add an image model only when that model supports the image endpoint configured for the provider.

## Provider fields

### OpenAI-compatible providers

**OpenAI**, **DeepSeek**, **SiliconFlow CN**, **Volcengine**, and **ModelScope** use a Base URL and API key. Their defaults point to their official APIs. Change the Base URL only for a compatible endpoint; include the version or path segment required by that endpoint, such as `/v1`.

OpenAI and DeepSeek also provide **Custom Headers**. Enter a JSON object, for example:

```json
{
  "X-Client-Name": "KiraAI"
}
```

### Anthropic

The Anthropic provider uses the Messages API rather than the OpenAI chat-completions format.

- **Base URL** defaults to `https://api.anthropic.com`. Preserve any provider-required path prefix when using a compatible service; for example, DeepSeek's Anthropic-compatible endpoint uses `https://api.deepseek.com/anthropic`.
- **API Key** is sent as the `x-api-key` request header.
- **Anthropic API Version** defaults to `2023-06-01`; change it only when the endpoint requires another version.
- **Custom Headers** is an optional JSON object. Matching keys replace the client's default headers.

### Aliyun Bailian

- **API Key**: obtain a key from the [Bailian console](https://bailian.console.aliyun.com/).
- **Region**: choose `beijing` or `singapore`. The API key must belong to the selected region.
- **Workspace ID**: optional. When set, KiraAI uses the workspace-scoped endpoint; leave it blank for the public DashScope endpoint.
- **Base URL Override**: optional OpenAI-compatible endpoint override. Leave blank to derive the endpoint from the region and workspace.
- **Custom Headers**: optional JSON headers passed to the OpenAI-compatible client.

### GPT-SoVITS

GPT-SoVITS is intended for a locally hosted or self-managed TTS API. **API URL** defaults to `http://127.0.0.1:9880/tts`.

Set **Reference Audio Path** and **Reference Text** at the provider level to make them the defaults for all of its TTS models. A model can override either setting. The reference clip should be 3–10 seconds long.

## Model configuration

After creating a provider, select its capability group and choose **Add Model**. The model ID is provider-defined, while the rest of the fields are per-model settings.

| Capability | Common settings |
| --- | --- |
| LLM | Timeout (normally 120 seconds), optional temperature, and optional `extra_body` JSON merged into the request body |
| TTS | Provider-specific voice, language, speed, or reference-audio settings |
| STT | Input audio format, sample rate, language hints, and timeout when supported |
| Image | Size and timeout; some providers expose endpoint, count, prompt, style, or seed options |
| Embedding | Timeout and slow-request logging threshold; Bailian can also set dimensions |
| Rerank | Timeout and provider-specific result options |
| Video | Add the model ID; Volcengine currently exposes no additional model fields |

`extra_body` must be a JSON object. It is for endpoint-specific request fields, such as a provider's search option, and should only be used when the selected model documents that field.

### LLM-specific settings

- **DeepSeek**: *Thinking Mode* is enabled by default. When it is enabled, temperature does not apply. *Reasoning Effort* is `high` by default; select `max` for more demanding agent tasks.
- **Anthropic**: *Max Output Tokens* defaults to 4096. Its temperature range is 0–1.
- **OpenAI, DeepSeek, Aliyun Bailian, SiliconFlow CN, Volcengine, and ModelScope**: LLM timeout defaults to 120 seconds and temperature accepts 0–2 when set.

### Media and retrieval settings

- **OpenAI image**: select `v1/image` for the image-generation API, or `v1/chat` for multimodal chat models that return images through chat completions. Image size applies only to `v1/image`.
- **SiliconFlow CN image**: set image size and inference steps. Its TTS models require a **Voice ID**; obtain one by uploading a reference clip according to [SiliconFlow's voice API documentation](https://docs.siliconflow.cn/cn/api-reference/audio/upload-voice).
- **Volcengine image**: optionally set image size. Video models have no additional current settings.
- **ModelScope image**: set the image-generation timeout (30 seconds by default). Its embedding slow-request threshold can be left `null` to disable slow-request logging.
- **Aliyun Bailian**: supports the most capability-specific settings. TTS includes voice ID, volume, speech rate, pitch, output format, language hints, dialect, instruction, timeout, and Markdown filtering. STT includes sample rate, input format, language hints, and timeout. Image models include size, model auto-routing, count, negative prompt, style, prompt extension, watermark, seed, and timeout. Embedding supports optional dimensions; rerank supports returning documents and an optional instruction.
- **GPT-SoVITS**: a TTS model may override the provider's reference audio and text, choose reference/text languages, and set speed, Top-K, Top-P, temperature, and timeout.

## Test and troubleshoot

Use the model health-check action after saving a model. It sends a small test request and reports latency for **LLM**, **TTS**, **embedding**, and **rerank** models. Health checks are not currently provided for STT, image, or video models.

If a provider cannot load or a request fails:

1. Confirm the API key, Base URL, region, and workspace belong together.
2. Verify the model ID and capability against the provider's console or API documentation.
3. Remove or correct malformed custom-header and `extra_body` JSON.
4. Increase the model timeout for slow endpoints, then retry the health check where supported.
5. Check the KiraAI logs for the provider response, without sharing credentials.
