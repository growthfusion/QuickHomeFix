import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Megaphone } from 'lucide-react'

import { useFilters } from '../components/FilterBar.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { DataTable } from '../components/DataTable.jsx'
import { Panel, PageHeader, Kpi, Money, AsyncBody } from '../components/ui.jsx'
import { usd, num, pct } from '../lib/format.js'

/**
 * One detail page for both sides.
 *
 * An affiliate and a buyer are the same kind of record in LeadProsper --
 * a client, seen from whichever side of the trade they sit on -- so the
 * page differs only in which figure leads and which list it reads.
 */
export default function ClientDetail({ side }) {
  const isAff = side === 'affiliate'
  const { clientId } = useParams()
  const { filters } = useFilters()
  const { from, to } = filters

  const { data, loading, error, reload } = useApi(
    () => (isAff ? api.affiliates({ from, to }) : api.buyers({ from, to })),
    [from, to, isAff],
  )

  const row = (data?.rows ?? []).find((r) => String(r.client_id) === String(clientId))

  const campaignCols = [
    { key: 'campaign_name', header: 'Campaign', render: (r) => <span className="text-text-primary">{r.campaign_name}</span> },
    { key: 'leads', header: 'Leads', align: 'right', render: (r) => <span className="tnum">{num(r.leads)}</span> },
    { key: 'accepted', header: 'Accepted', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.accepted)}</span> },
    { key: 'returned', header: 'Returned', align: 'right', render: (r) => <span className="tnum text-text-secondary">{num(r.returned)}</span> },
    ...(isAff ? [{ key: 'cost', header: 'Cost', align: 'right', render: (r) => <Money value={r.cost} cents /> }] : []),
    { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => <Money value={r.revenue} cents /> },
  ]

  const backTo = isAff ? '/affiliates' : '/buyers'

  return (
    <>
      <Link to={backTo} className="mb-2 inline-flex items-center gap-1.5 text-[11.5px] text-text-muted hover:text-text-primary">
        <ArrowLeft size={12} /> {isAff ? 'Affiliates' : 'Buyers'}
      </Link>

      <AsyncBody loading={loading} error={error} onRetry={reload}>
        {!row ? (
          <Panel><div className="px-3 py-10 text-center text-[12px] text-text-muted">
            No activity for this record in the selected period.
          </div></Panel>
        ) : (
          <>
            <PageHeader title={row.name} />

            <Panel className="overflow-hidden">
              <div className={`grid grid-cols-3 divide-x divide-grid ${isAff ? 'lg:grid-cols-7' : 'lg:grid-cols-4'}`}>
                {isAff && <Kpi label="Cost" value={usd(row.cost)} />}
                <Kpi label="Revenue" value={usd(row.revenue)} tone="gain" />
                {isAff && (
                  <Kpi label="Profit" value={usd(row.profit)} tone={row.profit >= 0 ? 'gain' : 'negative'} />
                )}
                {isAff && <Kpi label="Margin" value={pct(row.margin)} />}
                <Kpi label="Leads" value={num(row.leads)} />
                <Kpi label="Accepted" value={num(row.accepted)} />
                <Kpi label={isAff ? 'Accept Rate' : 'Ping/Post'}
                     value={pct(isAff ? row.accept_rate : row.ping_post_ratio)} />
              </div>
            </Panel>

            <Panel title="By Campaign" icon={Megaphone} className="mt-2 overflow-hidden">
              <DataTable
                columns={campaignCols}
                rows={row.campaigns ?? []}
                getRowId={(r) => r.campaign_id}
                initialSort={{ key: 'revenue', dir: 'desc' }}
              />
            </Panel>
          </>
        )}
      </AsyncBody>
    </>
  )
}
