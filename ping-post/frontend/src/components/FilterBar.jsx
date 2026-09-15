import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { clsx } from 'clsx'
import { Filter, RotateCcw } from 'lucide-react'

import { useMeta } from '../lib/useMeta.jsx'
import { daysAgo, isoDay, periodRange } from '../lib/format.js'
import { Toolbar, ToolButton, selectCls } from './ui.jsx'

/**
 * Global filters, stored in the URL rather than React state.
 *
 * Every view is then shareable as a link and gets browser back/forward
 * for free -- which matters for a dashboard whose screenshots get pasted
 * into chats with a "why is this number different?" attached.
 */
export function useFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(
    () => ({
      from: params.get('from') ?? periodRange('mtd').from,
      to: params.get('to') ?? periodRange('mtd').to,
      campaign: params.get('campaign') ?? '',
      affiliate_id: params.get('affiliate_id') ?? '',
      buyer_id: params.get('buyer_id') ?? '',
      status: params.get('status') ?? '',
      vertical: params.get('vertical') ?? '',
    }),
    [params],
  )

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const setRange = (from, to) => {
    const next = new URLSearchParams(params)
    next.set('from', from)
    next.set('to', to)
    setParams(next, { replace: true })
  }

  // Several keys in one write: two successive set* calls would each
  // start from the same stale params and the second would undo the first.
  const setMany = (values) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }

  const reset = () => setParams(new URLSearchParams(), { replace: true })

  return { filters, setFilter, setRange, setMany, reset }
}

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7D', days: 6 },
  { label: '30D', days: 29 },
  { label: '90D', days: 89 },
  { label: '6M', days: 179 },
]

/**
 * Filter strip above every table. Mirrors the source screens' toolbar:
 * date presets, explicit range, then the entity dropdowns.
 */
export function FilterBar({ show = ['campaign', 'affiliate', 'buyer', 'status'] }) {
  const { filters, setFilter, setRange, reset } = useFilters()
  const meta = useMeta()
  const today = isoDay(new Date())

  const active = PRESETS.find(
    (p) => filters.from === daysAgo(p.days) && filters.to === today,
  )

  return (
    <Toolbar
      actions={
        <ToolButton icon={RotateCcw} onClick={reset} title="Clear all filters">
          Reset
        </ToolButton>
      }
    >
      <Filter size={12} className="text-text-muted" />

      <div className="flex overflow-hidden rounded-sm border border-grid">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setRange(daysAgo(p.days), today)}
            className={clsx(
              'h-[23px] border-r border-grid px-2 text-[11px] last:border-r-0 transition-colors',
              active?.label === p.label
                ? 'bg-primary-light font-medium text-primary'
                : 'bg-white text-text-secondary hover:bg-chrome-hover',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <input
        type="date"
        value={filters.from}
        max={filters.to}
        onChange={(e) => setFilter('from', e.target.value)}
        className={clsx(selectCls, 'tnum')}
      />
      <span className="text-[11px] text-text-muted">→</span>
      <input
        type="date"
        value={filters.to}
        min={filters.from}
        max={today}
        onChange={(e) => setFilter('to', e.target.value)}
        className={clsx(selectCls, 'tnum')}
      />

      <div className="mx-0.5 h-[16px] w-px bg-grid" />

      {show.includes('campaign') && (
        <select
          value={filters.campaign}
          onChange={(e) => setFilter('campaign', e.target.value)}
          className={selectCls}
          disabled={meta.loading}
        >
          <option value="">All Campaigns</option>
          {meta.campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {show.includes('affiliate') && (
        <select
          value={filters.affiliate_id}
          onChange={(e) => setFilter('affiliate_id', e.target.value)}
          className={selectCls}
        >
          <option value="">All Affiliates</option>
          {meta.affiliates.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      )}

      {show.includes('buyer') && (
        <select
          value={filters.buyer_id}
          onChange={(e) => setFilter('buyer_id', e.target.value)}
          className={selectCls}
        >
          <option value="">All Buyers</option>
          {meta.buyers.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}

      {show.includes('status') && (
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className={selectCls}
        >
          <option value="">All Statuses</option>
          {[['accepted', 'Accepted'], ['error', 'Error'], ['duplicated', 'Duplicated']].map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      )}
    </Toolbar>
  )
}
