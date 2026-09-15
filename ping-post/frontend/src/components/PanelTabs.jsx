import { clsx } from 'clsx'

/**
 * Tab strip inside a panel, as in the source dashboard's
 * "Revenue Summary / Leads Summary / ..." and
 * "Affiliates Snapshot / Advertisers Snapshot" rows.
 *
 * Distinct from the workspace TabBar: those switch pages, these switch
 * what one panel is showing. The active tab is white with a blue rule on
 * top and blue text; the rest sit in the grey strip. A tab with no data
 * is rendered disabled rather than hidden, so the shape of the report
 * stays honest about what it will eventually hold.
 */
export function PanelTabs({ tabs, active, onSelect, icon: Icon }) {
  return (
    <div className="flex h-[30px] shrink-0 items-stretch border-b border-grid bg-chrome">
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
              'flex items-center gap-2 border-r border-grid px-3.5 text-[13px]',
              tab.disabled && 'cursor-not-allowed text-text-muted',
              !tab.disabled && isActive &&
                'relative -mb-px border-b border-b-white bg-white text-primary shadow-[inset_0_2px_0_0_var(--color-primary)]',
              !tab.disabled && !isActive &&
                'text-text-secondary hover:bg-chrome-hover hover:text-text-primary',
            )}
          >
            {TabIcon && (
              <TabIcon size={13} className={isActive && !tab.disabled ? 'text-primary' : 'text-text-muted'} />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
