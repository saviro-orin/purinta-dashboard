import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { LiveStatusRow, LltvBadge, MetricLabel, TokenLogo, UtilizationBar } from '../components/ui';
import { compactMoney, numberValue, pct, shortAddress, smartMoney } from '../lib/format';
import { usePurintaSnapshots } from '../realtime/use-purinta-snapshots';
import { Link } from '../router';
import type { PurintaMarket, PurintaSnapshot } from '../types';

function marketChainName(market: PurintaMarket) {
  return market.chain_name ?? 'Ethereum';
}

function marketMorphoUrl(market: PurintaMarket) {
  return `https://app.morpho.org/market?id=${market.id}&network=${market.morpho_network ?? 'mainnet'}`;
}

function marketAssetAmount(market: PurintaMarket, side: 'borrow' | 'supply') {
  return side === 'borrow'
    ? (market.borrow_assets ?? market.borrow_usdc ?? '0')
    : (market.supply_assets ?? market.supply_usdc ?? '0');
}

function MarketTable({ markets }: { markets: PurintaMarket[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_5px_0_var(--color-line)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-line bg-mint/60 text-xs font-bold uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-3 py-3 sm:px-5">
                Market
              </th>
              <th scope="col" className="hidden px-3 py-3 md:table-cell">
                Chain
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Borrowed
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right lg:table-cell">
                Supplied
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right sm:table-cell">
                Borrow APY
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right xl:table-cell">
                Net supply APY
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right lg:table-cell">
                Utilization
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right md:table-cell">
                LLTV
              </th>
              <th scope="col" className="hidden w-16 px-3 py-3 text-right sm:table-cell sm:w-24 sm:px-5">
                <span className="sr-only sm:not-sr-only">Links</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {markets.map((market) => (
              <tr key={`${market.chain_id ?? 1}-${market.id}`} className="group transition-colors hover:bg-cream/70">
                <th scope="row" className="px-3 py-4 font-normal sm:px-5">
                  <Link
                    href={`/market/${market.chain_id ?? 1}/${market.id}`}
                    className="flex min-w-36 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-mint-line bg-mint">
                      <TokenLogo
                        symbol={market.collateral_symbol}
                        logoUrl={market.collateral_logo_url}
                        className="h-7 w-7"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-black text-ink hover:text-leaf">{market.name}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-muted md:hidden">
                        {marketChainName(market)}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-muted sm:hidden">
                        Supplied ${compactMoney(market.supply_usd)} · LLTV {pct(market.lltv, 1)}
                      </span>
                      <span className="block text-xs font-medium text-muted sm:hidden">
                        Util. {pct(market.utilization, 1)} · Net APY {pct(market.net_supply_apy)}
                      </span>
                    </span>
                  </Link>
                </th>
                <td className="hidden px-3 py-4 md:table-cell">
                  <span className="inline-flex whitespace-nowrap rounded-full border border-usdc-line bg-usdc-soft px-2.5 py-1 text-xs font-bold text-usdc">
                    {marketChainName(market)}
                  </span>
                </td>
                <td className="px-3 py-4 text-right">
                  <span className="block font-black text-ink">${compactMoney(market.borrow_usd)}</span>
                  <span className="hidden text-xs font-medium text-muted sm:block">
                    {smartMoney(marketAssetAmount(market, 'borrow'))} {market.loan_symbol}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-muted sm:hidden">
                    {pct(market.borrow_apy)} borrow APY
                  </span>
                </td>
                <td className="hidden px-3 py-4 text-right lg:table-cell">
                  <span className="block font-black text-ink">${compactMoney(market.supply_usd)}</span>
                  <span className="text-xs font-medium text-muted">
                    {smartMoney(marketAssetAmount(market, 'supply'))} {market.loan_symbol}
                  </span>
                </td>
                <td className="hidden px-3 py-4 text-right font-black text-leaf sm:table-cell">
                  {pct(market.borrow_apy)}
                </td>
                <td className="hidden px-3 py-4 text-right font-black text-usdc xl:table-cell">
                  {pct(market.net_supply_apy)}
                </td>
                <td className="hidden min-w-32 px-3 py-4 text-right lg:table-cell">
                  <span className="font-black text-ink">{pct(market.utilization, 1)}</span>
                  <span className="mt-2 block">
                    <UtilizationBar value={numberValue(market.utilization)} />
                  </span>
                </td>
                <td className="hidden px-3 py-4 text-right md:table-cell">
                  <LltvBadge lltv={pct(market.lltv, 1)} />
                </td>
                <td className="hidden px-3 py-4 text-right sm:table-cell sm:px-5">
                  <span className="inline-flex items-center justify-end gap-2">
                    <a
                      className="hidden rounded-md text-leaf hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf sm:inline-flex"
                      href={marketMorphoUrl(market)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${market.name} on Morpho`}
                    >
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </a>
                    <Link
                      className="inline-flex rounded-md text-leaf group-hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                      href={`/market/${market.chain_id ?? 1}/${market.id}`}
                      aria-label={`View ${market.name} history`}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </Link>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Home({ snapshot: initialSnapshot }: { snapshot: PurintaSnapshot }) {
  const { snapshot, status } = usePurintaSnapshots<PurintaSnapshot>(initialSnapshot);

  const totals = useMemo(() => {
    const totalBorrow = numberValue(snapshot.total_borrow_usd ?? snapshot.total_borrow_usdc);
    const totalSupply = numberValue(snapshot.total_supply_usd ?? snapshot.total_supply_usdc);
    const utilization = totalSupply === 0 ? 0 : (totalBorrow / totalSupply) * 100;
    const availableLiquidity = Math.max(0, totalSupply - totalBorrow);

    return { totalBorrow, totalSupply, utilization, availableLiquidity };
  }, [snapshot]);

  const collateralSummary = useMemo(() => {
    const symbols = snapshot.markets.map((market) => market.collateral_symbol);
    return symbols.length === 0 ? null : new Intl.ListFormat('en-US').format(symbols);
  }, [snapshot.markets]);

  const chainSummary = useMemo(() => {
    const names = [...new Set(snapshot.markets.map(marketChainName))];
    return names.length === 0 ? null : new Intl.ListFormat('en-US').format(names);
  }, [snapshot.markets]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Purinta markets</h1>
            <p className="mt-2 max-w-3xl text-base leading-6 text-muted">
              {collateralSummary && chainSummary
                ? `Live stablecoin borrowing against ${collateralSummary} collateral on Morpho across ${chainSummary}.`
                : 'Live stablecoin borrowing on Morpho.'}
            </p>
          </div>
          <LiveStatusRow snapshot={snapshot} status={status} />
        </header>

        <section
          aria-label="Totals"
          className="rounded-3xl border border-mint-line bg-mint p-5 shadow-[0_5px_0_var(--color-mint-line)] sm:p-6"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <MetricLabel
                label="Borrowed now"
                tooltip="Total USD value borrowed across the tracked Purinta markets."
              />
              <p className="mt-1 text-4xl font-black tracking-tight text-ink sm:text-5xl">
                ${compactMoney(totals.totalBorrow)}
              </p>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <dt>
                  <MetricLabel label="Supplied" tooltip="Total USD value supplied across the tracked Morpho markets." />
                </dt>
                <dd className="mt-0.5 text-xl font-black text-ink">${compactMoney(totals.totalSupply)}</dd>
              </div>
              <div>
                <dt>
                  <MetricLabel label="Available" tooltip="Supplied value not currently borrowed." />
                </dt>
                <dd className="mt-0.5 text-xl font-black text-ink">${compactMoney(totals.availableLiquidity)}</dd>
              </div>
              <div>
                <dt>
                  <MetricLabel
                    label="Avg borrow APY"
                    tooltip="Each market's borrow APY weighted by its current borrowed USD value."
                  />
                </dt>
                <dd className="mt-0.5 text-xl font-black text-ink">{pct(snapshot.weighted_borrow_apy)}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <MetricLabel
                label="Utilization"
                tooltip="Borrowed USD value divided by supplied USD value across all markets."
              />
              <span className="text-sm font-black text-ink">{pct(totals.utilization, 1)}</span>
            </div>
            <div className="mt-2">
              <UtilizationBar value={totals.utilization} track="bg-white" />
            </div>
          </div>
        </section>

        <section aria-labelledby="markets-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="markets-heading" className="text-xl font-black text-ink">
                Markets
              </h2>
              <p className="mt-1 text-sm text-muted">
                {snapshot.markets.length} markets across {new Set(snapshot.markets.map(marketChainName)).size} chains
              </p>
            </div>
          </div>
          {snapshot.markets.length === 0 ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-muted shadow-[0_5px_0_var(--color-line)]">
              Waiting for the first live market snapshot. New data arrives about every 30 seconds.
            </div>
          ) : (
            <MarketTable markets={snapshot.markets} />
          )}
        </section>

        <footer className="flex flex-col gap-3 border-t border-line pt-5 text-sm text-muted lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-1">
            <p>
              <strong className="font-black text-ink">Current market snapshot:</strong> balances, rates, and utilization
              refresh about every 30 seconds for every tracked chain.
            </p>
            <p>
              <strong className="font-black text-ink">Ethereum event ledger:</strong> market activity is indexed
              separately for durable history. The event status above currently covers Ethereum.
            </p>
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 font-semibold text-leaf lg:max-w-xl lg:justify-end">
            {(snapshot.deployments ?? []).map((deployment) => (
              <a
                key={deployment.chain_id}
                className="inline-flex items-center gap-1 hover:text-ink"
                href={deployment.morpho_url}
                target="_blank"
                rel="noreferrer"
              >
                {deployment.chain_name} vault {shortAddress(deployment.vault_address)}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ))}
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
