# 提供商开发指南

提供商（Provider）是 KiraAI 与大语言模型，语音合成，图像生成等模型调用的统一接口，KiraAI 本体内置了常用的模型提供商，但不能满足所有场景的需求。

本章内容将引导您开发一个 KiraAI 提供商。

## 文件结构

内置提供商位于 `core/provider/src` 目录。插件也可以把 Provider 保留在自己的目录中，并通过 `await self.ctx.register_provider("相对路径")` 显式注册；组件目录和生命周期请参阅 [PluginContext API](./plugins/context#注册插件自有的-provider-和-adapter)。

KiraAI 提供商的文件结构如下：
```
my_provider/
├── provider.py          # 提供商主逻辑
├── model_clients.py     # 可选，模型客户端实现的独立文件
├── manifest.json        # 提供商清单文件
├── schema.json          # 提供商配置参数Schema文件
├── requirements.txt     # 提供商依赖
└── README.md            # 提供商说明
```

## 提供商清单文件

提供商清单文件（`manifest.json`）是 KiraAI 用于识别和加载提供商的配置文件。它包含了提供商的基本信息，如名称、版本、依赖等。

```json
{
    "name": "提供商名称，如 OpenAI",
    "version": "1.0.0",
    "author": "作者",
    "description": "提供商描述",
    "repo": "提供商仓库URL 或 null",
    "icon": "icon.svg",
    "icon-dark": "icon-dark.svg"
}
```

### Manifest 图标

`icon` 和 `icon-dark` 为可选图片路径，路径相对于包含 `manifest.json` 的提供商目录。它们会显示在 WebUI 的提供商类型下拉框和提供商卡片中。

- `icon`：浅色模式使用的图标。
- `icon-dark`：深色模式使用的图标；省略时，深色模式会回退使用 `icon`。

为保证安全，图标路径必须位于提供商目录内：绝对路径及解析后超出该目录的路径会被忽略。支持 SVG、PNG、JPEG、GIF、WebP、AVIF 和 ICO。建议使用正方形 SVG 或图片，并确保在目标主题中具有足够对比度。

## 提供商配置参数Schema文件

```json
{
  "provider_config": {
    "config_key": {
      "name": "配置项显示名称",
      "type": "配置项类型",
      "default": "配置项默认值",
      "hint": "配置项描述"
    }
  },
  "model_config": {
    "model_type": {
      "config_key": {
        "name": "配置项显示名称",
        "type": "配置项类型",
        "default": "配置项默认值",
        "hint": "配置项描述"
      }
    }
  }
}
```

以下是相关字段的说明：

- `provider_config`：提供商配置参数，用于配置提供商的全局参数，如 API 密钥、模型列表等。
- `model_config`：模型配置参数，用于配置模型的参数，如模型名称、温度、最大长度等。
- `model_type`：模型类型，可用的模型类型为：
  - `llm`：大语言模型
  - `tts`：语音合成模型
  - `stt`：语音识别模型
  - `image`：图像生成模型
  - `video`：视频生成模型
  - `embedding`：嵌入模型
  - `rerank`：重排序模型
- `config_key`：配置项键，用于标识配置项。
- `name`：配置项显示名称，用于在 WebUI 上显示。
- `type`：配置项类型，如 `string`、`integer`、`float` 等。
- `default`：配置项默认值。
- `hint`：配置项描述，用于在 WebUI 上显示。
- `enum`：可选值列表，仅对 `type` 为 `string` 有效。

## 提供商主逻辑

以 OpenAI 提供商的主逻辑为例：

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

提供商类需要继承 `BaseProvider` 类，该类定义了提供商的基本接口

具体的模型客户端定义在提供商类的类属性 `models` 中，键为模型类型，值为模型客户端类。

提供商类在 KiraAI 启动时被自动加载，KiraAI 会根据提供商清单文件中的配置和模型类型，加载对应的模型客户端类。并且在 WebUI 提供可视化的配置界面。

## v3 模型身份与启停

`ModelInfo.model_id` 是稳定的内部标识，`ModelInfo.model_name` 才是发送给上游 API 的模型名称。自定义客户端构造请求时应使用 `self.model.model_name`；不能把内部 ID 当作上游 `model` 参数。

配置采用 `model_config_version = 2`：

```json
{
  "model_config_version": 2,
  "model_config": {
    "llm": {
      "<internal_id>": {
        "model_name": "upstream-model-name",
        "config": {"temperature": 0.7}
      }
    }
  }
}
```

模型选择引用仍为 `provider_id:model_id`，但冒号后是内部 ID。修改上游名称不会更换内部身份。同一提供商、同一模型类型内，上游名称必须非空且唯一。

| 管理器接口 | 当前语义 |
| --- | --- |
| `register_model(provider_id, model_type, model_name, config=None)` | 返回生成的内部 ID；提供商不存在时返回 `None` |
| `get_models(provider_id)` | 按类型及内部 ID 返回 `{model_name, config}` |
| `get_model_info(..., model_type=None)` / `get_model_client(..., model_type=None)` | 使用内部 ID 或无歧义旧别名；可指定模型类型 |
| `update_model(..., config=None, model_name=None)` | 可更名并保留内部 ID；传入的配置整体替换模型参数 |
| `sync_models(..., add_ids, delete_ids, config=None)` | 两个列表仍传上游名称，虽然字段名包含 `ids` |

提供商配置的 `status` 为 `active` 或 `inactive`，旧配置缺失时按 `active` 处理。停用会保留配置并移除运行实例，通过管理器获取的客户端在每次新的异步调用前也会检查状态，包括已缓存的客户端。停用时抛出 `ProviderAPIError`，但不会撤回已经发出的上游请求。

### 兼容与迁移边界

旧模型配置迁移前会生成 `.model-identity-v1.bak` 备份，再转换条目和模型引用。旧名称保留为 `legacy_ids`，仅能无歧义解析时使用；新建模型不要假定存在旧名称别名。创建模型 REST 请求仍接受旧 `model_id` 字段作为 `model_name` 的输入别名。

直接构造 `ModelInfo` 未提供 `model_name` 时，会暂用 `model_id` 作为上游名称，以兼容旧集成。新 Provider 应明确使用新字段，不能依赖该回退来推断所有模型的上游名称。

OpenAI 兼容客户端的实现位置为 `core.provider.openai_compatible`；不要再依赖旧 `core.utils` 下的实现路径。

## 模型客户端

:::warning
部分模型客户端基类可能会随着版本更新而改变，但大部分情况下会兼容旧版本。
:::

### LLM 客户端

LLM 客户端负责与大语言模型交互，包括调用模型、处理请求和响应等。

```python
from core.provider import ModelInfo, LLMModelClient
from core.provider.llm_model import LLMRequest, LLMResponse

class OpenAILLMClient(LLMModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def chat(self, request: LLMRequest, **kwargs) -> LLMResponse:
        # 调用 OpenAI API
        ...
        return LLMResponse(...)
```

LLM 客户端需要实现 `chat` 方法，该方法负责调用大语言模型并返回模型的响应。

有关 `LLMRequest` 和 `LLMResponse` 的定义，请参考……

### TTS 客户端

TTS 客户端负责与语音合成模型交互，接收文本输入，返回语音对象。

```python
from core.provider import ModelInfo, TTSModelClient
from core.chat.message_elements import Record

class CustomTTSClient(TTSModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def text_to_speech(self, text: str, **kwargs) -> Record:
        # 调用 TTS API
        ...
        return Record(...)
```

### STT 客户端

STT 客户端负责与语音识别模型交互，接收语音对象，返回文本。

```python
from core.provider import ModelInfo, STTModelClient
from core.chat.message_elements import Record

class CustomSTTClient(STTModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def speech_to_text(self, record: Record, **kwargs):
        # 调用 STT API
        ...
        return ...
```

### IMAGE 客户端

IMAGE 客户端负责与图像生成模型交互，接收文本或图片输入，返回图片对象。

```python
from core.provider import ModelInfo, ImageModelClient
from core.chat.message_elements import Image

class CustomImageClient(ImageModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def text_to_image(self, prompt: str, **kwargs) -> Image:
        # 调用 IMAGE API
        ...
        return Image(...)

    async def image_to_image(self, prompt: str, image: Image, **kwargs) -> Image:
        # 调用 IMAGE API
        ...
        return Image(...)
```

### VIDEO 客户端

VIDEO 客户端负责与视频生成模型交互，接收文本或视频输入，返回视频对象。

```python
from core.provider import ModelInfo, VideoModelClient
from core.chat.message_elements import Video

class CustomVideoClient(VideoModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def generate_video(self, prompt: str, ref: list[Image] = None, duration: int = 5, **kwargs) -> Video:
        # 调用 VIDEO API
        ...
        return Video(...)
```

### EMBEDDING 客户端

EMBEDDING 客户端负责与嵌入模型交互，接收文本输入，返回嵌入向量。

```python
from core.provider import ModelInfo, EmbeddingModelClient

class CustomEmbeddingClient(EmbeddingModelClient):
    def __init__(self, model: ModelInfo):
        super().__init__(model)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        # 调用 EMBEDDING API
        ...
        return ...
```

### RERANK 客户端

RERANK 客户端负责与重排序模型交互，接收文本输入，返回重排序结果。

```python
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
        # 调用 RERANK API
        ...
        return ...
```
