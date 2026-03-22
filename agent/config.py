"""Environment-driven settings for OpenRouter.

Required:
  OPENROUTER_API_KEY — API key from https://openrouter.ai/

Optional:
  OPENROUTER_BASE_URL — default https://openrouter.ai/api/v1
  OPENROUTER_MODEL — e.g. openai/gpt-4o-mini
  OPENROUTER_HTTP_REFERER — optional attribution URL for OpenRouter
  OPENROUTER_APP_TITLE — optional X-Title header
  AGENT_MAX_TOOL_ROUNDS — max chat completion API calls per run (default 8)

Parallel.ai (optional, for lookup_service_fields — Parallel Extract):
  PARALLEL_API_KEY — https://platform.parallel.ai/

HTTP POST tool (submit_request):
  HTTP_POST_ALLOW_HOSTS — comma-separated hostnames allowed for POST (default van311.ca); use * for any host

System prompt (Van311 workflow):
  AGENT_SYSTEM_PROMPT_FILE — optional path to a .md/.txt file (repo-root relative OK); overrides default prompt
  AGENT_OMIT_CATEGORIES_JSON — if true, do not append agent/Van311_Services_Categories.json to the system message
  OPENROUTER_TIMEOUT_SECONDS — HTTP timeout for each LLM request (default 120)
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    env_file = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(env_file)


_load_dotenv()


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    return float(raw)


@dataclass(frozen=True)
class AgentConfig:
    api_key: str
    base_url: str
    model: str
    max_tool_rounds: int
    http_referer: str | None
    app_title: str | None
    request_timeout_seconds: float

    @classmethod
    def from_env(cls) -> AgentConfig:
        api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not set")

        base_url = (
            os.environ.get("OPENROUTER_BASE_URL", "").strip()
            or "https://openrouter.ai/api/v1"
        ).rstrip("/")

        model = (
            os.environ.get("OPENROUTER_MODEL", "").strip()
            or "openai/gpt-4o-mini"
        )

        timeout = max(10.0, _env_float("OPENROUTER_TIMEOUT_SECONDS", 120.0))

        return cls(
            api_key=api_key,
            base_url=base_url,
            model=model,
            max_tool_rounds=max(1, _env_int("AGENT_MAX_TOOL_ROUNDS", 8)),
            http_referer=os.environ.get("OPENROUTER_HTTP_REFERER", "").strip() or None,
            app_title=os.environ.get("OPENROUTER_APP_TITLE", "").strip() or None,
            request_timeout_seconds=timeout,
        )
