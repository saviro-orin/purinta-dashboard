export function numberValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const next = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(next) ? next : 0;
}

export function money(value: string | number | null | undefined, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(numberValue(value));
}

/* Headline tiles trade decimals for glanceability; exact figures live in the market cards. */
export function compactMoney(value: string | number | null | undefined): string {
  const amount = numberValue(value);
  if (amount < 100_000) return smartMoney(amount);
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);
}

/* Cents are only information when the number is small: $657.22 keeps them, $100,000.28 doesn't. */
export function smartMoney(value: string | number | null | undefined): string {
  const amount = numberValue(value);
  return money(amount, Math.abs(amount) < 1_000 ? 2 : 0);
}

export function pct(value: string | number | null | undefined, digits = 2): string {
  return `${money(value, digits)}%`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatTime(value: string | null): string {
  if (!value) return 'waiting for first snapshot';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
