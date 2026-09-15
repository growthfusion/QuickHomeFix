import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Wallet, User } from 'lucide-react'

import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { DataTable } from '../components/DataTable.jsx'
import { Panel, PageHeader, Money, Badge, AsyncBody } from '../components/ui.jsx'
import { dateTime, STATUS_STYLE } from '../lib/format.js'

function Field({ label, children, mono }) {
  return (
    <div className="flex items-start gap-2 border-b border-grid px-2 py-[5px] last:border-0">
      <span className="w-[110px] shrink-0 text-[11px] text-text-muted">{label}</span>
      <span className={`text-[12px] text-text-primary ${mono ? 'tnum' : ''}`}>
        {children || <span className="text-text-muted">—</span>}
      </span>
    </div>
  )
}

export default function LeadDetail() {
  const { leadId } = useParams()
  const { data: l, loading, error, reload } = useApi(() => api.lead(leadId), [leadId])

  const buyerCols = [
    { key: 'name', header: 'Buyer', render: (r) => <span className="text-text-primary">{r.name}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => <Badge className={STATUS_STYLE[r.status] ?? STATUS_STYLE.PENDING}>{r.status}</Badge>,
    },
    { key: 'sell_price', header: 'Sell Price', align: 'right', render: (r) => <Money value={r.sell_price} cents /> },
    {
      key: 'error_message', header: 'Message',
      render: (r) => <span className="text-text-muted">{r.error_message || '—'}</span>,
    },
  ]

  return (
    <>
      <Link to="/leads" className="mb-2 inline-flex items-center gap-1.5 text-[11.5px] text-text-muted hover:text-text-primary">
        <ArrowLeft size={12} /> Leads
      </Link>

      <AsyncBody loading={loading} error={error} onRetry={reload} label="Loading lead">
        {!l ? null : (
          <>
            <PageHeader
              title={`${l.first_name} ${l.last_name}`.trim() || l.lead_id}
              actions={<Badge className={STATUS_STYLE[l.status] ?? STATUS_STYLE.PENDING}>{l.status}</Badge>}
            />

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
              <Panel title="Routing" icon={Users}>
                <Field label="Lead ID" mono>{l.lead_id}</Field>
                <Field label="Received">{dateTime(l.received_at)}</Field>
                <Field label="Campaign">{l.campaign_name}</Field>
                <Field label="Affiliate">{l.affiliate}</Field>
                <Field label="Buyer">{l.buyer}</Field>
                {l.error_message && <Field label="Error">{l.error_message}</Field>}
                {l.returned && <Field label="Return reason">{l.return_reason}</Field>}
              </Panel>

              <Panel title="Money" icon={Wallet}>
                <Field label="Cost"><Money value={l.cost} cents /></Field>
                <Field label="Revenue"><Money value={l.revenue} cents /></Field>
                <Field label="Profit"><Money value={l.profit} cents signed /></Field>
                <Field label="Offered to" mono>{l.pings} buyers</Field>
                <Field label="Bought by" mono>{l.accepted_by}</Field>
              </Panel>

              <Panel title="Contact" icon={User}>
                <Field label="Name">{`${l.first_name} ${l.last_name}`.trim()}</Field>
                <Field label="Address">{l.address}</Field>
                <Field label="City">{[l.city, l.state].filter(Boolean).join(', ')}</Field>
                <Field label="Zip" mono>{l.zip_code}</Field>
                <Field label="Phone" mono>{l.phone}</Field>
                <Field label="Email">{l.email}</Field>
              </Panel>
            </div>

            <Panel title="Buyer Results" icon={Users} className="mt-2 overflow-hidden">
              <DataTable
                columns={buyerCols}
                rows={l.buyers ?? []}
                getRowId={(r) => r.buyer_id}
              />
            </Panel>

            {l.lead_data && Object.keys(l.lead_data).length > 0 && (
              <Panel title="Lead Data" className="mt-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {Object.entries(l.lead_data).map(([k, v]) => (
                    <Field key={k} label={k}>
                      <span className="break-all">{String(v).slice(0, 120)}</span>
                    </Field>
                  ))}
                </div>
              </Panel>
            )}
          </>
        )}
      </AsyncBody>
    </>
  )
}
