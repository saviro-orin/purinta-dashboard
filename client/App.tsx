import { lazy, Suspense, useEffect, useState } from 'react';
import Home from './pages/Home';
import { Router } from './router';
import type { PurintaSnapshot } from './types';

// Charts (recharts) only load when a market detail page is opened,
// keeping the home page bundle small.
const MarketDetail = lazy(() => import('./pages/MarketDetail'));

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
      <main className="min-h-screen bg-cream p-6 text-ink">
        <section className="mx-auto max-w-xl rounded-3xl border border-blush-line bg-blush p-6 shadow-[0_4px_0_var(--color-blush-line)]">
          <h1 className="text-2xl font-black">Could not load the latest market snapshot.</h1>
          <p className="mt-3 text-muted">{error}</p>
        </section>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-cream p-6 text-ink">
        <section className="mx-auto max-w-xl rounded-3xl border border-mint-line bg-mint p-6 shadow-[0_4px_0_var(--color-mint-line)]">
          <h1 className="text-2xl font-black">Loading live market snapshot…</h1>
        </section>
      </main>
    );
  }

  return (
    <Router
      routes={[
        { path: '/', render: () => <Home snapshot={snapshot} /> },
        {
          path: '/market/:chainId/:id',
          render: ({ chainId, id }) => (
            <Suspense fallback={<main className="min-h-screen bg-cream" />}>
              <MarketDetail chainId={Number(chainId)} marketId={id as string} snapshot={snapshot} />
            </Suspense>
          ),
        },
      ]}
      fallback={<Home snapshot={snapshot} />}
    />
  );
}
