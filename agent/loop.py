"""OpenRouter-backed agent loop with tool call round-trips."""

from __future__ import annotations

import json
import logging
from typing import Any

from openai import OpenAI

from .config import AgentConfig
from .tools import ToolRegistry
from .types import AgentResult

log = logging.getLogger("agent.loop")


def _default_headers(cfg: AgentConfig) -> dict[str, str] | None:
    h: dict[str, str] = {}
    if cfg.http_referer:
        h["HTTP-Referer"] = cfg.http_referer
    if cfg.app_title:
        h["X-Title"] = cfg.app_title
    return h or None


def _assistant_message_dict(msg: Any) -> dict[str, Any]:
    """Serialize assistant message for the next API request."""
    return msg.model_dump(exclude_none=True)


def append_tool_result_messages(
    registry: ToolRegistry,
    messages: list[dict[str, Any]],
    assistant_dict: dict[str, Any],
) -> None:
    """Execute tool calls from an assistant message dict and append tool role messages."""
    tool_calls = assistant_dict.get("tool_calls") or []
    names = [tc["function"]["name"] for tc in tool_calls]
    log.info("executing_tools  count=%d  names=%s", len(tool_calls), names)

    for tc in tool_calls:
        fn = tc["function"]
        name = fn["name"]
        call_id = tc["id"]
        raw_args = fn.get("arguments") or "{}"
        try:
            args = json.loads(raw_args)
            if not isinstance(args, dict):
                args = {"value": args}
        except json.JSONDecodeError as e:
            log.warning("tool_args_parse_error  name=%s  id=%s  error=%s", name, call_id, e)
            content = json.dumps(
                {"error": "invalid_arguments_json", "detail": str(e)}
            )
        else:
            content = registry.execute(name, args)

        messages.append(
            {
                "role": "tool",
                "tool_call_id": call_id,
                "content": content,
            }
        )


def run_agent(
    messages: list[dict[str, Any]],
    registry: ToolRegistry,
    *,
    config: AgentConfig | None = None,
    client: OpenAI | None = None,
) -> AgentResult:
    """
    Mutates and returns `messages` in the OpenAI chat format.

    Appends assistant messages (with tool_calls when present) and tool result
    messages until the model returns text without tool calls or max rounds hit.
    """
    cfg = config or AgentConfig.from_env()
    if client is None:
        headers = _default_headers(cfg)
        client = OpenAI(
            base_url=cfg.base_url,
            api_key=cfg.api_key,
            default_headers=headers,
            timeout=cfg.request_timeout_seconds,
        )

    tools = registry.openapi_tools()
    if not tools:
        raise ValueError("ToolRegistry has no tools registered")

    log.info("agent_start  model=%s  max_rounds=%d  message_count=%d", cfg.model, cfg.max_tool_rounds, len(messages))

    tool_rounds_used = 0
    final_content: str | None = None

    for round_idx in range(cfg.max_tool_rounds):
        log.info("llm_request  round=%d  message_count=%d", round_idx + 1, len(messages))

        response = client.chat.completions.create(
            model=cfg.model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

        choice = response.choices[0]
        msg = choice.message
        assistant_dict = _assistant_message_dict(msg)
        messages.append(assistant_dict)

        tool_calls = msg.tool_calls
        if not tool_calls:
            final_content = msg.content
            log.info("agent_done   rounds=%d  reply_chars=%d", tool_rounds_used, len(final_content or ""))
            break

        tool_rounds_used += 1
        append_tool_result_messages(registry, messages, assistant_dict)
    else:
        log.warning("agent_max_rounds_hit  rounds=%d", tool_rounds_used)

    if final_content is None and messages:
        last = messages[-1]
        if last.get("role") == "assistant":
            final_content = last.get("content")

    return AgentResult(
        messages=messages,
        final_content=final_content,
        tool_rounds_used=tool_rounds_used,
    )


def main() -> None:
    """Minimal demo: requires OPENROUTER_API_KEY and network."""
    from .tools import default_registry

    cfg = AgentConfig.from_env()
    reg = default_registry()
    messages: list[dict[str, Any]] = [
        {
            "role": "user",
            "content": (
                "What is the weather in Vancouver? Also what is 2.5 + 3.1? "
                "Use the tools."
            ),
        }
    ]
    result = run_agent(messages, reg, config=cfg)
    print("--- final assistant text ---")
    print(result.final_content)
    print("--- tool rounds ---", result.tool_rounds_used)


if __name__ == "__main__":
    main()
