import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Send, Loader2, Users, X, Heart, ShoppingBag, Plus, Minus,
  UserPlus, UserMinus, ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'

// ─── Gift catalog (mirrors DB) ─────────────────────────────────────────────────
const GIFTS = [
  { name: 'Rose',     emoji: '🌹',  coins: 1    },
  { name: 'Heart',    emoji: '❤️',  coins: 5    },
  { name: 'Star',     emoji: '⭐',  coins: 10   },
  { name: 'Fire',     emoji: '🔥',  coins: 20   },
  { name: 'Crown',    emoji: '👑',  coins: 50   },
  { name: 'Diamond',  emoji: '💎',  coins: 100  },
  { name: 'Rocket',   emoji: '🚀',  coins: 200  },
  { name: 'Galaxy',   emoji: '🌌',  coins: 500  },
  { name: 'Philomni', emoji: '✨',  coins: 1000 },
  { name: 'Legend',   emoji: '🏆',  coins: 5000 },
]

const QTY_OPTIONS = [1, 5, 10, 99]

// ─── Gift Animation ───────────────────────────────────────────────────────────
function GiftAnimation({ animations }) {
  return (
    <>
      <style>{`
        @keyframes giftFloat {
          0%   { opacity: 0; transform: translateX(-50%) translateY(0)     scale(0.5); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-20px)  scale(1.2); }
          80%  { opacity: 1; transform: translateX(-50%) translateY(-60px)  scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-100px) scale(0.8); }
        }
      `}</style>
      {animations.map(anim => (
        <div
          key={anim.id}
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            animation: 'giftFloat 3s ease-out forwards',
            zIndex: 100,
            textAlign: 'center',
            background: 'rgba(0,0,0,0.80)',
            borderRadius: '20px',
            padding: '12px 20px',
            border: '2px solid gold',
            pointerEvents: 'none',
            minWidth: '180px',
          }}
        >
          <div style={{ fontSize: '48px', lineHeight: 1.2 }}>{anim.emoji}</div>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
            {anim.senderName} sent {anim.giftName}!
          </div>
        </div>
      ))}
    </>
  )
}

// ─── Heart Tap ────────────────────────────────────────────────────────────────
function HeartTap({ onClick }) {
  const [hearts, setHearts] = useState([])
  const handleTap = () => {
    onClick?.()
    const id = Date.now()
    const x = 40 + Math.random() * 20
    setHearts(prev => [...prev, { id, x }])
    setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 1500)
  }
  return (
    <div className="relative">
      <style>{`
        @keyframes heartFloat { 0% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-80px) scale(0.6); } }
      `}</style>
      {hearts.map(h => (
        <div key={h.id} style={{ position: 'absolute', bottom: '48px', left: `${h.x}%`, animation: 'heartFloat 1.5s ease-out forwards', pointerEvents: 'none', fontSize: '20px' }}>❤️</div>
      ))}
      <button onClick={handleTap} className="w-10 h-10 rounded-full bg-rose-500/80 text-white flex items-center justify-center hover:bg-rose-500 transition-colors flex-shrink-0">
        <Heart className="w-5 h-5 fill-white" />
      </button>
    </div>
  )
}

// ─── Gift Panel ────────────────────────────────────────────────────────────────
function GiftPanel({ live, user, onClose, onSent }) {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(user?.coin_balance || 0)
  const [selected, setSelected] = useState(GIFTS[0])
  const [qty, setQty] = useState(1)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('users').select('coin_balance').eq('id', user.id).single()
      .then(({ data }) => { if (data) setBalance(data.coin_balance || 0) })
  }, [user?.id])

  const totalCost = selected.coins * qty

  const sendGift = async () => {
    if (balance < totalCost) { setShowInsufficientModal(true); return }
    setSending(true)
    try {
      // Deduct coins
      await supabase.from('users').update({ coin_balance: balance - totalCost }).eq('id', user.id)
      setBalance(b => b - totalCost)

      // Insert gift
      const usdValue = (totalCost / 100).toFixed(4)
      const hostEarnings = (Number(usdValue) * 0.70).toFixed(4)
      await supabase.from('live_gifts').insert({
        live_id: live.id,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_avatar: user.avatar_url || null,
        gift_name: selected.name,
        gift_emoji: selected.emoji,
        coin_cost: selected.coins,
        quantity: qty,
        total_coins: totalCost,
        usd_value: usdValue,
        host_earnings: hostEarnings,
      })

      // Credit host wallet (simplified — update lives table earnings)
      await supabase.from('lives').update({
        total_gifts_coins: (live.total_gifts_coins || 0) + totalCost,
        total_earnings_usd: parseFloat(((live.total_earnings_usd || 0) + Number(hostEarnings)).toFixed(4)),
      }).eq('id', live.id)

      setToast(`Sent ${qty > 1 ? `${qty}× ` : ''}${selected.emoji} ${selected.name}!`)
      setTimeout(() => setToast(''), 2500)
      onSent?.()
    } catch (err) { console.error(err) }
    setSending(false)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-zinc-900/98 border-t border-white/10 rounded-t-3xl p-4 max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-white">{balance.toLocaleString()} coins</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/coins')} className="text-xs text-primary font-semibold px-3 py-1.5 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors">
            Buy Coins
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zero balance empty state */}
      {balance === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-5xl mb-3">🪙</div>
          <p className="text-white font-bold text-base mb-1">You have no coins</p>
          <p className="text-white/60 text-sm mb-6">Buy coins to send gifts to your favourite creators!</p>
          <button
            onClick={() => navigate('/coins')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            🪙 Buy Coins
          </button>
        </div>
      ) : (
        <>
          {toast && (
            <div className="mb-3 text-center py-2 bg-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
              {toast}
            </div>
          )}

          {/* Gift grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {GIFTS.map(gift => (
              <button
                key={gift.name}
                onClick={() => setSelected(gift)}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                  selected.name === gift.name
                    ? 'border-amber-400 bg-amber-400/20 scale-105'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl leading-tight">{gift.emoji}</span>
                <span className="text-[10px] text-white/70 mt-0.5 truncate w-full text-center">{gift.name}</span>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span className="text-[9px] text-amber-400">🪙</span>
                  <span className="text-[10px] font-bold text-amber-400">{gift.coins}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Quantity + Send */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/10 rounded-xl overflow-hidden flex-shrink-0">
              {QTY_OPTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setQty(q)}
                  className={`px-3 py-2 text-sm font-bold transition-colors ${qty === q ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
                >
                  ×{q}
                </button>
              ))}
            </div>
            <button
              onClick={sendGift}
              disabled={sending}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Send {selected.emoji} {selected.name} — 🪙{totalCost.toLocaleString()}
            </button>
          </div>

          {/* Insufficient coins modal */}
          {showInsufficientModal && (
            <div className="mt-4 p-4 bg-destructive/20 border border-destructive/40 rounded-xl text-center">
              <p className="text-white font-semibold mb-2">Not enough coins</p>
              <p className="text-white/70 text-xs mb-3">You need {totalCost} coins but only have {balance}.</p>
              <button onClick={() => navigate('/coins')} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold">
                Buy Coins
              </button>
              <button onClick={() => setShowInsufficientModal(false)} className="ml-3 text-xs text-white/60 hover:text-white">Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── LiveViewer page ──────────────────────────────────────────────────────────

export default function LiveViewer() {
  const { id: liveId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [live, setLive] = useState(null)
  const [host, setHost] = useState(null)
  const [messages, setMessages] = useState([])
  const [animations, setAnimations] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showGifts, setShowGifts] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const bottomRef = useRef(null)

  // ─── Load live ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: liveData } = await supabase.from('lives').select('*').eq('id', liveId).single()
      if (!liveData) { navigate('/'); return }
      setLive(liveData)
      // Load host profile
      if (liveData.host_id) {
        const { data: hostData } = await supabase.from('users').select('*').eq('id', liveData.host_id).single()
        setHost(hostData)
      }
      // Increment viewer count
      await supabase.from('lives').update({
        viewer_count: (liveData.viewer_count || 0) + 1,
        peak_viewers: Math.max(liveData.peak_viewers || 0, (liveData.viewer_count || 0) + 1),
      }).eq('id', liveId)
    }
    load()
    // Decrement on unmount
    return () => {
      supabase.from('lives').select('viewer_count').eq('id', liveId).single()
        .then(({ data }) => {
          if (data) supabase.from('lives').update({ viewer_count: Math.max(0, (data.viewer_count || 1) - 1) }).eq('id', liveId)
        })
    }
  }, [liveId, navigate])

  // ─── Load messages ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('live_messages').select('*').eq('live_id', liveId).order('created_at').limit(100)
      .then(({ data }) => setMessages(data || []))
  }, [liveId])

  // ─── Check follow ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !live?.host_id) return
    supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', live.host_id).maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
  }, [user?.id, live?.host_id])

  // ─── Real-time ────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(`live-view-${liveId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_messages',
        filter: `live_id=eq.${liveId}`,
      }, payload => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_gifts',
        filter: `live_id=eq.${liveId}`,
      }, payload => {
        const g = payload.new
        const animId = Date.now() + Math.random()
        setAnimations(prev => [...prev, { id: animId, emoji: g.gift_emoji, giftName: g.gift_name, senderName: g.sender_name }])
        setTimeout(() => setAnimations(prev => prev.filter(a => a.id !== animId)), 3000)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'lives',
        filter: `id=eq.${liveId}`,
      }, payload => {
        setLive(payload.new)
        if (payload.new.status === 'ended') {
          setTimeout(() => navigate('/'), 2000)
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [liveId, navigate])

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages])

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!text.trim() || sending || !user) return
    const content = text.trim()
    setText('')
    setSending(true)
    await supabase.from('live_messages').insert({
      live_id: liveId,
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      sender_avatar: user.avatar_url || null,
      content,
    })
    setSending(false)
  }, [text, sending, user, liveId])

  // ─── Follow ───────────────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!user || !live?.host_id) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', live.host_id)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: live.host_id })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  if (!live) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (live.status === 'ended') {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-center">
        <div>
          <div className="text-5xl mb-4">📺</div>
          <p className="text-white text-lg font-bold mb-1">Stream ended</p>
          <p className="text-white/60 text-sm mb-4">This live has ended. Redirecting…</p>
          <button onClick={() => navigate('/')} className="text-primary text-sm underline">Go to Feed</button>
        </div>
      </div>
    )
  }

  const hostName = host?.full_name || live.host_name || 'Creator'
  const hostAvatar = host?.avatar_url || live.host_avatar

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden relative">
      {/* ── Video area ── */}
      <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
        {/* Placeholder stream area */}
        <div className="w-full h-full flex items-center justify-center">
          {live.thumbnail_url
            ? <img src={live.thumbnail_url} alt="stream" className="w-full h-full object-cover" />
            : (
              <div className="text-center text-white/30">
                <div className="text-6xl mb-3">📺</div>
                <p className="text-sm">Live stream</p>
              </div>
            )
          }
        </div>

        {/* Overlays */}
        {/* Top left — badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 bg-destructive rounded-full px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wide">Live</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold">{live.viewer_count || 0}</span>
          </div>
        </div>

        {/* Top right — host info */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 rounded-xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
              {hostAvatar
                ? <img src={hostAvatar} alt={hostName} className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-bold">{hostName[0]}</span>
              }
            </div>
            <span className="text-white text-xs font-semibold">{hostName}</span>
          </div>
          <button
            onClick={handleFollow}
            disabled={followLoading || !user || user.id === live.host_id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${isFollowing ? 'bg-white/20 text-white' : 'bg-primary text-white'}`}
          >
            {followLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : isFollowing ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Live title */}
        <div className="absolute bottom-[180px] left-4 right-4">
          <p className="text-white font-bold text-sm drop-shadow-lg line-clamp-2">{live.title}</p>
        </div>

        {/* Gift animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GiftAnimation animations={animations} />
        </div>
      </div>

      {/* ── Chat + controls ── */}
      <div className="flex-shrink-0 bg-zinc-900/98 max-h-[45vh] flex flex-col">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 space-y-1.5 min-h-0">
          {messages.slice(-30).map(msg => (
            <div key={msg.id} className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/40 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5">
                {(msg.sender_name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-primary">{msg.sender_name} </span>
                <span className="text-xs text-white/80 break-words">{msg.content}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-3 py-3 border-t border-white/10 flex-shrink-0">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Say something…"
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
          />
          {text.trim() && (
            <button onClick={sendMessage} disabled={sending} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40">
              {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          )}
          <button
            onClick={() => setShowGifts(v => !v)}
            className="w-10 h-10 rounded-full bg-amber-500/80 flex items-center justify-center flex-shrink-0 hover:bg-amber-500 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
          </button>
          <HeartTap />
        </div>
      </div>

      {/* ── Gift panel overlay ── */}
      {showGifts && user && (
        <GiftPanel
          live={live}
          user={user}
          onClose={() => setShowGifts(false)}
          onSent={() => {/* animation fires via realtime */}}
        />
      )}
    </div>
  )
}
