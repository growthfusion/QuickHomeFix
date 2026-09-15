import { clsx } from 'clsx'
import { signClass } from '../lib/format.js'

/**
 * Panel: a titled box with an icon header, as in the source screens.
 * Everything on a page lives in one of these, so the eye always knows
 * where a region starts and stops.
 */
export function Panel({ title, icon: Icon, actions, children, className, bodyClass }) {
  return (
    <div className={clsx('flex flex-col rounded-sm border border-grid bg-white', className)}>
      {title && (
        <div className="flex h-[27px] shrink-0 items-center gap-1.5 border-b border-grid bg-chrome px-2">
          {Icon && <Icon size={12} className="text-text-secondary" />}
          <span className="text-[12px] font-medium text-text-primary">{title}</span>
          {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className={clsx('min-h-0 flex-1', bodyClass)}>{children}</div>
    </div>
  )
}

/** Toolbar strip above a table: filters on the left, actions on the right. */
export function Toolbar({ children, actions }) {
  return (
    <div className="flex h-[32px] shrink-0 flex-wrap items-center gap-1.5 border-b border-grid bg-chrome px-2">
      {children}
      {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
    </div>
  )
}

export function ToolButton({ icon: Icon, children, onClick, disabled, title, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'flex h-[23px] items-center gap-1.5 rounded-sm border px-2 text-[11.5px] transition-colors disabled:opacity-40',
        primary
          ? 'border-primary bg-primary text-white hover:bg-primary-hover'
          : 'border-grid bg-white text-text-primary hover:bg-chrome-hover',
      )}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  )
}

export const selectCls =
  'h-[23px] rounded-sm border border-grid bg-white px-1.5 text-[11.5px] ' +
  'text-text-primary outline-none hover:border-text-muted focus:border-primary'

/**
 * Compact metric tile for the dashboard KPI strip.
 * `tone` accents the figure: teal for revenue, red only for real losses.
 */
export function Kpi({ label, value, sub, tone = 'neutral', provisional, size = 'md' }) {
  return (
    <div className={clsx(
      'flex flex-col justify-center border-r border-grid last:border-r-0',
      size === 'lg' ? 'px-5 py-3.5' : 'px-3 py-1.5',
    )}>
      <div className="flex items-center gap-1">
        <span className={clsx(
          'font-medium uppercase tracking-wide text-text-muted',
          size === 'lg' ? 'text-[11px]' : 'text-[10px]',
        )}>
          {label}
        </span>
        {provisional && (
          <span
            title="Provisional: awaiting confirmation that LeadProsper distinguishes accepted from sold"
            className="rounded-sm bg-accent-light px-1 text-[8.5px] font-semibold uppercase text-accent-hover ring-1 ring-accent/30"
          >
            prov
          </span>
        )}
      </div>
      <div
        className={clsx(
          'tnum mt-0.5 font-semibold leading-tight tracking-tight',
          size === 'lg' ? 'text-[30px]' : 'text-[17px]',
          tone === 'gain' && 'text-primary',
          tone === 'negative' && 'text-loss',
          (tone === 'neutral' || tone === 'loss') && 'text-text-primary',
        )}
      >
        {value}
      </div>
      {sub && <div className="tnum text-[10.5px] leading-tight text-text-muted">{sub}</div>}
    </div>
  )
}

export function Money({ value, cents = false, signed = false, className }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value ?? 0)

  return (
    <span className={clsx('tnum', signed && signClass(value), className)}>
      {formatted}
    </span>
  )
}

/** Record name that opens a detail view. Blue, as in the source screens. */
export function RecordLink({ onClick, children }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="app-link text-left"
    >
      {children}
    </button>
  )
}

export function Badge({ children, className, title }) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center rounded-sm px-1 py-px text-[9.5px] font-medium uppercase tracking-wide ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Marks a figure a manual adjustment has replaced, or tried to.
 *
 * The distinction matters more than it looks: `applied` means the number
 * shown IS the override; `partial_override` means the query window only
 * partly covered the override period, so the SYNCED value is shown
 * instead. Showing either silently would misreport money.
 */
export function AdjustmentMark({ adjustment, syncedValue }) {
  if (!adjustment) return null

  if (adjustment.partial_override) {
    return (
      <Badge
        className="ml-1 bg-accent-light text-accent-hover ring-accent/30"
        title={`An override of ${adjustment.value} exists for ${adjustment.period}, but the selected range only partly covers it. Showing the synced value. Widen the date range to apply it.`}
      >
        partial
      </Badge>
    )
  }

  return (
    <Badge
      className="ml-1 bg-primary-light text-primary ring-primary/25"
      title={`Manual override by ${adjustment.by} for ${adjustment.period}. Synced value was ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(syncedValue)}.`}
    >
      adj
    </Badge>
  )
}

/** Page title strip, sitting directly under the tab bar. */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between gap-4 px-1 pb-2">
      <div>
        <h1 className="font-display text-[15px] font-semibold leading-tight tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[11.5px] text-text-muted">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  )
}

/** Thin alias so pages not yet converted to Panel keep working. */
export function Card({ className, children, ...rest }) {
  return (
    <div className={clsx('rounded-sm border border-grid bg-white', className)} {...rest}>
      {children}
    </div>
  )
}

export function Empty({ children = 'No records match the current filters.' }) {
  return (
    <div className="px-3 py-10 text-center text-[12px] text-text-muted">{children}</div>
  )
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-10 text-[12px] text-text-muted">
      <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-grid border-t-primary" />
      {label}…
    </div>
  )
}

/**
 * Surfaces a failed request rather than letting it look like no data.
 *
 * A rate limit gets its own wording: it is temporary and the user's
 * next action is to wait, which "Request failed" would not tell them.
 */
export function ErrorState({ error, onRetry }) {
  const rateLimited = error?.status === 429
  // Two ways the backend being down reaches us: a bare TypeError when
  // the browser calls it directly, or a bodyless 502 when the dev proxy
  // cannot reach it. Both mean "start the API", which is far more use
  // than echoing "Failed to fetch".
  const offline =
    error?.offline === true ||
    (!error?.status && /failed to fetch|networkerror|load failed/i.test(error?.message ?? ''))

  const title = rateLimited ? 'LeadProsper rate limit reached'
    : offline ? 'Cannot reach the API'
    : 'Could not load data'

  const detail = rateLimited
    ? 'The account allows 100 API requests per minute. Wait a moment and try again.'
    : offline
      ? 'The backend is not responding. Start it with "npm run dev" from the ping-post folder, then retry.'
      : error?.message ?? 'Unknown error'

  return (
    <div className="px-4 py-8 text-center">
      <div className="text-[12.5px] font-medium text-loss">{title}</div>
      <div className="mx-auto mt-1 max-w-[460px] text-[11.5px] leading-relaxed text-text-secondary">
        {detail}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 h-[23px] rounded-sm border border-grid bg-white px-2.5 text-[11.5px] text-text-primary hover:bg-chrome-hover"
        >
          Retry
        </button>
      )}
    </div>
  )
}

/** Wraps a panel body: spinner, error, or content. */
export function AsyncBody({ loading, error, onRetry, children, label }) {
  if (loading) return <Loading label={label} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  return children
}
