import { useContext, useEffect, useState } from 'react';
import { RealtimeContext } from './provider';

export function usePurintaSnapshots<T>(initialSnapshot: T): { snapshot: T; status: string } {
  const realtime = useContext(RealtimeContext);
  const [snapshot, setSnapshot] = useState<T>(initialSnapshot);

  useEffect(() => {
    const channel = realtime?.marketChannel;
    if (!channel) return;

    const ref = channel.on('snapshot', (next: T) => setSnapshot(next));

    return () => {
      channel.off('snapshot', ref);
    };
  }, [realtime?.marketChannel]);

  return { snapshot, status: realtime?.status ?? 'connecting' };
}
