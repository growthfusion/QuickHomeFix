import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { useMeta } from '../lib/useMeta.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { ColumnPicker, useColumns } from '../components/ColumnPicker.jsx'
import { Panel, PageHeader, Money, Badge, AsyncBody, Empty } from '../components/ui.jsx'
import { num, dateTime, STATUS_STYLE } from '../lib/format.js'

export default function Leads() {
  const { filters, setFilter } = useFilters()
  const navigate = useNavigate()
  const meta = useMeta()

  const { from, to, campaign, status } = filters

  // LeadProsper pages with an opaque token rather than offsets, so
  // pages can only be walked forward. The trail lets us step back
  // without re-fetching from the start.
  const [cursor, setCursor] = useState(null)
  const [trail, setTrail] = useState([])

  // Any filter change invalidates the cursor -- it belongs to the old query.
  useEffect(() => {
    setCursor(null)
    setTrail([])
  }, [from, to, campaign, status])

  const { data, loading, error, reload } = useApi(
    () => api.leads({ from, to, campaign, status, cursor }),
    [from, to, campaign, status, cursor],
    { enabled: Boolean(campaign) },
  )

  const rows = data?.rows ?? []
  const next = data?.nextCursor ?? null

  const ALL_COLUMNS = [
    {
      key: 'received_at', header: 'Received', always: true,
      render: (r) => <span className="tnum text-text-secondary">{dateTime(r.received_at)}</span>,
    },
    { band: 'Routing', key: 'affiliate', header: 'Affiliate', render: (r) => <span className="text-text-primary">{r.affiliate}</span> },
    {
      band: 'Routing', key: 'buyer', header: 'Buyer',
      render: (r) => <span className={r.buyer ? 'text-text-primary' : 'text-text-muted'}>{r.buyer || '—'}</span>,
    },
    {
      band: 'Routing', key: 'status', header: 'Status',
      render: (r) => (
        <span className="flex items-center gap-1">
          <Badge className={STATUS_STYLE[r.status] ?? STATUS_STYLE.PENDING}>{r.status}</Badge>
          {r.returned === true && (
            <Badge className="bg-accent-light text-accent-hover ring-accent/30">returned</Badge>
          )}
        </span>
      ),
    },
    {
      band: 'Ping Post', key: 'pings', header: 'Pings', align: 'right',
      // How many buyers the lead was offered to, versus how many took
      // it -- the core of ping-post economics.
      render: (r) => (
        <span className="tnum text-text-secondary">{r.accepted_by}/{r.pings}</span>
      ),
    },
    { band: 'Money', key: 'cost', header: 'Cost', align: 'right', render: (r) => <Money value={r.cost} cents /> },
    { band: 'Money', key: 'revenue', header: 'Revenue', align: 'right', render: (r) => <Money value={r.revenue} cents /> },
    { band: 'Money', key: 'profit', header: 'Profit', align: 'right', render: (r) => <Money value={r.profit} cents signed /> },
    { band: 'Contact', key: 'zip_code', header: 'Zip', render: (r) => <span className="tnum text-text-secondary">{r.zip_code || '—'}</span> },
    {
      band: 'Routing', key: 'error_message', header: 'Reason',
      render: (r) => (
        <span className="text-text-muted" title={r.error_message}>
          {(r.error_message || '').slice(0, 28) || '—'}
        </span>
      ),
    },
  ]

  const { visible, selected, setSelected, reset } = useColumns('leads', ALL_COLUMNS)

  const btn =
    'flex h-[20px] w-[20px] items-center justify-center rounded-sm border border-grid ' +
    'bg-white text-text-secondary hover:bg-chrome-hover disabled:opacity-35 text-[11px]'

  return (
    <>
      <PageHeader
        title="Leads"
        actions={
          <ColumnPicker allColumns={ALL_COLUMNS} selected={selected}
                        onChange={setSelected} onReset={reset} />
        }
      />

      <Panel className="overflow-hidden">
        <FilterBar show={['campaign', 'status']} />

        {!campaign ? (
          <Empty>
            Select a campaign to view leads. LeadProsper returns lead
            detail for one campaign at a time.
          </Empty>
        ) : (
          <AsyncBody loading={loading} error={error} onRetry={reload} label="Loading leads">
            <>
              <DataTable
                columns={visible}
                rows={rows}
                getRowId={(r) => r.lead_id}
                onRowClick={(r) => navigate(`/leads/${r.lead_id}`)}
              />

              <div className="flex h-[28px] shrink-0 items-center justify-between border-t border-grid bg-chrome px-2">
                <div className="flex items-center gap-1">
                  <button
                    className={btn}
                    disabled={trail.length === 0}
                    onClick={() => {
                      const prev = [...trail]
                      const back = prev.pop() ?? null
                      setTrail(prev)
                      setCursor(back)
                    }}
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <span className="mx-1.5 text-[11px] text-text-secondary">
                    Page {trail.length + 1}
                  </span>
                  <button
                    className={btn}
                    disabled={!next}
                    onClick={() => { setTrail((t) => [...t, cursor]); setCursor(next) }}
                  >
                    <ChevronRight size={12} />
                  </button>
                  <span className="mx-1 h-[14px] w-px bg-grid" />
                  <button className={btn} onClick={reload} title="Refresh">
                    <RefreshCw size={11} />
                  </button>
                </div>

                <span className="tnum text-[11px] text-text-secondary">
                  {num(rows.length)} on this page{next ? ' · more available' : ''}
                </span>
              </div>
            </>
          </AsyncBody>
        )}
      </Panel>
    </>
  )
}
