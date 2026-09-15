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

const DEFAULT_COLUMNS = [
  'leads', 'accepted', 'accept_rate', 'ping_post_ratio', 'revenue', 'net_revenue',
]

export default function Buyers() {
  const { filters } = useFilters()
  const navigate = useNavigate()
  const [adjusting, setAdjusting] = useState(null)
  const [page, setPage] = useState(1)

  const { from, to } = filters
  const { data, loading, error, reload } = useApi(
    () => api.buyers({ from, to }), [from, to],
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
    { span: 5, label: 'Volume' },
    { span: 3, label: 'Ping Post' },
    { span: 3, label: 'Revenue' },
    { span: 1 },
  ]

  const ALL_COLUMNS = [
    {
      key: 'name', header: 'Buyer', always: true,
      render: (r) => (
        <RecordLink onClick={() => navigate(`/buyers/${r.client_id}`)}>{r.name}</RecordLink>
      ),
    },

    { band: 'Volume', key: 'leads', header: 'Leads', align: 'right', render: (r) => <span className="tnum">{num(r.leads)}</span> },
    { band: 'Volume', key: 'accepted', header: 'Accepted', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.accepted)}</span> },
    { band: 'Volume', key: 'failed', header: 'Failed', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.failed)}</span> },
    { band: 'Volume', key: 'returned', header: 'Returned', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.returned)}</span> },
    { band: 'Volume', key: 'accept_rate', header: 'Accept %', align: 'right', render: (r) => <span className="tnum">{pct(r.accept_rate)}</span> },

    { band: 'Ping Post', key: 'pings_total', header: 'Pings', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.pings_total)}</span> },
    { band: 'Ping Post', key: 'pings_failed', header: 'Ping Fail', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.pings_failed)}</span> },
    { band: 'Ping Post', key: 'ping_post_ratio', header: 'Post %', align: 'right', render: (r) => <span className="tnum">{pct(r.ping_post_ratio)}</span> },

    { band: 'Revenue', key: 'revenue', header: 'Revenue', align: 'right', render: (r) => <Money value={r.revenue} cents className="font-medium" /> },
    { band: 'Revenue', key: 'returned_revenue', header: 'Returned', align: 'right', render: (r) => <Money value={r.returned_revenue} cents className="text-text-secondary" /> },
    { band: 'Revenue', key: 'net_revenue', header: 'Net Rev', align: 'right', render: (r) => <Money value={r.net_revenue} cents /> },

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
    'buyers', ALL_COLUMNS, DEFAULT_COLUMNS,
  )
  const groups = visibleGroups(ALL_COLUMNS, ALL_GROUPS, visible)

  return (
    <>
      <PageHeader
        title="Buyers"
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
              onRowClick={(r) => navigate(`/buyers/${r.client_id}`)}
              initialSort={{ key: 'revenue', dir: 'desc' }}
              footer={{
                name: `${rows.length} Buyers`,
                leads: <span className="tnum">{num(sum('leads'))}</span>,
                accepted: <span className="tnum">{num(sum('accepted'))}</span>,
                failed: <span className="tnum">{num(sum('failed'))}</span>,
                returned: <span className="tnum">{num(sum('returned'))}</span>,
                pings_total: <span className="tnum">{num(sum('pings_total'))}</span>,
                revenue: <Money value={totals.revenue ?? 0} cents />,
                returned_revenue: <Money value={sum('returned_revenue')} cents />,
                net_revenue: <Money value={sum('net_revenue')} cents />,
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
          entityType="buyer"
          syncedField="revenue"
          onClose={() => setAdjusting(null)}
          onSubmit={(payload) => {
            console.log('adjustment submitted', payload)
            setAdjusting(null)
          }}
        />
      )}
    </>
  )
}
