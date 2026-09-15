import { useMemo, useState } from 'react'
import { Download, AlertTriangle, Search } from 'lucide-react'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { DataTable, Pager } from '../components/DataTable.jsx'
import { Panel, PageHeader, ToolButton, AsyncBody, Badge } from '../components/ui.jsx'
import { num, fullDate, STATUS_STYLE } from '../lib/format.js'

const PAGE_SIZE = 50

// Quoted so addresses containing commas survive the round trip -- the
// whole point of this export is that someone loads it into another tool.
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

/**
 * The zip list is what this dashboard is mostly used for, so it opens
 * straight onto data: every campaign, the current date range, no
 * picker to satisfy first. Campaign and text search narrow it down.
 */
export default function ZipList() {
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

  const exportCsv = () => {
    const header = ['Name', 'Address', 'City', 'State', 'Zip', 'Phone', 'Email', 'Campaign', 'Status', 'Received']
    const lines = [
      header.join(','),
      ...rows.map((r) => [
        r.lead_name, r.address, r.city, r.state, r.zip_code,
        r.phone, r.email, r.campaign_name, r.status, r.received_at,
      ].map(csvCell).join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zips-${from}-to-${to}${campaign ? `-c${campaign}` : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
      <PageHeader
        title="Zip List"
        actions={
          <ToolButton icon={Download} onClick={exportCsv} disabled={!rows.length} primary>
            Export {rows.length ? num(rows.length) : ''} to CSV
          </ToolButton>
        }
      />

      <Panel className="overflow-hidden">
        <FilterBar show={['campaign']} />

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
      </Panel>
    </>
  )
}
