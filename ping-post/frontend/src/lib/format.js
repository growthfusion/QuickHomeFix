// Money is the whole point of this dashboard, so formatting is centralised
// -- a figure rendered two different ways on two pages reads as two
// different numbers.

export const usd = (n, { cents = false } = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n ?? 0)

export const num = (n) => new Intl.NumberFormat('en-US').format(n ?? 0)

export const pct = (n) => `${(n ?? 0).toFixed(1)}%`

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const fullDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

export const dateTime = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

export const isoDay = (d) => d.toISOString().slice(0, 10)

export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoDay(d)
}

// Profit is the one figure that is meaningfully signed -- red when we
// lost money on a slice, green when we made it.
export const signClass = (n) =>
  n > 0 ? 'text-gain' : n < 0 ? 'text-loss' : 'text-text-muted'

/**
 * Compact axis label. Rounding to whole thousands collapsed 1500 and 2000
 * to the same "$2k", producing duplicate axis ticks -- so keep one decimal
 * below 10k where the ambiguity actually shows.
 */
export function axisMoney(v) {
  if (v === 0) return '$0'
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 10_000) return `$${Math.round(v / 1000)}k`
  if (abs >= 1_000) return `$${(v / 1000).toFixed(1)}k`
  return `$${Math.round(v)}`
}

export const STATUS_STYLE = {
  sold:     'bg-primary-light text-primary ring-primary/25',
  rejected: 'bg-error/10 text-loss ring-error/20',
  returned: 'bg-accent-light text-accent-hover ring-accent/30',
  pending:  'bg-border-light text-text-muted ring-border',
}
