import { useState } from 'react'
import { Check, Settings as SettingsIcon } from 'lucide-react'
import { clsx } from 'clsx'

import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { getPreferences, setPreferences } from '../lib/preferences.js'
import { PERIODS, periodRange } from '../lib/format.js'
import { Panel, PageHeader, ToolButton, selectCls } from '../components/ui.jsx'

/**
 * Per-device defaults, not a user profile -- there is no login yet, so
 * nothing here is tied to a person. Saved to localStorage and read by
 * useFilters() as the starting point for a fresh tab; changing it does
 * not touch a link already open with its own from/to/vertical in the URL.
 */
export default function Settings() {
  // A wide window so a vertical with no recent activity is still
  // selectable, rather than vanishing from the dropdown.
  const verticalsApi = useApi(() => api.verticals(periodRange('30d')), [])
  const verticalNames = (verticalsApi.data?.rows ?? []).map((r) => r.vertical).filter((v) => v && v !== '(unmapped)')

  const [prefs, setPrefs] = useState(getPreferences)
  const [saved, setSaved] = useState(false)

  const set = (k) => (v) => { setPrefs((p) => ({ ...p, [k]: v })); setSaved(false) }

  const save = () => {
    setPreferences(prefs)
    setSaved(true)
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Defaults for this browser -- applied to a fresh tab, not to links already open." />

      <Panel title="Default Filters" icon={SettingsIcon} className="overflow-hidden">
        <div className="flex flex-col gap-3 p-3">
          <label className="flex items-center gap-3">
            <span className="w-[140px] shrink-0 text-[12.5px] text-text-secondary">Default period</span>
            <select value={prefs.defaultPeriod} onChange={(e) => set('defaultPeriod')(e.target.value)} className={clsx(selectCls, 'w-[200px]')}>
              {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-3">
            <span className="w-[140px] shrink-0 text-[12.5px] text-text-secondary">Default vertical</span>
            <select value={prefs.defaultVertical} onChange={(e) => set('defaultVertical')(e.target.value)} className={clsx(selectCls, 'w-[200px]')}>
              <option value="">All Verticals</option>
              {verticalNames.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>

          <div className="mt-1 flex items-center gap-2">
            <ToolButton icon={saved ? Check : undefined} onClick={save} primary>
              {saved ? 'Saved' : 'Save'}
            </ToolButton>
            {saved && <span className="text-[11.5px] text-text-muted">Applies next time you open a page without its own filters in the link.</span>}
          </div>
        </div>
      </Panel>
    </>
  )
}
