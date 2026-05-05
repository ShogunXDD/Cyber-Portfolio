import requests
from urllib.parse import urljoin
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from typing import Callable, Optional, List
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.callbacks.base import BaseCallbackHandler
import os
from config import conf

class BufferedStreamingHandler(BaseCallbackHandler):
    def __init__(self, buffer_limit: int = 60, ui_callback: Optional[Callable[[str], None]] = None):
        self.buffer = ""
        self.buffer_limit = buffer_limit
        self.ui_callback = ui_callback

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.buffer += token
        if "\n" in token or len(self.buffer) >= self.buffer_limit:
            print(self.buffer, end="", flush=True)
            if self.ui_callback:
                self.ui_callback(self.buffer)
            self.buffer = ""

    def on_llm_end(self, response, **kwargs) -> None:
        if self.buffer:
            print(self.buffer, end="", flush=True)
            if self.ui_callback:
                self.ui_callback(self.buffer)
            self.buffer = ""

_common_callbacks = [BufferedStreamingHandler(buffer_limit=60)]

_common_llm_params = {
    "temperature": 0,
    "streaming": True,
    "callbacks": _common_callbacks,
}

def get_llm_config_map():
    return {
        'llama-3.3-70b-versatile-groq': {
            'class': ChatOpenAI,
            'constructor_params': {
                'model_name': 'llama-3.3-70b-versatile',
                'base_url': 'https://api.groq.com/openai/v1',
                'api_key': conf.GROQ_API_KEY
            }
        },
        'llama-3.1-8b-instant-groq': {
            'class': ChatOpenAI,
            'constructor_params': {
                'model_name': 'llama-3.1-8b-instant',
                'base_url': 'https://api.groq.com/openai/v1',
                'api_key': conf.GROQ_API_KEY
            }
        },
        'nemotron-nano-9b-openrouter': {
            'class': ChatOpenAI,
            'constructor_params': {
                'model_name': 'nvidia/nemotron-nano-9b-v2:free',
                'base_url': conf.OPENROUTER_BASE_URL,
                'api_key': conf.OPENROUTER_API_KEY
            }
        },
        'gemini-2.5-flash': {
            'class': ChatGoogleGenerativeAI,
            'constructor_params': {
                'model': 'gemini-2.5-flash',
                'google_api_key': conf.GOOGLE_API_KEY
            }
        },
        'gemini-2.0-flash': {
            'class': ChatGoogleGenerativeAI,
            'constructor_params': {
                'model': 'gemini-2.0-flash',
                'google_api_key': conf.GOOGLE_API_KEY
            }
        },
        'mistral-large-latest': {
            'class': ChatOpenAI,
            'constructor_params': {
                'model_name': 'mistral-large-latest',
                'base_url': 'https://api.mistral.ai/v1',
                'api_key': conf.MISTRAL_API_KEY
            }
        },
        'meta-llama/Llama-3-70b-chat-hf-together': {
            'class': ChatOpenAI,
            'constructor_params': {
                'model_name': 'meta-llama/Llama-3-70b-chat-hf',
                'base_url': 'https://api.together.xyz/v1',
                'api_key': conf.TOGETHER_API_KEY
            }
        },
        'deepseek-chat': {
            'class': ChatOpenAI,
            'constructor_params': {
                'model_name': 'deepseek-chat',
                'base_url': 'https://api.deepseek.com/v1',
                'api_key': conf.DEEPSEEK_API_KEY
            }
        },
        'zephyr-7b-beta-hf': {
            'class': ChatOpenAI,
            'constructor_params': {
                'model_name': 'HuggingFaceH4/zephyr-7b-beta',
                'base_url': 'https://api-inference.huggingface.co/v1/',
                'api_key': conf.HUGGINGFACE_API_KEY
            }
        }
    }

def _normalize_model_name(name: str) -> str:
    return name.strip().lower()

def _get_ollama_base_url() -> Optional[str]:
    if not conf.OLLAMA_BASE_URL:
        return None
    return conf.OLLAMA_BASE_URL.rstrip("/") + "/"

def fetch_ollama_models() -> List[str]:
    base_url = _get_ollama_base_url()
    if not base_url:
        return []

    try:
        resp = requests.get(urljoin(base_url, "api/tags"), timeout=3)
        resp.raise_for_status()
        models = resp.json().get("models", [])
        available = []
        for m in models:
            name = m.get("name") or m.get("model")
            if name:
                available.append(name)
        return available
    except (requests.RequestException, ValueError):
        return []

def fetch_llama_cpp_models() -> List[str]:
    if not conf.LLAMA_CPP_BASE_URL:
        return []

    base = conf.LLAMA_CPP_BASE_URL.rstrip("/")
    try:
        resp = requests.get(f"{base}/v1/models", timeout=3)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        return [m["id"] for m in data if "id" in m]
    except (requests.RequestException, ValueError, KeyError):
        return []

def _is_set(v: Optional[str]) -> bool:
    return bool(v and str(v).strip() and "your_" not in str(v))

def get_model_choices() -> List[str]:
    gated_base_models: List[str] = []

    openai_ok = _is_set(conf.OPENAI_API_KEY)
    anthropic_ok = _is_set(conf.ANTHROPIC_API_KEY)
    google_ok = _is_set(conf.GOOGLE_API_KEY)
    openrouter_ok = _is_set(conf.OPENROUTER_API_KEY) and _is_set(conf.OPENROUTER_BASE_URL)
    groq_ok = _is_set(conf.GROQ_API_KEY)
    mistral_ok = _is_set(conf.MISTRAL_API_KEY)
    together_ok = _is_set(conf.TOGETHER_API_KEY)
    deepseek_ok = _is_set(conf.DEEPSEEK_API_KEY)
    huggingface_ok = _is_set(conf.HUGGINGFACE_API_KEY)

    config_map = get_llm_config_map()

    for k, cfg in config_map.items():
        cls = cfg.get("class")
        ctor = cfg.get("constructor_params", {}) or {}

        if cls is ChatOpenAI and (ctor.get("base_url") == conf.OPENROUTER_BASE_URL or "openrouter" in k):
            if openrouter_ok:
                gated_base_models.append(k)
            continue
            
        if cls is ChatOpenAI and "groq.com" in str(ctor.get("base_url")).lower():
            if groq_ok:
                gated_base_models.append(k)
            continue

        if cls is ChatOpenAI:
            base = str(ctor.get("base_url") or "").lower()
            if "mistral.ai" in base:
                if mistral_ok: gated_base_models.append(k)
                continue
            if "together.xyz" in base:
                if together_ok: gated_base_models.append(k)
                continue
            if "deepseek.com" in base:
                if deepseek_ok: gated_base_models.append(k)
                continue
            if "huggingface.co" in base:
                if huggingface_ok: gated_base_models.append(k)
                continue
            
            if openai_ok:
                gated_base_models.append(k)
            continue

        if cls is ChatAnthropic:
            if anthropic_ok:
                gated_base_models.append(k)
            continue

        if cls is ChatGoogleGenerativeAI:
            if google_ok:
                gated_base_models.append(k)
            continue

        gated_base_models.append(k)

    dynamic_models = []

    dynamic_models += fetch_ollama_models()

    dynamic_models += fetch_llama_cpp_models()

    normalized = {_normalize_model_name(m): m for m in gated_base_models}
    for dm in dynamic_models:
        key = _normalize_model_name(dm)
        if key not in normalized:
            normalized[key] = dm

    ordered_dynamic = sorted(
        [name for key, name in normalized.items() if name not in gated_base_models],
        key=_normalize_model_name,
    )
    return gated_base_models + ordered_dynamic

def resolve_model_config(model_choice: str):
    model_choice_lower = _normalize_model_name(model_choice)
    config_map = get_llm_config_map()
    config = config_map.get(model_choice_lower)
    if config:
        return config

    for llama_model in fetch_llama_cpp_models():
        if _normalize_model_name(llama_model) == model_choice_lower:
            return {
                "class": ChatOpenAI,
                "constructor_params": {
                    "model_name": llama_model,
                    "base_url": conf.LLAMA_CPP_BASE_URL,
                    "api_key": conf.OPENAI_API_KEY or "sk-local",
                },
            }

    for ollama_model in fetch_ollama_models():
        if _normalize_model_name(ollama_model) == model_choice_lower:
            return {
                "class": ChatOllama,
                "constructor_params": {"model": ollama_model, "base_url": conf.OLLAMA_BASE_URL},
            }

    return None