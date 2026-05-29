import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Loader2, Share2, Radio, ArrowLeft } from 'lucide-react'
import GoLiveModal from '../components/GoLiveModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(startedAt, endedAt) {
  if (!startedAt || !endedAt) return '—'
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-muted/60 rounded-2xl p-4 text-center">
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-2xl font-black text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export default function LiveRecap() {
  const { id: liveId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [live, setLive] = useState(null)
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGoLive, setShowGoLive] = useState(false)

  // ─── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: liveData }, { data: giftsData }] = await Promise.all([
        supabase.from('lives').select('*').eq('id', liveId).single(),
        supabase.from('live_gifts').select('*').eq('live_id', liveId).order('created_at'),
      ])
      setLive(liveData)
      setGifts(giftsData || [])
      setLoading(false)
    }
    load()
  }, [liveId])

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const totalGiftValue = useMemo(() => {
    return gifts.reduce((sum, g) => sum + (g.total_coins || 0) / 100, 0)
  }, [gifts])

  const earnings = (totalGiftValue * 0.70).toFixed(2)

  // ─── Gift breakdown grouped by gift type ────────────────────────────────────
  const giftBreakdown = useMemo(() => {
    const map = {}
    gifts.forEach(g => {
      const key = g.gift_name || 'Gift'
      if (!map[key]) map[key] = { emoji: g.gift_emoji || '🎁', name: key, qty: 0, totalCoins: 0 }
      map[key].qty += g.quantity || 1
      map[key].totalCoins += g.total_coins || 0
    })
    return Object.values(map).sort((a, b) => b.totalCoins - a.totalCoins)
  }, [gifts])

  // ─── Top gifters ────────────────────────────────────────────────────────────
  const topGifters = useMemo(() => {
    const map = {}
    gifts.forEach(g => {
      const key = g.sender_id || g.sender_name
      if (!map[key]) map[key] = { name: g.sender_name || 'Anonymous', avatar: g.sender_avatar, coins: 0 }
      map[key].coins += g.total_coins || 0
    })
    return Object.values(map).sort((a, b) => b.coins - a.coins).slice(0, 5)
  }, [gifts])

  // ─── Share ──────────────────────────────────────────────────────────────────
  const handleShare = () => {
    const text = `I just went LIVE on Philomni!\n${live?.viewer_count || 0} viewers | ${gifts.length} gifts received\nJoin me at philomni.vercel.app`
    if (navigator.share) {
      navigator.share({ title: 'My Live Recap', text }).catch(() => navigator.clipboard.writeText(text))
    } else {
      navigator.clipboard.writeText(text)
      alert('Stats copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!live) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Live not found.</p>
        <button onClick={() => navigate('/profile')} className="mt-4 text-primary underline text-sm">Back to Profile</button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <div className="text-5xl mb-4">🎬</div>
        <h1 className="text-2xl font-black text-foreground mb-1">Live Ended</h1>
        <p className="text-muted-foreground font-medium line-clamp-2 px-4">{live.title}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="Duration"
          value={formatDuration(live.started_at, live.ended_at)}
        />
        <StatCard
          label="Peak Viewers"
          value={(live.peak_viewers || 0).toLocaleString()}
        />
        <StatCard
          label="Total Gifts"
          value={`$${totalGiftValue.toFixed(2)}`}
          sub={`${gifts.length} gift${gifts.length !== 1 ? 's' : ''} received`}
        />
        <StatCard
          label="Your Earnings"
          value={`$${earnings}`}
          sub="70% of gift value"
        />
      </div>

      {/* Gift breakdown */}
      {giftBreakdown.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4 shadow-sm">
          <h2 className="font-bold text-sm mb-3 text-foreground">Gift Breakdown</h2>
          <div className="space-y-2">
            {giftBreakdown.map(g => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="text-2xl">{g.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">×{g.qty}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-amber-500">🪙 {g.totalCoins.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">${(g.totalCoins / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top gifters */}
      {topGifters.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4 shadow-sm">
          <h2 className="font-bold text-sm mb-3 text-foreground">🏆 Top Gifters</h2>
          <div className="space-y-3">
            {topGifters.map((g, i) => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="text-base font-black text-amber-500 w-5 text-center">#{i + 1}</span>
                {g.avatar
                  ? <img src={g.avatar} alt={g.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">{(g.name || '?')[0].toUpperCase()}</div>
                }
                <p className="flex-1 text-sm font-medium text-foreground truncate">{g.name}</p>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-amber-500">🪙 {g.coins.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty gifts state */}
      {gifts.length === 0 && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 mb-4 text-center shadow-sm">
          <div className="text-4xl mb-2">🎁</div>
          <p className="text-muted-foreground text-sm">No gifts received this stream</p>
        </div>
      )}

      {/* Share section */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 mb-6 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-3">Share your live stats</p>
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share Stats
        </button>
      </div>

      {/* Bottom buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowGoLive(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Go Live Again
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
      </div>

      {/* Go Live Again modal */}
      {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} />}
    </div>
  )
}
