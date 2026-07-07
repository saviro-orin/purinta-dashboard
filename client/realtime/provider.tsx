import { createContext, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import type { PurintaSnapshot } from '../types';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'errored';

type SnapshotHandler = (snapshot: PurintaSnapshot) => void;

export interface RealtimeContextValue {
  status: RealtimeStatus;
  subscribe: (handler: SnapshotHandler) => () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

function websocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const handlers = useRef(new Set<SnapshotHandler>());
  const reconnectTimer = useRef<number | null>(null);
  const closedByUnmount = useRef(false);

  const subscribe = useCallback((handler: SnapshotHandler) => {
    handlers.current.add(handler);
    return () => handlers.current.delete(handler);
  }, []);

  useEffect(() => {
    function connect() {
      setStatus('connecting');
      const ws = new WebSocket(websocketUrl());

      ws.onopen = () => setStatus('connected');
      ws.onerror = () => setStatus('errored');
      ws.onclose = () => {
        if (closedByUnmount.current) return;
        setStatus('disconnected');
        reconnectTimer.current = window.setTimeout(connect, 2000);
      };
      ws.onmessage = (event) => {
        const parsed = JSON.parse(event.data) as {
          type?: string;
          payload?: unknown;
        };
        if (parsed.type !== 'snapshot' || !parsed.payload) return;

        for (const handler of handlers.current) handler(parsed.payload as PurintaSnapshot);
      };

      return ws;
    }

    const ws = connect();

    return () => {
      closedByUnmount.current = true;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      ws.close();
    };
  }, []);

  return <RealtimeContext.Provider value={{ status, subscribe }}>{children}</RealtimeContext.Provider>;
}
