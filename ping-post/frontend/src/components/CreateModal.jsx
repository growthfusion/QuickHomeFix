import { useState } from 'react'
import { X } from 'lucide-react'
import { useMeta } from '../lib/useMeta.jsx'

/**
 * Create dialogs, modelled on the source screens: grouped sections with
 * an underlined heading, label-left / field-right rows, and
 * Save & Continue / Cancel at the foot.
 *
 * Records are held locally for now. LeadProsper owns affiliates,
 * advertisers and campaigns, and our sync is one-directional, so nothing
 * here writes back to it -- the dialog exists so the flow is in place
 * when that connection is made.
 */

const ACCOUNT_MANAGERS = ['Mukilan', 'Adithya', 'Kevin Maxwell', 'Jennifer Kingston']
const STATUSES = ['Active', 'Paused', 'Inactive']
const MODES = ['Ping Post', 'Direct Post', 'Real Time']

// Each form is described as data so the dialog body stays one renderer.
// type: text | select | textarea | number | date
export function buildForms(meta) {
  const AFFILIATE_OPTS = meta.affiliates.map((a) => ({ value: a.id, label: a.name }))
  const BUYER_OPTS = meta.buyers.map((b) => ({ value: b.id, label: b.name }))
  const CAMPAIGN_OPTS = meta.campaigns.map((c) => ({ value: c.id, label: c.name }))

  return {
  advertiser: {
    title: 'Create Advertiser',
    sections: [
      {
        heading: 'Advertiser Information',
        fields: [
          { key: 'name', label: 'Advertiser', type: 'text', required: true },
          { key: 'account_manager', label: 'Account Manager', type: 'select', options: ACCOUNT_MANAGERS, required: true },
          { key: 'status', label: 'Status', type: 'select', options: STATUSES, required: true },
        ],
      },
      {
        heading: 'Additional Information',
        fields: [
          { key: 'website', label: 'Website', type: 'text' },
          { key: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
    ],
  },

  contract: {
    title: 'Create Contract',
    sections: [
      {
        heading: 'Contract Information',
        fields: [
          { key: 'buyer_id', label: 'Buyer', type: 'select', required: true,
            options: BUYER_OPTS },
          { key: 'campaign_id', label: 'Campaign', type: 'select', options: CAMPAIGN_OPTS, required: true },
          { key: 'payout', label: 'Payout', type: 'number', prefix: '$' },
        ],
      },
      {
        heading: 'Term',
        fields: [
          { key: 'starts_on', label: 'Start Date', type: 'date', required: true },
          { key: 'ends_on', label: 'End Date', type: 'date' },
        ],
      },
    ],
  },

  affiliate: {
    title: 'Create Affiliate',
    sections: [
      {
        heading: 'Affiliate Information',
        fields: [
          { key: 'name', label: 'Affiliate', type: 'text', required: true },
          { key: 'account_manager', label: 'Account Manager', type: 'select', options: ACCOUNT_MANAGERS, required: true },
          { key: 'status', label: 'Status', type: 'select', options: STATUSES, required: true },
        ],
      },
      {
        heading: 'Additional Information',
        fields: [
          { key: 'website', label: 'Website', type: 'text' },
          { key: 'notes', label: 'Internal Notes', type: 'textarea' },
        ],
      },
    ],
  },

  campaign: {
    title: 'Create Campaign',
    sections: [
      {
        heading: 'Offer Information',
        fields: [
          { key: 'campaign_id', label: 'Campaign', type: 'select', options: CAMPAIGN_OPTS, required: true },
          { key: 'offer', label: 'Offer', type: 'select', options: ['Standard', 'Exclusive', 'Shared'] },
        ],
      },
      {
        heading: 'Campaign Information',
        fields: [
          { key: 'affiliate_id', label: 'Affiliate', type: 'select', required: true,
            options: AFFILIATE_OPTS },
          { key: 'name', label: 'Campaign', type: 'text', required: true },
          { key: 'mode', label: 'Mode', type: 'select', options: MODES },
        ],
      },
    ],
  },

  vertical: {
    title: 'Create Vertical',
    sections: [
      {
        heading: 'Vertical Information',
        fields: [
          { key: 'name', label: 'Vertical', type: 'text', required: true },
          { key: 'status', label: 'Status', type: 'select', options: STATUSES, required: true },
        ],
      },
    ],
  },

  adjustment: {
    title: 'Create Adjustment',
    sections: [
      {
        heading: 'Entity',
        fields: [
          { key: 'entity_type', label: 'Type', type: 'select', required: true,
            options: [{ value: 'affiliate', label: 'Affiliate' }, { value: 'buyer', label: 'Buyer' }] },
          { key: 'entity_id', label: 'Record', type: 'select', required: true,
options: [...AFFILIATE_OPTS, ...BUYER_OPTS] },
          { key: 'field', label: 'Field', type: 'select', required: true,
            options: [
              { value: 'cost_override', label: 'Cost Override' },
              { value: 'revenue_override', label: 'Revenue Override' },
              { value: 'note', label: 'Note' },
            ] },
          { key: 'value', label: 'Value', type: 'text', required: true },
        ],
      },
      {
        heading: 'Period',
        // An override only applies when the query window fully contains
        // this range, so both dates are mandatory.
        fields: [
          { key: 'period_start', label: 'Start Date', type: 'date', required: true },
          { key: 'period_end', label: 'End Date', type: 'date', required: true },
          { key: 'created_by', label: 'Your Name', type: 'text', required: true },
        ],
      },
    ],
  },

  offer: {
    title: 'Create Offer',
    sections: [
      {
        heading: 'Offer Information',
        fields: [
          { key: 'name', label: 'Offer', type: 'text', required: true },
          { key: 'campaign_id', label: 'Campaign', type: 'select', options: CAMPAIGN_OPTS, required: true },
          { key: 'buyer_id', label: 'Buyer', type: 'select',
            options: BUYER_OPTS },
        ],
      },
      {
        heading: 'Pricing',
        fields: [
          { key: 'payout', label: 'Payout', type: 'number', prefix: '$' },
          { key: 'cap', label: 'Daily Cap', type: 'number' },
        ],
      },
    ],
  },
  }
}

const inputCls =
  'h-[24px] w-full rounded-sm border border-grid bg-white px-1.5 text-[12px] ' +
  'text-text-primary outline-none focus:border-primary'

function Field({ field, value, onChange }) {
  const opts = (field.options ?? []).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  )

  return (
    <div className="flex items-start gap-2 py-[3px]">
      <label className="w-[118px] shrink-0 pt-[4px] text-[12px] text-text-primary">
        {field.label}:
      </label>

      <div className="flex-1">
        {field.type === 'select' ? (
          <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
          >
            <option value="" />
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            rows={3}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls.replace('h-[24px]', 'h-auto py-1')}
          />
        ) : (
          <div className="relative">
            {field.prefix && (
              <span className="pointer-events-none absolute left-1.5 top-[4px] text-[12px] text-text-muted">
                {field.prefix}
              </span>
            )}
            <input
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              step={field.type === 'number' ? '0.01' : undefined}
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className={`${inputCls} ${field.prefix ? 'pl-4' : ''} ${field.type !== 'text' ? 'tnum' : ''}`}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function CreateModal({ kind, onClose, onSave }) {
  const meta = useMeta()
  const form = buildForms(meta)[kind]
  const [values, setValues] = useState({})

  if (!form) return null

  const required = form.sections.flatMap((s) => s.fields.filter((f) => f.required))
  const valid = required.every((f) => String(values[f.key] ?? '').trim())

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSave?.({ kind, ...values })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 pt-[14vh]"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-[560px] rounded-sm border border-grid bg-white shadow-[0_10px_40px_rgba(17,24,39,.22)]"
      >
        <div className="flex h-[30px] items-center justify-between border-b border-grid bg-chrome px-2.5">
          <span className="text-[12.5px] font-semibold text-text-primary">{form.title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-0.5 text-text-muted hover:bg-chrome-hover hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-2.5">
          {form.sections.map((section) => (
            <div key={section.heading} className="mb-3 last:mb-0">
              {/* Section rule: label, then a line running to the right
                  edge -- the same divider the source dialogs use. */}
              <div className="mb-1.5 flex items-center gap-2">
                <span className="shrink-0 text-[12px] text-text-primary">{section.heading}</span>
                <span className="h-px flex-1 bg-primary/40" />
              </div>

              {section.fields.map((f) => (
                <Field
                  key={f.key}
                  field={f}
                  value={values[f.key]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-grid bg-chrome px-2.5 py-2">
          <button
            type="submit"
            disabled={!valid}
            className="h-[24px] rounded-sm border border-grid bg-white px-2.5 text-[12px] text-text-primary
                       hover:bg-chrome-hover disabled:opacity-40 disabled:hover:bg-white"
          >
            Save &amp; Continue...
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[24px] rounded-sm bg-primary px-3 text-[12px] font-medium text-white hover:bg-primary-hover"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
