/**
 * Proxy to the Python FastAPI backend's /api/chat/stream endpoint.
 * Forwards the SSE stream directly to the browser so the frontend
 * doesn't need to know the backend URL or deal with CORS.
 */

const BACKEND_URL = process.env.AGENT_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Connection failed";
    return new Response(
      JSON.stringify({
        error: `Could not reach agent server at ${BACKEND_URL}: ${message}. Is the Python server running?`,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

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
