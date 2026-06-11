import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Send, Loader2, Users, Gift, PhoneOff, Share2,
} from 'lucide-react'

// ─── Gift Animation ───────────────────────────────────────────────────────────

function GiftAnimation({ animations }) {
  return (
    <>
      <style>{`
        @keyframes giftFloatUp {
          0%   { opacity: 0; transform: translateX(-50%) translateY(0)    scale(0.5); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.2); }
          80%  { opacity: 1; transform: translateX(-50%) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-100px) scale(0.8); }
        }
      `}</style>
      {animations.map(anim => (
        <div
          key={anim.id}
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            animation: 'giftFloatUp 3s ease-out forwards',
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

// ─── LiveHost page ────────────────────────────────────────────────────────────

export default function LiveHost() {
  const { id: liveId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const hostToken = location.state?.hostToken ?? null

  const [live, setLive] = useState(null)
  const [messages, setMessages] = useState([])
  const [gifts, setGifts] = useState([])
  const [animations, setAnimations] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [ending, setEnding] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'gifters'

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // ─── Load live info ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('lives').select('*').eq('id', liveId).single()
      .then(({ data }) => {
        if (!data || data.host_id !== user?.id) {
          navigate('/groups')
          return
        }
        setLive(data)
      })
  }, [liveId, user?.id, navigate])

  // ─── Load messages + realtime ─────────────────────────────────────────────
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('live_messages')
        .select('*')
        .eq('live_id', liveId)
        .order('created_at', { ascending: true })
        .limit(100)
      setMessages(data || [])
    }
    loadMessages()

    const channel = supabase
      .channel('live-chat-' + liveId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_messages',
        filter: 'live_id=eq.' + liveId,
      }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [liveId])

  // ─── Load gifts + realtime ────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('live_gifts').select('*').eq('live_id', liveId).order('created_at')
      .then(({ data }) => setGifts(data || []))

    const channel = supabase.channel(`live-host-${liveId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_gifts',
        filter: `live_id=eq.${liveId}`,
      }, payload => {
        const g = payload.new
        setGifts(prev => [...prev, g])
        const animId = Date.now() + Math.random()
        setAnimations(prev => [...prev, {
          id: animId, emoji: g.gift_emoji, giftName: g.gift_name, senderName: g.sender_name,
        }])
        setTimeout(() => setAnimations(prev => prev.filter(a => a.id !== animId)), 3000)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'lives',
        filter: `id=eq.${liveId}`,
      }, payload => setLive(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [liveId])

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
      sender_name: '🎬 ' + (user.full_name || user.email),
      sender_avatar: user.avatar_url || null,
      content,
    })
    setSending(false)
  }, [text, sending, user, liveId])

  // ─── End live ─────────────────────────────────────────────────────────────
  const endLive = async () => {
    setEnding(true)
    await supabase.from('lives').update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    }).eq('id', liveId)

    // Delete Daily.co room (fire-and-forget)
    supabase.functions.invoke('create-live-room', {
      body: { action: 'delete', liveId },
    }).catch(e => console.warn('Room delete error:', e))

    // Kick off recording save asynchronously — the recap page will show status
    supabase.functions.invoke('save-live-recording', {
      body: { liveId },
    }).catch(e => console.warn('Recording save error:', e))

    setEnding(false)
    setShowEndModal(false)
    navigate(`/live/${liveId}/recap`)
  }

  // ─── Derived stats ────────────────────────────────────────────────────────
  const topGifters = useMemo(() => {
    const map = {}
    gifts.forEach(g => {
      if (!map[g.sender_id]) map[g.sender_id] = { name: g.sender_name, coins: 0 }
      map[g.sender_id].coins += g.total_coins || 0
    })
    return Object.values(map).sort((a, b) => b.coins - a.coins).slice(0, 5)
  }, [gifts])

  const totalGiftCoins = useMemo(() => gifts.reduce((s, g) => s + (g.total_coins || 0), 0), [gifts])

  // ─── Build Daily.co iframe URL ────────────────────────────────────────────
  const dailyUrl = useMemo(() => {
    if (!live?.room_url) return null
    return hostToken ? `${live.room_url}?t=${hostToken}` : live.room_url
  }, [live?.room_url, hostToken])

  if (!live) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black overflow-hidden">
      {/* ── Video / Stream area ── */}
      <div className="flex-1 flex flex-col relative h-[60vh] lg:h-auto">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-1.5 bg-destructive rounded-full px-2.5 py-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wide">Live</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2.5 py-1">
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold">{live.viewer_count || 0}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2.5 py-1">
            <span className="text-xs text-amber-400">🪙</span>
            <span className="text-white text-xs font-bold">{totalGiftCoins}</span>
          </div>
          <p className="ml-auto text-white text-sm font-semibold truncate max-w-[160px]">{live.title}</p>
          <button
            onClick={() => navigator.share?.({
              title: live.title,
              url: `${window.location.origin}/live/${liveId}`,
            }).catch(() => navigator.clipboard.writeText(`${window.location.origin}/live/${liveId}`))}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowEndModal(true)}
            className="flex items-center gap-1 bg-destructive text-white text-xs font-bold px-2.5 py-1.5 rounded-full hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End
          </button>
        </div>

        {/* Stream area */}
        <div className="flex-1 relative bg-zinc-900">
          {dailyUrl ? (
            <iframe
              src={dailyUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Live stream"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-3">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-sm">Setting up your stream…</p>
            </div>
          )}
          {/* Gift animations overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <GiftAnimation animations={animations} />
          </div>
        </div>
      </div>

      {/* ── Right sidebar: Chat + Gifts ── */}
      <div className="w-full lg:w-80 flex flex-col bg-zinc-900/95 border-t lg:border-t-0 lg:border-l border-white/10 flex-1 lg:flex-none min-h-0">
        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {[
            { id: 'chat', label: 'Chat' },
            { id: 'gifters', label: '🏆 Top Gifters' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === tab.id ? 'text-white border-b-2 border-primary' : 'text-white/40 hover:text-white/70'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <img
                    src={msg.sender_avatar || '/default-avatar.png'}
                    alt={msg.sender_name}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover', background: '#6d28d9' }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                  <div>
                    <span style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold' }}>{msg.sender_name}</span>
                    <p style={{ color: 'white', fontSize: '13px', margin: '2px 0 0', wordBreak: 'break-word' }}>{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2 p-3 border-t border-white/10 flex-shrink-0">
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Say something…"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              >
                {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </>
        )}

        {/* Top Gifters */}
        {activeTab === 'gifters' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {topGifters.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No gifts yet</p>
              </div>
            ) : topGifters.map((g, i) => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="text-lg font-black text-amber-400 w-6 text-center">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-primary/40 flex items-center justify-center text-white text-xs font-bold">
                  {(g.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{g.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-xs">🪙</span>
                  <span className="text-white text-sm font-bold">{g.coins.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── End Live Confirmation ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80">
          <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center mx-4">
            <div className="text-4xl mb-4">🔴</div>
            <h3 className="font-bold text-lg mb-2">End your live?</h3>
            <p className="text-muted-foreground text-sm mb-6">Your stream will end and viewers will be disconnected.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndModal(false)} className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-muted">
                Keep Going
              </button>
              <button onClick={endLive} disabled={ending} className="flex-1 py-2.5 rounded-xl bg-destructive text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {ending && <Loader2 className="w-4 h-4 animate-spin" />}
                End Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
