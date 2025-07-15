import { useEffect, useRef } from 'react';
import { WebSocketManager } from '@/lib/websocket';

export function useWebSocket(sessionId: string) {
  const wsRef = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocketManager(sessionId);
    wsRef.current.connect();

    return () => {
      wsRef.current?.disconnect();
    };
  }, [sessionId]);

  return wsRef.current;
}
