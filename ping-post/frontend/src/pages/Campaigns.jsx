import { useNavigate } from 'react-router-dom'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { DataTable } from '../components/DataTable.jsx'
import { ColumnPicker, useColumns, visibleGroups } from '../components/ColumnPicker.jsx'
import { Panel, PageHeader, Money, RecordLink, Badge, AsyncBody } from '../components/ui.jsx'
import { num, pct } from '../lib/format.js'

export default function Campaigns() {
  const { filters } = useFilters()
  const navigate = useNavigate()
  const { from, to } = filters

  // Campaign performance rides along with the summary call, so this
  // page costs nothing extra against the rate limit.
  const { data, loading, error, reload } = useApi(
    () => api.summary({ from, to }), [from, to],
  )

  const rows = data?.campaigns ?? []

  const ALL_GROUPS = [
    { span: 1 },
    { span: 4, label: 'Volume' },
    { span: 4, label: 'Financials' },
  ]

  const ALL_COLUMNS = [
    {
      key: 'name', header: 'Campaign', always: true,
      render: (r) => (
        <RecordLink onClick={() => navigate(`/leads?campaign=${r.campaign_id}&from=${from}&to=${to}`)}>
          {r.name}
        </RecordLink>
      ),
    },
    { band: 'Volume', key: 'leads', header: 'Leads', align: 'right', render: (r) => <span className="tnum">{num(r.leads)}</span> },
    { band: 'Volume', key: 'accepted', header: 'Accepted', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.accepted)}</span> },
    { band: 'Volume', key: 'failed', header: 'Failed', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.failed)}</span> },
    { band: 'Volume', key: 'accept_rate', header: 'Accept %', align: 'right', render: (r) => <span className="tnum">{pct(r.accept_rate)}</span> },
    { band: 'Financials', key: 'cost', header: 'Cost', align: 'right', render: (r) => <Money value={r.cost} cents /> },
    { band: 'Financials', key: 'revenue', header: 'Revenue', align: 'right', render: (r) => <Money value={r.revenue} cents /> },
    { band: 'Financials', key: 'profit', header: 'Profit', align: 'right', render: (r) => <Money value={r.profit} cents signed /> },
    { band: 'Financials', key: 'margin', header: 'Margin', align: 'right', render: (r) => <span className="tnum text-text-secondary">{pct(r.margin)}</span> },
  ]

  const sum = (k) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0)

  const { visible, selected, setSelected, reset } = useColumns(
    'campaigns', ALL_COLUMNS,
  )
  const groups = visibleGroups(ALL_COLUMNS, ALL_GROUPS, visible)

  return (
    <>
      <PageHeader
        title="Campaigns"
        actions={
          <ColumnPicker allColumns={ALL_COLUMNS} selected={selected}
                        onChange={setSelected} onReset={reset} />
        }
      />
      <Panel className="overflow-hidden">
        <FilterBar show={[]} />
        <AsyncBody loading={loading} error={error} onRetry={reload}>
          <DataTable
            columns={visible}
            groups={groups}
            rows={rows}
            getRowId={(r) => r.campaign_id}
            initialSort={{ key: 'revenue', dir: 'desc' }}
            footer={{
              name: `${rows.length} Campaigns`,
              leads: <span className="tnum">{num(sum('leads'))}</span>,
              accepted: <span className="tnum">{num(sum('accepted'))}</span>,
              cost: <Money value={sum('cost')} cents />,
              revenue: <Money value={sum('revenue')} cents />,
              profit: <Money value={sum('profit')} cents signed />,
            }}
          />
        </AsyncBody>
      </Panel>
    </>
  )
}
