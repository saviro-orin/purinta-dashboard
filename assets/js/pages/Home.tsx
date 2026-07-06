import { Head } from '@inertiajs/react';
import {
  type Activity,
  ArrowUpRight,
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

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
}) {
  return (
    <section className="rounded-3xl border border-cyan-300/10 bg-white/[0.045] p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/10 p-2 text-cyan-200">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </section>
  );
}

function MarketCard({ market }: { market: PurintaSnapshot['markets'][number] }) {
  const utilization = Math.min(100, Math.max(0, numberValue(market.utilization)));

  return (
    <article className="rounded-3xl border border-blue-200/10 bg-slate-950/70 p-5 shadow-xl shadow-black/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/70">Collateral market</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{market.name}</h2>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
          LLTV {pct(market.lltv)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-slate-500">Borrowed</p>
          <p className="mt-1 font-semibold text-white">${money(market.borrow_usdc, 2)}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-slate-500">Supplied</p>
          <p className="mt-1 font-semibold text-white">${money(market.supply_usdc, 2)}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-slate-500">Borrow APY</p>
          <p className="mt-1 font-semibold text-emerald-200">{pct(market.borrow_apy)}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-slate-500">Net supply APY</p>
          <p className="mt-1 font-semibold text-cyan-100">{pct(market.net_supply_apy)}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Utilization</span>
          <span>{pct(market.utilization)}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400"
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
        <a
          className="inline-flex items-center gap-1 hover:text-cyan-200"
          href={`https://etherscan.io/token/${market.collateral_address}`}
          target="_blank"
          rel="noreferrer"
        >
          {market.collateral_symbol} {shortAddress(market.collateral_address)} <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          className="inline-flex items-center gap-1 hover:text-cyan-200"
          href={`https://app.morpho.org/market?id=${market.id}&network=mainnet`}
          target="_blank"
          rel="noreferrer"
        >
          Morpho market <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}

export default function Home({ snapshot: initialSnapshot }: { snapshot: PurintaSnapshot }) {
  const { snapshot, status } = usePurintaSnapshots<PurintaSnapshot>(initialSnapshot);

  const totals = useMemo(() => {
    const utilization =
      numberValue(snapshot.total_supply_usdc) === 0
        ? 0
        : (numberValue(snapshot.total_borrow_usdc) / numberValue(snapshot.total_supply_usdc)) * 100;
    const highestBorrow = [...snapshot.markets].sort(
      (a, b) => numberValue(b.borrow_usdc) - numberValue(a.borrow_usdc)
    )[0];
    return { utilization, highestBorrow };
  }, [snapshot]);

  return (
    <>
      <Head title="Purinta Dashboard" />
      <main className="min-h-screen overflow-hidden bg-[#020817] text-slate-100">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.20),transparent_28%),linear-gradient(180deg,#020817_0%,#061225_45%,#020817_100%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur sm:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  <RadioTower className="h-3.5 w-3.5" /> Live Purinta monitor
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                  USDC borrow health for Purinta markets.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Tracks PEPE and SPX collateral markets, live Morpho state, vault addresses, APYs, utilization, and
                  supply/borrow balances.
                </p>
              </div>
              <div className="rounded-3xl border border-cyan-300/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="text-slate-500">Live socket</p>
                <p className="mt-1 flex items-center gap-2 font-medium text-cyan-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                  {status}
                </p>
                <p className="mt-3 text-slate-500">Last refresh</p>
                <p className="mt-1 font-medium text-white">{formatTime(snapshot.fetched_at)}</p>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active borrowed"
              value={`$${money(snapshot.total_borrow_usdc, 2)}`}
              detail="USDC borrowed across Purinta meme markets"
              icon={Wallet}
            />
            <StatCard
              label="Market supply"
              value={`$${money(snapshot.total_supply_usdc, 2)}`}
              detail="Liquidity supplied to PEPE + SPX markets"
              icon={Coins}
            />
            <StatCard
              label="Weighted borrow APY"
              value={pct(snapshot.weighted_borrow_apy)}
              detail="Borrow-weighted rate across live markets"
              icon={LineChart}
            />
            <StatCard
              label="Blended utilization"
              value={pct(totals.utilization)}
              detail="Borrowed USDC divided by supplied USDC"
              icon={Gauge}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4">
              {snapshot.markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>

            <aside className="flex flex-col gap-4">
              <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center gap-3 text-cyan-100">
                  <ShieldCheck className="h-5 w-5" />
                  <h2 className="text-lg font-semibold text-white">Useful signals</h2>
                </div>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-slate-400">Largest borrow market</dt>
                    <dd className="font-medium text-white">{totals.highestBorrow?.name ?? 'n/a'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-slate-400">Indexed markets</dt>
                    <dd className="font-medium text-white">{snapshot.markets.length}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-3">
                    <dt className="text-slate-400">Latest block</dt>
                    <dd className="font-medium text-white">{snapshot.block_number?.toLocaleString() ?? 'syncing'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-400">Source</dt>
                    <dd className="font-medium text-white">Morpho Blue</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.06] p-5 text-sm text-slate-300">
                <div className="flex items-center gap-3 text-cyan-100">
                  <DatabaseZap className="h-5 w-5" />
                  <h2 className="text-lg font-semibold text-white">Indexer shape</h2>
                </div>
                <p className="mt-4 leading-6">
                  The Phoenix app polls and persists normalized Purinta snapshots, then pushes changes over Phoenix
                  Channels. The repo also includes an Envio HyperIndex sidecar scaffold for event indexing when a
                  HyperSync token is provided.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <a
                    className="block hover:text-cyan-100"
                    href={`https://etherscan.io/address/${snapshot.vault_address}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Vault {shortAddress(snapshot.vault_address)}
                  </a>
                  <a
                    className="block hover:text-cyan-100"
                    href={`https://etherscan.io/address/${snapshot.morpho_blue}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Morpho {shortAddress(snapshot.morpho_blue)}
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
