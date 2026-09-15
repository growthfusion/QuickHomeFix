import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { Columns3, Check, RotateCcw } from 'lucide-react'

/**
 * Lets the operator choose which columns a table shows.
 *
 * The choice is stored per table in localStorage rather than in the URL:
 * it is a personal preference that should survive across sessions, and
 * putting sixteen column names in the query string would make every
 * shared link unreadable.
 */
export function useColumns(tableKey, allColumns, defaultKeys) {
  const storageKey = `pp.cols.${tableKey}`

  const [selected, setSelected] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (Array.isArray(saved) && saved.length) {
        // Drop anything that no longer exists, so a renamed column
        // cannot leave a table permanently missing a field.
        const valid = new Set(allColumns.map((c) => c.key))
        const kept = saved.filter((k) => valid.has(k))
        if (kept.length) return kept
      }
    } catch {
      // Private mode, cleared storage, corrupt value -- fall through.
    }
    return defaultKeys ?? allColumns.map((c) => c.key)
  })

  const persist = (keys) => {
    setSelected(keys)
    try { localStorage.setItem(storageKey, JSON.stringify(keys)) } catch { /* ignore */ }
  }

  const reset = () => {
    try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
    setSelected(defaultKeys ?? allColumns.map((c) => c.key))
  }

  // Columns that cannot be hidden (the name, the row actions) stay in
  // place regardless, and order always follows the table's definition
  // rather than the order they were ticked.
  const visible = allColumns.filter(
    (c) => c.always || selected.includes(c.key),
  )

  return { visible, selected, setSelected: persist, reset }
}

/**
 * Recomputes header bands after columns are hidden.
 *
 * Bands are declared as spans over the full column list, so hiding a
 * column would otherwise leave a band covering the wrong cells. This
 * walks the original spans and counts how many of each band's columns
 * actually survived.
 */
export function visibleGroups(allColumns, groups, visible) {
  if (!groups) return undefined

  const shown = new Set(visible.map((c) => c.key))
  const out = []
  let i = 0

  for (const g of groups) {
    const slice = allColumns.slice(i, i + g.span)
    i += g.span
    const span = slice.filter((c) => shown.has(c.key)).length
    if (span > 0) out.push({ ...g, span })
  }

  return out.length ? out : undefined
}

export function ColumnPicker({ allColumns, selected, onChange, onReset }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const away = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const toggleable = allColumns.filter((c) => !c.always && c.header)

  const toggle = (key) => {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    )
  }

  // Group the menu the same way the table bands them, so finding a
  // column in the list matches where it sits on screen.
  const sections = []
  for (const c of toggleable) {
    const band = c.band ?? 'Columns'
    let sec = sections.find((s) => s.band === band)
    if (!sec) sections.push((sec = { band, cols: [] }))
    sec.cols.push(c)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Choose columns"
        className={clsx(
          'flex h-[23px] items-center gap-1.5 rounded-sm border px-2 text-[11.5px] transition-colors',
          open
            ? 'border-primary bg-primary-light text-primary'
            : 'border-grid bg-white text-text-primary hover:bg-chrome-hover',
        )}
      >
        <Columns3 size={12} />
        Columns
        <span className="tnum text-text-muted">
          {toggleable.filter((c) => selected.includes(c.key)).length}/{toggleable.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[26px] z-50 max-h-[70vh] w-[230px] overflow-y-auto rounded-sm border border-grid bg-white py-1 shadow-[0_6px_20px_rgba(17,24,39,.16)]">
          {sections.map((sec) => (
            <div key={sec.band}>
              <div className="border-b border-grid bg-chrome px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {sec.band}
              </div>
              {sec.cols.map((c) => {
                const on = selected.includes(c.key)
                return (
                  <button
                    key={c.key}
                    onClick={() => toggle(c.key)}
                    className="flex w-full items-center gap-2 px-2.5 py-[4px] text-left text-[11.5px] text-text-primary hover:bg-row-hover"
                  >
                    <span
                      className={clsx(
                        'flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-[2px] border',
                        on ? 'border-primary bg-primary text-white' : 'border-grid bg-white',
                      )}
                    >
                      {on && <Check size={9} strokeWidth={3} />}
                    </span>
                    {c.header}
                  </button>
                )
              })}
            </div>
          ))}

          <button
            onClick={() => { onReset(); setOpen(false) }}
            className="mt-1 flex w-full items-center gap-1.5 border-t border-grid px-2.5 py-1.5 text-[11px] text-text-secondary hover:bg-chrome hover:text-text-primary"
          >
            <RotateCcw size={11} />
            Reset to default
          </button>
        </div>
      )}
    </div>
  )
}
