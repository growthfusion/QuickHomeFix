import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  ChevronLeft, ChevronRight, ChevronDown, Monitor,
  Users, Building2, List, CheckCircle2, XCircle, RotateCcw, Wallet,
} from 'lucide-react'

/**
 * Left "Main Menu" tree, as in the source screens.
 *
 * Only the areas someone lives inside for a while: Overview, Leads,
 * Finance. Everything else (Zip List, Create, Performance) moved to the
 * top menu bar, which is for jumping between areas rather than working
 * through one. Every group starts collapsed -- none is more "default"
 * than another, and a reload always resets to the same closed state
 * rather than remembering what was open.
 */
const GROUPS = [
  {
    label: 'Overview',
    icon: Monitor,
    items: [
      { label: 'Dashboard', to: '/', icon: Monitor },
      { label: 'Finance', to: '/finance', icon: Wallet },
    ],
  },
  {
    label: 'Leads',
    icon: List,
    items: [
      { label: 'All Leads', to: '/leads', icon: List },
      { label: 'Accepted', to: '/leads?status=accepted', icon: CheckCircle2 },
      { label: 'Errors', to: '/leads?status=error', icon: XCircle },
      { label: 'Duplicated', to: '/leads?status=duplicated', icon: RotateCcw },
    ],
  },
  {
    label: 'Finance',
    icon: Wallet,
    items: [
      { label: 'Affiliates', to: '/affiliates', icon: Users },
      { label: 'Buyers', to: '/buyers', icon: Building2 },
    ],
  },
]

export function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const here = pathname + search

  const [open, setOpen] = useState(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, Boolean(g.defaultOpen)])),
  )

  if (collapsed) {
    return (
      <aside className="flex w-[30px] shrink-0 flex-col items-center border-r border-grid bg-white pt-2">
        <button
          onClick={onToggle}
          title="Expand menu"
          className="p-1 text-primary hover:bg-chrome"
        >
          <ChevronRight size={16} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex w-[210px] shrink-0 flex-col border-r border-grid bg-white">
      <div className="flex h-[34px] shrink-0 items-center justify-between border-b border-grid px-3">
        <span className="text-[13px] font-semibold text-text-primary">Main Menu</span>
        <button
          onClick={onToggle}
          title="Collapse menu"
          className="p-0.5 text-primary hover:bg-chrome"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {GROUPS.map((group) => {
          const GroupIcon = group.icon
          const isOpen = open[group.label]

          return (
            <div key={group.label}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [group.label]: !o[group.label] }))}
                className="flex w-full items-center gap-2.5 px-3 py-[6px] text-[13px] text-text-primary hover:bg-chrome"
              >
                <GroupIcon size={14} className="text-text-secondary" />
                {group.label}
                <ChevronDown
                  size={13}
                  className={clsx(
                    'ml-auto text-primary transition-transform',
                    !isOpen && '-rotate-90',
                  )}
                />
              </button>

              {isOpen && group.items.map((item) => {
                const ItemIcon = item.icon
                const active = here === item.to

                return (
                  <button
                    key={item.to}
                    onClick={() => navigate(item.to)}
                    className={clsx(
                      'flex w-full items-center gap-2.5 py-[5px] pl-8 pr-3 text-left text-[13px]',
                      active
                        ? 'bg-primary-light text-primary'
                        : 'text-text-primary hover:bg-row-hover',
                    )}
                  >
                    <ItemIcon size={13} className={active ? 'text-primary' : 'text-text-secondary'} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
