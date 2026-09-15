import { useMemo, useState } from 'react'
import { Download, AlertTriangle, Search } from 'lucide-react'
import { clsx } from 'clsx'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { PanelTabs } from '../components/PanelTabs.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { useMeta } from '../lib/useMeta.jsx'
import { DataTable, Pager } from '../components/DataTable.jsx'
import { Panel, PageHeader, ToolButton, AsyncBody, Badge, Money, selectCls } from '../components/ui.jsx'
import { num, pct, fullDate, periodRange, STATUS_STYLE } from '../lib/format.js'

const PAGE_SIZE = 50

// Quoted so addresses containing commas survive the round trip -- the
// whole point of this export is that someone loads it into another tool.
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

function exportRows(filename, header, rows, pick) {
  const lines = [header.join(','), ...rows.map((r) => pick(r).map(csvCell).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** One row per lead, with a usable name, address and zip. */
function LeadList() {
  const { filters } = useFilters()
  const { from, to, campaign } = filters

  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useApi(
    () => api.zipList({ from, to, campaign }),
    [from, to, campaign],
  )

  const all = data?.rows ?? []

  // Client-side search over what has already been fetched: the API has
  // no free-text filter, and the rows are already in hand.
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter((r) =>
      [r.lead_name, r.address, r.city, r.state, r.zip_code, r.phone, r.email]
        .some((v) => String(v ?? '').toLowerCase().includes(needle)),
    )
  }, [all, q])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const exportCsv = () => exportRows(
    `zips-${from}-to-${to}${campaign ? `-c${campaign}` : ''}.csv`,
    ['Name', 'Address', 'City', 'State', 'Zip', 'Phone', 'Email', 'Campaign', 'Status', 'Received'],
    rows,
    (r) => [r.lead_name, r.address, r.city, r.state, r.zip_code, r.phone, r.email, r.campaign_name, r.status, r.received_at],
  )

  const columns = [
    { key: 'zip_code', header: 'Zip', width: 70, render: (r) => <span className="tnum font-medium text-text-primary">{r.zip_code}</span> },
    { key: 'lead_name', header: 'Name', render: (r) => <span className="text-text-primary">{r.lead_name}</span> },
    { key: 'address', header: 'Address', render: (r) => <span className="text-text-secondary">{r.address}</span> },
    { key: 'city', header: 'City', render: (r) => <span className="text-text-secondary">{r.city}</span> },
    { key: 'state', header: 'State', width: 60, render: (r) => <span className="text-text-secondary">{r.state}</span> },
    { key: 'phone', header: 'Phone', render: (r) => <span className="tnum text-text-secondary">{r.phone || '—'}</span> },
    { key: 'email', header: 'Email', render: (r) => <span className="text-text-secondary">{r.email || '—'}</span> },
    { key: 'campaign_name', header: 'Campaign', render: (r) => <span className="text-text-secondary">{r.campaign_name}</span> },
    {
      key: 'status', header: 'Status', width: 90,
      render: (r) => <Badge className={STATUS_STYLE[r.status] ?? STATUS_STYLE.PENDING}>{r.status}</Badge>,
    },
    { key: 'received_at', header: 'Received', render: (r) => <span className="tnum text-text-muted">{fullDate(r.received_at)}</span> },
  ]

  return (
    <>
      <div className="flex items-center gap-2 border-b border-grid bg-white px-2 py-1.5">
        <Search size={13} className="text-text-muted" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="Search zip, name, city, phone, email…"
          className="h-[24px] w-full max-w-[420px] rounded-sm border border-grid bg-white px-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
        />
        {!loading && !error && (
          <span className="ml-auto tnum text-[11.5px] text-text-secondary">
            {num(rows.length)} {q ? `of ${num(all.length)} ` : ''}zips
            {data?.campaigns_scanned > 1 ? ` · ${data.campaigns_scanned} campaigns` : ''}
          </span>
        )}
        <ToolButton icon={Download} onClick={exportCsv} disabled={!rows.length}>
          Export {rows.length ? num(rows.length) : ''} to CSV
        </ToolButton>
      </div>

      <AsyncBody loading={loading} error={error} onRetry={reload} label="Collecting zips across campaigns">
        <>
          {data?.truncated && (
            // Saying so beats silently returning a partial list that
            // someone then exports and treats as complete.
            <div className="flex items-start gap-2 border-b border-grid bg-accent-light px-3 py-2 text-[11.5px] text-accent-hover">
              <AlertTriangle size={13} className="mt-px shrink-0" />
              <span>
                Not everything is shown for: {data.truncated_campaigns.join(', ')}.
                Narrow the date range or pick that campaign to see the rest.
              </span>
            </div>
          )}

          <DataTable
            columns={columns}
            rows={pageRows}
            getRowId={(r) => r.lead_id}
            emptyMessage={q ? 'Nothing matches that search.' : 'No leads with a zip code in this period.'}
          />
          <Pager
            page={safePage} totalPages={totalPages} total={rows.length}
            pageSize={PAGE_SIZE} onPage={setPage} onRefresh={reload} onExport={exportCsv}
          />
        </>
      </AsyncBody>
    </>
  )
}

const GROUP_OPTIONS = [
  { key: 'vertical', label: 'Group by Vertical' },
  { key: 'buyer', label: 'Group by Buyer' },
]

/**
 * One row per zip code (or per zip x buyer), for spotting which zips
 * are worth targeting and which are worth excluding from a campaign.
 *
 * Two groupings, two different data sources: vertical-wise reads
 * hs_geo_rollup (cost + revenue, from every lead ever synced).
 * Buyer-wise reads hs_buyer_geo_rollup (revenue only -- a buyer's cost
 * to us isn't a concept LeadProsper exposes), which only has zip/state
 * for leads synced after that rollup was added -- so it can be sparse
 * or empty until a backfill re-syncs older leads.
 */
function ZipPerformance() {
  const { filters } = useFilters()
  const { from, to } = filters
  const meta = useMeta()

  const [group, setGroup] = useState('vertical')
  const [vertical, setVertical] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useApi(
    () => group === 'buyer'
      ? api.zipPerformanceByBuyer({ from, to, vertical, buyer_id: buyerId })
      : api.zipPerformance({ from, to, vertical }),
    [group, from, to, vertical, buyerId],
  )
  // A wide window so a vertical with no activity this period is still
  // selectable, rather than vanishing from the dropdown.
  const verticalsApi = useApi(() => api.verticals(periodRange('30d')), [])
  const verticalNames = (verticalsApi.data?.rows ?? []).map((r) => r.vertical).filter((v) => v && v !== '(unmapped)')

  const all = data?.rows ?? []
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter((r) =>
      r.zip_code.includes(needle) || r.state.toLowerCase().includes(needle) ||
      (group === 'buyer' && r.buyer_name.toLowerCase().includes(needle)),
    )
  }, [all, q, group])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const sum = (k) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0)

  const setGroupBy = (k) => { setGroup(k); setBuyerId(''); setPage(1) }

  const exportCsv = () => group === 'buyer'
    ? exportRows(
        `zip-performance-by-buyer-${from}-to-${to}${vertical ? `-${vertical}` : ''}.csv`,
        ['Zip', 'State', 'Buyer', 'Verticals', 'Leads', 'Accepted', 'Accept %', 'Revenue'],
        rows,
        (r) => [r.zip_code, r.state, r.buyer_name, r.verticals.join('; '), r.leads, r.accepted, r.accept_rate, r.revenue],
      )
    : exportRows(
        `zip-performance-${from}-to-${to}${vertical ? `-${vertical}` : ''}.csv`,
        ['Zip', 'State', 'Verticals', 'Leads', 'Accepted', 'Accept %', 'Cost', 'Revenue', 'Profit', 'Margin %'],
        rows,
        (r) => [r.zip_code, r.state, r.verticals.join('; '), r.leads, r.accepted, r.accept_rate, r.cost, r.revenue, r.profit, r.margin],
      )

  const sharedColumns = [
    { key: 'zip_code', header: 'Zip', width: 70, render: (r) => <span className="tnum font-medium text-text-primary">{r.zip_code}</span> },
    { key: 'state', header: 'State', width: 60, render: (r) => <span className="text-text-secondary">{r.state}</span> },
  ]

  const columns = group === 'buyer' ? [
    ...sharedColumns,
    { key: 'buyer_name', header: 'Buyer', render: (r) => <span className="text-text-primary">{r.buyer_name}</span> },
    { key: 'verticals', header: 'Verticals', sortable: false, render: (r) => <span className="text-text-secondary">{r.verticals.join(', ')}</span> },
    { key: 'leads', header: 'Leads', align: 'right', width: 90, render: (r) => <span className="tnum">{num(r.leads)}</span> },
    { key: 'accepted', header: 'Accepted', align: 'right', width: 90, render: (r) => <span className="tnum text-text-secondary">{num(r.accepted)}</span> },
    { key: 'accept_rate', header: 'Accept %', align: 'right', width: 90, render: (r) => <span className="tnum">{pct(r.accept_rate)}</span> },
    { key: 'revenue', header: 'Revenue', align: 'right', width: 120, render: (r) => <Money value={r.revenue} cents /> },
  ] : [
    ...sharedColumns,
    { key: 'verticals', header: 'Verticals', sortable: false, render: (r) => <span className="text-text-secondary">{r.verticals.join(', ')}</span> },
    { key: 'leads', header: 'Leads', align: 'right', width: 90, render: (r) => <span className="tnum">{num(r.leads)}</span> },
    { key: 'accepted', header: 'Accepted', align: 'right', width: 90, render: (r) => <span className="tnum text-text-secondary">{num(r.accepted)}</span> },
    { key: 'accept_rate', header: 'Accept %', align: 'right', width: 90, render: (r) => <span className="tnum">{pct(r.accept_rate)}</span> },
    { key: 'cost', header: 'Cost', align: 'right', width: 110, render: (r) => <Money value={r.cost} cents /> },
    { key: 'revenue', header: 'Revenue', align: 'right', width: 110, render: (r) => <Money value={r.revenue} cents /> },
    { key: 'profit', header: 'Profit', align: 'right', width: 110, render: (r) => <Money value={r.profit} cents signed className="font-medium" /> },
    { key: 'margin', header: 'Margin', align: 'right', width: 80, render: (r) => <span className="tnum text-text-secondary">{pct(r.margin)}</span> },
  ]

  const footer = group === 'buyer' ? {
    zip_code: `${rows.length} rows`,
    leads: <span className="tnum">{num(sum('leads'))}</span>,
    accepted: <span className="tnum">{num(sum('accepted'))}</span>,
    accept_rate: <span className="tnum">{pct(sum('leads') ? (sum('accepted') / sum('leads')) * 100 : 0)}</span>,
    revenue: <Money value={sum('revenue')} cents />,
  } : {
    zip_code: `${rows.length} zips`,
    leads: <span className="tnum">{num(sum('leads'))}</span>,
    accepted: <span className="tnum">{num(sum('accepted'))}</span>,
    accept_rate: <span className="tnum">{pct(sum('leads') ? (sum('accepted') / sum('leads')) * 100 : 0)}</span>,
    cost: <Money value={sum('cost')} cents />,
    revenue: <Money value={sum('revenue')} cents />,
    profit: <Money value={sum('profit')} cents signed />,
    margin: <span className="tnum">{pct(sum('revenue') ? (sum('profit') / sum('revenue')) * 100 : 0)}</span>,
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-grid bg-white px-2 py-1.5">
        <div className="flex overflow-hidden rounded-sm border border-grid">
          {GROUP_OPTIONS.map((g) => (
            <button key={g.key} onClick={() => setGroupBy(g.key)}
                    className={clsx('h-[24px] border-r border-grid px-2.5 text-[11.5px] last:border-r-0',
                      group === g.key ? 'bg-primary-light font-medium text-primary' : 'bg-white text-text-secondary hover:bg-chrome-hover')}>
              {g.label}
            </button>
          ))}
        </div>

        <select value={vertical} onChange={(e) => { setVertical(e.target.value); setPage(1) }}
                className={clsx(selectCls, 'min-w-[150px]', !vertical && 'text-text-muted')}>
          <option value="">All Verticals</option>
          {verticalNames.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        {group === 'buyer' && (
          <select value={buyerId} onChange={(e) => { setBuyerId(e.target.value); setPage(1) }}
                  className={clsx(selectCls, 'min-w-[150px]', !buyerId && 'text-text-muted')}>
            <option value="">All Buyers</option>
            {meta.buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <Search size={13} className="text-text-muted" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder={group === 'buyer' ? 'Search zip, state or buyer…' : 'Search zip or state…'}
          className="h-[24px] w-full max-w-[220px] rounded-sm border border-grid bg-white px-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
        />
        {!loading && !error && (
          <span className="ml-auto tnum text-[11.5px] text-text-secondary">
            {num(rows.length)} {q ? `of ${num(all.length)} ` : ''}{group === 'buyer' ? 'rows' : 'zips'}
          </span>
        )}
        <ToolButton icon={Download} onClick={exportCsv} disabled={!rows.length}>
          Export {rows.length ? num(rows.length) : ''} to CSV
        </ToolButton>
      </div>

      {group === 'buyer' && data && !data.backfilled && (
        <div className="flex items-start gap-2 border-b border-grid bg-accent-light px-3 py-2 text-[11.5px] text-accent-hover">
          <AlertTriangle size={13} className="mt-px shrink-0" />
          <span>
            Buyer-wise zip tracking only covers leads synced after it was turned on --
            nothing has synced yet, so this is empty. Run a backfill to bring in history,
            or check back after the next scheduled sync.
          </span>
        </div>
      )}

      <AsyncBody loading={loading} error={error} onRetry={reload} label="Aggregating zips">
        <>
          <DataTable
            columns={columns}
            rows={pageRows}
            getRowId={(r, i) => `${r.zip_code}-${r.buyer_id ?? ''}-${i}`}
            initialSort={{ key: 'revenue', dir: 'desc' }}
            emptyMessage={q ? 'Nothing matches that search.' : 'No zip activity in this period.'}
            footer={footer}
          />
          <Pager
            page={safePage} totalPages={totalPages} total={rows.length}
            pageSize={PAGE_SIZE} onPage={setPage} onRefresh={reload} onExport={exportCsv}
          />
        </>
      </AsyncBody>
    </>
  )
}

const TABS = [
  { key: 'leads', label: 'Lead List' },
  { key: 'performance', label: 'Zip Performance' },
]

/**
 * The zip list is what this dashboard is mostly used for, so it opens
 * straight onto data: every campaign, the current date range, no
 * picker to satisfy first.
 *
 * Two tabs, two different grains: Lead List is one row per person, for
 * looking someone up or exporting a mailing list. Zip Performance is
 * one row per zip code with leads/cost/revenue rolled up, for deciding
 * which zips are worth targeting -- or worth excluding from a campaign.
 */
export default function ZipList() {
  const [tab, setTab] = useState('leads')

  return (
    <>
      <PageHeader title="Zip List" />

      <Panel className="overflow-hidden" bodyClass="flex flex-col">
        <FilterBar show={tab === 'leads' ? ['campaign'] : []} />
        <PanelTabs tabs={TABS} active={tab} onSelect={setTab} />
        {tab === 'leads' ? <LeadList /> : <ZipPerformance />}
      </Panel>
    </>
  )
}
