import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  ChevronLeft, ChevronRight, ChevronDown, Monitor, Plus,
  Users, Building2, List, CheckCircle2, XCircle, RotateCcw,
  Clock, MapPin, Megaphone, Layers, Wallet, FileText, Tag, SlidersHorizontal,
} from 'lucide-react'

/**
 * Left "Main Menu" tree, as in the source screens.
 *
 * Duplicates what the top menu bar offers, deliberately: the top bar is
 * for jumping between areas, this is for living inside one. Groups stay
 * open so an operator working through leads keeps the whole lead
 * workflow in view.
 */
const GROUPS = [
  {
    label: 'Zip List',
    icon: MapPin,
    defaultOpen: true,
    items: [
      { label: 'All Zips', to: '/zip-list', icon: MapPin },
    ],
  },
  {
    label: 'Overview',
    icon: Monitor,
    defaultOpen: true,
    items: [
      { label: 'Dashboard', to: '/', icon: Monitor },
      { label: 'Finance', to: '/finance', icon: Wallet },
    ],
  },
  {
    label: 'Create',
    icon: Plus,
    items: [
      { label: 'Advertiser', create: 'advertiser', icon: Building2 },
      { label: 'Contract',   create: 'contract',   icon: FileText },
      { label: 'Affiliate',  create: 'affiliate',  icon: Users },
      { label: 'Campaign',   create: 'campaign',   icon: Megaphone },
      { label: 'Vertical',   create: 'vertical',   icon: Layers },
      { label: 'Offer',      create: 'offer',      icon: Tag },
      { label: 'Adjustment', create: 'adjustment', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Leads',
    icon: List,
    defaultOpen: true,
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
    defaultOpen: true,
    items: [
      { label: 'Ledger', to: '/finance', icon: Wallet },
      { label: 'Affiliates', to: '/affiliates', icon: Users },
      { label: 'Buyers', to: '/buyers', icon: Building2 },
    ],
  },
  {
    label: 'Performance',
    icon: Layers,
    items: [
      { label: 'Campaigns', to: '/campaigns', icon: Megaphone },
    ],
  },
]

export function Sidebar({ collapsed, onToggle, onCreate }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const here = pathname + search

  const [open, setOpen] = useState(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, Boolean(g.defaultOpen)])),
  )

  if (collapsed) {
    return (
      <aside className="flex w-[26px] shrink-0 flex-col items-center border-r border-grid bg-white pt-1.5">
        <button
          onClick={onToggle}
          title="Expand menu"
          className="rounded-sm p-1 text-text-muted hover:bg-chrome hover:text-text-primary"
        >
          <ChevronRight size={13} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex w-[186px] shrink-0 flex-col border-r border-grid bg-white">
      <div className="flex h-[26px] shrink-0 items-center justify-between border-b border-grid bg-chrome px-2">
        <span className="text-[11.5px] font-semibold text-text-primary">Main Menu</span>
        <button
          onClick={onToggle}
          title="Collapse menu"
          className="rounded-sm p-0.5 text-text-muted hover:bg-chrome-hover hover:text-text-primary"
        >
          <ChevronLeft size={13} />
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
                className="flex w-full items-center gap-1.5 px-2 py-[5px] text-[11.5px] text-text-primary hover:bg-chrome"
              >
                <GroupIcon size={12} className="text-text-secondary" />
                {group.label}
                <ChevronDown
                  size={11}
                  className={clsx(
                    'ml-auto text-text-muted transition-transform',
                    !isOpen && '-rotate-90',
                  )}
                />
              </button>

              {isOpen && group.items.map((item) => {
                const ItemIcon = item.icon
                const active = Boolean(item.to) && here === item.to

                return (
                  <button
                    key={(item.to ?? item.create) + item.label}
                    onClick={() => (item.create ? onCreate?.(item.create) : navigate(item.to))}
                    className={clsx(
                      'flex w-full items-center gap-1.5 py-[4px] pl-6 pr-2 text-left text-[11.5px]',
                      active
                        ? 'border-l-2 border-primary bg-primary-light pl-[22px] font-medium text-primary'
                        : 'text-text-secondary hover:bg-row-hover hover:text-text-primary',
                    )}
                  >
                    <ItemIcon size={11} className={active ? 'text-primary' : 'text-text-muted'} />
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
