import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Building2, Users, Megaphone, List, Layers,
  MapPin, BarChart3, Settings as SettingsIcon, ChevronDown, LogOut, Wallet,
} from 'lucide-react'

/**
 * Top menu bar with dropdowns, modelled on the LeadProsper screens the
 * team already works in.
 *
 * Menus are grouped by the noun being worked on, not by page, so an
 * operator looking for "what do we owe Upyield" opens Affiliates rather
 * than hunting a flat list.
 */
const MENUS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/',
  },
  {
    label: 'Zip List',
    icon: MapPin,
    to: '/zip-list',
  },
  {
    label: 'Finance',
    icon: Wallet,
    items: [
      { label: 'Ledger', to: '/finance' },
      { divider: true },
      { label: 'Owed to Affiliates', to: '/affiliates' },
      { label: 'Due from Buyers', to: '/buyers' },
    ],
  },
  {
    label: 'Buyers',
    icon: Building2,
    items: [
      { label: 'All Buyers', to: '/buyers' },
      { label: 'Revenue Owed', to: '/buyers?sort=revenue' },
      { divider: true },
      { label: 'Buyer x Affiliate', to: '/buyers?view=by-affiliate' },
    ],
  },
  {
    label: 'Affiliates',
    icon: Users,
    items: [
      { label: 'All Affiliates', to: '/affiliates' },
      { label: 'Cost Owed', to: '/affiliates?sort=cost' },
    ],
  },
  {
    label: 'Campaigns',
    icon: Megaphone,
    to: '/campaigns',
  },
  {
    label: 'Leads',
    icon: List,
    items: [
      { label: 'All Leads', to: '/leads' },
      { label: 'Accepted', to: '/leads?status=accepted' },
      { label: 'Errors', to: '/leads?status=error' },
      { label: 'Duplicated', to: '/leads?status=duplicated' },
    ],
  },
]

export function MenuBar({ onOpen }) {
  const [open, setOpen] = useState(null)
  const navigate = useNavigate()
  const barRef = useRef(null)

  // Click-away and Escape both close the menu. Without this the dropdown
  // stays open behind whatever you click next.
  useEffect(() => {
    if (open === null) return
    const away = (e) => { if (!barRef.current?.contains(e.target)) setOpen(null) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const go = (item) => {
    setOpen(null)
    onOpen?.(item)
    navigate(item.to)
  }

  return (
    <div
      ref={barRef}
      className="flex h-[34px] shrink-0 items-center border-b border-grid bg-chrome px-1.5"
    >
      {MENUS.map((menu, i) => {
        const Icon = menu.icon
        const isOpen = open === i

        return (
          <div key={menu.label} className="relative">
            <button
              onClick={() => (menu.to ? go(menu) : setOpen(isOpen ? null : i))}
              onMouseEnter={() => open !== null && !menu.to && setOpen(i)}
              className={clsx(
                'flex h-[26px] items-center gap-1.5 rounded-sm px-2.5 text-[12px] transition-colors',
                isOpen
                  ? 'bg-white text-primary shadow-[0_1px_2px_rgba(17,24,39,.08)]'
                  : 'text-text-primary hover:bg-chrome-hover',
              )}
            >
              <Icon size={13} className={isOpen ? 'text-primary' : 'text-text-secondary'} />
              {menu.label}
              {menu.items && (
                <ChevronDown
                  size={11}
                  className={clsx('transition-transform', isOpen && 'rotate-180')}
                />
              )}
            </button>

            {isOpen && menu.items && (
              <div className="absolute left-0 top-[30px] z-50 min-w-[196px] rounded-sm border border-grid bg-white py-1 shadow-[0_6px_20px_rgba(17,24,39,.14)]">
                {menu.items.map((item, j) =>
                  item.divider ? (
                    <div key={j} className="my-1 border-t border-grid" />
                  ) : (
                    <button
                      key={j}
                      onClick={() => go(item)}
                      className="flex w-full items-center px-3 py-[5px] text-left text-[12px] text-text-primary hover:bg-row-hover hover:text-primary"
                    >
                      {item.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        )
      })}

      <div className="ml-auto flex items-center gap-1 pr-1">
        <button className="flex h-[26px] items-center gap-1.5 rounded-sm px-2.5 text-[12px] text-text-secondary hover:bg-chrome-hover">
          <SettingsIcon size={13} />
          Settings
        </button>
        <button className="flex h-[26px] items-center gap-1.5 rounded-sm px-2.5 text-[12px] text-text-secondary hover:bg-chrome-hover">
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </div>
  )
}

export { MENUS }
