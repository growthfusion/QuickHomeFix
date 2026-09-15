import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft, ArrowUpRight, Scale, ChevronRight, ChevronDown, Download,
} from 'lucide-react'
import { clsx } from 'clsx'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { Panel, PageHeader, Kpi, Money, ToolButton, AsyncBody, Empty } from '../components/ui.jsx'
import { num, usd } from '../lib/format.js'

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

// The accounting row only carries a campaign *count* -- the breakdown
// is fetched lazily per client on expand, from whichever endpoint
// matches that side of the ledger.
const CAMPAIGNS_FETCHER = {
  owed: (client_id, range) => api.affiliateCampaigns(client_id, range).then((d) => d.rows.map((c) => ({
    campaign_id: c.campaign_id,
    campaign_name: c.campaign_name,
    leads: c.leads,
    returned_leads: c.returned,
    net_leads: c.leads - c.returned,
    amount: c.cost,
    avg_price: (c.leads - c.returned) ? c.cost / (c.leads - c.returned) : 0,
  }))),
  due: (client_id, range) => api.buyerCampaigns(client_id, range).then((d) => d.rows),
}

/**
 * One side of the ledger, with each client expandable to its campaigns.
 *
 * The campaign breakdown is what makes a figure checkable: "we owe
 * Upyield $2,252.50" is only actionable once you can see it is 89 leads
 * at $10.85 on Bathroom plus 48 at $14.69 on Roofing. The accounting
 * endpoint only gives a count though, so the actual rows are fetched
 * per client the first time it's expanded, and cached here after that.
 */
function Ledger({ title, icon: Icon, side, tone, direction, range }) {
  const [open, setOpen] = useState(() => new Set())
  const [campaigns, setCampaigns] = useState({}) // client_id -> { loading, error, rows }

  // A cached campaign breakdown is keyed by client only, not by date
  // range -- if the filter changes, stale rows from the old range would
  // otherwise keep showing under an already-expanded client.
  useEffect(() => {
    setOpen(new Set())
    setCampaigns({})
  }, [range.from, range.to, direction])

  const toggle = (client_id) => {
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(client_id) ? next.delete(client_id) : next.add(client_id)
      return next
    })

    if (!campaigns[client_id]) {
      setCampaigns((prev) => ({ ...prev, [client_id]: { loading: true, error: null, rows: null } }))
      CAMPAIGNS_FETCHER[direction](client_id, range)
        .then((rows) => setCampaigns((prev) => ({ ...prev, [client_id]: { loading: false, error: null, rows } })))
        .catch((error) => setCampaigns((prev) => ({ ...prev, [client_id]: { loading: false, error, rows: null } })))
    }
  }

  if (!side?.rows?.length) {
    return (
      <Panel title={title} icon={Icon} className="overflow-hidden">
        <Empty>Nothing {title.toLowerCase()} for this period.</Empty>
      </Panel>
    )
  }

  return (
    <Panel title={title} icon={Icon} className="overflow-hidden">
      <table className="grid-table w-full text-[12px]">
        <thead className="bg-chrome">
          <tr>
            <th className="h-[26px] border-t border-grid px-2 text-left font-medium">Client</th>
            <th className="h-[26px] border-t border-grid px-2 text-right font-medium">Gross</th>
            <th className="h-[26px] border-t border-grid px-2 text-right font-medium">Returned</th>
            <th className="h-[26px] border-t border-grid px-2 text-right font-medium">Net Leads</th>
            <th className="h-[26px] border-t border-grid px-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {side.rows.map((r) => {
            const expanded = open.has(r.client_id)
            const detail = campaigns[r.client_id]
            const campaignCount = r.campaigns ?? 0

            return [
              <tr
                key={r.client_id}
                onClick={() => toggle(r.client_id)}
                className="cursor-pointer bg-white hover:bg-row-hover"
              >
                <td className="h-[26px] px-2">
                  <span className="flex items-center gap-1">
                    {expanded
                      ? <ChevronDown size={11} className="text-text-muted" />
                      : <ChevronRight size={11} className="text-text-muted" />}
                    <span className="text-text-primary">{r.name}</span>
                    <span className="text-[10.5px] text-text-muted">
                      ({campaignCount} {campaignCount === 1 ? 'campaign' : 'campaigns'})
                    </span>
                  </span>
                </td>
                <td className="h-[26px] px-2 text-right tnum text-text-secondary">{num(r.leads)}</td>
                <td className={clsx(
                  'h-[26px] px-2 text-right tnum',
                  r.returned_leads > 0 ? 'text-accent-hover' : 'text-text-muted',
                )}>
                  {num(r.returned_leads)}
                </td>
                <td className="h-[26px] px-2 text-right tnum text-text-primary">{num(r.net_leads)}</td>
                <td className="h-[26px] px-2 text-right">
                  <Money value={r.amount} cents className={clsx('font-medium', tone)} />
                </td>
              </tr>,

              ...(!expanded ? [] : !detail || detail.loading ? [
                <tr key={`${r.client_id}-loading`} className="bg-surface">
                  <td colSpan={5} className="h-[24px] py-0 pl-7 pr-2 text-[11.5px] text-text-muted">
                    Loading campaigns…
                  </td>
                </tr>,
              ] : detail.error ? [
                <tr key={`${r.client_id}-error`} className="bg-surface">
                  <td colSpan={5} className="h-[24px] py-0 pl-7 pr-2 text-[11.5px] text-loss">
                    Could not load campaigns: {detail.error.message}
                  </td>
                </tr>,
              ] : detail.rows.map((c) => (
                <tr key={`${r.client_id}-${c.campaign_id}`} className="bg-surface">
                  <td className="h-[24px] py-0 pl-7 pr-2 text-[11.5px] text-text-secondary">
                    {c.campaign_name}
                  </td>
                  <td className="h-[24px] px-2 text-right tnum text-[11.5px] text-text-muted">{num(c.leads)}</td>
                  <td className="h-[24px] px-2 text-right tnum text-[11.5px] text-text-muted">{num(c.returned_leads)}</td>
                  <td className="h-[24px] px-2 text-right tnum text-[11.5px] text-text-secondary">
                    {num(c.net_leads)} @ {usd(c.avg_price, { cents: true })}
                  </td>
                  <td className="h-[24px] px-2 text-right">
                    <Money value={c.amount} cents className="text-[11.5px] text-text-secondary" />
                  </td>
                </tr>
              ))),
            ]
          })}
        </tbody>
        <tfoot className="bg-chrome">
          <tr className="font-semibold">
            <td className="h-[27px] border-t-2 border-t-grid px-2 text-text-primary">
              {side.rows.length} {side.rows.length === 1 ? 'client' : 'clients'}
            </td>
            <td className="h-[27px] border-t-2 border-t-grid px-2 text-right tnum">
              {num(side.rows.reduce((a, r) => a + r.leads, 0))}
            </td>
            <td className="h-[27px] border-t-2 border-t-grid px-2 text-right tnum">
              {num(side.rows.reduce((a, r) => a + r.returned_leads, 0))}
            </td>
            <td className="h-[27px] border-t-2 border-t-grid px-2 text-right tnum">
              {num(side.rows.reduce((a, r) => a + r.net_leads, 0))}
            </td>
            <td className="h-[27px] border-t-2 border-t-grid px-2 text-right">
              <Money value={side.total} cents className={tone} />
            </td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  )
}

export default function Finance() {
  const { filters } = useFilters()
  const { from, to } = filters

  const { data, loading, error, reload } = useApi(
    () => api.accounting({ from, to }), [from, to],
  )

  const owed = data?.owed
  const due = data?.due
  const netPosition = (due?.total ?? 0) - (owed?.total ?? 0)

  const [exporting, setExporting] = useState(false)

  // The accounting rows only carry a campaign count, so the CSV's
  // per-campaign lines need the same lazy fetch the expand rows use --
  // just for every client up front instead of one at a time.
  const exportCsv = async () => {
    setExporting(true)
    try {
      const lines = [
        ['Direction', 'Client', 'Campaign', 'Gross Leads', 'Returned', 'Net Leads', 'Avg Price', 'Amount']
          .join(','),
      ]
      for (const [label, direction, sideData] of [['Owed', 'owed', owed], ['Due', 'due', due]]) {
        const rows = sideData?.rows ?? []
        const detail = await Promise.all(
          rows.map((r) => CAMPAIGNS_FETCHER[direction](r.client_id, { from, to })),
        )
        rows.forEach((r, i) => {
          for (const c of detail[i]) {
            lines.push([
              label, r.name, c.campaign_name,
              c.leads, c.returned_leads, c.net_leads, c.avg_price, c.amount,
            ].map(csvCell).join(','))
          }
        })
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-${from}-to-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Finance"
        actions={
          <ToolButton icon={Download} onClick={exportCsv} disabled={!data || exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </ToolButton>
        }
      />

      <Panel className="overflow-hidden">
        <FilterBar show={[]} />
        <AsyncBody loading={loading} error={error} onRetry={reload} label="Loading ledger">
          <div className="grid grid-cols-3 divide-x divide-grid">
            <Kpi label="Owed to affiliates" value={usd(owed?.total)} />
            <Kpi label="Due from buyers" value={usd(due?.total)} tone="gain" />
            <Kpi
              label="Net position"
              value={usd(netPosition)}
              tone={netPosition >= 0 ? 'gain' : 'negative'}
            />
          </div>
        </AsyncBody>
      </Panel>

      <AsyncBody loading={loading} error={error} onRetry={reload}>
        <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-2">
          <Ledger
            title="Owed to Affiliates"
            icon={ArrowUpRight}
            side={owed}
            tone="text-text-primary"
            direction="owed"
            range={{ from, to }}
          />
          <Ledger
            title="Due from Buyers"
            icon={ArrowDownLeft}
            side={due}
            tone="text-primary"
            direction="due"
            range={{ from, to }}
          />
        </div>
      </AsyncBody>

      <Panel className="mt-2" bodyClass="px-3 py-2">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-text-muted">
          <Scale size={12} className="mt-px shrink-0" />
          <span>
            These are LeadProsper&apos;s own accounting figures, net of returns --
            the amounts they invoice on. The Affiliates and Buyers pages
            derive their totals independently from campaign stats; if the
            two ever disagree, this page is the one to trust.
          </span>
        </p>
      </Panel>
    </>
  )
}
