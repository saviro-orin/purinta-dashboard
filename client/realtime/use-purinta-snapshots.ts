import { useContext, useEffect, useState } from 'react';
import { RealtimeContext } from './provider';

export function usePurintaSnapshots<TSnapshot>(initialSnapshot: TSnapshot) {
  const context = useContext(RealtimeContext);
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    if (!context) return;
    return context.subscribe((next) => setSnapshot(next as TSnapshot));
  }, [context]);

  return { snapshot, status: context?.status ?? 'disconnected' };
}
