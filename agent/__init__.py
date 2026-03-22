"""Agentic loop with OpenRouter (OpenAI-compatible) tool calling."""

from .config import AgentConfig
from .loop import run_agent
from .prompts import apply_system_prompt, load_system_prompt
from .streaming import run_agent_stream_events
from .tools import (
    ToolRegistry,
    default_registry,
    register_geocode_tools,
    register_http_tools,
    register_parallel_tools,
    stub_registry,
    tool,
)
from .types import AgentResult, ToolDefinition

__all__ = [
    "AgentConfig",
    "AgentResult",
    "apply_system_prompt",
    "load_system_prompt",
    "run_agent_stream_events",
    "ToolDefinition",
    "ToolRegistry",
    "default_registry",
    "register_geocode_tools",
    "register_http_tools",
    "register_parallel_tools",
    "run_agent",
    "stub_registry",
    "tool",
]
