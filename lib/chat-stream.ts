/**
 * SSE client for the SolveYVR chat agent.
 *
 * Backend event types:
 *   delta           — streaming text token
 *   thinking_start  — agent is about to run tools
 *   thinking_step   — per-tool progress update
 *   thinking_end    — tool round finished
 *   done            — final response with full message history
 *   error           — something went wrong
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

export interface DeltaEvent {
  type: "delta";
  text: string;
}

export interface ThinkingStartEvent {
  type: "thinking_start";
  steps: { name: string; label: string }[];
}

export interface ThinkingStepEvent {
  type: "thinking_step";
  name: string;
  label: string;
  detail?: string;
  result_summary: string;
  status: "ok" | "error";
}

export interface ThinkingEndEvent {
  type: "thinking_end";
}

export interface DoneEvent {
  type: "done";
  messages: ChatMessage[];
  reply: string | null;
  tool_rounds_used: number;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type AgentEvent =
  | DeltaEvent
  | ThinkingStartEvent
  | ThinkingStepEvent
  | ThinkingEndEvent
  | DoneEvent
  | ErrorEvent;

/**
 * Stream chat events from the backend via our Next.js proxy route.
 * Yields parsed SSE events as they arrive.
 */
export async function* streamChat(
  messages: ChatMessage[],
  signal?: AbortSignal
): AsyncGenerator<AgentEvent> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    yield { type: "error", message: `HTTP ${res.status}: ${text}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    yield { type: "error", message: "No response body" };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last potentially incomplete line in the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const payload = trimmed.slice(6); // strip "data: "
      if (payload === "[DONE]") return;

      try {
        const event = JSON.parse(payload) as AgentEvent;
        yield event;
      } catch {
        // Skip malformed events
      }
    }
  }
}
