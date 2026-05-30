import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Loader2, Share2, ArrowLeft, Download, ExternalLink, UserPlus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  getTypeInfo, getTierInfo, REACTIONS,
} from '../lib/celebrations'

// ─── Digital Certificate ──────────────────────────────────────────────────────
function DigitalCertificate({ celebration }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 800, H = 560
    canvas.width  = W
    canvas.height = H

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#0f0f23')
    bg.addColorStop(1, '#1a1a3e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Gold border
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth   = 6
    ctx.strokeRect(16, 16, W - 32, H - 32)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth   = 1.5
    ctx.strokeRect(24, 24, W - 48, H - 48)

    // Corner decorations
    const corners = [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]]
    corners.forEach(([x, y]) => {
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
    })

    // Philomni logo text
    ctx.fillStyle = '#8b5cf6'
    ctx.font      = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PHILOMNI', W / 2, 70)

    ctx.fillStyle = '#f59e0b'
    ctx.font      = 'italic 13px sans-serif'
    ctx.fillText('Certificate of Celebration', W / 2, 95)

    // Divider
    ctx.strokeStyle = '#f59e0b44'
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(120, 110)
    ctx.lineTo(W - 120, 110)
    ctx.stroke()

    // Type emoji + label
    const typeInfo = getTypeInfo(celebration.celebration_type)
    ctx.font      = '40px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(typeInfo.emoji, W / 2, 170)

    ctx.font      = 'bold 28px sans-serif'
    ctx.fillStyle = '#f59e0b'
    ctx.fillText(celebration.title, W / 2, 220)

    // Honoree
    ctx.font      = '16px sans-serif'
    ctx.fillStyle = '#ffffff99'
    ctx.fillText('Celebrating', W / 2, 265)

    ctx.font      = 'bold 32px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(celebration.honoree_name, W / 2, 310)

    // Message excerpt
    const excerpt = (celebration.message || '').slice(0, 80)
    ctx.font      = 'italic 14px sans-serif'
    ctx.fillStyle = '#ffffff70'
    ctx.fillText(`"${excerpt}${celebration.message?.length > 80 ? '…' : ''}"`, W / 2, 360)

    // Date
    ctx.font      = '13px sans-serif'
    ctx.fillStyle = '#ffffff50'
    ctx.fillText(new Date(celebration.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, 400)

    // Footer
    ctx.strokeStyle = '#f59e0b44'
    ctx.beginPath()
    ctx.moveTo(120, 430)
    ctx.lineTo(W - 120, 430)
    ctx.stroke()

    ctx.font      = '12px sans-serif'
    ctx.fillStyle = '#ffffff40'
    ctx.fillText('Celebrated by the Philomni Community', W / 2, 460)
    ctx.fillText('philomni.app', W / 2, 480)
  }, [celebration])

  useEffect(() => { draw() }, [draw])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href     = canvas.toDataURL('image/png')
    a.download = `celebration-${celebration.honoree_name?.replace(/\s+/g, '-')}.png`
    a.click()
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-foreground">🏅 Digital Certificate</h3>
        <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-500 text-xs font-semibold hover:bg-amber-500/30 transition-colors">
          <Download className="w-3.5 h-3.5" /> Download PNG
        </button>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-xl border border-border/40" style={{ maxHeight: 280, objectFit: 'contain' }} />
    </div>
  )
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────
function ReactionBar({ celebration, user }) {
  const [counts, setCounts]     = useState({})
  const [myReaction, setMy]     = useState(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('celebration_reactions')
        .select('reaction, user_id')
        .eq('celebration_id', celebration.id)

      const c = {}
      data?.forEach(r => {
        c[r.reaction] = (c[r.reaction] || 0) + 1
        if (r.user_id === user?.id) setMy(r.reaction)
      })
      setCounts(c)
    }
    load()
  }, [celebration.id, user?.id])

  const react = async (key) => {
    if (!user || loading) return
    setLoading(true)
    if (myReaction === key) {
      // Remove reaction
      await supabase.from('celebration_reactions').delete()
        .eq('celebration_id', celebration.id)
        .eq('user_id', user.id)
      setCounts(c => ({ ...c, [key]: Math.max(0, (c[key] || 1) - 1) }))
      setMy(null)
    } else {
      if (myReaction) {
        await supabase.from('celebration_reactions').delete()
          .eq('celebration_id', celebration.id)
          .eq('user_id', user.id)
        setCounts(c => ({ ...c, [myReaction]: Math.max(0, (c[myReaction] || 1) - 1) }))
      }
      await supabase.from('celebration_reactions').upsert({
        celebration_id: celebration.id,
        user_id: user.id,
        reaction: key,
      })
      setCounts(c => ({ ...c, [key]: (c[key] || 0) + 1 }))
      setMy(key)
    }
    setLoading(false)
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4">
      <h3 className="font-bold text-sm text-foreground mb-3">React</h3>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(r => (
          <button
            key={r.key}
            onClick={() => react(r.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              myReaction === r.key
                ? 'border-primary bg-primary/15 text-primary scale-105'
                : 'border-border/60 bg-muted hover:border-primary/40'
            }`}
          >
            <span className="text-base">{r.emoji}</span>
            <span className="text-xs">{r.label}</span>
            {counts[r.key] > 0 && <span className="text-xs font-bold text-muted-foreground">{counts[r.key]}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Wishes Section ───────────────────────────────────────────────────────────
function WishesSection({ celebration, user }) {
  const [wishes, setWishes]     = useState([])
  const [text, setText]         = useState('')
  const [anon, setAnon]         = useState(false)
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    supabase.from('celebration_wishes').select('*')
      .eq('celebration_id', celebration.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setWishes(data || []))
  }, [celebration.id])

  // Realtime
  useEffect(() => {
    const channel = supabase.channel(`wishes-${celebration.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'celebration_wishes', filter: `celebration_id=eq.${celebration.id}` },
        payload => setWishes(prev => [payload.new, ...prev]))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [celebration.id])

  const sendWish = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await supabase.from('celebration_wishes').insert({
      celebration_id: celebration.id,
      sender_id:      anon ? null : (user?.id || null),
      sender_name:    anon ? null : (user?.full_name || user?.email || 'Someone'),
      sender_avatar:  anon ? null : (user?.avatar_url || null),
      message:        text.trim(),
      is_anonymous:   anon,
    })
    // Bump wish_count
    await supabase.from('celebrations').update({ wish_count: (celebration.wish_count || 0) + 1 }).eq('id', celebration.id)
    setText('')
    setSending(false)
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4">
      <h3 className="font-bold text-sm text-foreground mb-4">💬 Send a Wish to {celebration.honoree_name}</h3>

      <div className="space-y-3 mb-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write your wish..."
          rows={3}
          className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} className="rounded" />
            <span className="text-xs text-muted-foreground">Send anonymously</span>
          </label>
          <button
            onClick={sendWish}
            disabled={!text.trim() || sending}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            {sending && <Loader2 className="w-3 h-3 animate-spin" />}
            Send Wish 🎉
          </button>
        </div>
      </div>

      {wishes.length > 0 && (
        <div className="space-y-3">
          <div className="border-t border-border/50 pt-3" />
          {wishes.map(w => (
            <div key={w.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 overflow-hidden">
                {!w.is_anonymous && w.sender_avatar
                  ? <img src={w.sender_avatar} alt="" className="w-full h-full object-cover" />
                  : (w.is_anonymous ? '?' : (w.sender_name?.[0] || '?'))
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {w.is_anonymous ? 'Anonymous' : (w.sender_name || 'Someone')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(w.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{w.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Who is celebrating section ──────────────────────────────────────────────
function WhoIsCelebrating({ celebration, honoreeUser }) {
  const copyInvite = () => {
    const url = `${window.location.origin}/signup?ref=celebration&name=${encodeURIComponent(celebration.honoree_name)}`
    navigator.clipboard.writeText(url)
    alert('Invite link copied!')
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 mb-4 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4 text-center">Who is celebrating whom</p>
      <div className="flex items-center justify-center gap-4">
        {/* Creator card */}
        <Link
          to={`/profile/${celebration.creator_id}`}
          className="flex flex-col items-center gap-2 group flex-1 max-w-[140px]"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors">
            {celebration.creator_avatar
              ? <img src={celebration.creator_avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">{celebration.creator_name?.[0] || '?'}</div>
            }
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{celebration.creator_name}</p>
            <p className="text-[10px] text-muted-foreground">Celebrating</p>
            <span className="text-[10px] text-primary flex items-center justify-center gap-0.5 mt-0.5"><ExternalLink className="w-2.5 h-2.5" />View Profile</span>
          </div>
        </Link>

        {/* Middle */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-3xl">🎉</span>
          <span className="text-[9px] text-muted-foreground font-medium">is celebrating</span>
        </div>

        {/* Honoree card */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
          {honoreeUser ? (
            <Link
              to={`/profile/${celebration.honoree_user_id}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400/60 group-hover:border-amber-400 transition-colors">
                {honoreeUser.avatar_url
                  ? <img src={honoreeUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-amber-400/20 flex items-center justify-center text-amber-500 font-bold text-xl">{celebration.honoree_name?.[0]}</div>
                }
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{celebration.honoree_name}</p>
                <p className="text-[10px] text-muted-foreground">Honoree</p>
                <span className="text-[10px] text-primary flex items-center justify-center gap-0.5 mt-0.5"><ExternalLink className="w-2.5 h-2.5" />View Profile</span>
              </div>
            </Link>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                {celebration.honoree_photo_url
                  ? <img src={celebration.honoree_photo_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xl">{celebration.honoree_name?.[0] || '?'}</div>
                }
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground line-clamp-1">{celebration.honoree_name}</p>
                <p className="text-[10px] text-muted-foreground">Honoree</p>
                <button
                  onClick={copyInvite}
                  className="mt-1 text-[10px] text-primary flex items-center justify-center gap-0.5 hover:underline"
                >
                  <UserPlus className="w-2.5 h-2.5" /> Invite to Philomni
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Honoree profile snippet if on Philomni */}
      {honoreeUser && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {honoreeUser.headline && <p className="text-xs text-muted-foreground">{honoreeUser.headline}</p>}
              {honoreeUser.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{honoreeUser.bio}</p>}
            </div>
            <Link
              to={`/profile/${celebration.honoree_user_id}`}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              View {celebration.honoree_name}'s Profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CelebrationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [celebration, setCelebration]   = useState(null)
  const [honoreeUser, setHonoreeUser]   = useState(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('celebrations').select('*').eq('id', id).single()
      setCelebration(data)
      setLoading(false)
      if (data) {
        supabase.from('celebrations').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id).catch(() => null)
        // Load honoree profile if linked
        if (data.honoree_user_id) {
          supabase.from('users').select('id, full_name, avatar_url, headline, bio').eq('id', data.honoree_user_id).single()
            .then(({ data: u }) => { if (u) setHonoreeUser(u) })
        }
      }
    }
    load()
  }, [id])

  const handleShare = () => {
    const url  = `${window.location.origin}/celebrations/${id}`
    const text = celebration
      ? `🎉 ${celebration.title} — Join the celebration on Philomni!\n${url}`
      : url
    if (navigator.share) {
      navigator.share({ title: celebration?.title, text, url }).catch(() => navigator.clipboard.writeText(url))
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (!celebration) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Celebration not found.</p>
      <button onClick={() => navigate('/celebrations')} className="mt-4 text-primary underline text-sm">Browse Celebrations</button>
    </div>
  )

  const typeInfo = getTypeInfo(celebration.celebration_type)
  const tierInfo = getTierInfo(celebration.tier)
  const isGrand  = celebration.tier === 'grand' || celebration.tier === 'sponsored'

  const timeLeft = celebration.expires_at
    ? (() => {
        const ms = new Date(celebration.expires_at) - new Date()
        if (ms <= 0) return null
        const days = Math.floor(ms / 86400000)
        const hrs  = Math.floor((ms % 86400000) / 3600000)
        return days > 0 ? `${days} days left` : `${hrs} hours left`
      })()
    : null

  const shareUrl = `${window.location.origin}/celebrations/${id}`
  const shareText = encodeURIComponent(`🎉 ${celebration.title} — Join the celebration on Philomni!\n${shareUrl}`)

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Back */}
      <button onClick={() => navigate('/celebrations')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 pt-2">
        <ArrowLeft className="w-4 h-4" /> Back to Celebrations
      </button>

      {/* Who is celebrating whom */}
      <WhoIsCelebrating celebration={celebration} honoreeUser={honoreeUser} />

      {/* Sponsor banner (sponsored tier) */}
      {celebration.sponsor_brand_name && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-3">
          {celebration.sponsor_logo_url && <img src={celebration.sponsor_logo_url} alt="" className="h-6 object-contain" />}
          <div>
            <p className="text-xs text-muted-foreground">This celebration is sponsored by</p>
            <p className="text-sm font-bold text-foreground">{celebration.sponsor_brand_name}</p>
            {celebration.sponsor_message && <p className="text-xs text-muted-foreground">{celebration.sponsor_message}</p>}
          </div>
        </div>
      )}

      {/* Hero banner */}
      <div className={`relative rounded-2xl overflow-hidden mb-6 ${isGrand ? 'ring-2 ring-yellow-400/60 grand-shimmer' : ''}`}>
        {celebration.honoree_photo_url ? (
          <div className="relative h-64 sm:h-80">
            <img src={celebration.honoree_photo_url} alt={celebration.honoree_name} className="w-full h-full object-cover" style={{ filter: 'blur(40px) brightness(0.6)', transform: 'scale(1.1)' }} />
            <img src={celebration.honoree_photo_url} alt={celebration.honoree_name} className="absolute inset-0 w-full h-full object-contain" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        ) : (
          <div className={`h-40 bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center`}>
            <span className="text-7xl">{typeInfo.emoji}</span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span>{typeInfo.emoji}</span> {typeInfo.label}
          </span>
        </div>

        {/* Tier badge */}
        {tierInfo.badge && (
          <div className="absolute top-4 right-4">
            <span className={`bg-black/60 text-xs font-bold px-3 py-1.5 rounded-full ${tierInfo.color}`}>
              {tierInfo.badge} {tierInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 mb-4 shadow-sm">
        {/* Honoree */}
        <div className="flex flex-col items-center text-center mb-4">
          {celebration.honoree_photo_url && (
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-border mb-3">
              <img src={celebration.honoree_photo_url} alt={celebration.honoree_name} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-black text-foreground mb-1">{celebration.title}</h1>
          <p className="text-sm text-muted-foreground mb-0.5">Celebrating <span className="font-semibold text-foreground">{celebration.honoree_name}</span></p>

          {/* Creator */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold overflow-hidden">
              {celebration.creator_avatar
                ? <img src={celebration.creator_avatar} alt="" className="w-full h-full object-cover" />
                : (celebration.creator_name?.[0] || '?')}
            </div>
            <span>Posted by <span className="font-medium text-foreground">{celebration.creator_name}</span></span>
          </div>
        </div>

        {/* Message */}
        <div className="bg-muted/60 rounded-xl p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">
          {celebration.message}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>👁️ {celebration.view_count || 0} views</span>
          {timeLeft && <span className="bg-muted rounded-full px-2 py-0.5">{timeLeft}</span>}
        </div>
      </div>

      {/* Reaction bar */}
      <div className="mb-4">
        <ReactionBar celebration={celebration} user={user} />
      </div>

      {/* Wishes */}
      <div className="mb-4">
        <WishesSection celebration={celebration} user={user} />
      </div>

      {/* Share section */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4 shadow-sm">
        <h3 className="font-bold text-sm text-foreground mb-3">Share this celebration</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Copy Link
          </button>
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold hover:bg-green-500/30 transition-colors"
          >
            💬 WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-500/30 transition-colors"
          >
            🐦 Twitter/X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-500/30 transition-colors"
          >
            📘 Facebook
          </a>
        </div>
      </div>

      {/* Digital Certificate (Grand + Sponsored only) */}
      {isGrand && (
        <div className="mb-4">
          <DigitalCertificate celebration={celebration} />
        </div>
      )}

      {/* Sponsor section */}
      {celebration.sponsor_brand_name && (
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2">This celebration made possible by:</p>
          <div className="flex items-center gap-3">
            {celebration.sponsor_logo_url && <img src={celebration.sponsor_logo_url} alt="" className="h-10 object-contain" />}
            <div>
              <p className="font-bold text-foreground">{celebration.sponsor_brand_name}</p>
              {celebration.sponsor_message && <p className="text-sm text-muted-foreground">{celebration.sponsor_message}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
