import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Send, Loader2, Users, X, Radio, PhoneOff, Video, VideoOff,
  Mic, MicOff, Share2, Trophy, Gift,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

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

  const [live, setLive] = useState(null)
  const [messages, setMessages] = useState([])
  const [gifts, setGifts] = useState([])
  const [animations, setAnimations] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [ending, setEnding] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [summary, setSummary] = useState(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')  // 'chat' | 'gifters'

  const videoRef = useRef(null)
  const streamRef = useRef(null)
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

  // ─── Load existing messages ───────────────────────────────────────────────
  useEffect(() => {
    supabase.from('live_messages').select('*').eq('live_id', liveId).order('created_at').limit(100)
      .then(({ data }) => setMessages(data || []))
  }, [liveId])

  // ─── Load existing gifts ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('live_gifts').select('*').eq('live_id', liveId).order('created_at')
      .then(({ data }) => setGifts(data || []))
  }, [liveId])

  // ─── Camera ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (e) {
        console.warn('Camera not available:', e)
      }
    }
    start()
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const toggleCamera = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCameraOn(v => !v)
  }
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(v => !v)
  }

  // ─── Real-time subscriptions ──────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(`live-host-${liveId}`)
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
        setGifts(prev => [...prev, g])
        // Show animation
        const animId = Date.now() + Math.random()
        setAnimations(prev => [...prev, { id: animId, emoji: g.gift_emoji, giftName: g.gift_name, senderName: g.sender_name }])
        setTimeout(() => setAnimations(prev => prev.filter(a => a.id !== animId)), 3000)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'lives',
        filter: `id=eq.${liveId}`,
      }, payload => setLive(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [liveId])

  // Auto-scroll messages
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages])

  // ─── Send chat message ────────────────────────────────────────────────────
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
    const endedAt = new Date().toISOString()
    await supabase.from('lives').update({ status: 'ended', ended_at: endedAt }).eq('id', liveId)

    // Build summary
    const duration = live?.started_at
      ? Math.round((Date.now() - new Date(live.started_at).getTime()) / 60000)
      : 0
    const totalCoins = gifts.reduce((s, g) => s + (g.total_coins || 0), 0)
    const totalEarnings = (totalCoins / 100 * 0.70).toFixed(2)

    streamRef.current?.getTracks().forEach(t => t.stop())
    setSummary({ duration, peakViewers: live?.peak_viewers || 0, totalCoins, totalEarnings })
    setShowEndModal(false)
    setEnding(false)

    // Navigate after 5 seconds
    setTimeout(() => navigate('/profile'), 5000)
  }

  // ─── Top Gifters ──────────────────────────────────────────────────────────
  const topGifters = useMemo(() => {
    const map = {}
    gifts.forEach(g => {
      if (!map[g.sender_id]) map[g.sender_id] = { name: g.sender_name, coins: 0 }
      map[g.sender_id].coins += g.total_coins || 0
    })
    return Object.values(map).sort((a, b) => b.coins - a.coins).slice(0, 5)
  }, [gifts])

  const totalGiftCoins = useMemo(() => gifts.reduce((s, g) => s + (g.total_coins || 0), 0), [gifts])

  if (!live) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // ─── Summary screen ───────────────────────────────────────────────────────
  if (summary) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-1">Live Ended!</h2>
          <p className="text-muted-foreground text-sm mb-6">Great stream! Here's your recap:</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Duration', value: `${summary.duration}m` },
              { label: 'Peak Viewers', value: summary.peakViewers.toLocaleString() },
              { label: 'Total Gifts', value: `🪙 ${summary.totalCoins.toLocaleString()}` },
              { label: 'Earnings', value: `$${summary.totalEarnings}` },
            ].map(s => (
              <div key={s.label} className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-bold text-lg">{s.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Returning to profile in 5 seconds…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* ── Camera area ── */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-1.5 bg-destructive rounded-full px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wide">Live</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold">{live.viewer_count || 0}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
            <span className="text-xs text-amber-400">🪙</span>
            <span className="text-white text-xs font-bold">{totalGiftCoins}</span>
          </div>
          <div className="ml-auto">
            <p className="text-white text-sm font-semibold truncate max-w-[200px]">{live.title}</p>
          </div>
          <button
            onClick={() => setShowEndModal(true)}
            className="flex items-center gap-1.5 bg-destructive text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End Live
          </button>
        </div>

        {/* Video */}
        <div className="flex-1 relative bg-zinc-900 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`}
          />
          {!cameraOn && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <VideoOff className="w-16 h-16" />
              <p className="text-sm">Camera is off</p>
            </div>
          )}
          {/* Gift animations overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <GiftAnimation animations={animations} />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 pb-6 bg-gradient-to-t from-black/80 to-transparent pt-8">
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${cameraOn ? 'bg-white/20 hover:bg-white/30' : 'bg-destructive hover:bg-destructive/80'}`}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-destructive hover:bg-destructive/80'}`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigator.share?.({ title: live.title, url: `${window.location.origin}/live/${liveId}` }).catch(() => navigator.clipboard.writeText(`${window.location.origin}/live/${liveId}`))}
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Right sidebar: Chat + Gifts ── */}
      <div className="w-80 flex flex-col bg-zinc-900/95 border-l border-white/10">
        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {[
            { id: 'chat', label: 'Chat' },
            { id: 'gifters', label: '🏆 Top Gifters' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === tab.id ? 'text-white border-b-2 border-primary' : 'text-white/40 hover:text-white/70'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {(msg.sender_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary">{msg.sender_name} </span>
                    <span className="text-xs text-white/80">{msg.content}</span>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
