import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Loader2, ExternalLink, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getTypeInfo, getTierInfo } from '../../lib/celebrations'

const TABS = ['Active', 'Pending Payments', 'Brand Sponsors', 'Stats']

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-muted/60 rounded-2xl p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-black text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminCelebrations() {
  const navigate = useNavigate()
  const [tab, setTab]               = useState(0)
  const [celebrations, setCelebrations] = useState([])
  const [pending, setPending]           = useState([])
  const [sponsors, setSponsors]         = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)

  const load = async () => {
    setLoading(true)
    const [{ data: active }, { data: pend }, { data: spons }] = await Promise.all([
      supabase.from('celebrations').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(100),
      supabase.from('celebrations').select('*').eq('payment_status', 'pending').order('created_at', { ascending: false }),
      supabase.from('celebration_sponsors').select('*').order('created_at', { ascending: false }),
    ])
    setCelebrations(active || [])
    setPending(pend || [])
    setSponsors(spons || [])

    // Compute stats
    const all = active || []
    const revenue = pend?.filter(c => c.payment_status === 'paid').reduce((s, c) => s + (c.tier_price || 0), 0) || 0
    const typeCounts = {}
    all.forEach(c => { typeCounts[c.celebration_type] = (typeCounts[c.celebration_type] || 0) + 1 })
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
    const totalWishes = all.reduce((s, c) => s + (c.wish_count || 0), 0)
    setStats({ total: all.length, revenue, topType: topType?.[0], totalWishes })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const togglePin = async (c) => {
    await supabase.from('celebrations').update({ is_pinned: !c.is_pinned }).eq('id', c.id)
    setCelebrations(prev => prev.map(x => x.id === c.id ? { ...x, is_pinned: !x.is_pinned } : x))
  }

  const removeCelebration = async (c) => {
    if (!window.confirm('Remove this celebration?')) return
    await supabase.from('celebrations').update({ status: 'removed' }).eq('id', c.id)
    setCelebrations(prev => prev.filter(x => x.id !== c.id))
  }

  const markPaid = async (c) => {
    await supabase.from('celebrations').update({ payment_status: 'paid', status: 'active' }).eq('id', c.id)
    setPending(prev => prev.filter(x => x.id !== c.id))
  }

  const activateSponsor = async (s) => {
    await supabase.from('celebration_sponsors').update({ status: 'active', start_date: new Date().toISOString().slice(0, 10) }).eq('id', s.id)
    setSponsors(prev => prev.map(x => x.id === s.id ? { ...x, status: 'active' } : x))
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Celebrations Admin</h1>
        <p className="text-sm text-muted-foreground">Manage all celebrations, payments, and brand sponsors</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${tab === i ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
            {i === 1 && pending.length > 0 && (
              <span className="ml-1.5 bg-destructive text-white text-[9px] px-1.5 py-0.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 0: Active Celebrations */}
      {tab === 0 && (
        <div className="space-y-3">
          {celebrations.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No active celebrations.</p>
          )}
          {celebrations.map(c => {
            const typeInfo = getTypeInfo(c.celebration_type)
            const tierInfo = getTierInfo(c.tier)
            return (
              <div key={c.id} className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {c.honoree_photo_url
                    ? <img src={c.honoree_photo_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">{typeInfo.emoji}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground truncate">{c.title}</span>
                    <span className={`text-xs font-bold ${tierInfo.color}`}>{tierInfo.badge} {tierInfo.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Honoring: {c.honoree_name} · By: {c.creator_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>👁️ {c.view_count || 0}</span>
                    <span>💬 {c.wish_count || 0}</span>
                    <span>Expires: {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => togglePin(c)} title={c.is_pinned ? 'Unpin' : 'Pin'} className={`p-2 rounded-lg transition-colors ${c.is_pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}>
                    {c.is_pinned ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => navigate(`/celebrations/${c.id}`)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeCelebration(c)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 1: Pending Payments */}
      {tab === 1 && (
        <div className="space-y-3">
          {pending.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No pending payments.</p>
          )}
          {pending.map(c => {
            const tierInfo = getTierInfo(c.tier)
            return (
              <div key={c.id} className="bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">By {c.creator_name} · {tierInfo.badge} {tierInfo.label} — ${tierInfo.price}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full font-semibold">Pending</span>
                  <button
                    onClick={() => markPaid(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 2: Brand Sponsors */}
      {tab === 2 && (
        <div className="space-y-3">
          {sponsors.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No sponsorship inquiries yet.</p>
          )}
          {sponsors.map(s => (
            <div key={s.id} className="bg-card border border-border/60 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground">{s.brand_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      s.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                      s.status === 'expired' ? 'bg-muted text-muted-foreground' :
                      'bg-amber-500/20 text-amber-500'
                    }`}>{s.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Contact: {s.contact_name} — {s.contact_email}</p>
                  <p className="text-xs text-muted-foreground">Package: {s.package} · Budget: {s.monthly_budget ? `$${s.monthly_budget}/mo` : '—'}</p>
                  {s.categories?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Categories: {s.categories.join(', ')}</p>
                  )}
                  {s.campaign_goals && (
                    <p className="text-xs text-muted-foreground mt-1">Goals: {s.campaign_goals.slice(0, 100)}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</p>
                </div>
                {s.status === 'inquiry' && (
                  <button
                    onClick={() => activateSponsor(s)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Stats */}
      {tab === 3 && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total Active" value={stats.total} />
            <StatBox label="Total Wishes" value={stats.totalWishes} />
            <StatBox label="Pending Sponsors" value={sponsors.filter(s => s.status === 'inquiry').length} />
            <StatBox label="Active Sponsors" value={sponsors.filter(s => s.status === 'active').length} />
          </div>

          {stats.topType && (
            <div className="bg-card border border-border/60 rounded-2xl p-4">
              <p className="text-sm font-bold text-foreground mb-1">Most Popular Type</p>
              <p className="text-lg">{getTypeInfo(stats.topType).emoji} {getTypeInfo(stats.topType).label}</p>
            </div>
          )}

          {/* Tier breakdown */}
          <div className="bg-card border border-border/60 rounded-2xl p-4">
            <p className="text-sm font-bold text-foreground mb-3">Breakdown by Tier</p>
            <div className="space-y-2">
              {['basic', 'featured', 'grand', 'sponsored'].map(tier => {
                const count = celebrations.filter(c => c.tier === tier).length
                const pct   = celebrations.length > 0 ? Math.round((count / celebrations.length) * 100) : 0
                const info  = getTierInfo(tier)
                return (
                  <div key={tier} className="flex items-center gap-3">
                    <span className={`w-20 text-xs font-semibold ${info.color}`}>{info.badge} {info.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
