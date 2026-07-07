import { useEffect, useState } from 'react';
import Home from './pages/Home';
import type { PurintaSnapshot } from './types';

export function App() {
  const [snapshot, setSnapshot] = useState<PurintaSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const response = await fetch('/api/snapshot');

        if (!response.ok) {
          throw new Error(`Snapshot request failed with ${response.status}`);
        }

        const next = (await response.json()) as PurintaSnapshot;
        if (!cancelled) setSnapshot(next);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Failed to load snapshot');
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-[#FCFBF5] p-6 text-[#185229]">
        <section className="mx-auto max-w-xl rounded-[28px] border border-[#FEDBD8] bg-[#FFF5F4] p-6 shadow-[0_7px_0_#FEDBD8]">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#8C1C5F]">Purinta dashboard</p>
          <h1 className="mt-3 text-3xl font-black">Could not load the latest market snapshot.</h1>
          <p className="mt-3 text-[#666666]">{error}</p>
        </section>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-[#FCFBF5] p-6 text-[#185229]">
        <section className="mx-auto max-w-xl rounded-[28px] border border-[#C8E4B0] bg-[#E7F4EC] p-6 shadow-[0_7px_0_#C8E4B0]">
          <p className="text-sm font-black uppercase tracking-[0.24em]">Purinta dashboard</p>
          <h1 className="mt-3 text-3xl font-black">Loading live market snapshot…</h1>
        </section>
      </main>
    );
  }

  return <Home snapshot={snapshot} />;
}
