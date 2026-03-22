"""Parallel.ai Extract tool for required Van311 form fields.

Requires `parallel-web` and `PARALLEL_API_KEY` (https://platform.parallel.ai/).
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from parallel import Parallel

from .registry import ToolRegistry, stub_registry

# Cap tool output size for LLM context (characters, not tokens).
_MAX_RESPONSE_CHARS = 100_000

# Van311 / Verint-style field tokens often appear in page content or sample payloads.
_FIELD_PATTERNS = [
    re.compile(r"\b(txt_[a-z][a-z0-9_]*)\b", re.I),
    re.compile(r"\b(le_[a-z][a-z0-9_]*)\b", re.I),
    re.compile(r"\b(txta_[a-z][a-z0-9_]*)\b", re.I),
    re.compile(r"\b(rad_[a-z][a-z0-9_]*)\b", re.I),
    re.compile(r"\b(chk_[a-z][a-z0-9_]*)\b", re.I),
    re.compile(r"\b(eml_[a-z][a-z0-9_]*)\b", re.I),
    re.compile(r"\b(tel_[a-z][a-z0-9_]*)\b", re.I),
    re.compile(r"\bfull-address\b", re.I),
    re.compile(r"\bname=\"(txt_[a-z0-9_]+)\"", re.I),
    re.compile(r"\bid=\"(txt_[a-z0-9_]+)\"", re.I),
]


def _truncate_text(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return text[: limit - 20] + "\n...[truncated]"


def _clip_payload(payload: Any) -> str:
    raw = json.dumps(payload, ensure_ascii=False, default=str)
    if len(raw) <= _MAX_RESPONSE_CHARS:
        return raw
    return _truncate_text(raw, _MAX_RESPONSE_CHARS)


def _collect_text_from_extract_result(r: Any) -> str:
    parts: list[str] = []
    ex = getattr(r, "excerpts", None)
    if ex is not None:
        if isinstance(ex, list):
            parts.extend(str(x) for x in ex)
        else:
            parts.append(str(ex))
    fc = getattr(r, "full_content", None)
    if fc is not None:
        parts.append(str(fc))
    return "\n".join(parts)


def _guess_field_names_from_text(text: str) -> list[str]:
    """Heuristic: pull Van311-style identifiers from extracted page text."""
    seen: set[str] = set()
    for pat in _FIELD_PATTERNS:
        for m in pat.finditer(text):
            g = m.lastindex or 1
            name = m.group(g).strip()
            if name.lower() == "full-address":
                seen.add("full-address")
            elif name and not name.startswith("http"):
                seen.add(name)
    return sorted(seen, key=str.lower)


def _parallel_client(client: Parallel | None) -> Parallel:
    if client is not None:
        return client
    key = os.environ.get("PARALLEL_API_KEY", "").strip()
    if not key:
        raise RuntimeError("PARALLEL_API_KEY is not set")
    return Parallel(api_key=key)


def register_parallel_tools(
    registry: ToolRegistry,
    *,
    client: Parallel | None = None,
) -> None:
    """Register `lookup_service_fields` (Parallel Extract + field-name heuristics)."""
    pc = _parallel_client(client)

    _DEFAULT_OBJECTIVE = (
        "Identify all required form inputs, mandatory fields, and control names for submitting "
        "this Van311 service request. Include field names as used in the form or API (e.g. txt_*, "
        "le_*, txta_*, rad_*, chk_*, full-address)."
    )

    def lookup_service_fields(
        urls: list[str],
        objective: str | None = None,
        excerpts: bool = True,
        full_content: bool = False,
    ) -> str:
        if not urls:
            return json.dumps({"error": "urls_required", "required_fields": []})
        obj = (objective or "").strip() or _DEFAULT_OBJECTIVE
        try:
            extract = pc.beta.extract(
                urls=urls,
                objective=obj,
                excerpts=excerpts,
                full_content=full_content,
            )
        except Exception as e:
            return json.dumps(
                {"error": "parallel_extract_failed", "detail": str(e), "required_fields": []}
            )

        all_text_parts: list[str] = []
        rows: list[dict[str, Any]] = []
        for r in extract.results:
            text_blob = _collect_text_from_extract_result(r)
            all_text_parts.append(text_blob)
            row: dict[str, Any] = {
                "url": getattr(r, "url", None),
                "title": getattr(r, "title", None),
                "publish_date": getattr(r, "publish_date", None),
            }
            ex = getattr(r, "excerpts", None)
            if ex is not None:
                if isinstance(ex, list):
                    row["excerpts"] = [_truncate_text(str(x), 50_000) for x in ex]
                else:
                    row["excerpts"] = [str(ex)]
            fc = getattr(r, "full_content", None)
            if fc is not None:
                row["full_content"] = _truncate_text(str(fc), 80_000)
            rows.append(row)

        combined = "\n".join(all_text_parts)
        required_fields = _guess_field_names_from_text(combined)

        out: dict[str, Any] = {
            "required_fields": required_fields,
            "extract_id": getattr(extract, "extract_id", None),
            "urls": urls,
            "objective_used": obj,
            "results": rows,
            "errors": getattr(extract, "errors", None),
            "warnings": getattr(extract, "warnings", None),
            "usage": getattr(extract, "usage", None),
            "note": (
                "required_fields are heuristics from page text (txt_*/le_*/etc.). "
                "Cross-check with excerpts in results if the list looks incomplete."
            ),
        }
        return _clip_payload(out)

    registry.register(
        "lookup_service_fields",
        (
            "Load one or more Van311 service page URLs (from Van311_Services_Categories.json `link`) "
            "via Parallel Extract and return a JSON object whose **`required_fields`** key is a list "
            "of inferred field/control names for the POST payload. Use for step 2 only—categories "
            "come from the bundled JSON, not from the web."
        ),
        {
            "type": "object",
            "properties": {
                "urls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Service page URL(s), e.g. https://van311.ca/services/abandoned-garbage",
                },
                "objective": {
                    "type": "string",
                    "description": "Optional focus for extraction; defaults to finding required form/API fields.",
                },
                "excerpts": {
                    "type": "boolean",
                    "description": "If true, use focused excerpts (default true).",
                },
                "full_content": {
                    "type": "boolean",
                    "description": "If true, include full page markdown (larger; may find more field names).",
                },
            },
            "required": ["urls"],
        },
        lookup_service_fields,
    )


def default_registry() -> ToolRegistry:
    """Stub tools plus Parallel `lookup_service_fields` when PARALLEL_API_KEY is set."""
    reg = stub_registry()
    if os.environ.get("PARALLEL_API_KEY", "").strip():
        register_parallel_tools(reg)
    return reg
