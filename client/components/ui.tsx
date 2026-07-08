import { formatTime } from '../lib/format';
import type { PurintaSnapshot } from '../types';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

function ExplainerContent({ children }: { children: string }) {
  return (
    <TooltipContent className="max-w-72 rounded-xl border border-mint-line bg-ink px-3 py-2 text-sm leading-5 text-cream">
      {children}
    </TooltipContent>
  );
}

/* Labels explain themselves: when a tooltip exists, the label itself is the
   trigger (dotted underline) instead of a separate `?` icon crowding the data. */
export function MetricLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  if (!tooltip) {
    return <span className="text-sm font-medium text-muted">{label}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help rounded-sm text-sm font-medium text-muted underline decoration-muted/40 decoration-dotted underline-offset-4 hover:decoration-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
        >
          {label}
        </button>
      </TooltipTrigger>
      <ExplainerContent>{tooltip}</ExplainerContent>
    </Tooltip>
  );
}

export function LltvBadge({ lltv }: { lltv: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 cursor-help items-center gap-1 whitespace-nowrap rounded-full border border-blush-line bg-blush px-3 py-1 text-xs font-bold text-blush-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
        >
          LLTV {lltv}
        </button>
      </TooltipTrigger>
      <ExplainerContent>
        {`Liquidation loan-to-value: positions borrowing more than ${lltv} of their collateral's value can be liquidated.`}
      </ExplainerContent>
    </Tooltip>
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
  /* Connecting is a normal transient state; only a dropped connection reads as a warning. */
  const tone = live
    ? 'border-mint-line bg-mint text-ink'
    : waiting
      ? 'border-line bg-white text-muted'
      : 'border-blush-line bg-blush text-blush-ink';
  const dot = live ? 'animate-slow-pulse bg-leaf' : waiting ? 'animate-slow-pulse bg-muted' : 'bg-blush-ink';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

/* Only surface the lag count once the indexer is meaningfully behind:
   ~1 hour of Ethereum blocks (12s each). Below that, "catching up" says enough. */
const LAG_DISPLAY_THRESHOLD_BLOCKS = 300;

const EVENT_SYNC_TONE: Record<PurintaSnapshot['event_sync']['status'], string> = {
  live: 'border-mint-line bg-mint text-ink',
  syncing: 'border-usdc-line bg-usdc-soft text-ink',
  error: 'border-blush-line bg-blush text-blush-ink',
  /* Unknown and disabled are neutral facts, not warnings. */
  disabled: 'border-line bg-white text-muted',
  unknown: 'border-line bg-white text-muted',
};

const EVENT_SYNC_LABEL: Record<PurintaSnapshot['event_sync']['status'], string> = {
  live: 'Event ledger live',
  syncing: 'Event ledger catching up',
  error: 'Event ledger needs attention',
  disabled: 'Event ledger off',
  unknown: 'Event ledger checking',
};

const EVENT_SYNC_DOT: Record<PurintaSnapshot['event_sync']['status'], string> = {
  live: 'bg-leaf',
  syncing: 'animate-slow-pulse bg-usdc',
  error: 'bg-blush-ink',
  disabled: 'bg-muted',
  unknown: 'animate-slow-pulse bg-muted',
};

/* Connection state, data freshness, and chain position in one line, shared by every page. */
export function LiveStatusRow({ snapshot, status }: { snapshot: PurintaSnapshot; status: string }) {
  const eventSync = snapshot.event_sync;
  const farBehind =
    eventSync.status === 'syncing' &&
    eventSync.lag_blocks !== null &&
    eventSync.lag_blocks > LAG_DISPLAY_THRESHOLD_BLOCKS;
  /* Details only when something needs explaining; a healthy pill speaks for itself. */
  const detail = eventSync.status === 'error' || farBehind ? eventSync.message : null;

  const pillClass = `inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${EVENT_SYNC_TONE[eventSync.status]}`;
  const pillContent = (
    <>
      <span className={`h-2 w-2 rounded-full ${EVENT_SYNC_DOT[eventSync.status]}`} aria-hidden />
      {EVENT_SYNC_LABEL[eventSync.status]}
      {farBehind ? <span>{eventSync.lag_blocks?.toLocaleString()} blocks behind</span> : null}
    </>
  );

  return (
    <div className="flex flex-col items-start gap-1 text-sm text-muted sm:items-end">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:justify-end">
        <StatusPill status={status} />
        <span>Updated {formatTime(snapshot.fetched_at)}</span>
        <span aria-hidden>·</span>
        <span>Block {snapshot.block_number?.toLocaleString() ?? 'syncing'}</span>
      </div>
      {detail === null ? (
        <span className={pillClass}>{pillContent}</span>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`cursor-help focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${pillClass}`}
            >
              {pillContent}
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-80 rounded-xl border border-mint-line bg-ink px-3 py-2 text-sm leading-5 text-cream">
            {detail}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

/* Tones follow the series colors used everywhere else: green = borrow side, blue = supply side. */
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
  tone?: 'mint' | 'blue';
  tooltip?: string;
}) {
  const toneClass = {
    mint: 'border-mint-line bg-mint shadow-[0_4px_0_var(--color-mint-line)]',
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

export function UtilizationBar({ value, track = 'bg-mint' }: { value: number; track?: string }) {
  const utilization = Math.min(100, Math.max(0, value));

  return (
    <div className={`h-2.5 rounded-full ${track}`} role="presentation">
      <div className="h-2.5 rounded-full bg-leaf" style={{ width: `${utilization}%` }} />
    </div>
  );
}
