import type { Channel, Socket } from 'phoenix';
import { createContext, type ReactNode, useEffect, useState } from 'react';
import { createSocket } from './socket';

export interface RealtimeContextValue {
  socket: Socket | null;
  marketChannel: Channel | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'errored';
}

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [marketChannel, setMarketChannel] = useState<Channel | null>(null);
  const [status, setStatus] = useState<RealtimeContextValue['status']>('connecting');

  useEffect(() => {
    const next = createSocket();
    const channel = next.channel('purinta');

    setStatus('connecting');

    next.onOpen(() => setStatus('connected'));
    next.onClose(() => setStatus('disconnected'));
    next.onError(() => setStatus('errored'));
    next.connect();
    setSocket(next);

    channel
      .join()
      .receive('ok', () => {
        setMarketChannel(channel);
        setStatus('connected');
      })
      .receive('error', () => setStatus('errored'))
      .receive('timeout', () => setStatus('errored'));

    return () => {
      channel.leave();
      next.disconnect();
      setMarketChannel(null);
      setSocket(null);
    };
  }, []);

  return <RealtimeContext.Provider value={{ socket, marketChannel, status }}>{children}</RealtimeContext.Provider>;
}
