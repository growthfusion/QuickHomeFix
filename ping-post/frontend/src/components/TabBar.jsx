import { clsx } from 'clsx'
import { X } from 'lucide-react'

/**
 * Workspace tabs, as in the source screens.
 *
 * The point of tabs here is comparison: an operator reconciling an
 * invoice wants the affiliate table and one affiliate's detail open at
 * once, and to flip between them without losing the filters on either.
 * Route state lives in the URL, so a tab is just a remembered URL.
 */
export function TabBar({ tabs, activeKey, onSelect, onClose }) {
  if (tabs.length === 0) return null

  return (
    <div className="flex h-[30px] shrink-0 items-end gap-px border-b border-grid bg-chrome px-1.5">
      {tabs.map((tab) => {
        const active = tab.key === activeKey
        return (
          <div
            key={tab.key}
            onClick={() => onSelect(tab)}
            className={clsx(
              'group flex h-[25px] cursor-pointer items-center gap-1.5 rounded-t-sm border border-b-0 px-2.5 text-[12px]',
              active
                ? 'border-grid bg-white font-medium text-primary'
                : 'border-transparent text-text-secondary hover:bg-chrome-hover',
            )}
          >
            {tab.icon && (
              <tab.icon size={12} className={active ? 'text-primary' : 'text-text-muted'} />
            )}
            <span className="max-w-[150px] truncate">{tab.title}</span>

            {/* The first tab is the app's home and cannot be closed --
                closing every tab would leave an empty shell. */}
            {tab.closable !== false && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(tab) }}
                className="ml-0.5 rounded-sm p-px text-text-muted opacity-0 transition-opacity hover:bg-grid hover:text-text-primary group-hover:opacity-100"
                title="Close tab"
              >
                <X size={11} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
