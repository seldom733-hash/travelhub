export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

// In-memory store of active SSE connections per conversation
const connections = new Map<string, ReadableStreamDefaultController[]>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return new Response("Missing conversationId", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Register this connection
      if (!connections.has(conversationId)) {
        connections.set(conversationId, []);
      }
      connections.get(conversationId)!.push(controller);

      // Send initial heartbeat
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

      // Keep-alive ping every 30 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
        } catch {
          clearInterval(interval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        const conns = connections.get(conversationId);
        if (conns) {
          const idx = conns.indexOf(controller);
          if (idx > -1) conns.splice(idx, 1);
          if (conns.length === 0) connections.delete(conversationId);
        }
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Broadcast a new message to all connected clients in a conversation
export function broadcastMessage(conversationId: string, message: unknown) {
  const conns = connections.get(conversationId);
  if (!conns || conns.length === 0) return;

  const data = `data: ${JSON.stringify({ type: "message", data: message })}\n\n`;

  for (const controller of conns) {
    try {
      controller.enqueue(data);
    } catch {
      // Connection dead — will be cleaned up by abort handler
    }
  }
}

// Export for use in POST /api/chat/messages
export { connections as sseConnections };
