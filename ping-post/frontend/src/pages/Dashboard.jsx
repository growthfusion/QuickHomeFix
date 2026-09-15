import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ArrowDownLeft, ArrowUpRight, LineChart as ChartIcon, MapPin } from 'lucide-react'

import { FilterBar, useFilters } from '../components/FilterBar.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { Panel, Kpi, Money, RecordLink, AsyncBody, ToolButton } from '../components/ui.jsx'
import { usd, num, shortDate, axisMoney } from '../lib/format.js'

/**
 * The dashboard answers two questions and nothing else:
 *
 *   How much does each buyer pay us?
 *   How much do we pay each affiliate?
 *
 * Everything below reads from LeadProsper's accounting figures -- the
 * amounts they invoice on, net of returns -- so the numbers here match
 * the Finance page exactly. Volume detail, ping ratios and the rest
 * live on the Buyers and Affiliates pages behind the column picker.
 */

/** One side of the money: who, how many leads, price per lead, total. */
function PayoutTable({ rows, who, linkTo, tone }) {
  const navigate = useNavigate()

  if (!rows?.length) {
    return (
      <div className="px-3 py-8 text-center text-[12px] text-text-muted">
        No {who.toLowerCase()} activity in this period.
      </div>
    )
  }

  const total = rows.reduce((a, r) => a + r.amount, 0)
  const leads = rows.reduce((a, r) => a + r.net_leads, 0)

  return (
    <table className="grid-table w-full text-[12.5px]">
      <thead className="bg-chrome">
        <tr>
          <th className="h-[27px] border-t border-grid px-3 text-left font-medium">{who}</th>
          <th className="h-[27px] border-t border-grid px-3 text-right font-medium">Leads</th>
          <th className="h-[27px] border-t border-grid px-3 text-right font-medium">Per Lead</th>
          <th className="h-[27px] border-t border-grid px-3 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.client_id}
            onClick={() => navigate(linkTo(r))}
            className="cursor-pointer bg-white hover:bg-row-hover"
          >
            <td className="h-[30px] px-3">
              <RecordLink onClick={() => navigate(linkTo(r))}>{r.name}</RecordLink>
            </td>
            <td className="h-[30px] px-3 text-right tnum text-text-secondary">{num(r.net_leads)}</td>
            <td className="h-[30px] px-3 text-right tnum text-text-secondary">
              {r.net_leads ? usd(r.amount / r.net_leads, { cents: true }) : '—'}
            </td>
            <td className="h-[30px] px-3 text-right">
              <Money value={r.amount} cents className={`font-semibold ${tone}`} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-chrome">
        <tr className="font-semibold">
          <td className="h-[29px] border-t-2 border-t-grid px-3 text-text-primary">Total</td>
          <td className="h-[29px] border-t-2 border-t-grid px-3 text-right tnum">{num(leads)}</td>
          <td className="h-[29px] border-t-2 border-t-grid px-3 text-right tnum text-text-secondary">
            {leads ? usd(total / leads, { cents: true }) : '—'}
          </td>
          <td className="h-[29px] border-t-2 border-t-grid px-3 text-right">
            <Money value={total} cents className={tone} />
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

export default function Dashboard() {
  const { filters } = useFilters()
  const navigate = useNavigate()
  const { from, to } = filters

  // One request state for the whole page: one failure, one message --
  // not the same error repeated in five panels.
  const { data, loading, error, reload } = useApi(
    () => Promise.all([api.accounting({ from, to }), api.summary({ from, to })])
      .then(([accounting, summary]) => ({ accounting, summary })),
    [from, to],
  )

  const owed = data?.accounting?.owed
  const due = data?.accounting?.due
  const keep = (due?.total ?? 0) - (owed?.total ?? 0)
  const trend = data?.summary?.trend ?? []

  return (
    <div className="flex flex-col gap-2">
      <Panel className="overflow-hidden">
        <FilterBar show={[]} />
        <AsyncBody loading={loading} error={error} onRetry={reload} label="Loading">
          <div className="grid grid-cols-3 divide-x divide-grid">
            <Kpi size="lg" label="Buyers pay us" value={usd(due?.total)} tone="gain" />
            <Kpi size="lg" label="We pay affiliates" value={usd(owed?.total)} />
            <Kpi size="lg" label="We keep" value={usd(keep)} tone={keep >= 0 ? 'gain' : 'negative'} />
          </div>
        </AsyncBody>
      </Panel>

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <Panel title="Buyers pay us" icon={ArrowDownLeft} className="overflow-hidden">
              <PayoutTable
                rows={due?.rows}
                who="Buyer"
                linkTo={(r) => `/buyers/${r.client_id}`}
                tone="text-primary"
              />
            </Panel>

            <Panel title="We pay affiliates" icon={ArrowUpRight} className="overflow-hidden">
              <PayoutTable
                rows={owed?.rows}
                who="Affiliate"
                linkTo={(r) => `/affiliates/${r.client_id}`}
                tone="text-text-primary"
              />
            </Panel>
          </div>

          <Panel
            title="Daily"
            icon={ChartIcon}
            className="overflow-hidden"
            actions={
              <ToolButton icon={MapPin} onClick={() => navigate(`/zip-list?from=${from}&to=${to}`)}>
                Open Zip List
              </ToolButton>
            }
          >
            {trend.length === 0 ? (
              <div className="px-3 py-8 text-center text-[12px] text-text-muted">
                No activity in this period.
              </div>
            ) : (
              <div className="p-3">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
                            barCategoryGap="28%" barGap={2}>
                    <CartesianGrid stroke="#eef2f6" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDate}
                           tick={{ fill: '#94a3b8', fontSize: 11 }}
                           axisLine={{ stroke: '#dfe4ea' }} tickLine={false} minTickGap={26} />
                    <YAxis tickFormatter={axisMoney} tick={{ fill: '#94a3b8', fontSize: 11 }}
                           axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ background: '#fff', border: '1px solid #dfe4ea', borderRadius: 3, fontSize: 12 }}
                      labelFormatter={shortDate}
                      formatter={(v, n) => [usd(v), n]}
                    />
                    <Legend iconType="square" iconSize={9}
                            wrapperStyle={{ fontSize: 11.5, color: '#475569', paddingTop: 6 }} />
                    <Bar dataKey="revenue" name="Buyers pay us" fill="#00a99d" isAnimationActive={false} />
                    <Bar dataKey="cost" name="We pay affiliates" fill="#94a3b8" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
