import { useState, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, Megaphone, List, MapPin, Wallet,
} from 'lucide-react'



import { HeaderBar } from './components/HeaderBar.jsx'
import { MenuBar } from './components/MenuBar.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { CreateModal } from './components/CreateModal.jsx'
import { MetaProvider } from './lib/useMeta.jsx'
import { TabBar } from './components/TabBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Finance from './pages/Finance.jsx'
import Affiliates from './pages/Affiliates.jsx'
import Buyers from './pages/Buyers.jsx'
import ClientDetail from './pages/ClientDetail.jsx'
import Leads from './pages/Leads.jsx'
import LeadDetail from './pages/LeadDetail.jsx'
import Campaigns from './pages/Campaigns.jsx'
import ZipList from './pages/ZipList.jsx'

// Maps a pathname to its tab identity. Detail routes fold into one tab
// per record, so opening three affiliates gives three tabs rather than
// one that keeps changing under you.
function tabFor(pathname) {
  const seg = pathname.split('/').filter(Boolean)

  if (seg.length === 0) return { key: '/', title: 'Dashboard', icon: LayoutDashboard, closable: false }

  const [root, id] = seg
  const base = {
    finance:    { title: 'Finance',    icon: Wallet },
    affiliates: { title: 'Affiliates', icon: Users },
    buyers:     { title: 'Buyers',     icon: Building2 },
    campaigns:  { title: 'Campaigns',  icon: Megaphone },
    leads:      { title: 'Leads',      icon: List },
    'zip-list': { title: 'Zip List',   icon: MapPin },
  }[root]

  if (!base) return null

  if (!id) return { key: `/${root}`, title: base.title, icon: base.icon }

  if (!id) return { key: `/${root}`, title: base.title, icon: base.icon }

  // The record's name is not known until its page loads, so the tab
  // shows the singular noun plus a short id rather than guessing.
  const singular = base.title.replace(/s$/, '')
  return { key: pathname, title: `${singular} ${String(id).slice(0, 10)}`, icon: base.icon }
}

const HOME = { key: '/', title: 'Dashboard', icon: LayoutDashboard, closable: false }

export default function App() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  const [tabs, setTabs] = useState([HOME])
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const [creating, setCreating] = useState(null)

  // Register the current route as a tab. Runs during render rather than
  // in an effect so the tab appears in the same paint as the page.
  const current = tabFor(pathname)
  const activeKey = current?.key ?? '/'
  if (current && !tabs.some((t) => t.key === current.key)) {
    setTabs((prev) => [...prev, { ...current, path: pathname + search }])
  }

  const select = useCallback((tab) => navigate(tab.path ?? tab.key), [navigate])

  const close = useCallback((tab) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.key !== tab.key)
      // Closing the active tab moves to its neighbour, never to a blank
      // screen.
      if (tab.key === activeKey) {
        const fallback = next[next.length - 1] ?? HOME
        navigate(fallback.path ?? fallback.key)
      }
      return next.length ? next : [HOME]
    })
  }, [activeKey, navigate])

  return (
    <MetaProvider>
    <div className="flex h-full flex-col bg-surface">
      <HeaderBar />
      <MenuBar />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={menuCollapsed}
          onToggle={() => setMenuCollapsed((c) => !c)}
          onCreate={setCreating}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TabBar tabs={tabs} activeKey={activeKey} onSelect={select} onClose={close} />
          <main className="min-h-0 flex-1 overflow-auto p-2">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/affiliates" element={<Affiliates />} />
              <Route path="/affiliates/:clientId" element={<ClientDetail side="affiliate" />} />
              <Route path="/buyers" element={<Buyers />} />
              <Route path="/buyers/:clientId" element={<ClientDetail side="buyer" />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:leadId" element={<LeadDetail />} />
              <Route path="/zip-list" element={<ZipList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {creating && (
        <CreateModal
          kind={creating}
          onClose={() => setCreating(null)}
          onSave={(record) => {
            // Held locally for now; LeadProsper owns most of these
            // records and our sync is one-directional.
            console.log('create', record)
            setCreating(null)
          }}
        />
      )}

      <div className="flex h-[22px] shrink-0 items-center gap-2 border-t border-grid bg-chrome px-2 text-[10.5px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Live · LeadProsper API
        </span>
        <span className="ml-auto">GrowthFusion Ping Post</span>
      </div>
    </div>
    </MetaProvider>
  )
}
