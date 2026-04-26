import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Video, Phone, Plus, PhoneOff, Copy, Clock, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function CallFrame({ url, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 bg-black/80 border-b border-white/10">
        <span className="text-white font-semibold text-sm">Philomni Call</span>
        <button onClick={onLeave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
          <PhoneOff className="w-4 h-4" /> Leave
        </button>
      </div>
      <iframe src={url} allow="camera; microphone; fullscreen; speaker; display-capture"
        style={{ flex: 1, border: 'none' }} title="Meeting" />
    </div>
  )
}

export default function Meetings() {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'video' })
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    supabase.from('bookings').select('*').eq('host_id', user?.id).order('created_at', { ascending: false })
      .then(({ data }) => { setMeetings(data ?? []); setLoading(false) })
  }, [user?.id])

  const createMeeting = async () => {
    setCreating(true)
    const slug = `philomni-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const dailyDomain = import.meta.env.VITE_DAILY_DOMAIN || 'philomni'
    let roomUrl = `https://${dailyDomain}.daily.co/${slug}`

    try {
      const res = await Promise.race([
        fetch('/api/daily-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: slug }),
        }).then(r => r.json()),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
      ])
      if (res?.url) roomUrl = res.url
    } catch (err) {
      console.error('[Meetings] Daily.co failed, using fallback:', err)
    }

    const { data } = await supabase.from('bookings').insert({
      title: form.title || `${user.full_name}'s ${form.type === 'video' ? 'Video' : 'Voice'} Call`,
      meeting_type: form.type,
      host_id: user.id,
      room_url: roomUrl,
      status: 'active',
      started_at: new Date().toISOString(),
    }).select().single()

    if (data) {
      setMeetings(prev => [data, ...prev])
      setActiveCall(roomUrl)
      setShowNew(false)
      setForm({ title: '', type: 'video' })
    }
    setCreating(false)
  }

  const copyLink = (url, id) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (activeCall) return <CallFrame url={activeCall} onLeave={() => setActiveCall(null)} />

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Video & voice calls</p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Call
        </button>
      </div>

      {showNew && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-4">
          <h3 className="font-semibold text-foreground">Start a Call</h3>
          <div className="grid grid-cols-2 gap-3">
            {['video', 'voice'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.type === t ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                {t === 'video' ? <Video className={`w-6 h-6 ${form.type === t ? 'text-primary' : 'text-muted-foreground'}`} />
                  : <Phone className={`w-6 h-6 ${form.type === t ? 'text-primary' : 'text-muted-foreground'}`} />}
                <span className="text-sm font-medium">{t === 'video' ? 'Video Call' : 'Voice Call'}</span>
              </button>
            ))}
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Meeting title (optional)"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button onClick={createMeeting} disabled={creating}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            {creating ? 'Creating…' : 'Start Call Now'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No meetings yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.meeting_type === 'video' ? 'bg-primary/15' : 'bg-emerald-500/15'}`}>
                {m.meeting_type === 'video'
                  ? <Video className="w-5 h-5 text-primary" />
                  : <Phone className="w-5 h-5 text-emerald-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {m.started_at ? formatDistanceToNow(new Date(m.started_at), { addSuffix: true }) : 'Instant call'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.room_url && (
                  <>
                    <button onClick={() => copyLink(m.room_url, m.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Copy className="w-3 h-3" /> {copied === m.id ? 'Copied!' : 'Copy'}
                    </button>
                    {m.status === 'active' && (
                      <button onClick={() => setActiveCall(m.room_url)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
                        Join
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
