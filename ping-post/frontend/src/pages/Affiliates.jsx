import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { DataTable, Pager } from '../components/DataTable.jsx'
import { ColumnPicker, useColumns, visibleGroups } from '../components/ColumnPicker.jsx'
import { AdjustModal } from '../components/AdjustModal.jsx'
import { Panel, PageHeader, Money, RecordLink, AsyncBody } from '../components/ui.jsx'
import { num, pct } from '../lib/format.js'

const PAGE_SIZE = 25

// Shown by default. Everything else stays one click away in the column
// picker rather than making the table unreadable on first open.
const DEFAULT_COLUMNS = [
  'leads', 'accepted', 'accept_rate',
  'cost', 'revenue', 'profit', 'margin',
]

export default function Affiliates() {
  const { filters } = useFilters()
  const navigate = useNavigate()
  const [adjusting, setAdjusting] = useState(null)
  const [page, setPage] = useState(1)

  const { from, to } = filters
  const { data, loading, error, reload } = useApi(
    () => api.affiliates({ from, to }), [from, to],
  )

  const rows = data?.rows ?? []
  const totals = data?.totals ?? {}
  const sum = (k) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  )

  const ALL_GROUPS = [
    { span: 1 },
    { span: 6, label: 'Volume' },
    { span: 3, label: 'Ping Post' },
    { span: 4, label: 'Gross' },
    { span: 3, label: 'Net (after returns)' },
    { span: 1 },
  ]

  const ALL_COLUMNS = [
    {
      key: 'name', header: 'Affiliate', always: true,
      render: (r) => (
        <RecordLink onClick={() => navigate(`/affiliates/${r.client_id}`)}>{r.name}</RecordLink>
      ),
    },

    // Volume
    { band: 'Volume', key: 'leads', header: 'Leads', align: 'right', render: (r) => <span className="tnum">{num(r.leads)}</span> },
    { band: 'Volume', key: 'accepted', header: 'Accepted', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.accepted)}</span> },
    { band: 'Volume', key: 'failed', header: 'Failed', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.failed)}</span> },
    { band: 'Volume', key: 'duplicated', header: 'Dupes', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.duplicated)}</span> },
    { band: 'Volume', key: 'returned', header: 'Returned', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.returned)}</span> },
    { band: 'Volume', key: 'accept_rate', header: 'Accept %', align: 'right', render: (r) => <span className="tnum">{pct(r.accept_rate)}</span> },

    // Ping Post
    { band: 'Ping Post', key: 'pings_total', header: 'Pings', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.pings_total)}</span> },
    { band: 'Ping Post', key: 'ping_post_ratio', header: 'Post %', align: 'right', render: (r) => <span className="tnum">{pct(r.ping_post_ratio)}</span> },
    { band: 'Ping Post', key: 'avg_bid', header: 'Avg Bid', align: 'right', render: (r) => <Money value={r.avg_bid} cents className="text-text-secondary" /> },

    // Gross
    { band: 'Gross', key: 'cost', header: 'Cost', align: 'right', render: (r) => <Money value={r.cost} cents className="font-medium" /> },
    { band: 'Gross', key: 'revenue', header: 'Revenue', align: 'right', render: (r) => <Money value={r.revenue} cents /> },
    { band: 'Gross', key: 'profit', header: 'Profit', align: 'right', render: (r) => <Money value={r.profit} cents signed /> },
    { band: 'Gross', key: 'margin', header: 'Margin', align: 'right', render: (r) => <span className="tnum text-text-secondary">{pct(r.margin)}</span> },

    // Net -- what is actually invoiced once returns are deducted.
    { band: 'Net', key: 'net_revenue', header: 'Net Rev', align: 'right', render: (r) => <Money value={r.net_revenue} cents /> },
    { band: 'Net', key: 'net_profit', header: 'Net Profit', align: 'right', render: (r) => <Money value={r.net_profit} cents signed /> },
    { band: 'Net', key: 'net_margin', header: 'Net Margin', align: 'right', render: (r) => <span className="tnum text-text-secondary">{pct(r.net_margin)}</span> },

    {
      key: 'actions', header: '', align: 'right', sortable: false, width: 34, always: true,
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setAdjusting(r) }}
          title="Add manual adjustment"
          className="rounded-sm p-0.5 text-text-muted hover:bg-chrome-hover hover:text-primary"
        >
          <SlidersHorizontal size={12} />
        </button>
      ),
    },
  ]

  const { visible, selected, setSelected, reset } = useColumns(
    'affiliates', ALL_COLUMNS, DEFAULT_COLUMNS,
  )
  const groups = visibleGroups(ALL_COLUMNS, ALL_GROUPS, visible)

  return (
    <>
      <PageHeader
        title="Affiliates"
        actions={
          <ColumnPicker
            allColumns={ALL_COLUMNS}
            selected={selected}
            onChange={setSelected}
            onReset={reset}
          />
        }
      />

      <Panel className="overflow-hidden">
        <FilterBar show={['campaign']} />
        <AsyncBody loading={loading} error={error} onRetry={reload}>
          <>
            <DataTable
              columns={visible}
              groups={groups}
              rows={pageRows}
              getRowId={(r) => r.client_id}
              onRowClick={(r) => navigate(`/affiliates/${r.client_id}`)}
              initialSort={{ key: 'cost', dir: 'desc' }}
              footer={{
                name: `${rows.length} Affiliates`,
                leads: <span className="tnum">{num(sum('leads'))}</span>,
                accepted: <span className="tnum">{num(sum('accepted'))}</span>,
                failed: <span className="tnum">{num(sum('failed'))}</span>,
                returned: <span className="tnum">{num(sum('returned'))}</span>,
                pings_total: <span className="tnum">{num(sum('pings_total'))}</span>,
                cost: <Money value={totals.cost ?? 0} cents />,
                revenue: <Money value={totals.revenue ?? 0} cents />,
                profit: <Money value={totals.profit ?? 0} cents signed />,
                net_revenue: <Money value={sum('net_revenue')} cents />,
                net_profit: <Money value={sum('net_profit')} cents signed />,
              }}
            />
            <Pager
              page={page} totalPages={totalPages} total={rows.length}
              pageSize={PAGE_SIZE} onPage={setPage} onRefresh={reload}
            />
          </>
        </AsyncBody>
      </Panel>

      {adjusting && (
        <AdjustModal
          entity={adjusting}
          entityType="affiliate"
          syncedField="cost"
          onClose={() => setAdjusting(null)}
          onSubmit={(payload) => {
            // Adjustments need somewhere to persist; there is no
            // database yet, so this is recorded but not stored.
            console.log('adjustment submitted', payload)
            setAdjusting(null)
          }}
        />
      )}
    </>
  )
}
