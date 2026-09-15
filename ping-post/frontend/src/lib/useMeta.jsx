import { createContext, useContext, useMemo } from 'react'
import { api } from './api.js'
import { useApi } from './useApi.js'

/**
 * Campaign, affiliate and buyer lists, fetched once and shared.
 *
 * Every filter dropdown needs these, and /campaigns is one upstream
 * call against a 100/min account budget -- so it is fetched at the app
 * root and read from context rather than re-requested per page.
 */
const MetaContext = createContext(null)

export function MetaProvider({ children }) {
  const { data, loading, error, reload } = useApi(() => api.campaigns(), [])

  const value = useMemo(() => {
    const campaigns = data?.rows ?? []

    // A supplier or buyer appears once per campaign it takes part in,
    // so dedupe by client_id -- the billing entity, and what the user
    // means when they pick "Upyield".
    const byClient = (key) => {
      const m = new Map()
      for (const c of campaigns) {
        for (const p of c[key] ?? []) {
          if (!m.has(p.client_id)) m.set(p.client_id, { id: p.client_id, name: p.name })
        }
      }
      return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
    }

    return {
      campaigns: campaigns.map((c) => ({
        id: c.campaign_id,
        name: c.name,
        type: c.campaign_type,
      })),
      affiliates: byClient('affiliates'),
      buyers: byClient('buyers'),
      loading,
      error,
      reload,
    }
  }, [data, loading, error, reload])

  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>
}

export function useMeta() {
  const ctx = useContext(MetaContext)
  if (!ctx) throw new Error('useMeta must be used inside <MetaProvider>')
  return ctx
}
