import { clsx } from 'clsx'

/**
 * Tab strip inside a panel, as in the source dashboard's
 * "Revenue Summary / Leads Summary / ..." and
 * "Affiliates Snapshot / Advertisers Snapshot" rows.
 *
 * Distinct from the workspace TabBar: those switch pages, these switch
 * what one panel is showing. A tab with no data is rendered disabled
 * rather than hidden, so the shape of the report stays honest about
 * what it will eventually hold.
 */
export function PanelTabs({ tabs, active, onSelect, icon: Icon }) {
  return (
    <div className="flex h-[26px] shrink-0 items-end gap-0 border-b border-grid bg-chrome px-1">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        const TabIcon = tab.icon ?? Icon

        return (
          <button
            key={tab.key}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onSelect(tab.key)}
            title={tab.disabled ? tab.disabledReason : undefined}
            className={clsx(
              'flex h-[22px] items-center gap-1.5 rounded-t-sm border border-b-0 px-2.5 text-[11.5px]',
              tab.disabled && 'cursor-not-allowed border-transparent text-text-muted opacity-55',
              !tab.disabled && isActive &&
                'border-grid bg-white font-medium text-primary',
              !tab.disabled && !isActive &&
                'border-transparent text-text-secondary hover:bg-chrome-hover hover:text-text-primary',
            )}
          >
            {TabIcon && (
              <TabIcon size={11} className={isActive && !tab.disabled ? 'text-primary' : 'text-text-muted'} />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
