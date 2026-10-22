import json
import re
from typing import Any, Optional

import httpx

from app.config import settings


class LLMClient:
    """Thin wrapper around a local Ollama instance.

    Kept behind this interface so the provider (Ollama / OpenAI / Anthropic)
    can be swapped without touching the agent orchestrator.
    """

    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.chat_model = settings.ollama_chat_model
        self.embed_model = settings.ollama_embed_model

    def chat(self, messages: list[dict[str, str]], temperature: float = 0.4) -> str:
        try:
            resp = httpx.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.chat_model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": temperature},
                },
                timeout=120,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "").strip()
        except (httpx.HTTPError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"LLM call failed: {exc}") from exc

    def chat_json(self, messages: list[dict[str, str]], temperature: float = 0.2) -> dict[str, Any]:
        """Ask the model for a JSON object and parse it defensively."""
        raw = self.chat(messages, temperature=temperature)
        return extract_json(raw)

    def embed(self, text: str) -> list[float]:
        try:
            resp = httpx.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.embed_model, "prompt": text},
                timeout=60,
            )
            resp.raise_for_status()
            return resp.json()["embedding"]
        except (httpx.HTTPError, KeyError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"Embedding call failed: {exc}") from exc


def extract_json(raw: str) -> dict[str, Any]:
    """Best-effort extraction of a JSON object from an LLM response."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(json)?", "", raw).rstrip("`").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {}


llm_client = LLMClient()
