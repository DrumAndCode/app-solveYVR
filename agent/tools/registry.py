"""Tool registry: JSON Schema + handlers for OpenAI-compatible tool calling."""

from __future__ import annotations

import inspect
import json
import logging
import time
from typing import Any

from ..types import JSONSchema, ToolDefinition, ToolHandler

log = logging.getLogger("agent.tools")


class ToolRegistry:
    """Collects tools and builds the `tools` payload for chat completions."""

    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}

    def register(
        self,
        name: str,
        description: str,
        parameters: JSONSchema,
        handler: ToolHandler,
    ) -> None:
        if name in self._tools:
            raise ValueError(f"Tool {name!r} is already registered")
        self._tools[name] = ToolDefinition(
            name=name,
            description=description,
            parameters=parameters,
            handler=handler,
        )

    def get(self, name: str) -> ToolDefinition | None:
        return self._tools.get(name)

    def openapi_tools(self) -> list[dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.parameters,
                },
            }
            for t in self._tools.values()
        ]

    def execute(self, name: str, arguments: dict[str, Any]) -> str:
        tool = self.get(name)
        if tool is None:
            log.warning("tool_unknown  name=%s", name)
            return json.dumps({"error": f"unknown_tool: {name}"})

        arg_preview = json.dumps(arguments, ensure_ascii=False, default=str)
        if len(arg_preview) > 500:
            arg_preview = arg_preview[:500] + "…"
        log.info("tool_call     name=%s  args=%s", name, arg_preview)

        t0 = time.perf_counter()
        try:
            sig = inspect.signature(tool.handler)
            if any(
                p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values()
            ):
                result = tool.handler(**arguments)
            else:
                bound = sig.bind_partial(**arguments)
                bound.apply_defaults()
                result = tool.handler(*bound.args, **bound.kwargs)
        except TypeError as e:
            elapsed = time.perf_counter() - t0
            log.error("tool_error    name=%s  error=invalid_arguments  detail=%s  elapsed=%.3fs", name, e, elapsed)
            return json.dumps({"error": "invalid_arguments", "detail": str(e)})
        except Exception as e:
            elapsed = time.perf_counter() - t0
            log.error("tool_error    name=%s  error=tool_failed  detail=%s  elapsed=%.3fs", name, e, elapsed)
            return json.dumps({"error": "tool_failed", "detail": str(e)})

        elapsed = time.perf_counter() - t0
        output = result if isinstance(result, str) else json.dumps(result, default=str)
        log.info(
            "tool_result   name=%s  elapsed=%.3fs  output_chars=%d",
            name, elapsed, len(output),
        )
        return output


def tool(
    registry: ToolRegistry,
    name: str,
    description: str,
    parameters: JSONSchema,
) -> Any:
    """Decorator: @tool(reg, "name", "desc", {...schema...})\n    def fn(...): ..."""

    def decorator(fn: ToolHandler) -> ToolHandler:
        registry.register(name, description, parameters, fn)
        return fn

    return decorator


def base_registry() -> ToolRegistry:
    """Registry with core tools (submit_request, geocode_address)."""
    reg = ToolRegistry()

    from .geocode import register_geocode_tools
    from .http import register_http_tools

    register_http_tools(reg)
    register_geocode_tools(reg)

    return reg


# Keep alias for backwards compat in case anything imports stub_registry.
stub_registry = base_registry
