"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SSEMessage {
  type: "connected" | "ping" | "message";
  data?: unknown;
}

interface UseSSEMessagesOptions {
  conversationId: string | null;
  onMessage?: (message: unknown) => void;
}

export function useSSEMessages({ conversationId, onMessage }: UseSSEMessagesOptions) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (!conversationId) return;
    disconnect();

    const url = `/api/chat/stream?conversationId=${conversationId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const parsed: SSEMessage = JSON.parse(event.data);
        if (parsed.type === "message" && parsed.data) {
          onMessageRef.current?.(parsed.data);
        }
      } catch {
        // ignore parse errors (ping/heartbeat)
      }
    };

    es.onerror = () => {
      setConnected(false);
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          connect();
        }
      }, 3000);
    };
  }, [conversationId, disconnect]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { connected };
}
