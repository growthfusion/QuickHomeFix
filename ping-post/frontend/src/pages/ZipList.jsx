import { useMemo, useState } from 'react'
import { Download, AlertTriangle, Search, TrendingUp, MapPin, HelpCircle } from 'lucide-react'
import { clsx } from 'clsx'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { PanelTabs } from '../components/PanelTabs.jsx'
import { UsStateMap } from '../components/UsStateMap.jsx'
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

const MIN_LEADS_OPTIONS = [1, 3, 5, 10]
// 0 stands for "All" -- kept as a number so it sits in the same state
// and URL-free logic as the others, rather than a separate boolean.
const TOP_N_OPTIONS = [3, 10, 25, 0]
const topNLabel = (n) => (n === 0 ? 'All' : `Top ${n}`)

/** State abbreviation -> weighted accept rate, for the map. Only states with at least one qualifying zip are included. */
function stateRates(rows) {
  const byState = new Map()
  for (const r of rows) {
    const s = byState.get(r.state) ?? { leads: 0, accepted: 0 }
    s.leads += r.leads
    s.accepted += r.accepted
    byState.set(r.state, s)
  }
  const rates = {}
  for (const [state, s] of byState) rates[state] = s.leads ? (s.accepted / s.leads) * 100 : 0
  return rates
}

/**
 * Ranked, not listed: the best-performing zip codes, for deciding what
 * to target or exclude -- not a spreadsheet of every zip that ever had
 * a lead. A zip only qualifies once it clears the leads threshold (a
 * single lucky lead cannot fake a 100% accept rate), then ranks by
 * accept rate first and revenue as the tiebreak.
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
  const [minLeads, setMinLeads] = useState(3)
  const [q, setQ] = useState('')
  const [selectedState, setSelectedState] = useState(null)
  const [topN, setTopN] = useState(10)

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

  // "All" means every zip with any activity -- it ignores Min. leads
  // entirely, because that filter exists to trust a *rate*, and a raw
  // list of every zip makes no such claim. Top 3/10/25 do respect it:
  // ranking by accept rate only makes sense over a pool worth trusting.
  const qualifying = useMemo(() => all.filter((r) => r.leads >= minLeads), [all, minLeads])
  const pool = topN === 0 ? all : qualifying
  const rates = useMemo(() => stateRates(pool), [pool])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return pool.filter((r) => {
      if (selectedState && r.state !== selectedState) return false
      if (!needle) return true
      return r.zip_code.includes(needle) || r.state.toLowerCase().includes(needle) ||
        (group === 'buyer' && r.buyer_name.toLowerCase().includes(needle))
    })
  }, [pool, q, group, selectedState])

  const ranked = useMemo(
    () => [...filtered].sort((a, b) => b.accept_rate - a.accept_rate || b.revenue - a.revenue),
    [filtered],
  )
  const visible = topN === 0 ? ranked : ranked.slice(0, topN)

  const setGroupBy = (k) => { setGroup(k); setBuyerId(''); setSelectedState(null) }

  const exportFull = () => group === 'buyer'
    ? exportRows(
        `top-zips-by-buyer-${from}-to-${to}${vertical ? `-${vertical}` : ''}.csv`,
        ['Zip', 'State', 'Buyer', 'Verticals', 'Leads', 'Accepted', 'Accept %', 'Revenue'],
        ranked,
        (r) => [r.zip_code, r.state, r.buyer_name, r.verticals.join('; '), r.leads, r.accepted, r.accept_rate, r.revenue],
      )
    : exportRows(
        `top-zips-${from}-to-${to}${vertical ? `-${vertical}` : ''}.csv`,
        ['Zip', 'State', 'Verticals', 'Leads', 'Accepted', 'Accept %', 'Cost', 'Revenue', 'Profit', 'Margin %'],
        ranked,
        (r) => [r.zip_code, r.state, r.verticals.join('; '), r.leads, r.accepted, r.accept_rate, r.cost, r.revenue, r.profit, r.margin],
      )

  // Zip + State only -- nothing about revenue, cost or accept rate,
  // so this is the sheet that is safe to hand to an affiliate or buyer.
  const exportForClient = () => exportRows(
    `top-zips-for-client-${from}-to-${to}${vertical ? `-${vertical}` : ''}.csv`,
    ['Zip', 'State'],
    ranked,
    (r) => [r.zip_code, r.state],
  )

  const bestRate = ranked.length ? Math.max(...ranked.map((r) => r.accept_rate)) : 0
  const topRevenue = ranked.length ? ranked[0].revenue : 0

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

        <select value={vertical} onChange={(e) => setVertical(e.target.value)}
                className={clsx(selectCls, 'min-w-[150px]', !vertical && 'text-text-muted')}>
          <option value="">All Verticals</option>
          {verticalNames.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        {group === 'buyer' && (
          <select value={buyerId} onChange={(e) => setBuyerId(e.target.value)}
                  className={clsx(selectCls, 'min-w-[150px]', !buyerId && 'text-text-muted')}>
            <option value="">All Buyers</option>
            {meta.buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        <select value={minLeads} onChange={(e) => setMinLeads(Number(e.target.value))} disabled={topN === 0}
                className={clsx(selectCls, topN === 0 && 'opacity-50')}
                title={topN === 0 ? '"All" ignores Min. leads — switch to Top 3/10/25 to use it.' : undefined}>
          {MIN_LEADS_OPTIONS.map((n) => <option key={n} value={n}>Min. {n} lead{n === 1 ? '' : 's'}</option>)}
        </select>

        <Search size={13} className="text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={group === 'buyer' ? 'Search zip, state or buyer…' : 'Search zip or state…'}
          className="h-[24px] w-full max-w-[220px] rounded-sm border border-grid bg-white px-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
        />

        <span className="ml-auto flex items-center gap-1">
          <ToolButton icon={Download} onClick={exportFull} disabled={!ranked.length} title="Every column, for your own records.">
            Export Full Data
          </ToolButton>
          <ToolButton icon={Download} onClick={exportForClient} disabled={!ranked.length} primary
                      title="Zip + State only — safe to hand to a client or affiliate.">
            Export for Client
          </ToolButton>
        </span>
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
        <div className="grid grid-cols-1 gap-2 p-2 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT: ranked list */}
          <Panel
            title="Best-Performing Zip Codes"
            icon={TrendingUp}
            className="min-w-0"
            actions={
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-sm border border-grid">
                  {TOP_N_OPTIONS.map((n) => (
                    <button key={n} onClick={() => setTopN(n)}
                            className={clsx('h-[22px] border-r border-grid px-2 text-[11px] last:border-r-0',
                              topN === n ? 'bg-primary-light font-medium text-primary' : 'bg-white text-text-secondary hover:bg-chrome-hover')}>
                      {topNLabel(n)}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-normal text-text-muted">
                  {num(ranked.length)} zip{ranked.length === 1 ? '' : 's'}
                  {topN === 0 ? '' : ` · min. ${minLeads} lead${minLeads === 1 ? '' : 's'}`}
                  {selectedState ? ` · ${selectedState}` : ''}
                </span>
              </div>
            }
          >
            <ZipRankedList rows={visible} group={group} />
            {ranked.length === 0 && (
              <div className="px-3 py-10 text-center text-[12px] text-text-muted">
                {q || selectedState ? 'Nothing matches that filter.'
                  : topN === 0 ? 'No zip activity in this period.'
                  : `No zip cleared ${minLeads} lead${minLeads === 1 ? '' : 's'} in this period.`}
              </div>
            )}
            {ranked.length > 0 && (
              <div className="border-t border-grid bg-chrome px-3 py-1.5 text-[11.5px] text-text-secondary">
                {topN === 0
                  ? `Showing all ${num(ranked.length)} zip${ranked.length === 1 ? '' : 's'} with activity in this period — the Min. leads filter does not apply here.`
                  : <>
                      Showing the top {num(visible.length)} of {num(ranked.length)} qualifying zip{ranked.length === 1 ? '' : 's'}
                      {all.length > ranked.length ? ` — ${num(all.length - ranked.length)} more fell short of ${minLeads} lead${minLeads === 1 ? '' : 's'}.` : '.'}
                    </>}
              </div>
            )}
          </Panel>

          {/* RIGHT: map + stats + explainer */}
          <div className="flex min-w-0 flex-col gap-2">
            <Panel
              title="Accept Rate by State"
              icon={MapPin}
              actions={selectedState && (
                <button onClick={() => setSelectedState(null)} className="text-[11px] font-normal text-primary hover:underline">
                  Clear filter ✕
                </button>
              )}
            >
              <UsStateMap rates={rates} selected={selectedState} onSelect={setSelectedState} />
              <div className="flex items-center gap-1.5 px-3 pb-2.5 text-[10.5px] text-text-muted">
                <span>Low</span>
                <div className="h-1.5 flex-1" style={{ background: 'linear-gradient(90deg,#eaf2fb,#bcd8f1,#7fb3e3,#3f88cf,#1f6fc0,#144a82)' }} />
                <span>High</span>
              </div>
            </Panel>

            <Panel>
              <div className="grid grid-cols-3 divide-x divide-grid">
                <div className="px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-text-muted">Qualifying Zips</div>
                  <div className="tnum mt-0.5 text-[17px] font-semibold text-text-primary">{num(ranked.length)}</div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-text-muted">Best Accept Rate</div>
                  <div className="tnum mt-0.5 text-[17px] font-semibold text-primary">{ranked.length ? pct(bestRate) : '—'}</div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-text-muted">Top-Zip Revenue</div>
                  <div className="tnum mt-0.5 text-[17px] font-semibold text-primary">{ranked.length ? `$${num(topRevenue)}` : '—'}</div>
                </div>
              </div>
            </Panel>

            <Panel title="How “top” is decided" icon={HelpCircle}>
              <div className="px-3 py-2.5 text-[12px] leading-relaxed text-text-secondary">
                Under Top 3/10/25, a zip only ranks if it has <b className="text-text-primary">{minLeads} or more lead{minLeads === 1 ? '' : 's'}</b> in
                the period — a single lucky lead can't fake a 100% rate. Ranked by accept rate first, revenue as the tiebreak.
                {' '}<b className="text-text-primary">All</b> shows every zip with any activity and ignores that threshold.
                <ul className="mt-2 flex flex-col gap-1.5">
                  <li className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />Click a state on the map to filter the list to it.</li>
                  <li className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />Raise “Min. leads” to demand a stronger sample before trusting a zip.</li>
                  <li className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /><b className="text-text-primary">Export Full Data</b> keeps every figure, for your own records.</li>
                  <li className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /><b className="whitespace-nowrap text-text-primary">Export for Client</b>&nbsp;strips it to Zip + State — nothing about revenue, cost or accept rate leaves the building.</li>
                </ul>
              </div>
            </Panel>
          </div>
        </div>
      </AsyncBody>
    </>
  )
}

/** The ranked list itself: rank, zip/place, affiliate-or-buyer + vertical, an accept-rate bar, leads, revenue. */
function ZipRankedList({ rows, group }) {
  if (!rows.length) return null
  return (
    <div className="flex flex-col">
      {rows.map((r, i) => (
        <div key={`${r.zip_code}-${r.buyer_id ?? ''}-${i}`}
             className="grid grid-cols-[24px_84px_minmax(0,1fr)_100px_64px_72px] items-center gap-2.5 border-b border-grid-light px-3 py-2 last:border-b-0 hover:bg-primary-light">
          <span className={clsx('tnum text-center text-[11px] font-bold', i < 3 ? 'text-accent-hover' : 'text-text-muted')}>{i + 1}</span>
          <span className="flex flex-col gap-px">
            <span className="tnum text-[13px] font-semibold text-text-primary">{r.zip_code}</span>
            <span className="text-[10.5px] text-text-muted">{r.state}</span>
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[12px] text-text-secondary">{group === 'buyer' ? r.buyer_name : r.verticals.join(', ')}</span>
            {group === 'buyer' && (
              <span className="inline-block w-fit bg-primary-light px-1.5 py-px text-[10px] font-semibold text-primary">{r.verticals.join(', ')}</span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 flex-1 bg-grid-light">
              <span className={clsx('block h-full', r.accept_rate >= 90 ? 'bg-success' : 'bg-primary')} style={{ width: `${r.accept_rate}%` }} />
            </span>
            <span className="tnum w-9 text-right text-[12px] font-semibold">{r.accept_rate.toFixed(0)}%</span>
          </span>
          <span className="text-right">
            <span className="tnum block text-[12.5px] font-semibold">{r.accepted}/{r.leads}</span>
            <span className="block text-[10px] text-text-muted">accepted</span>
          </span>
          <span className="tnum text-right text-[12.5px] font-semibold text-success">{`$${num(r.revenue)}`}</span>
        </div>
      ))}
    </div>
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
