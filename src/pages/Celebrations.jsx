import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2, Plus } from 'lucide-react'
import { CELEBRATION_TYPES, getTypeInfo } from '../lib/celebrations'
import CelebrationCard from '../components/celebrations/CelebrationCard'

const PAGE_SIZE = 16

const FILTERS = [
  { key: 'all', label: 'All' },
  ...CELEBRATION_TYPES.map(t => ({ key: t.type, label: `${t.emoji} ${t.label}` })),
]

const TIER_ORDER = { spotlight: 0, grand: 1, featured: 2 }

async function loadPage(filter, offset) {
  let q = supabase
    .from('celebrations')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (filter !== 'all') q = q.eq('celebration_type', filter)

  const { data, count, error } = await q
  if (error || !data) return { rows: [], total: 0 }

  // Batch-fetch creator profiles
  const creatorIds = [...new Set(data.map(c => c.creator_id).filter(Boolean))]
  const honoreeIds = [...new Set(data.map(c => c.honoree_user_id).filter(Boolean))]
  const allIds = [...new Set([...creatorIds, ...honoreeIds])]

  let userMap = {}
  if (allIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, username')
      .in('id', allIds)
    userMap = Object.fromEntries((users || []).map(u => [u.id, u]))
  }

  const rows = data.map(c => ({
    ...c,
    creator:      userMap[c.creator_id]     || null,
    honoree_user: userMap[c.honoree_user_id] || null,
  }))

  return { rows, total: count || 0 }
}

export default function Celebrations() {
  const navigate = useNavigate()
  const [celebrations, setCelebrations] = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [filter, setFilter]             = useState('all')
  const [offset, setOffset]             = useState(0)
  const [activeSponsors, setActiveSponsors] = useState([])

  const fetchPage = useCallback(async (f, off, replace) => {
    if (off === 0) setLoading(true); else setLoadingMore(true)
    const { rows, total: t } = await loadPage(f, off)
    if (replace) {
      setCelebrations(rows)
    } else {
      setCelebrations(prev => [...prev, ...rows])
    }
    setTotal(t)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    setOffset(0)
    fetchPage(filter, 0, true)
  }, [filter, fetchPage])

  // Active category sponsorships for banner
  useEffect(() => {
    const now = new Date().toISOString()
    supabase
      .from('celebration_category_sponsorships')
      .select('id, company:company_id(id, name, logo_url), category_id, brand_message')
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .then(({ data }) => setActiveSponsors(data || []))
  }, [])

  const loadMore = () => {
    const next = offset + PAGE_SIZE
    setOffset(next)
    fetchPage(filter, next, false)
  }

  const hasMore = celebrations.length < total

  // Sort within loaded set: spotlight/grand full-width first, then featured, then rest — all by created_at within tier
  const sorted = useMemo(() => {
    return [...celebrations].sort((a, b) => {
      const ta = TIER_ORDER[a.tier] ?? 3
      const tb = TIER_ORDER[b.tier] ?? 3
      if (ta !== tb) return ta - tb
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [celebrations])

  const premium = sorted.filter(c => c.tier === 'grand' || c.tier === 'spotlight')
  const regular = sorted.filter(c => c.tier !== 'grand' && c.tier !== 'spotlight')

  // Unique sponsors for banner
  const uniqueSponsors = useMemo(() => {
    const seen = new Set()
    return activeSponsors.filter(s => {
      if (seen.has(s.company?.id)) return false
      seen.add(s.company?.id)
      return true
    })
  }, [activeSponsors])

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Philomni Celebrations 🎉</h1>
        <p className="text-muted-foreground mb-6">Share life's moments with the world</p>
        <button
          onClick={() => navigate('/celebrations/create')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm shadow-lg hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #14b8a6, #f59e0b)' }}
        >
          <Plus className="w-4 h-4" />
          Create a Celebration
        </button>
      </div>

      {/* Active sponsors banner */}
      {uniqueSponsors.length > 0 && (
        <div className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">Celebrations this period proudly sponsored by</span>
          {uniqueSponsors.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              {s.company?.logo_url && <img src={s.company.logo_url} alt={s.company.name} className="h-5 object-contain" />}
              <span className="text-xs font-semibold text-foreground">{s.company?.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border/60 rounded-2xl">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-bold text-foreground mb-1">No celebrations yet</p>
          <p className="text-sm text-muted-foreground mb-4">Be the first to share a celebration!</p>
          <button
            onClick={() => navigate('/celebrations/create')}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            Create One
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Grand / Spotlight — full width */}
          {premium.map(c => (
            <CelebrationCard key={c.id} celebration={c} />
          ))}

          {/* Regular grid */}
          {regular.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {regular.map(c => (
                <CelebrationCard key={c.id} celebration={c} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                Load more celebrations
                <span className="text-xs text-muted-foreground">({celebrations.length} of {total})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sponsor CTA */}
      <div className="mt-12 bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/20 rounded-2xl p-6 text-center">
        <p className="text-lg font-bold text-foreground mb-1">Is your brand ready to be part of life's biggest moments?</p>
        <p className="text-sm text-muted-foreground mb-4">Sponsor a celebration category and reach thousands of emotionally engaged users.</p>
        <button
          onClick={() => navigate('/celebrations/sponsor')}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Explore Brand Sponsorship
        </button>
      </div>
    </div>
  )
}
