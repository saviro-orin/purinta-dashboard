import { Head } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  CircleHelp,
  Coins,
  DatabaseZap,
  Gauge,
  LineChart,
  RadioTower,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { usePurintaSnapshots } from '../realtime/use-purinta-snapshots';
import type { PurintaSnapshot } from '../types';

function numberValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const next = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(next) ? next : 0;
}

function money(value: string | number | null | undefined, digits = 2): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(
    numberValue(value)
  );
}

function pct(value: string | number | null | undefined, digits = 2): string {
  return `${money(value, digits)}%`;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatTime(value: string | null): string {
  if (!value) return 'Waiting for first snapshot';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function StatusPill({ status }: { status: string }) {
  const live = status === 'connected';
  const waiting = status === 'connecting';
  const label = live ? 'Live updates connected' : waiting ? 'Connecting live updates' : 'Live updates disconnected';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-cyan-50">
      <span
        className={`h-2 w-2 rounded-full ${
          live ? 'bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.85)]' : 'bg-amber-300'
        }`}
      />
      {label}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'cyan',
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: 'cyan' | 'emerald' | 'blue';
}) {
  const iconTone = {
    cyan: 'bg-cyan-300/10 text-cyan-100 border-cyan-300/15',
    emerald: 'bg-emerald-300/10 text-emerald-100 border-emerald-300/15',
    blue: 'bg-blue-300/10 text-blue-100 border-blue-300/15',
  }[tone];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-300">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className={`rounded-2xl border p-2 ${iconTone}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </section>
  );
}

function Explainer({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <CircleHelp className="h-4 w-4 text-cyan-200" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{children}</p>
    </div>
  );
}

function MarketCard({ market }: { market: PurintaSnapshot['markets'][number] }) {
  const utilization = Math.min(100, Math.max(0, numberValue(market.utilization)));
  const borrow = numberValue(market.borrow_usdc);
  const supply = numberValue(market.supply_usdc);

  return (
    <article className="rounded-[2rem] border border-blue-200/10 bg-slate-950/75 p-5 shadow-xl shadow-black/30 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Market</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{market.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Borrow USDC using {market.collateral_symbol} collateral. LLTV is the maximum loan-to-value before the
            position becomes risky.
          </p>
        </div>
        <div className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
          LLTV {pct(market.lltv)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        <div className="rounded-2xl bg-white/[0.045] p-4">
          <p className="text-slate-500">Borrowed now</p>
          <p className="mt-1 text-lg font-semibold text-white">${money(borrow, 2)}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.045] p-4">
          <p className="text-slate-500">Supplied liquidity</p>
          <p className="mt-1 text-lg font-semibold text-white">${money(supply, 2)}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.045] p-4">
          <p className="text-slate-500">Borrow APY</p>
          <p className="mt-1 text-lg font-semibold text-emerald-200">{pct(market.borrow_apy)}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.045] p-4">
          <p className="text-slate-500">Net supply APY</p>
          <p className="mt-1 text-lg font-semibold text-cyan-100">{pct(market.net_supply_apy)}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-300">Utilization</span>
          <span className="font-semibold text-white">{pct(market.utilization)}</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-slate-800">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400"
            style={{ width: `${utilization}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Utilization means how much of the supplied USDC is currently borrowed. Higher utilization usually means higher
          rates and less available liquidity.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:flex-wrap">
        <a
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 hover:border-cyan-300/30 hover:text-cyan-100"
          href={`https://etherscan.io/token/${market.collateral_address}`}
          target="_blank"
          rel="noreferrer"
        >
          {market.collateral_symbol} token {shortAddress(market.collateral_address)}{' '}
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 hover:border-cyan-300/30 hover:text-cyan-100"
          href={`https://app.morpho.org/market?id=${market.id}&network=mainnet`}
          target="_blank"
          rel="noreferrer"
        >
          Open Morpho market <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

export default function Home({ snapshot: initialSnapshot }: { snapshot: PurintaSnapshot }) {
  const { snapshot, status } = usePurintaSnapshots<PurintaSnapshot>(initialSnapshot);

  const totals = useMemo(() => {
    const totalBorrow = numberValue(snapshot.total_borrow_usdc);
    const totalSupply = numberValue(snapshot.total_supply_usdc);
    const utilization = totalSupply === 0 ? 0 : (totalBorrow / totalSupply) * 100;
    const highestBorrow = [...snapshot.markets].sort(
      (a, b) => numberValue(b.borrow_usdc) - numberValue(a.borrow_usdc)
    )[0];
    const availableLiquidity = Math.max(0, totalSupply - totalBorrow);

    return { totalBorrow, totalSupply, utilization, highestBorrow, availableLiquidity };
  }, [snapshot]);

  return (
    <>
      <Head title="Purinta Dashboard" />
      <main className="min-h-screen overflow-hidden bg-[#020817] text-slate-100">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.20),transparent_28%),linear-gradient(180deg,#020817_0%,#061225_45%,#020817_100%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:px-8">
          <header className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
                    <RadioTower className="h-3.5 w-3.5" /> Purinta live market monitor
                  </div>
                  <StatusPill status={status} />
                </div>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                  How much USDC is borrowed against Purinta meme collateral?
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
                  A simple view of Purinta's PEPE and SPX markets on Morpho. It shows current borrow demand, available
                  liquidity, APYs, and whether the live feed is connected.
                </p>
              </div>
              <div className="rounded-3xl border border-cyan-300/10 bg-slate-950/75 p-4 text-sm text-slate-300 lg:min-w-72">
                <p className="text-slate-500">Last data refresh</p>
                <p className="mt-1 font-medium text-white">{formatTime(snapshot.fetched_at)}</p>
                <p className="mt-4 text-slate-500">Latest indexed block</p>
                <p className="mt-1 font-medium text-white">{snapshot.block_number?.toLocaleString() ?? 'Syncing'}</p>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Borrowed now"
              value={`$${money(snapshot.total_borrow_usdc, 2)}`}
              detail="Total USDC borrowed from PEPE and SPX collateral markets."
              icon={Wallet}
              tone="emerald"
            />
            <StatCard
              label="Supplied liquidity"
              value={`$${money(snapshot.total_supply_usdc, 2)}`}
              detail="USDC currently supplied to those two markets."
              icon={Coins}
            />
            <StatCard
              label="Available liquidity"
              value={`$${money(totals.availableLiquidity, 2)}`}
              detail="Supplied USDC that has not been borrowed yet."
              icon={DatabaseZap}
              tone="blue"
            />
            <StatCard
              label="Average borrow APY"
              value={pct(snapshot.weighted_borrow_apy)}
              detail="Borrow-rate average weighted by market borrow size."
              icon={LineChart}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="grid gap-4">
              {snapshot.markets.length === 0 ? (
                <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 text-slate-300">
                  Waiting for the first live market snapshot.
                </section>
              ) : (
                snapshot.markets.map((market) => <MarketCard key={market.id} market={market} />)
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center gap-3 text-cyan-100">
                  <ShieldCheck className="h-5 w-5" />
                  <h2 className="text-lg font-semibold text-white">What to watch</h2>
                </div>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-slate-400">Most borrowed market</dt>
                    <dd className="font-medium text-white">{totals.highestBorrow?.name ?? 'Waiting'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-slate-400">Overall utilization</dt>
                    <dd className="font-medium text-white">{pct(totals.utilization)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-slate-400">Tracked markets</dt>
                    <dd className="font-medium text-white">{snapshot.markets.length}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Data source</dt>
                    <dd className="font-medium text-white">Morpho Blue</dd>
                  </div>
                </dl>
              </section>

              <section className="grid gap-3">
                <Explainer title="Borrowed now">
                  This is the current amount of USDC that borrowers have drawn from the market.
                </Explainer>
                <Explainer title="APY">
                  APY is the annualized rate. Borrow APY is what borrowers pay. Net supply APY is what suppliers earn
                  after market effects.
                </Explainer>
                <Explainer title="Utilization">
                  Utilization compares borrowed USDC with supplied USDC. Low utilization means most liquidity is still
                  available.
                </Explainer>
              </section>

              <section className="rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.06] p-5 text-sm text-slate-300">
                <div className="flex items-center gap-3 text-cyan-100">
                  <Gauge className="h-5 w-5" />
                  <h2 className="text-lg font-semibold text-white">Contracts</h2>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <a
                    className="block hover:text-cyan-100"
                    href={`https://etherscan.io/address/${snapshot.vault_address}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Purinta vault {shortAddress(snapshot.vault_address)}
                  </a>
                  <a
                    className="block hover:text-cyan-100"
                    href={`https://etherscan.io/address/${snapshot.morpho_blue}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Morpho Blue {shortAddress(snapshot.morpho_blue)}
                  </a>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}
