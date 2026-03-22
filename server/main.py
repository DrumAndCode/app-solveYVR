"""HTTP API + static chat UI for the SolveYVR agent."""

from __future__ import annotations

import json
import logging
import traceback
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-5s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Ensure repo root is on path when running as `uvicorn server.main:app`
_ROOT = Path(__file__).resolve().parent.parent

app = FastAPI(title="SolveYVR Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    messages: list[dict] = Field(
        ...,
        description="OpenAI-style chat messages (user/assistant/system/tool).",
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _sse_event(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


@app.post("/api/chat/stream")
def chat_stream(body: ChatRequest) -> StreamingResponse:
    """SSE stream: `delta` tokens, `tools_start`, then `done` with full messages."""
    if not body.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    try:
        from agent.config import AgentConfig
        from agent.prompts import apply_system_prompt, load_system_prompt
        from agent.streaming import run_agent_stream_events
        from agent.tools import default_registry
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent import failed: {e}. Run from repo root with PYTHONPATH set.",
        ) from e

    cfg = AgentConfig.from_env()
    reg = default_registry()
    msgs = [dict(m) for m in body.messages]
    apply_system_prompt(msgs, load_system_prompt())

    def gen():
        try:
            for ev in run_agent_stream_events(msgs, reg, config=cfg):
                yield _sse_event(ev)
            yield "data: [DONE]\n\n"
        except Exception as e:
            traceback.print_exc()
            yield _sse_event({"type": "error", "message": str(e)})
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


_web = _ROOT / "web"
if _web.is_dir():

    @app.get("/")
    def index() -> FileResponse:
        """Serve chat UI (static mount at `/` can steal `/api/*` in some setups)."""
        return FileResponse(_web / "index.html")

    app.mount("/assets", StaticFiles(directory=str(_web)), name="assets")
