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
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(numberValue(value));
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

function MiniMetric({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">
        <LabelWithTooltip label={label} tooltip={tooltip} />
      </p>
      <p className="mt-1 text-base font-black text-[#185229]">{value}</p>
    </div>
  );
}

function UtilizationBar({ value }: { value: string }) {
  const utilization = Math.min(100, Math.max(0, numberValue(value)));

  return (
    <div className="min-w-36">
      <div className="flex items-center justify-between gap-3 text-xs font-black text-[#185229]">
        <span>{pct(value)}</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-[#C8E4B0]">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-[#39763D] via-[#57A053] to-[#3E73C4]"
          style={{ width: `${utilization}%` }}
        />
      </div>
    </div>
  );
}

function MarketTable({ markets }: { markets: PurintaSnapshot['markets'] }) {
  if (markets.length === 0) {
    return (
      <section className="rounded-[32px] border border-[#F0EDD4] bg-white/80 p-8 text-[#666666] shadow-[0_7px_0_#F0EDD4]">
        Waiting for the first live market snapshot.
      </section>
    );
  }

  return (
    <section className="rounded-[36px] border border-[#E5E1BE] bg-white/88 p-5 shadow-[0_9px_0_#D6D2B2,0_24px_60px_rgba(57,118,61,0.10)] sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#F0EDD4] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#39763D]">Tracked markets</p>
          <h2 className="mt-2 text-3xl font-black text-[#185229]">Market table</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#666666]">
            One row per collateral asset. This layout is easier to scan now and will scale as Purinta adds more markets.
          </p>
        </div>
        <div className="rounded-full border border-[#C8E4B0] bg-[#E7F4EC] px-4 py-2 text-sm font-black text-[#185229] shadow-[0_4px_0_#C8E4B0]">
          {markets.length} markets
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-xs font-black uppercase tracking-[0.16em] text-[#39763D]">
              <th className="rounded-l-2xl bg-[#FDFBF1] px-4 py-3">Market</th>
              <th className="bg-[#FDFBF1] px-4 py-3">
                <LabelWithTooltip
                  label="Borrowed"
                  tooltip="USDC that has already been drawn by borrowers in this market."
                />
              </th>
              <th className="bg-[#FDFBF1] px-4 py-3">
                <LabelWithTooltip label="Supply" tooltip="Total USDC supplied to this Morpho market." />
              </th>
              <th className="bg-[#FDFBF1] px-4 py-3">
                <LabelWithTooltip label="Utilization" tooltip="Borrowed USDC divided by supplied USDC." />
              </th>
              <th className="bg-[#FDFBF1] px-4 py-3">
                <LabelWithTooltip label="Borrow APY" tooltip="Annualized rate borrowers are paying right now." />
              </th>
              <th className="bg-[#FDFBF1] px-4 py-3">
                <LabelWithTooltip
                  label="Net supply APY"
                  tooltip="Annualized rate suppliers earn after market-level effects. Not guaranteed."
                />
              </th>
              <th className="bg-[#FDFBF1] px-4 py-3">
                <LabelWithTooltip
                  label="LLTV"
                  tooltip="Maximum loan-to-value allowed by this market before liquidation risk rises."
                />
              </th>
              <th className="rounded-r-2xl bg-[#FDFBF1] px-4 py-3">Links</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => (
              <tr key={market.id} className="align-middle">
                <td className="border-b border-[#F0EDD4] px-4 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#C8E4B0] bg-[#E7F4EC] shadow-[0_3px_0_#C8E4B0]">
                      <TokenLogo symbol={market.collateral_symbol} className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-base font-black text-[#185229]">{market.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#666666]">
                        Borrow <TokenLogo symbol="USDC" className="h-4 w-4" /> USDC with {market.collateral_symbol}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-[#F0EDD4] px-4 py-5 font-black text-[#185229]">
                  ${money(market.borrow_usdc, 2)}
                </td>
                <td className="border-b border-[#F0EDD4] px-4 py-5 font-black text-[#185229]">
                  ${money(market.supply_usdc, 2)}
                </td>
                <td className="border-b border-[#F0EDD4] px-4 py-5">
                  <UtilizationBar value={market.utilization} />
                </td>
                <td className="border-b border-[#F0EDD4] px-4 py-5 font-black text-[#39763D]">
                  {pct(market.borrow_apy)}
                </td>
                <td className="border-b border-[#F0EDD4] px-4 py-5 font-black text-[#3E73C4]">
                  {pct(market.net_supply_apy)}
                </td>
                <td className="border-b border-[#F0EDD4] px-4 py-5">
                  <span className="rounded-full border border-[#FEDBD8] bg-[#FFF5F4] px-3 py-1 text-xs font-black text-[#8C1C5F]">
                    {pct(market.lltv)}
                  </span>
                </td>
                <td className="border-b border-[#F0EDD4] px-4 py-5">
                  <div className="flex flex-col gap-2 text-sm font-semibold text-[#39763D]">
                    <a
                      className="inline-flex items-center gap-1 hover:text-[#185229]"
                      href={`https://app.morpho.org/market?id=${market.id}&network=mainnet`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Morpho <ArrowUpRight className="h-3 w-3" />
                    </a>
                    <a
                      className="inline-flex items-center gap-1 hover:text-[#185229]"
                      href={`https://etherscan.io/token/${market.collateral_address}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Token {shortAddress(market.collateral_address)} <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 rounded-[28px] border border-[#C8E4B0] bg-[#E7F4EC] p-5 sm:grid-cols-3">
        <MiniMetric
          label="How to read utilization"
          value="Borrowed ÷ supplied"
          tooltip="A quick liquidity pressure signal. Higher utilization means less idle USDC."
        />
        <MiniMetric
          label="How to read LLTV"
          value="Risk limit"
          tooltip="The maximum market loan-to-value. It is not a recommendation to borrow up to that level."
        />
        <MiniMetric
          label="How to read APY"
          value="Live annualized rate"
          tooltip="APYs move as market supply and borrow demand change."
        />
      </div>
    </section>
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

    return {
      totalBorrow,
      totalSupply,
      utilization,
      highestBorrow,
      availableLiquidity,
    };
  }, [snapshot]);

  return (
    <main
      className="min-h-screen overflow-hidden text-[#333333]"
      style={{
        background:
          'radial-gradient(circle at 50% -10%, rgba(241,252,203,0.86), transparent 34%), radial-gradient(circle at 10% 20%, rgba(231,244,236,0.95), transparent 28%), radial-gradient(circle at 88% 8%, rgba(254,219,216,0.80), transparent 30%), #FCFBF5',
      }}
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-[#F1FCCB]/70 to-transparent" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:gap-12 sm:px-6 sm:py-12 lg:px-8">
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

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

        <section className="space-y-10">
          <MarketTable markets={snapshot.markets} />

          <aside className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr_0.9fr]">
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
  );
}
