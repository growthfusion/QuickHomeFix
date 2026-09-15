import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie,
} from 'recharts'
import {
  Building2, CalendarDays, Filter, LineChart as ChartIcon, PieChart as PieIcon, RotateCcw, Users, Wallet,
} from 'lucide-react'
import { clsx } from 'clsx'

import { useFilters } from '../components/FilterBar.jsx'
import { PanelTabs } from '../components/PanelTabs.jsx'
import { DataTable, Pager } from '../components/DataTable.jsx'
import { api, clearCache } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { Panel, Money, RecordLink, AsyncBody, ErrorState, ToolButton, Toolbar, selectCls } from '../components/ui.jsx'
import { usd, num, pct, hourLabel, axisMoney, PERIODS, periodRange, periodKeyFor } from '../lib/format.js'

/**
 * The operations dashboard, laid out as the team's previous platform
 * was: toolbar, hourly summary chart with the partner table beneath it,
 * affiliate share and financial snapshot down the right.
 */

// Chart series: light blue for the primary measure, deep blue for the
// secondary. Validated as a pair; direct labels cover the light one.
const LIGHT = '#5b9bd5'
const DEEP = '#1f5fa8'
const PIE_COLORS = ['#8db850', '#7a55b0', '#6f9fdb', '#e0563f', '#d1a92a', '#1fa69e']
const OTHER = '#c7cfd8'

const tooltipStyle = {
  background: '#fff', border: '1px solid #d9dee4', borderRadius: 0,
  fontSize: 13, padding: '6px 10px', boxShadow: '0 4px 12px rgba(17,24,39,.10)',
}

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
function exportCsv(filename, columns, rows) {
  const lines = [columns.map((c) => esc(c.header)).join(',')]
  for (const r of rows) lines.push(columns.map((c) => esc(c.csv ? c.csv(r) : r[c.key])).join(','))
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/* Toolbar                                                             */
/* ------------------------------------------------------------------ */

function DashboardToolbar({ verticals }) {
  const { filters, setMany, reset } = useFilters()

  // Applied on "Filter Data", not per keystroke, as in the reference.
  const [vertical, setVertical] = useState(filters.vertical)
  const [period, setPeriod] = useState(() => periodKeyFor(filters))
  const [from, setFrom] = useState(filters.from)
  const [to, setTo] = useState(filters.to)

  const apply = () => {
    const r = period === 'custom' ? { from, to } : periodRange(period)
    setMany({ from: r.from, to: r.to, vertical })
  }
  const onReset = () => {
    setVertical(''); setPeriod('mtd')
    const r = periodRange('mtd'); setFrom(r.from); setTo(r.to)
    reset()
  }

  return (
    <Toolbar>
      <select value={vertical} onChange={(e) => setVertical(e.target.value)}
              className={clsx(selectCls, 'min-w-[200px]', !vertical && 'text-text-muted')}>
        <option value="">Vertical</option>
        {verticals.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>

      <select value={period} onChange={(e) => setPeriod(e.target.value)} className={clsx(selectCls, 'min-w-[140px]')}>
        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        <option value="custom">Custom Range</option>
      </select>

      {period === 'custom' && (
        <>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={clsx(selectCls, 'tnum')} />
          <span className="text-[11px] text-text-muted">→</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={clsx(selectCls, 'tnum')} />
        </>
      )}

      <ToolButton icon={Filter} onClick={apply} ghost>Filter Data</ToolButton>
      <ToolButton icon={RotateCcw} onClick={onReset} ghost>Reset</ToolButton>
    </Toolbar>
  )
}

/* ------------------------------------------------------------------ */
/* Summary chart (last 24 hours)                                       */
/* ------------------------------------------------------------------ */

const CHART_TABS = [
  { key: 'revenue', label: 'Revenue Summary' },
  { key: 'leads', label: 'Leads Summary' },
  { key: 'profit', label: 'Profit Summary' },
]

const CHART_SERIES = {
  revenue: { money: true, bars: [['revenue', 'Revenue', LIGHT], ['cost', 'Cost', DEEP]] },
  leads: { money: false, bars: [['leads', 'All Leads', LIGHT], ['accepted', 'Accepted Leads', DEEP]] },
  profit: { money: true, bars: [['profit', 'Profit', DEEP]] },
}

function SummaryChart({ data, tab }) {
  const { money, bars } = CHART_SERIES[tab]
  const fmt = money ? usd : num

  if (!data.some((d) => bars.some(([key]) => d[key]))) {
    return <div className="px-3 py-16 text-center text-[12px] text-text-muted">No leads received in the last 24 hours.</div>
  }

  return (
    <div className="px-3 pb-1 pt-2">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%" barGap={3}>
          <CartesianGrid stroke="#e3e7ec" vertical={false} />
          <XAxis dataKey="hour" tickFormatter={hourLabel} tick={{ fill: '#333', fontSize: 11.5 }}
                 axisLine={{ stroke: '#333' }} tickLine={{ stroke: '#333' }} interval={1} />
          <YAxis tickFormatter={money ? (v) => Math.round(v).toLocaleString('en-US') : num}
                 tick={{ fill: '#333', fontSize: 11.5 }} axisLine={{ stroke: '#333' }} tickLine={{ stroke: '#333' }} width={48} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={tooltipStyle}
                   labelFormatter={(v) => new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })}
                   formatter={(v, n) => [fmt(v), n]} />
          {bars.length > 1 && (
            <Legend verticalAlign="top" align="right" iconType="square" iconSize={12}
                    // Recharts lays a right-aligned legend out last-first; reversed so Revenue leads.
                    payload={[...bars].reverse().map(([key, name, color]) => ({ id: key, value: name, type: 'square', color }))}
                    wrapperStyle={{ fontSize: 12.5, color: '#333', paddingBottom: 8 }} />
          )}
          {bars.map(([key, name, color]) => (
            <Bar key={key} dataKey={key} name={name} fill={color} maxBarSize={14} isAnimationActive={false}>
              {tab === 'profit' && data.map((d, i) => <Cell key={i} fill={d.profit < 0 ? '#e65540' : color} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Affiliates metric pie chart                                         */
/* ------------------------------------------------------------------ */

const PIE_METRICS = [
  ['leads', 'All Leads', false], ['accepted', 'Accepted Leads', false],
  ['cost', 'Cost', true], ['revenue', 'Revenue', true], ['profit', 'Profit', true],
]

function AffiliatePie({ rows, metric, onMetric }) {
  const money = PIE_METRICS.find(([k]) => k === metric)[2]
  const fmt = money ? usd : num

  const slices = useMemo(() => {
    const sorted = rows.filter((r) => r[metric] > 0).sort((a, b) => b[metric] - a[metric])
    const top = sorted.slice(0, 5).map((r) => ({ name: r.name, value: r[metric] }))
    const rest = sorted.slice(5).reduce((a, r) => a + r[metric], 0)
    if (rest > 0) top.push({ name: `Other (${sorted.length - 5})`, value: rest, other: true })
    return top
  }, [rows, metric])

  const total = slices.reduce((a, s) => a + s.value, 0)
  const color = (s, i) => (s.other ? OTHER : PIE_COLORS[i])

  return (
    <div className="p-2">
      <select value={metric} onChange={(e) => onMetric(e.target.value)} className={clsx(selectCls, 'w-[150px]')}>
        {PIE_METRICS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>

      {!total ? (
        <div className="px-3 py-14 text-center text-[12px] text-text-muted">No affiliate activity in this period.</div>
      ) : (
        <div className="mt-1 flex items-center gap-3">
          <div className="h-[180px] w-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius={22} outerRadius={84}
                     stroke="#fff" strokeWidth={1} isAnimationActive={false} labelLine={false}
                     label={({ value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                       if (value / total < 0.06) return null
                       const r = innerRadius + (outerRadius - innerRadius) * 0.6
                       const a = (-midAngle * Math.PI) / 180
                       return (
                         <text x={cx + r * Math.cos(a)} y={cy + r * Math.sin(a)} fill="#1f2429" fontSize={12.5}
                               textAnchor="middle" dominantBaseline="central">
                           {money ? axisMoney(value) : num(value)}
                         </text>
                       )
                     }}>
                  {slices.map((s, i) => <Cell key={s.name} fill={color(s, i)} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${fmt(v)} · ${pct((v / total) * 100)}`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="min-w-0 flex-1 space-y-2 text-[12.5px]">
            {slices.map((s, i) => (
              <li key={s.name} className="flex items-center gap-2" title={`${s.name}: ${fmt(s.value)}`}>
                <span className="h-[12px] w-[12px] shrink-0" style={{ background: color(s, i) }} />
                <span className="truncate text-text-primary">{s.name}</span>
                <span className="tnum ml-auto shrink-0 text-text-muted">{pct((s.value / total) * 100)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Financial snapshot                                                  */
/* ------------------------------------------------------------------ */

const SNAPSHOT_COLUMNS = [
  { key: 'label', header: 'Period', csv: (r) => r.label },
  { key: 'cost', header: 'Cost' }, { key: 'revenue', header: 'Revenue' }, { key: 'profit', header: 'Profit' },
]

function FinancialSnapshot({ periods, onRefresh }) {
  const th = 'h-[30px] whitespace-nowrap border-t border-grid px-3 font-normal'
  const td = 'h-[32px] whitespace-nowrap px-3 tnum'
  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
      <table className="grid-table w-full text-[13px]">
        <thead className="bg-chrome">
          <tr>
            <th className={clsx(th, 'w-[30px]')} />
            <th className={clsx(th, 'text-left')}>Period</th>
            <th className={clsx(th, 'text-right')}>Cost</th>
            <th className={clsx(th, 'text-right')}>Revenue</th>
            <th className={clsx(th, 'text-right')}>Profit</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.key} className="bg-white hover:bg-row-hover">
              <td className="h-[32px] px-3 text-center"><CalendarDays size={13} className="inline text-text-secondary" /></td>
              <td className="h-[32px] whitespace-nowrap px-3 text-text-primary">{p.label}</td>
              <td className={clsx(td, 'text-right')}>{usd(p.cost, { cents: true })}</td>
              <td className={clsx(td, 'text-right')}>{usd(p.revenue, { cents: true })}</td>
              <td className={clsx(td, 'text-right', p.profit < 0 ? 'text-loss' : 'text-text-primary')}>
                {usd(p.profit, { cents: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pager page={1} totalPages={1} total={periods.length} pageSize={Math.max(1, periods.length)} onPage={() => {}}
             onRefresh={onRefresh} onExport={() => exportCsv('financial-snapshot.csv', SNAPSHOT_COLUMNS, periods)} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Affiliates / Advertisers snapshot                                   */
/* ------------------------------------------------------------------ */

const SNAPSHOT_TABS = [
  { key: 'affiliates', label: 'Affiliates Snapshot', icon: Users },
  { key: 'advertisers', label: 'Advertisers Snapshot', icon: Building2 },
]
const PAGE_SIZE = 50

const cell = (v, cls) => <span className={clsx('tnum', cls)}>{v}</span>

function PartnerSnapshot({ affiliates, buyers, range, onRefresh }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('affiliates')
  const [page, setPage] = useState(1)

  const isAff = tab === 'affiliates'
  const rows = (isAff ? affiliates?.rows : buyers?.rows) ?? []
  const sum = (k) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0)
  const path = isAff ? 'affiliates' : 'buyers'
  const Icon = isAff ? Users : Building2

  const columns = isAff ? [
    { key: 'icon', header: '', width: 30, sortable: false, render: () => <Icon size={12} className="inline text-text-muted" />, csv: () => '' },
    { key: 'name', header: 'Affiliate', render: (r) => <RecordLink onClick={() => navigate(`/${path}/${r.client_id}`)}>{r.name}</RecordLink>, csv: (r) => r.name },
    { key: 'cost', header: 'Cost', align: 'right', width: 120, render: (r) => <Money value={r.cost} cents /> },
    { key: 'revenue', header: 'Revenue', align: 'right', width: 120, render: (r) => <Money value={r.revenue} cents /> },
    { key: 'profit', header: 'Profit', align: 'right', width: 120, render: (r) => <Money value={r.profit} cents className={r.profit < 0 ? 'text-loss' : ''} /> },
    { key: 'margin', header: 'Margin', align: 'right', width: 90, render: (r) => cell(pct(r.margin)) },
  ] : [
    { key: 'icon', header: '', width: 30, sortable: false, render: () => <Icon size={12} className="inline text-text-muted" />, csv: () => '' },
    { key: 'name', header: 'Advertiser', render: (r) => <RecordLink onClick={() => navigate(`/${path}/${r.client_id}`)}>{r.name}</RecordLink>, csv: (r) => r.name },
    { key: 'leads', header: 'Offered', align: 'right', width: 100, render: (r) => cell(num(r.leads)) },
    { key: 'accepted', header: 'Bought', align: 'right', width: 100, render: (r) => cell(num(r.accepted)) },
    { key: 'accept_rate', header: 'Accept %', align: 'right', width: 90, render: (r) => cell(pct(r.accept_rate)) },
    { key: 'revenue', header: 'Revenue', align: 'right', width: 120, render: (r) => <Money value={r.revenue} cents /> },
    { key: 'net_revenue', header: 'Net Revenue', align: 'right', width: 120, render: (r) => <Money value={r.net_revenue} cents /> },
  ]

  const footer = isAff ? {
    name: `${rows.length} Affiliates`,
    cost: <Money value={sum('cost')} cents />, revenue: <Money value={sum('revenue')} cents />,
    profit: <Money value={sum('profit')} cents />,
    margin: cell(pct(sum('revenue') ? (sum('profit') / sum('revenue')) * 100 : 0)),
  } : {
    name: `${rows.length} Advertisers`,
    leads: cell(num(sum('leads'))), accepted: cell(num(sum('accepted'))),
    accept_rate: cell(pct(sum('leads') ? (sum('accepted') / sum('leads')) * 100 : 0)),
    revenue: <Money value={sum('revenue')} cents />, net_revenue: <Money value={sum('net_revenue')} cents />,
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <Panel className="min-h-0 flex-1 overflow-hidden" bodyClass="flex min-h-0 flex-col">
      <PanelTabs tabs={SNAPSHOT_TABS} active={tab} onSelect={(k) => { setTab(k); setPage(1) }} />
      <DataTable
        columns={columns}
        rows={pageRows}
        getRowId={(r) => r.client_id}
        onRowClick={(r) => navigate(`/${path}/${r.client_id}`)}
        initialSort={{ key: 'name', dir: 'asc' }}
        footer={footer}
        fill
        emptyMessage={`No ${isAff ? 'affiliate' : 'advertiser'} activity in this period.`}
      />
      <Pager
        page={safePage} totalPages={totalPages} total={rows.length} pageSize={PAGE_SIZE}
        onPage={setPage} onRefresh={onRefresh}
        onExport={() => exportCsv(`${tab}-${range.from}-to-${range.to}.csv`, columns.filter((c) => c.key !== 'icon'), rows)}
      />
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const { filters } = useFilters()
  const { from, to, vertical } = filters

  const [chartTab, setChartTab] = useState('revenue')
  const [pieMetric, setPieMetric] = useState('leads')

  const main = useApi(
    () => Promise.all([api.affiliates({ from, to, vertical }), api.buyers({ from, to, vertical })])
      .then(([affiliates, buyers]) => ({ affiliates, buyers })),
    [from, to, vertical],
  )
  const hourly = useApi(() => api.summaryHourly({ vertical }), [vertical])
  const snapshot = useApi(() => api.summarySnapshot({ vertical }), [vertical])
  const verticals = useApi(() => api.verticals(periodRange('30d')), [])
  const verticalNames = (verticals.data?.rows ?? []).map((r) => r.vertical).filter((v) => v && v !== '(unmapped)')

  const reloadAll = () => { clearCache(); main.reload(); hourly.reload(); snapshot.reload() }

  // One stale notice under the toolbar when a refresh fails; the panels
  // keep their last figures and stay quiet.
  const suppressed = main.error && main.data
  const panelError = (own) => (suppressed ? null : own)

  if (main.error && !main.data) {
    return (
      <div className="flex flex-col gap-2">
        <Panel className="overflow-hidden">
          <DashboardToolbar verticals={verticalNames} />
          <ErrorState error={main.error} onRetry={reloadAll} />
        </Panel>
      </div>
    )
  }

  // The page fills the viewport and never scrolls itself: the snapshot
  // table takes whatever height is left and scrolls inside its panel,
  // as the reference platform does.
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <Panel className="shrink-0 overflow-hidden">
        <DashboardToolbar verticals={verticalNames} />
        {suppressed && <AsyncBody loading={false} error={main.error} onRetry={reloadAll} hasData>{null}</AsyncBody>}
      </Panel>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(380px,34%)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-2">
          <Panel title="Summary Chart (Last 24 Hours)" icon={ChartIcon} className="shrink-0 overflow-hidden" bodyClass="flex flex-col">
            <PanelTabs tabs={CHART_TABS} active={chartTab} onSelect={setChartTab} />
            <AsyncBody loading={hourly.loading} error={panelError(hourly.error)} onRetry={hourly.reload} hasData={!!hourly.data} compact label="Loading chart">
              <SummaryChart data={hourly.data?.trend ?? []} tab={chartTab} />
            </AsyncBody>
          </Panel>

          <AsyncBody loading={main.loading} error={panelError(main.error)} onRetry={main.reload} hasData={!!main.data}>
            <PartnerSnapshot affiliates={main.data?.affiliates} buyers={main.data?.buyers} range={{ from, to }} onRefresh={reloadAll} />
          </AsyncBody>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-2">
          <Panel title="Affiliates Metric Pie Chart" icon={PieIcon} className="shrink-0 overflow-hidden">
            <AsyncBody loading={main.loading} error={panelError(main.error)} onRetry={main.reload} hasData={!!main.data} compact label="Loading">
              <AffiliatePie rows={main.data?.affiliates?.rows ?? []} metric={pieMetric} onMetric={setPieMetric} />
            </AsyncBody>
          </Panel>

          <Panel title="Financial Snapshot" icon={Wallet} className="min-h-0 flex-1 overflow-hidden" bodyClass="flex min-h-0 flex-col">
            <AsyncBody loading={snapshot.loading} error={panelError(snapshot.error)} onRetry={snapshot.reload} hasData={!!snapshot.data} compact label="Loading">
              <FinancialSnapshot periods={snapshot.data?.periods ?? []} onRefresh={reloadAll} />
            </AsyncBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}
