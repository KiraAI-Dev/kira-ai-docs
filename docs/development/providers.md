# Developing Provider

Providers are KiraAI's unified interfaces for calling large language models, speech synthesis, image generation, and other models. KiraAI has built-in common model providers, but they cannot meet all scenarios.

This chapter will guide you through developing a KiraAI provider.

## File Structure

All providers are located in the `core/provider/src` directory.

The file structure of a KiraAI provider is as follows:
```
my_provider/
├── provider.py          # Provider main logic
├── model_clients.py     # Optional, separate file for model client implementations
├── manifest.json        # Provider manifest file
├── schema.json          # Provider configuration parameters Schema file
├── requirements.txt     # Provider dependencies
└── README.md            # Provider description
```

## Provider Manifest File

The provider manifest file (`manifest.json`) is a configuration file used by KiraAI to identify and load providers. It contains basic provider information such as name, version, dependencies, etc.

```json
{
    "name": "Provider name, such as OpenAI",
    "version": "1.0.0",
    "author": "Author",
    "description": "Provider description",
    "repo": "Provider repository URL or null",
    "icon": "icon.svg",
    "icon-dark": "icon-dark.svg"
}
```

### Manifest Icons

`icon` and `icon-dark` are optional image paths, relative to the provider directory that contains `manifest.json`. They are shown in the WebUI provider type selector and provider cards.

- `icon`: icon used in light mode.
- `icon-dark`: icon used in dark mode. When omitted, the `icon` value is used in both themes.

For security, an icon path must remain inside the provider directory: absolute paths and paths that resolve outside that directory are ignored. Supported formats are SVG, PNG, JPEG, GIF, WebP, AVIF, and ICO. Use a square SVG or image with enough contrast for its target theme.

## Provider Configuration Parameters Schema File

```json
{
  "provider_config": {
    "config_key": {
      "name": "Configuration item display name",
      "type": "Configuration item type",
      "default": "Configuration item default value",
      "hint": "Configuration item description"
    }
  },
  "model_config": {
    "model_type": {
      "config_key": {
        "name": "Configuration item display name",
        "type": "Configuration item type",
        "default": "Configuration item default value",
        "hint": "Configuration item description"
      }
    }
  }
}
```

The following are explanations of the related fields:

- `provider_config`: Provider configuration parameters, used to configure global parameters of the provider, such as API keys, model lists, etc.
- `model_config`: Model configuration parameters, used to configure model parameters, such as model name, temperature, maximum length, etc.
- `model_type`: Model type, available model types are:
  - `llm`: Large language model
  - `tts`: Text-to-speech model
  - `stt`: Speech-to-text model
  - `image`: Image generation model
  - `video`: Video generation model
  - `embedding`: Embedding model
  - `rerank`: Reranking model
- `config_key`: Configuration item key, used to identify the configuration item.
- `name`: Configuration item display name, used to display on WebUI.
- `type`: Configuration item type, such as `string`, `integer`, `float`, etc.
- `default`: Configuration item default value.
- `hint`: Configuration item description, used to display on WebUI.
- `enum`: Optional value list, only valid for `type` as `string`.

## Provider Main Logic

Taking OpenAI provider's main logic as an example:

```python
from core.provider import ModelType, BaseProvider

from .model_clients import OpenAILLMClient, OpenAIImageClient, OpenAIEmbeddingClient


class OpenAIProvider(BaseProvider):
    models = {
        ModelType.LLM: OpenAILLMClient,
        ModelType.IMAGE: OpenAIImageClient,
        ModelType.EMBEDDING: OpenAIEmbeddingClient
    }

    def __init__(self, provider_id, provider_name, provider_config):
        super().__init__(provider_id, provider_name, provider_config)
```

The provider class needs to inherit from the `BaseProvider` class, which defines the basic interface of the provider.

The specific model clients are defined in the class attribute `models` of the provider class, with the key being the model type and the value being the model client class.

The provider class is automatically loaded when KiraAI starts. KiraAI will load the corresponding model client classes based on the configuration in the provider manifest file and model type, and provide a visual configuration interface in the WebUI.

## Model Clients

:::warning
Some model client base classes may change with version updates, but in most cases, they will be compatible with older versions.
:::

### LLM Client

The LLM client is responsible for interacting with large language models, including calling the model, processing requests and responses, etc.

```python
from core.provider import ModelInfo, LLMModelClient
from core.provider.llm_model import LLMRequest, LLMResponse

class OpenAILLMClient(LLMModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def chat(self, request: LLMRequest, **kwargs) -> LLMResponse:
        # Call OpenAI API
        ...
        return LLMResponse(...)
```

The LLM client needs to implement the `chat` method, which is responsible for calling the large language model and returning the model's response.

For the definitions of `LLMRequest` and `LLMResponse`, please refer to...

### TTS Client

The TTS client is responsible for interacting with the text-to-speech model, receiving text input, and returning a speech object.

```python
from core.provider import ModelInfo, TTSModelClient
from core.chat.message_elements import Record

class CustomTTSClient(TTSModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def text_to_speech(self, text: str, **kwargs) -> Record:
        # Call TTS API
        ...
        return Record(...)
```

### STT Client

The STT client is responsible for interacting with the speech recognition model, receiving a speech object, and returning text.

```python
from core.provider import ModelInfo, STTModelClient
from core.chat.message_elements import Record

class CustomSTTClient(STTModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def speech_to_text(self, record: Record, **kwargs):
        # Call STT API
        ...
        return ...
```

### IMAGE Client

The IMAGE client is responsible for interacting with the image generation model, receiving text or image input, and returning an image object.

```python
from core.provider import ModelInfo, ImageModelClient
from core.chat.message_elements import Image

class CustomImageClient(ImageModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def text_to_image(self, prompt: str, **kwargs) -> Image:
        # Call IMAGE API
        ...
        return Image(...)

    async def image_to_image(self, prompt: str, image: Image, **kwargs) -> Image:
        # Call IMAGE API
        ...
        return Image(...)
```

### VIDEO Client

The VIDEO client is responsible for interacting with the video generation model, receiving text or video input, and returning a video object.

```python
from core.provider import ModelInfo, VideoModelClient
from core.chat.message_elements import Video

class CustomVideoClient(VideoModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def generate_video(self, prompt: str, ref: list[Image] = None, duration: int = 5, **kwargs) -> Video:
        # Call VIDEO API
        ...
        return Video(...)
```

### EMBEDDING Client

The EMBEDDING client is responsible for interacting with the embedding model, receiving text input, and returning an embedding vector.

```python
from core.provider import ModelInfo, EmbeddingModelClient

class CustomEmbeddingClient(EmbeddingModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        # Call EMBEDDING API
        ...
        return ...
```

### RERANK Client

The RERANK client is responsible for interacting with the reranking model, receiving text input, and returning reranking results.

```python
from typing import Optional
from core.provider import ModelInfo, RerankModelClient
from core.provider.llm_model import RerankResult

class CustomRerankClient(RerankModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def rerank(
        self,
        query: str,
        documents: list[str],
        top_n: Optional[int] = None,
        **kwargs
    ) -> list[RerankResult]:
        # Call RERANK API
        ...
        return ...
```
