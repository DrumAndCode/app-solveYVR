# Backend API Reference

Base URL: `http://localhost:8000` (default when running `uvicorn server.main:app`)

CORS is open (`*`), so any frontend origin can call these endpoints during development.

---

## `GET /api/health`

Simple liveness check.

**Response** `200`

```json
{ "status": "ok" }
```

---

## `POST /api/chat/stream`

Stream a conversation with the SolveYVR agent. The response is a **Server-Sent Events (SSE)** stream.

### Request

**Content-Type:** `application/json`

```json
{
  "messages": [
    { "role": "user", "content": "There's garbage at 1128 W Broadway" }
  ]
}
```

`messages` is an array of OpenAI-style chat messages. Include the full conversation history on each request — the backend is stateless. Valid roles are `user`, `assistant`, `system`, and `tool` (the last two are only relevant when replaying prior agent turns).

### Response

**Content-Type:** `text/event-stream`

The stream emits newline-delimited `data:` lines. Each line is a JSON object with a `type` field. The stream ends with `data: [DONE]`.

#### Event types

| Type | When | Payload |
|---|---|---|
| `delta` | Model is generating text | `{ "type": "delta", "text": "..." }` |
| `thinking_start` | Agent is about to call tools | `{ "type": "thinking_start", "steps": [...] }` |
| `thinking_step` | One tool finished | `{ "type": "thinking_step", "name": "...", "label": "...", "detail": "...", "result_summary": "...", "status": "ok" \| "error" }` |
| `thinking_end` | Tool round complete | `{ "type": "thinking_end" }` |
| `done` | Stream complete | `{ "type": "done", "messages": [...], "reply": "...", "tool_rounds_used": 1 }` |
| `error` | Something went wrong | `{ "type": "error", "message": "..." }` |

#### Event details

**`delta`** — A text fragment from the model. Concatenate all `delta.text` values to build the assistant's reply in real time.

**`thinking_start`** — The agent decided to call one or more tools. `steps` is an array of `{ "name", "label" }` objects previewing what will run. `label` is a user-friendly description (e.g. "Looking up location" instead of the internal tool name).

**`thinking_step`** — Emitted once per tool after it finishes. Fields:
- `name` — internal tool name
- `label` — friendly label (same as in `thinking_start`)
- `detail` — short description of the input (e.g. an address or URL), may be `null`
- `result_summary` — human-readable one-liner of the result
- `status` — `"ok"` or `"error"`

**`thinking_end`** — All tools in this round finished. The model will now process the results and either reply or start another tool round. Multiple `thinking_start` → `thinking_end` cycles can occur in a single request.

**`done`** — The final event before `[DONE]`. Contains:
- `messages` — the full updated message history (including tool messages), suitable for sending back in the next request
- `reply` — the assistant's final text, or `null` if the model didn't produce text
- `tool_rounds_used` — number of tool rounds executed (0 if the model replied directly)

**`error`** — An error occurred during streaming. The stream will still end with `[DONE]` after this.

### Errors

| Status | Cause |
|---|---|
| `400` | `messages` is empty |
| `422` | Request body doesn't match the expected schema (FastAPI validation) |
| `500` | Agent failed to import (missing dependencies or wrong working directory) |

For `422` errors, the response body is:

```json
{
  "detail": [
    { "loc": ["body", "messages"], "msg": "field required", "type": "value_error.missing" }
  ]
}
```

---

## Typical frontend flow

```
1.  User types a message
2.  POST /api/chat/stream with full message history
3.  Read the SSE stream:
      - On "delta":          append text to the current assistant bubble
      - On "thinking_start": show a "working on it" indicator
      - On "thinking_step":  show each step (e.g. "Looking up location ✓")
      - On "thinking_end":   collapse the indicator, show "Thinking…" while model processes
      - On "done":           store messages from the event as the new conversation state
      - On "error":          show the error to the user
4.  Wait for "data: [DONE]" to know the stream is fully closed
5.  On next user message, send the stored messages array + the new user message
```

### Minimal JavaScript example

```javascript
const res = await fetch("/api/chat/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buf = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });

  let sep;
  while ((sep = buf.indexOf("\n\n")) >= 0) {
    const block = buf.slice(0, sep);
    buf = buf.slice(sep + 2);

    for (const line of block.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (raw === "[DONE]") break;

      const ev = JSON.parse(raw);

      if (ev.type === "delta") {
        // append ev.text to assistant message bubble
      }
      if (ev.type === "thinking_start") {
        // show thinking indicator with ev.steps
      }
      if (ev.type === "thinking_step") {
        // show step: ev.label, ev.detail, ev.result_summary, ev.status
      }
      if (ev.type === "thinking_end") {
        // collapse thinking indicator
      }
      if (ev.type === "done") {
        // save ev.messages as conversation state for next request
        messages = ev.messages;
      }
      if (ev.type === "error") {
        // show ev.message to user
      }
    }
  }
}
```

---

## Running the backend

```bash
# From the repo root
pip install -r requirements.txt
cp .env.example .env          # fill in OPENROUTER_API_KEY
python3 -m uvicorn server.main:app --reload --host 127.0.0.1 --port 8000
```

The server will be available at `http://127.0.0.1:8000`. The built-in chat UI is served at `/` if the `web/` folder exists.
