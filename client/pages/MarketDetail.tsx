import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LiveStatusRow, StatCard, TokenLogo } from '../components/ui';
import { formatTime, money, pct } from '../lib/format';
import { usePurintaSnapshots } from '../realtime/use-purinta-snapshots';
import { Link } from '../router';
import type { HistoryRange, MarketHistoryPoint, PurintaSnapshot } from '../types';

const RANGES: HistoryRange[] = ['24h', '7d', '30d'];

/* Series colors: green = borrow side, USDC blue = supply side, everywhere. */
const BORROW_COLOR = '#39763d';
const SUPPLY_COLOR = '#3e73c4';
const GRID_COLOR = '#efebdc';
const CURSOR = { stroke: '#d6d2b2', strokeWidth: 1 };
const AXIS_TICK = { fill: '#5c5c50', fontSize: 12 };

function axisMoney(value: number): string {
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`;
}

function axisPct(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)}%`;
}

function timeTick(range: HistoryRange) {
  const format: Intl.DateTimeFormatOptions =
    range === '24h' ? { hour: '2-digit', minute: '2-digit' } : { month: 'short', day: 'numeric' };
  const formatter = new Intl.DateTimeFormat('en-US', format);
  return (value: string) => formatter.format(new Date(value));
}

function ChartTip({
  active,
  payload,
  label,
  kind,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string | number; value?: number | string; color?: string }>;
  label?: string;
  kind: 'money' | 'pct';
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-[0_4px_12px_rgba(24,82,41,0.10)]">
      <p className="text-xs text-muted">{formatTime(label ?? null)}</p>
      <dl className="mt-1 space-y-0.5">
        {payload.map((entry) => (
          <div key={String(entry.name)} className="flex items-center gap-2 text-sm">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: entry.color }} aria-hidden />
            <dd className="font-bold text-ink">
              {kind === 'money' ? `$${money(entry.value as number)}` : pct(entry.value as number)}
            </dd>
            <dt className="text-muted">{entry.name}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ChartLegend({ series }: { series: Array<{ name: string; color: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((entry) => (
        <span key={entry.name} className="inline-flex items-center gap-1.5 text-sm text-muted">
          <span className="h-0.5 w-4 rounded-full" style={{ background: entry.color }} aria-hidden />
          {entry.name}
        </span>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  current,
  legend,
  children,
}: {
  title: string;
  current?: string;
  legend?: Array<{ name: string; color: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-[0_5px_0_var(--color-line)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {current ? <p className="text-sm font-black text-ink">{current}</p> : null}
      </div>
      {legend ? <div className="mt-1">{legend.length > 1 ? <ChartLegend series={legend} /> : null}</div> : null}
      <div className="mt-3 h-56 min-w-0">{children}</div>
    </section>
  );
}

const activeDot = { r: 4, strokeWidth: 2, stroke: '#ffffff' };

export default function MarketDetail({
  marketId,
  snapshot: initialSnapshot,
}: {
  marketId: string;
  snapshot: PurintaSnapshot;
}) {
  const { snapshot, status } = usePurintaSnapshots<PurintaSnapshot>(initialSnapshot);
  const market = snapshot.markets.find((entry) => entry.id === marketId);

  const [range, setRange] = useState<HistoryRange>('24h');
  const [points, setPoints] = useState<MarketHistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetch(`/api/markets/${marketId}/history?range=${range}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`History request failed with ${response.status}`);
        const history = (await response.json()) as { points: MarketHistoryPoint[] };
        if (!cancelled) setPoints(history.points);
      })
      .catch((reason) => {
        if (!cancelled) setLoadError(reason instanceof Error ? reason.message : 'Failed to load history');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [marketId, range]);

  if (!market) {
    return (
      <main className="min-h-screen bg-cream p-6 text-ink">
        <section className="mx-auto max-w-xl rounded-3xl border border-blush-line bg-blush p-6 shadow-[0_4px_0_var(--color-blush-line)]">
          <h1 className="text-2xl font-black">Market not found</h1>
          <p className="mt-3 text-muted">No tracked Purinta market matches this address.</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-1 font-semibold text-leaf hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All markets
          </Link>
        </section>
      </main>
    );
  }

  const tick = timeTick(range);
  const hasHistory = (points?.length ?? 0) >= 2;
  const usdcLegend = [
    { name: 'Supplied', color: SUPPLY_COLOR },
    { name: 'Borrowed', color: BORROW_COLOR },
  ];
  const apyLegend = [
    { name: 'Borrow APY', color: BORROW_COLOR },
    { name: 'Net supply APY', color: SUPPLY_COLOR },
  ];

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <nav>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-leaf hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All markets
          </Link>
        </nav>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-mint-line bg-mint">
              <TokenLogo symbol={market.collateral_symbol} className="h-9 w-9" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{market.name}</h1>
              <p className="mt-1 text-sm text-muted">
                Borrow USDC against {market.collateral_symbol} · LLTV {pct(market.lltv, 1)}
              </p>
            </div>
          </div>
          <LiveStatusRow snapshot={snapshot} status={status} />
        </header>

        <section aria-label="Current values" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Borrowed" value={`$${money(market.borrow_usdc)}`} tone="mint" />
          <StatCard label="Supplied" value={`$${money(market.supply_usdc)}`} tone="blue" />
          <StatCard
            label="Borrow APY"
            value={pct(market.borrow_apy)}
            tone="mint"
            tooltip="Annualized rate borrowers are paying right now."
          />
          <StatCard
            label="Net supply APY"
            value={pct(market.net_supply_apy)}
            tone="blue"
            tooltip="Annualized rate suppliers earn after market-level effects. Not guaranteed."
          />
        </section>

        <section aria-label="History" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">History</h2>
            <fieldset className="m-0 flex gap-1.5 border-0 p-0" aria-label="Time range">
              {RANGES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={range === option}
                  onClick={() => setRange(option)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                    range === option ? 'border-ink bg-ink text-cream' : 'border-line bg-white text-muted hover:text-ink'
                  }`}
                >
                  {option}
                </button>
              ))}
            </fieldset>
          </div>

          {loadError ? (
            <div className="rounded-3xl border border-blush-line bg-blush p-6 text-blush-ink shadow-[0_4px_0_var(--color-blush-line)]">
              Could not load history: {loadError}
            </div>
          ) : !hasHistory && !loading ? (
            <div className="rounded-3xl border border-mint-line bg-mint p-6 text-ink shadow-[0_4px_0_var(--color-mint-line)]">
              Not enough history for this range yet. Snapshots are recorded about every 30 seconds, so check back
              shortly.
            </div>
          ) : points === null ? (
            <div className="rounded-3xl border border-line bg-white p-6 text-muted shadow-[0_5px_0_var(--color-line)]">
              Loading history…
            </div>
          ) : (
            <div className={`grid min-w-0 gap-4 lg:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>
              <div className="min-w-0 lg:col-span-2">
                <ChartCard title="Borrowed vs supplied USDC" legend={usdcLegend}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={1} />
                      <XAxis
                        dataKey="t"
                        tickFormatter={tick}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={48}
                        dy={6}
                      />
                      <YAxis
                        tickFormatter={axisMoney}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<ChartTip kind="money" />} cursor={CURSOR} />
                      <Line
                        type="monotone"
                        dataKey="supply_usdc"
                        name="Supplied"
                        stroke={SUPPLY_COLOR}
                        strokeWidth={2}
                        dot={false}
                        activeDot={activeDot}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="borrow_usdc"
                        name="Borrowed"
                        stroke={BORROW_COLOR}
                        strokeWidth={2}
                        dot={false}
                        activeDot={activeDot}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <ChartCard title="APY" legend={apyLegend}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={1} />
                    <XAxis
                      dataKey="t"
                      tickFormatter={tick}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={48}
                      dy={6}
                    />
                    <YAxis
                      tickFormatter={axisPct}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<ChartTip kind="pct" />} cursor={CURSOR} />
                    <Line
                      type="monotone"
                      dataKey="borrow_apy"
                      name="Borrow APY"
                      stroke={BORROW_COLOR}
                      strokeWidth={2}
                      dot={false}
                      activeDot={activeDot}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="net_supply_apy"
                      name="Net supply APY"
                      stroke={SUPPLY_COLOR}
                      strokeWidth={2}
                      dot={false}
                      activeDot={activeDot}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Utilization" current={pct(market.utilization)}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={1} />
                    <XAxis
                      dataKey="t"
                      tickFormatter={tick}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={48}
                      dy={6}
                    />
                    <YAxis
                      tickFormatter={axisPct}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<ChartTip kind="pct" />} cursor={CURSOR} />
                    <Area
                      type="monotone"
                      dataKey="utilization"
                      name="Utilization"
                      stroke={BORROW_COLOR}
                      strokeWidth={2}
                      fill={BORROW_COLOR}
                      fillOpacity={0.1}
                      activeDot={activeDot}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <details className="rounded-3xl border border-line bg-white p-5 shadow-[0_5px_0_var(--color-line)] lg:col-span-2">
                <summary className="cursor-pointer text-sm font-semibold text-leaf hover:text-ink">
                  View history as a table
                </summary>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="text-muted">
                        <th className="py-2 pr-4 font-medium">Time</th>
                        <th className="py-2 pr-4 font-medium">Borrowed</th>
                        <th className="py-2 pr-4 font-medium">Supplied</th>
                        <th className="py-2 pr-4 font-medium">Utilization</th>
                        <th className="py-2 pr-4 font-medium">Borrow APY</th>
                        <th className="py-2 font-medium">Net supply APY</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {points.map((point) => (
                        <tr key={point.t} className="border-t border-line">
                          <td className="py-2 pr-4 text-muted">{formatTime(point.t)}</td>
                          <td className="py-2 pr-4 font-semibold text-ink">${money(point.borrow_usdc)}</td>
                          <td className="py-2 pr-4 font-semibold text-ink">${money(point.supply_usdc)}</td>
                          <td className="py-2 pr-4">{pct(point.utilization)}</td>
                          <td className="py-2 pr-4">{pct(point.borrow_apy)}</td>
                          <td className="py-2">{pct(point.net_supply_apy)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </section>

        <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-sm font-semibold text-leaf">
          <a
            className="inline-flex items-center gap-1 hover:text-ink"
            href={`https://app.morpho.org/market?id=${market.id}&network=mainnet`}
            target="_blank"
            rel="noreferrer"
          >
            View on Morpho <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a
            className="inline-flex items-center gap-1 hover:text-ink"
            href={`https://etherscan.io/token/${market.collateral_address}`}
            target="_blank"
            rel="noreferrer"
          >
            {market.collateral_symbol} token <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </footer>
      </div>
    </main>
  );
}
