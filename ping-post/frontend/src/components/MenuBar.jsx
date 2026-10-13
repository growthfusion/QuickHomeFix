import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Building2, Users, Megaphone, List, Layers, Plus,
  MapPin, BarChart3, Settings as SettingsIcon, ChevronDown, LogOut, Wallet,
  FileText, Tag, SlidersHorizontal,
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
    label: 'Create',
    icon: Plus,
    items: [
      { label: 'Advertiser', create: 'advertiser' },
      { label: 'Contract', create: 'contract' },
      { label: 'Affiliate', create: 'affiliate' },
      { label: 'Campaign', create: 'campaign' },
      { label: 'Vertical', create: 'vertical' },
      { label: 'Offer', create: 'offer' },
      { label: 'Adjustment', create: 'adjustment' },
    ],
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

export function MenuBar({ onOpen, onCreate }) {
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
    if (item.create) { onCreate?.(item.create); return }
    onOpen?.(item)
    navigate(item.to)
  }

  return (
    <div
      ref={barRef}
      className="flex h-[40px] shrink-0 items-stretch border-b border-grid bg-white px-2"
    >
      {MENUS.map((menu, i) => {
        const Icon = menu.icon
        const isOpen = open === i

        return (
          <div key={menu.label} className="relative flex">
            <button
              onClick={() => (menu.to ? go(menu) : setOpen(isOpen ? null : i))}
              onMouseEnter={() => open !== null && !menu.to && setOpen(i)}
              className={clsx(
                'flex items-center gap-2 px-3 text-[13px] transition-colors',
                isOpen ? 'bg-chrome text-primary' : 'text-text-primary hover:bg-chrome',
              )}
            >
              <Icon size={15} className={isOpen ? 'text-primary' : 'text-text-secondary'} />
              {menu.label}
              {menu.items && (
                <ChevronDown
                  size={12}
                  className={clsx('text-text-secondary transition-transform', isOpen && 'rotate-180')}
                />
              )}
            </button>

            {isOpen && menu.items && (
              <div className="absolute left-0 top-[40px] z-50 min-w-[200px] border border-grid bg-white py-1 shadow-[0_6px_20px_rgba(17,24,39,.14)]">
                {menu.items.map((item, j) =>
                  item.divider ? (
                    <div key={j} className="my-1 border-t border-grid" />
                  ) : (
                    <button
                      key={j}
                      onClick={() => go(item)}
                      className="flex w-full items-center px-3 py-[6px] text-left text-[13px] text-text-primary hover:bg-row-hover hover:text-primary"
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

      <div className="ml-auto flex items-stretch">
        <button onClick={() => go({ to: '/settings' })} className="flex items-center gap-2 px-3 text-[13px] text-text-primary hover:bg-chrome">
          <SettingsIcon size={15} className="text-text-secondary" />
          Settings
        </button>
        <button title="Not wired up -- there is no login to sign out of yet" disabled
                className="flex cursor-not-allowed items-center gap-2 px-3 text-[13px] text-text-muted opacity-50">
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  )
}

export { MENUS }
