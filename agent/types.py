"""Typed helpers for the agent tool loop."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


JSONSchema = dict[str, Any]
ToolHandler = Callable[..., Any]


@dataclass
class ToolDefinition:
    """A registered tool: schema for the API and a Python handler."""

    name: str
    description: str
    parameters: JSONSchema
    handler: ToolHandler


@dataclass
class AgentResult:
    """Outcome of a completed agent run."""

    messages: list[dict[str, Any]]
    final_content: str | None
    tool_rounds_used: int
