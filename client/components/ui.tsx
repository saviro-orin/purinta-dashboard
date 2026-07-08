import { CircleHelp } from 'lucide-react';
import { formatTime } from '../lib/format';
import type { PurintaSnapshot } from '../types';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

export function InfoTooltip({ label, children }: { label: string; children: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-leaf hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 rounded-xl border border-mint-line bg-ink px-3 py-2 text-sm leading-5 text-cream">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export function MetricLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-muted">
      {label}
      {tooltip ? <InfoTooltip label={`What is ${label}?`}>{tooltip}</InfoTooltip> : null}
    </span>
  );
}

export function TokenLogo({ symbol, className = 'h-8 w-8' }: { symbol: string; className?: string }) {
  const upper = symbol.toUpperCase();
  const src = upper.includes('PEPE')
    ? 'https://app.purinta.xyz/assets/Pepe-BV89tIWU.svg'
    : upper.includes('SPX')
      ? 'https://app.purinta.xyz/assets/Spx-BF2tRkT5.svg'
      : '/images/tokens/usdc.svg';

  return <img src={src} alt={`${symbol} logo`} className={`${className} rounded-full object-contain`} loading="lazy" />;
}

export function StatusPill({ status }: { status: string }) {
  const live = status === 'connected';
  const waiting = status === 'connecting';
  const label = live ? 'Live' : waiting ? 'Connecting' : 'Offline';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        live ? 'border-mint-line bg-mint text-ink' : 'border-blush-line bg-blush text-blush-ink'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${live ? 'animate-slow-pulse bg-leaf' : 'bg-blush-ink'}`} aria-hidden />
      {label}
    </span>
  );
}

/* Connection state, data freshness, and chain position in one line, shared by every page. */
export function LiveStatusRow({ snapshot, status }: { snapshot: PurintaSnapshot; status: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
      <StatusPill status={status} />
      <span>Updated {formatTime(snapshot.fetched_at)}</span>
      <span aria-hidden>·</span>
      <span>Block {snapshot.block_number?.toLocaleString() ?? 'syncing'}</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'mint',
  tooltip,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'mint' | 'blush' | 'blue';
  tooltip?: string;
}) {
  const toneClass = {
    mint: 'border-mint-line bg-mint shadow-[0_4px_0_var(--color-mint-line)]',
    blush: 'border-blush-line bg-blush shadow-[0_4px_0_var(--color-blush-line)]',
    blue: 'border-usdc-line bg-usdc-soft shadow-[0_4px_0_var(--color-usdc-line)]',
  }[tone];

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 ${toneClass}`}>
      <MetricLabel label={label} tooltip={tooltip} />
      <p className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
    </section>
  );
}

export function UtilizationBar({ value }: { value: number }) {
  const utilization = Math.min(100, Math.max(0, value));

  return (
    <div className="h-2.5 rounded-full bg-mint" role="presentation">
      <div className="h-2.5 rounded-full bg-leaf" style={{ width: `${utilization}%` }} />
    </div>
  );
}
