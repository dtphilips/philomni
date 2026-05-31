import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchCelebrations } from '../lib/queries'
import { Loader2, Plus } from 'lucide-react'
import { CELEBRATION_TYPES, getTypeInfo } from '../lib/celebrations'
import CelebrationCard from '../components/celebrations/CelebrationCard'

const FILTERS = [
  { key: 'all', label: 'All' },
  ...CELEBRATION_TYPES.map(t => ({ key: t.type, label: `${t.emoji} ${t.label}` })),
]

export default function Celebrations() {
  const navigate = useNavigate()
  const [celebrations, setCelebrations] = useState([])
  const [sponsors, setSponsors]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')

  // 5-second safety net
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // Uses centralized fetchCelebrations from src/lib/queries.js
      const [cels, sponsRes] = await Promise.all([
        fetchCelebrations(60),
        supabase.from('celebration_sponsors').select('*').eq('status', 'active'),
      ])
      setCelebrations(cels)
      setSponsors(sponsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return celebrations
    return celebrations.filter(c => c.celebration_type === filter)
  }, [celebrations, filter])

  // Grand/Sponsored go full-width at very top
  const grand    = filtered.filter(c => c.tier === 'grand' || c.tier === 'sponsored')
  const regular  = filtered.filter(c => c.tier !== 'grand' && c.tier !== 'sponsored')

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

      {/* Active sponsors bar */}
      {sponsors.length > 0 && (
        <div className="bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">Celebrations this month proudly sponsored by</span>
          {sponsors.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              {s.logo_url && <img src={s.logo_url} alt={s.brand_name} className="h-5 object-contain" />}
              <span className="text-xs font-semibold text-foreground">{s.brand_name}</span>
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
      ) : filtered.length === 0 ? (
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
          {/* Grand / Sponsored — full width */}
          {grand.map(c => (
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
