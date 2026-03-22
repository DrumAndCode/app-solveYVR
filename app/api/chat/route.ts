/**
 * Proxy to the Python FastAPI backend's /api/chat/stream endpoint.
 * Forwards the SSE stream directly to the browser so the frontend
 * doesn't need to know the backend URL or deal with CORS.
 */

const BACKEND_URL = process.env.AGENT_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json();

  const upstream = await fetch(`${BACKEND_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, { status: upstream.status });
  }

  // Pipe the SSE stream straight through
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
