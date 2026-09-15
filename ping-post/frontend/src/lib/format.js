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

export const hourLabel = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

/**
 * Named reporting periods, as a {from, to} pair each. Weeks start on
 * Sunday and everything is computed in local time, matching how the
 * team reads "today" -- the backend snapshot uses the same boundaries.
 */
export const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'wtd', label: 'Week To Date' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'mtd', label: 'Month To Date' },
  { key: 'last_month', label: 'Last Month' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
]

// Local calendar date. isoDay() goes through UTC, which turns a local
// midnight into the previous day anywhere east of Greenwich.
const localDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function periodRange(key) {
  const today = new Date()
  const isoDay = localDay
  const shift = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
  const weekStart = shift(today, -today.getDay())
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonthEnd = shift(monthStart, -1)
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1)

  switch (key) {
    case 'today': return { from: isoDay(today), to: isoDay(today) }
    case 'yesterday': return { from: isoDay(shift(today, -1)), to: isoDay(shift(today, -1)) }
    case 'wtd': return { from: isoDay(weekStart), to: isoDay(today) }
    case 'last_week': return { from: isoDay(shift(weekStart, -7)), to: isoDay(shift(weekStart, -1)) }
    case 'mtd': return { from: isoDay(monthStart), to: isoDay(today) }
    case 'last_month': return { from: isoDay(lastMonthStart), to: isoDay(lastMonthEnd) }
    case '7d': return { from: daysAgo(6), to: isoDay(today) }
    case '30d': return { from: daysAgo(29), to: isoDay(today) }
    default: return null
  }
}

/** Which named period a {from, to} pair is, or 'custom'. */
export const periodKeyFor = ({ from, to }) =>
  PERIODS.find((p) => { const r = periodRange(p.key); return r.from === from && r.to === to })?.key ?? 'custom'

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
