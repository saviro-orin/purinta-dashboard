import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { LiveStatusRow, LltvBadge, MetricLabel, TokenLogo, UtilizationBar } from '../components/ui';
import { compactMoney, numberValue, pct, shortAddress, smartMoney } from '../lib/format';
import { usePurintaSnapshots } from '../realtime/use-purinta-snapshots';
import { Link } from '../router';
import type { PurintaMarket, PurintaSnapshot } from '../types';

function MarketCard({ market }: { market: PurintaMarket }) {
  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-[0_5px_0_var(--color-line)]">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-mint-line bg-mint">
          <TokenLogo symbol={market.collateral_symbol} className="h-8 w-8" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-ink">
            <Link
              href={`/market/${market.id}`}
              className="inline-flex items-center gap-0.5 rounded-md hover:text-leaf focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
            >
              {market.name}
              <ChevronRight className="h-4 w-4 text-leaf" aria-hidden />
            </Link>
          </h3>
          <p className="text-sm text-muted">Borrow USDC against {market.collateral_symbol}</p>
        </div>
        <span className="ml-auto">
          <LltvBadge lltv={pct(market.lltv, 1)} />
        </span>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        <div>
          <dt>
            <MetricLabel label="Borrowed" tooltip="USDC already drawn by borrowers in this market." />
          </dt>
          <dd className="mt-0.5 text-lg font-black text-ink">${smartMoney(market.borrow_usdc)}</dd>
        </div>
        <div>
          <dt>
            <MetricLabel label="Supplied" tooltip="Total USDC supplied to this Morpho market." />
          </dt>
          <dd className="mt-0.5 text-lg font-black text-ink">${smartMoney(market.supply_usdc)}</dd>
        </div>
        <div>
          <dt>
            <MetricLabel label="Borrow APY" tooltip="Annualized rate borrowers are paying right now." />
          </dt>
          <dd className="mt-0.5 text-lg font-black text-leaf">{pct(market.borrow_apy)}</dd>
        </div>
        <div>
          <dt>
            <MetricLabel
              label="Net supply APY"
              tooltip="Annualized rate suppliers earn after market-level effects. Not guaranteed."
            />
          </dt>
          <dd className="mt-0.5 text-lg font-black text-usdc">{pct(market.net_supply_apy)}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <MetricLabel label="Utilization" tooltip="Borrowed USDC divided by supplied USDC." />
          <span className="text-sm font-black text-ink">{pct(market.utilization, 1)}</span>
        </div>
        <div className="mt-2">
          <UtilizationBar value={numberValue(market.utilization)} />
        </div>
      </div>

      <footer className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm font-semibold text-leaf">
        <Link className="inline-flex items-center gap-1 hover:text-ink" href={`/market/${market.id}`}>
          History <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
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
    </article>
  );
}

export default function Home({ snapshot: initialSnapshot }: { snapshot: PurintaSnapshot }) {
  const { snapshot, status } = usePurintaSnapshots<PurintaSnapshot>(initialSnapshot);

  const totals = useMemo(() => {
    const totalBorrow = numberValue(snapshot.total_borrow_usdc);
    const totalSupply = numberValue(snapshot.total_supply_usdc);
    const utilization = totalSupply === 0 ? 0 : (totalBorrow / totalSupply) * 100;
    const availableLiquidity = Math.max(0, totalSupply - totalBorrow);

    return { totalBorrow, totalSupply, utilization, availableLiquidity };
  }, [snapshot]);

  /* Derive the collateral list from the snapshot so the tagline never drifts
     from the markets actually tracked in server/markets.ts. */
  const collateralSummary = useMemo(() => {
    const symbols = snapshot.markets.map((market) => market.collateral_symbol);
    return symbols.length === 0 ? null : new Intl.ListFormat('en-US').format(symbols);
  }, [snapshot.markets]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Purinta markets</h1>
            <p className="mt-2 max-w-xl text-base leading-6 text-muted">
              {collateralSummary
                ? `Live USDC borrowing against ${collateralSummary} collateral on Morpho.`
                : 'Live USDC borrowing on Morpho.'}
            </p>
          </div>
          <LiveStatusRow snapshot={snapshot} status={status} />
        </header>

        {/* One summary panel instead of four equal tiles: the headline number leads,
            the derived stats support, and the bar shows overall utilization at a glance. */}
        <section
          aria-label="Totals"
          className="rounded-3xl border border-mint-line bg-mint p-5 shadow-[0_5px_0_var(--color-mint-line)] sm:p-6"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <MetricLabel label="Borrowed now" tooltip="Total USDC debt across the tracked Purinta markets." />
              <p className="mt-1 text-4xl font-black tracking-tight text-ink sm:text-5xl">
                ${compactMoney(snapshot.total_borrow_usdc)}
              </p>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <dt>
                  <MetricLabel
                    label="Supplied"
                    tooltip="USDC deposited into the tracked Morpho markets and available to lend."
                  />
                </dt>
                <dd className="mt-0.5 text-xl font-black text-ink">${compactMoney(snapshot.total_supply_usdc)}</dd>
              </div>
              <div>
                <dt>
                  <MetricLabel label="Available" tooltip="Supplied USDC not yet borrowed." />
                </dt>
                <dd className="mt-0.5 text-xl font-black text-ink">${compactMoney(totals.availableLiquidity)}</dd>
              </div>
              <div>
                <dt>
                  <MetricLabel
                    label="Avg borrow APY"
                    tooltip="Each market's borrow APY weighted by how much USDC is borrowed there."
                  />
                </dt>
                <dd className="mt-0.5 text-xl font-black text-ink">{pct(snapshot.weighted_borrow_apy)}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <MetricLabel label="Utilization" tooltip="Borrowed USDC divided by supplied USDC, across all markets." />
              <span className="text-sm font-black text-ink">{pct(totals.utilization, 1)}</span>
            </div>
            <div className="mt-2">
              <UtilizationBar value={totals.utilization} track="bg-white" />
            </div>
          </div>
        </section>

        <section aria-label="Markets" className="grid gap-4 lg:grid-cols-2">
          {snapshot.markets.length === 0 ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-muted shadow-[0_5px_0_var(--color-line)] lg:col-span-2">
              Waiting for the first live market snapshot. New data arrives about every 30 seconds.
            </div>
          ) : (
            snapshot.markets.map((market) => <MarketCard key={market.id} market={market} />)
          )}
        </section>

        <footer className="flex flex-col gap-2 border-t border-line pt-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Live rates and balances from the Morpho API, refreshed about every 30 seconds. On-chain events are indexed
            directly from Ethereum.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 font-semibold text-leaf">
            <a
              className="inline-flex items-center gap-1 hover:text-ink"
              href={`https://etherscan.io/address/${snapshot.vault_address}`}
              target="_blank"
              rel="noreferrer"
            >
              Purinta vault {shortAddress(snapshot.vault_address)} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
            <a
              className="inline-flex items-center gap-1 hover:text-ink"
              href={`https://etherscan.io/address/${snapshot.morpho_blue}`}
              target="_blank"
              rel="noreferrer"
            >
              Morpho Blue {shortAddress(snapshot.morpho_blue)} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
