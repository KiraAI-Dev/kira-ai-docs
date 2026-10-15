# Provider Configuration

Providers connect KiraAI to model APIs. A provider instance stores credentials and an API endpoint once; the models you add under it select the model ID, capability, and model-level options.

> Both the OpenAI and Anthropic providers can connect to third-party model services compatible with their respective API formats. Choose the provider that matches the service API, then enter its Base URL and API key.

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
| OpenAI | LLM, TTS, image generation, embedding | Base URL, API key, optional custom headers |
| Anthropic | LLM | Base URL, API key, Anthropic API version, optional custom headers |
| DeepSeek | LLM | Base URL, API key, optional custom headers |
| Aliyun Bailian | LLM, TTS, STT, image generation, embedding, rerank | API key, region, optional workspace ID, optional Base URL override, optional custom headers |
| SiliconFlow CN | LLM, TTS, STT, image generation, embedding, rerank | Base URL, API key |
| Volcengine | LLM, image generation, video generation, embedding | Base URL, API key |
| ModelScope | LLM, image generation, embedding | Base URL, API key |
| GPT-SoVITS | TTS | API URL, optional reference-audio path and transcript |

Model types describe the integration capability, not a promise that every model from a provider supports it. For example, add an image-generation model only when that model supports the configured image-generation endpoint.

## Model configuration

After creating a provider, select its capability group and choose **Add Model**. The model ID is provider-defined, while the rest of the fields are per-model settings.

| Capability | Common settings |
| --- | --- |
| LLM | Timeout (normally 120 seconds), optional temperature, and optional `extra_body` JSON merged into the request body |
| TTS | Provider-specific voice, language, speed, or reference-audio settings |
| STT | Input audio format, sample rate, language hints, and timeout when supported |
| Image generation | Size and timeout; some providers expose endpoint, count, prompt, style, or seed options |
| Embedding | Timeout and slow-request logging threshold; Bailian can also set dimensions |
| Rerank | Timeout and provider-specific result options |
| Video generation | Add the model ID; Volcengine currently exposes no additional model fields |

`extra_body` must be a JSON object. It is for endpoint-specific request fields, such as a provider's search option, and should only be used when the selected model documents that field.

## Model names and internal IDs

When adding a model, enter the **upstream model name / ID** expected by the provider API, such as `gpt-4o`. KiraAI separately generates a stable internal model ID. Default-model and plugin selections store `provider_id:internal_model_id` references.

Editing the upstream name in WebUI preserves existing selections. Do not construct or manually rewrite internal references from display names. See [Provider Development](../development/providers#v3-model-identity-and-provider-status) for developer APIs and migration.

## Enabling and disabling

The provider switch lets you temporarily disable a service while retaining credentials and model configuration. Default models and plugin calls relying on a disabled provider become unavailable; select an available model or re-enable the provider. Enabling restores its runtime instance.

Disabling blocks new calls, including calls through previously cached plugin clients. It does not undo requests already sent upstream.

## Test and troubleshoot

Use the model health-check action after saving a model. It sends a small test request and reports latency for **LLM**, **TTS**, **embedding**, and **rerank** models. Health checks are not currently provided for STT, image-generation, or video-generation models.

If a provider cannot load or a request fails:

1. Confirm the API key, Base URL, region, and workspace belong together.
2. Verify the model ID and capability against the provider's console or API documentation.
3. Remove or correct malformed custom-header and `extra_body` JSON.
4. Increase the model timeout for slow endpoints, then retry the health check where supported.
5. Check the KiraAI logs for the provider response, without sharing credentials.
