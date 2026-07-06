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
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/Tooltip';
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

function InfoTooltip({ label, children }: { label: string; children: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#C8E4B0] bg-[#FCFBF5] text-[#39763D] shadow-[0_2px_0_#C8E4B0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39763D]"
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 rounded-2xl border border-[#C8E4B0] bg-[#185229] px-3 py-2 text-sm leading-5 text-[#FCFBF5] shadow-[0_6px_0_#C8E4B0]">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

function TokenLogo({ symbol, className = 'h-8 w-8' }: { symbol: string; className?: string }) {
  const upper = symbol.toUpperCase();
  const src = upper.includes('PEPE')
    ? 'https://app.purinta.xyz/assets/Pepe-BV89tIWU.svg'
    : upper.includes('SPX')
      ? 'https://app.purinta.xyz/assets/Spx-BF2tRkT5.svg'
      : '/images/tokens/usdc.svg';

  return <img src={src} alt={`${symbol} logo`} className={`${className} rounded-full object-contain`} loading="lazy" />;
}

function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <InfoTooltip label={`What is ${label}?`}>{tooltip}</InfoTooltip>
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const live = status === 'connected';
  const waiting = status === 'connecting';
  const label = live ? 'Live updates connected' : waiting ? 'Connecting live updates' : 'Live updates disconnected';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#C8E4B0] bg-[#E7F4EC] px-3 py-1.5 text-xs font-semibold text-[#185229] shadow-[0_4px_0_#C8E4B0]">
      <span className={`h-2.5 w-2.5 rounded-full ${live ? 'bg-[#39763D]' : 'bg-[#FFA466]'}`} />
      {label}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tooltip,
  tone = 'green',
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tooltip?: string;
  tone?: 'green' | 'blush' | 'blue';
}) {
  const toneClass = {
    green: 'bg-[#E7F4EC] text-[#185229] border-[#C8E4B0]',
    blush: 'bg-[#FFF5F4] text-[#8C1C5F] border-[#FEDBD8]',
    blue: 'bg-[#EDF4FF] text-[#3E73C4] border-[#B2D0FF]',
  }[tone];

  return (
    <section className="rounded-[28px] border border-[#F0EDD4] bg-white/85 p-5 shadow-[0_7px_0_#F0EDD4,0_18px_40px_rgba(57,118,61,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#666666]">
            {tooltip ? <LabelWithTooltip label={label} tooltip={tooltip} /> : label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-[#185229]">{value}</p>
        </div>
        <div className={`rounded-2xl border p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#666666]">{detail}</p>
    </section>
  );
}

function Explainer({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-2xl border border-[#F0EDD4] bg-[#FDFBF1] p-4 shadow-[0_4px_0_#F0EDD4]">
      <div className="flex items-center gap-2 text-sm font-black text-[#185229]">
        <CircleHelp className="h-4 w-4 text-[#39763D]" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#666666]">{children}</p>
    </div>
  );
}

function MarketCard({ market }: { market: PurintaSnapshot['markets'][number] }) {
  const utilization = Math.min(100, Math.max(0, numberValue(market.utilization)));
  const borrow = numberValue(market.borrow_usdc);
  const supply = numberValue(market.supply_usdc);
  const mascotTone = market.collateral_symbol.toUpperCase().includes('PEPE') ? 'bg-[#E7F4EC]' : 'bg-[#FFF5F4]';

  return (
    <article className="rounded-[32px] border border-[#E5E1BE] bg-[#FCFBF5]/95 p-5 shadow-[0_8px_0_#D6D2B2,0_22px_50px_rgba(51,51,51,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-[#C8E4B0] ${mascotTone} text-xl font-black text-[#185229] shadow-[0_4px_0_#C8E4B0]`}
          >
            <TokenLogo symbol={market.collateral_symbol} className="h-10 w-10" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#39763D]">Meme collateral market</p>
            <h2 className="mt-2 text-2xl font-black text-[#185229]">{market.name}</h2>
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm leading-6 text-[#666666]">
              Borrow <TokenLogo symbol="USDC" className="h-5 w-5" /> USDC using{' '}
              <TokenLogo symbol={market.collateral_symbol} className="h-5 w-5" /> {market.collateral_symbol} collateral.
              LLTV is the maximum loan-to-value before the position becomes risky.
            </p>
          </div>
        </div>
        <div className="w-fit rounded-full border border-[#FEDBD8] bg-[#FFF5F4] px-3 py-1 text-xs font-black text-[#8C1C5F] shadow-[0_3px_0_#FEDBD8]">
          <LabelWithTooltip
            label={`LLTV ${pct(market.lltv)}`}
            tooltip="LLTV is the highest loan-to-value allowed by this market. A 62.5% LLTV means each $100 of collateral can support up to $62.50 of debt before buffers."
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        <div className="rounded-2xl border border-[#F0EDD4] bg-white p-4">
          <p className="font-semibold text-[#666666]">
            <LabelWithTooltip
              label="Borrowed now"
              tooltip="USDC that has already been drawn by borrowers in this market."
            />
          </p>
          <p className="mt-1 text-lg font-black text-[#185229]">${money(borrow, 2)}</p>
        </div>
        <div className="rounded-2xl border border-[#F0EDD4] bg-white p-4">
          <p className="font-semibold text-[#666666]">
            <LabelWithTooltip
              label="Supplied liquidity"
              tooltip="Total USDC supplied to this Morpho market. Borrowers can draw from this pool."
            />
          </p>
          <p className="mt-1 text-lg font-black text-[#185229]">${money(supply, 2)}</p>
        </div>
        <div className="rounded-2xl border border-[#F0EDD4] bg-white p-4">
          <p className="font-semibold text-[#666666]">
            <LabelWithTooltip
              label="Borrow APY"
              tooltip="Annualized rate borrowers are paying to borrow USDC from this market right now."
            />
          </p>
          <p className="mt-1 text-lg font-black text-[#39763D]">{pct(market.borrow_apy)}</p>
        </div>
        <div className="rounded-2xl border border-[#F0EDD4] bg-white p-4">
          <p className="font-semibold text-[#666666]">
            <LabelWithTooltip
              label="Net supply APY"
              tooltip="Annualized rate suppliers earn after market-level effects. This is not a guaranteed return."
            />
          </p>
          <p className="mt-1 text-lg font-black text-[#3E73C4]">{pct(market.net_supply_apy)}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#C8E4B0] bg-[#E7F4EC] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-black text-[#185229]">
            <LabelWithTooltip
              label="Utilization"
              tooltip="Borrowed USDC divided by supplied USDC. Higher utilization can mean less available liquidity and higher rates."
            />
          </span>
          <span className="font-black text-[#185229]">{pct(market.utilization)}</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-[#C8E4B0]">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-[#39763D] via-[#57A053] to-[#3E73C4]"
            style={{ width: `${utilization}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-[#498746]">
          Utilization means how much of the supplied USDC is currently borrowed. Higher utilization usually means higher
          rates and less available liquidity.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm text-[#39763D] sm:flex-row sm:flex-wrap">
        <a
          className="inline-flex items-center gap-1 rounded-full border border-[#C8E4B0] bg-white px-3 py-1.5 font-semibold shadow-[0_3px_0_#C8E4B0] hover:bg-[#E7F4EC]"
          href={`https://etherscan.io/token/${market.collateral_address}`}
          target="_blank"
          rel="noreferrer"
        >
          <TokenLogo symbol={market.collateral_symbol} className="h-5 w-5" /> {market.collateral_symbol} token{' '}
          {shortAddress(market.collateral_address)} <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          className="inline-flex items-center gap-1 rounded-full border border-[#C8E4B0] bg-white px-3 py-1.5 font-semibold shadow-[0_3px_0_#C8E4B0] hover:bg-[#E7F4EC]"
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
      <main
        className="min-h-screen overflow-hidden text-[#333333]"
        style={{
          background:
            'radial-gradient(circle at 50% -10%, rgba(241,252,203,0.86), transparent 34%), radial-gradient(circle at 10% 20%, rgba(231,244,236,0.95), transparent 28%), radial-gradient(circle at 88% 8%, rgba(254,219,216,0.80), transparent 30%), #FCFBF5',
        }}
      >
        <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-[#F1FCCB]/70 to-transparent" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:px-8">
          <header className="rounded-[36px] border border-[#E5E1BE] bg-[#FCFBF5]/90 p-5 shadow-[0_10px_0_#D6D2B2,0_30px_70px_rgba(57,118,61,0.12)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#C8E4B0] bg-[#E7F4EC] px-3 py-1.5 text-xs font-black text-[#185229] shadow-[0_4px_0_#C8E4B0]">
                    <RadioTower className="h-3.5 w-3.5" /> Purinta live market monitor
                  </div>
                  <StatusPill status={status} />
                </div>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.28em] text-[#39763D]">
                  Deposit memes, print USDC
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-[#185229] sm:text-6xl">
                  How much USDC is borrowed against Purinta meme collateral?
                </h1>
                <p className="mt-4 flex flex-wrap items-center gap-1.5 text-base leading-7 text-[#4C4C4C] sm:text-lg">
                  A simple view of Purinta's <TokenLogo symbol="PEPE" className="h-6 w-6" /> PEPE and{' '}
                  <TokenLogo symbol="SPX" className="h-6 w-6" /> SPX markets on Morpho. It shows current{' '}
                  <TokenLogo symbol="USDC" className="h-6 w-6" /> USDC borrow demand, available liquidity, APYs, and
                  whether the live feed is connected.
                </p>
              </div>
              <div className="rounded-[28px] border border-[#FEDBD8] bg-[#FFF5F4] p-4 text-sm text-[#666666] shadow-[0_7px_0_#FEDBD8] lg:min-w-72">
                <p className="font-semibold text-[#8C1C5F]">Last data refresh</p>
                <p className="mt-1 font-black text-[#333333]">{formatTime(snapshot.fetched_at)}</p>
                <p className="mt-4 font-semibold text-[#8C1C5F]">Ethereum block checked</p>
                <p className="mt-1 font-black text-[#333333]">{snapshot.block_number?.toLocaleString() ?? 'Syncing'}</p>
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Borrowed now"
              value={`$${money(snapshot.total_borrow_usdc, 2)}`}
              detail="Total USDC borrowed from PEPE and SPX collateral markets."
              icon={Wallet}
              tooltip="The live total of USDC debt across the tracked Purinta PEPE and SPX Morpho markets."
              tone="green"
            />
            <StatCard
              label="Supplied liquidity"
              value={`$${money(snapshot.total_supply_usdc, 2)}`}
              detail="USDC currently supplied to those two markets."
              icon={Coins}
              tooltip="The size of the USDC supply pools backing the tracked Purinta markets."
              tone="green"
            />
            <StatCard
              label="Available liquidity"
              value={`$${money(totals.availableLiquidity, 2)}`}
              detail="Supplied USDC that has not been borrowed yet."
              icon={DatabaseZap}
              tooltip="A simple liquidity estimate: supplied USDC minus borrowed USDC."
              tone="blue"
            />
            <StatCard
              label="Average borrow APY"
              value={pct(snapshot.weighted_borrow_apy)}
              detail="Borrow-rate average weighted by market borrow size."
              icon={LineChart}
              tooltip="Each market's borrow APY weighted by how much USDC is borrowed there."
              tone="blush"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="grid gap-4">
              {snapshot.markets.length === 0 ? (
                <section className="rounded-[28px] border border-[#F0EDD4] bg-white/80 p-6 text-[#666666] shadow-[0_7px_0_#F0EDD4]">
                  Waiting for the first live market snapshot.
                </section>
              ) : (
                snapshot.markets.map((market) => <MarketCard key={market.id} market={market} />)
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <section className="rounded-[28px] border border-[#F0EDD4] bg-white/85 p-5 shadow-[0_7px_0_#F0EDD4]">
                <div className="flex items-center gap-3 text-[#185229]">
                  <ShieldCheck className="h-5 w-5" />
                  <h2 className="text-lg font-black">What to watch</h2>
                </div>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between gap-3 border-b border-[#F0EDD4] pb-3">
                    <dt className="font-semibold text-[#666666]">
                      <LabelWithTooltip
                        label="Most borrowed market"
                        tooltip="The tracked market with the largest outstanding USDC borrow amount."
                      />
                    </dt>
                    <dd className="font-black text-[#185229]">{totals.highestBorrow?.name ?? 'Waiting'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-[#F0EDD4] pb-3">
                    <dt className="font-semibold text-[#666666]">
                      <LabelWithTooltip
                        label="Overall utilization"
                        tooltip="Total borrowed USDC divided by total supplied USDC across PEPE and SPX."
                      />
                    </dt>
                    <dd className="font-black text-[#185229]">{pct(totals.utilization)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-[#F0EDD4] pb-3">
                    <dt className="font-semibold text-[#666666]">Tracked markets</dt>
                    <dd className="font-black text-[#185229]">{snapshot.markets.length}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-[#666666]">
                      <LabelWithTooltip
                        label="Data source"
                        tooltip="Market balances and APYs come from Morpho Blue API. Ethereum block height comes from JSON-RPC."
                      />
                    </dt>
                    <dd className="font-black text-[#185229]">Morpho Blue</dd>
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

              <section className="rounded-[28px] border border-[#B2D0FF] bg-[#EDF4FF] p-5 text-sm text-[#666666] shadow-[0_7px_0_#B2D0FF]">
                <div className="flex items-center gap-3 text-[#3E73C4]">
                  <Gauge className="h-5 w-5" />
                  <h2 className="text-lg font-black">Contracts</h2>
                </div>
                <div className="mt-4 space-y-2 text-sm font-semibold text-[#3E73C4]">
                  <a
                    className="block hover:text-[#185229]"
                    href={`https://etherscan.io/address/${snapshot.vault_address}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Purinta vault {shortAddress(snapshot.vault_address)}
                  </a>
                  <a
                    className="block hover:text-[#185229]"
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
