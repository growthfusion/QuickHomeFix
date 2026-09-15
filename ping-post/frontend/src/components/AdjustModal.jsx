import { useState } from 'react'
import { X } from 'lucide-react'
import { usd } from '../lib/format.js'

/**
 * Manual adjustment form -- the only write surface in the whole system.
 *
 * The period fields are mandatory and prominent because an override
 * without a date range cannot be applied correctly: the API only honours
 * an override when the query window fully contains its period.
 */
export function AdjustModal({ entity, entityType, syncedField, onClose, onSubmit }) {
  const isAffiliate = entityType === 'affiliate'
  const moneyField = isAffiliate ? 'cost_override' : 'revenue_override'
  const syncedValue = entity[syncedField]

  const [field, setField] = useState(moneyField)
  const [value, setValue] = useState(String(syncedValue?.toFixed(2) ?? ''))
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [createdBy, setCreatedBy] = useState('')

  const isNote = field === 'note'
  const valid =
    createdBy.trim() &&
    periodStart && periodEnd && periodStart <= periodEnd &&
    (isNote ? value.trim() : Number.isFinite(Number(value)))

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSubmit({
      entity_type: entityType,
      entity_id: entity[isAffiliate ? 'affiliate_id' : 'buyer_id'],
      field,
      value: isNote ? value.trim() : Number(value).toFixed(2),
      period_start: periodStart,
      period_end: periodEnd,
      created_by: createdBy.trim(),
    })
  }

  const inputCls =
    'h-9 w-full rounded-md border border-border bg-surface px-2.5 text-[13px] ' +
    'text-text-primary outline-none placeholder:text-text-muted focus:border-primary'
  const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-muted'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-[14px] font-semibold text-text-primary">
              Manual adjustment
            </div>
            <div className="mt-0.5 text-[12px] text-text-muted">{entity.name}</div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3.5 px-4 py-4">
          <div>
            <label className={labelCls}>Field</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className={inputCls}
            >
              <option value={moneyField}>
                {isAffiliate ? 'Cost override' : 'Revenue override'}
              </option>
              <option value="note">Note</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>
              {isNote ? 'Note' : 'New value'}
            </label>
            {isNote ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                placeholder="Internal annotation…"
                className={inputCls.replace('h-9', 'h-auto py-2')}
              />
            ) : (
              <>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={`${inputCls} tnum`}
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  Synced value for this range: {usd(syncedValue, { cents: true })}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Period start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className={`${inputCls} tnum`}
              />
            </div>
            <div>
              <label className={labelCls}>Period end</label>
              <input
                type="date"
                value={periodEnd}
                min={periodStart || undefined}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className={`${inputCls} tnum`}
              />
            </div>
          </div>

          <p className="rounded-md bg-surface px-3 py-2 text-[11px] leading-relaxed text-text-muted">
            The override applies only when the selected date range fully
            contains this period. A partly-overlapping range shows the synced
            value instead, marked <span className="text-accent">partial</span>.
          </p>

          <div>
            <label className={labelCls}>Your name</label>
            <input
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="e.g. mukilan"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Self-reported until login is added.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-md px-3 text-[13px] text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="h-8 rounded-md bg-primary px-3.5 text-[13px] font-medium text-white
                         disabled:cursor-not-allowed disabled:bg-border disabled:text-text-muted"
            >
              Save adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
