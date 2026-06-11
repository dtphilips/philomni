import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useNavigate } from 'react-router-dom'
import {
  Radio, Plus, Users, Search, Mic, Video, Monitor, BookOpen,
  Headphones, ChevronRight, Calendar, Clock, Copy, Check,
  X, Bell, BellOff, Play, Lock, Globe, Unlock, ChevronDown,
  Hash, Loader2, Zap, TrendingUp, ArrowRight
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

// ─── Sample Data ───────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { id: 'audio',        label: 'Audio Room',       emoji: '🎤', desc: 'Voice only — like Twitter Spaces',  icon: Mic },
  { id: 'video',        label: 'Video Room',        emoji: '📹', desc: 'Camera + mic — like Zoom',          icon: Video },
  { id: 'presentation', label: 'Presentation Room', emoji: '🖥', desc: 'Screen share + camera',             icon: Monitor },
  { id: 'workshop',     label: 'Workshop Room',     emoji: '🎓', desc: 'Whiteboard + video',                icon: BookOpen },
  { id: 'podcast',      label: 'Podcast Room',      emoji: '🎙', desc: 'Recording mode, pro layout',        icon: Headphones },
]

const SAMPLE_LIVE_ROOMS = [
  { id: 'r1', name: 'Instagram Growth Q&A — ask me anything', host_name: 'Sarah Kim', host_avatar: null, viewer_count: 247, room_type: 'video', status: 'live', mode: 'creator', description: 'Live Q&A on Instagram growth strategies, reels, and monetization. No gatekeeping.', started_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'r2', name: 'Afrobeats Production Session', host_name: 'Marcus Osei', host_avatar: null, viewer_count: 89, room_type: 'audio', status: 'live', mode: 'creator', description: 'Making a full beat live from scratch — drum programming, bass, melody. Watch and learn.', started_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'r3', name: 'CISSP Exam Prep Study Group', host_name: 'Dr. Adaeze N.', host_avatar: null, viewer_count: 134, room_type: 'presentation', status: 'live', mode: 'pro', description: 'Week 3 of our 8-week CISSP prep series. Today: Cryptography and PKI deep dive.', started_at: new Date(Date.now() - 5400000).toISOString() },
  { id: 'r4', name: 'Founder Office Hours — pitch your startup', host_name: 'James Larkin', host_avatar: null, viewer_count: 56, room_type: 'video', status: 'live', mode: 'pro', description: 'Open office hours. Founders pitch their ideas for live feedback. Come with your deck.', started_at: new Date(Date.now() - 900000).toISOString() },
]

const SAMPLE_UPCOMING_ROOMS = [
  { id: 'u1', name: 'YouTube Algorithm Decoded 2026', host_name: 'Alex Turner', host_avatar: null, rsvp_count: 892, room_type: 'video', status: 'upcoming', mode: 'creator', scheduled_at: new Date(Date.now() + 7200000).toISOString(), description: 'Breaking down exactly what YouTube is rewarding in 2026. Data from 500+ channels analyzed.' },
  { id: 'u2', name: 'Brand Deal Negotiation Workshop', host_name: 'Emma Laurent', host_avatar: null, rsvp_count: 234, room_type: 'workshop', status: 'upcoming', mode: 'creator', scheduled_at: new Date(Date.now() + 86400000).toISOString(), description: 'Learn to negotiate, close, and manage brand deals. Rate cards, contracts, red flags.' },
  { id: 'u3', name: 'Cybersecurity Career Panel: Breaking In', host_name: 'DevSecOps Guild', host_avatar: null, rsvp_count: 445, room_type: 'presentation', status: 'upcoming', mode: 'pro', scheduled_at: new Date(Date.now() + 172800000).toISOString(), description: 'Panel of 4 hiring managers and 3 new entrants discussing real paths into cybersecurity.' },
]

const SAMPLE_ENDED_ROOMS = [
  { id: 'e1', name: 'Creator Monetization Deep Dive', host_name: 'Priya Sharma', host_avatar: null, viewer_count: 1240, room_type: 'video', status: 'ended', mode: 'creator', started_at: new Date(Date.now() - 86400000 * 3).toISOString(), ended_at: new Date(Date.now() - 86400000 * 3 + 7200000).toISOString(), recording_url: null },
  { id: 'e2', name: 'Product Strategy Office Hours', host_name: 'Marcus Dellano', host_avatar: null, viewer_count: 380, room_type: 'video', status: 'ended', mode: 'pro', started_at: new Date(Date.now() - 86400000 * 2).toISOString(), ended_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), recording_url: null },
]

// ─── Color maps ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  audio:        { gradient: 'from-violet-600 to-violet-800', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  video:        { gradient: 'from-blue-600 to-blue-800',     badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  presentation: { gradient: 'from-teal-600 to-teal-800',     badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  workshop:     { gradient: 'from-amber-600 to-amber-800',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  podcast:      { gradient: 'from-pink-600 to-pink-800',     badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTypeInfo(type) {
  return ROOM_TYPES.find(t => t.id === type) || ROOM_TYPES[0]
}

function durationLabel(startedAt, endedAt) {
  if (!startedAt || !endedAt) return null
  const ms = new Date(endedAt) - new Date(startedAt)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RoomTypeBadge({ type }) {
  const info = getTypeInfo(type)
  const colors = TYPE_COLORS[type] || TYPE_COLORS.video
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors.badge}`}>
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </span>
  )
}

function StatusBadge({ status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        LIVE
      </span>
    )
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium">
        <Calendar className="w-3 h-3" /> Upcoming
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-xs font-medium">
      <Check className="w-3 h-3" /> Ended
    </span>
  )
}

function HostAvatar({ name, size = 10 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const sz = `w-${size} h-${size}`
  return (
    <div className={`${sz} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0`}>
      <span className="text-xs font-bold text-primary">{initials}</span>
    </div>
  )
}

// ─── JoinCodeModal ─────────────────────────────────────────────────────────────

function JoinCodeModal({ onClose }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleJoin() {
    if (code.trim().length !== 6) { setError('Please enter a valid 6-character code'); return }
    // In production: look up room by code
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Join with Code</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Enter the 6-character room code shared with you.</p>
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase().slice(0, 6)); setError('') }}
          placeholder="ABC123"
          className="w-full bg-muted rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 mb-2"
          maxLength={6}
          autoFocus
        />
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <button
          onClick={handleJoin}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Join Room
        </button>
      </div>
    </div>
  )
}

// ─── CreateRoomModal ───────────────────────────────────────────────────────────

function CreateRoomModal({ onClose, onSuccess }) {
  const { user } = useAuth()
  const { mode } = useMode()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    roomType: 'video',
    mode: mode || 'creator',
    privacy: 'public',
    maxParticipants: 'unlimited',
    allowRecording: false,
    startNow: true,
    scheduledDate: '',
    scheduledTime: '',
  })

  const fakeCode = Math.random().toString(36).slice(2, 8).toUpperCase()
  const fakeLink = `https://philomni.com/rooms/${fakeCode}`

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function nextStep() {
    if (step === 1 && !form.name.trim()) return
    if (step === 2 && !form.startNow) { setStep(3); return }
    if (step === 2 && form.startNow) { handleSubmit(); return }
    if (step === 3) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    const scheduledAt = (!form.startNow && form.scheduledDate && form.scheduledTime)
      ? new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString()
      : null

    let dailyRoomUrl = null
    let dailyRoomName = null
    let hostToken = null

    if (form.startNow) {
      const { data: dailyData, error: dailyError } = await supabase.functions.invoke('create-live-room', {
        body: { action: 'create-generic' },
      })
      if (!dailyError && dailyData?.roomUrl) {
        dailyRoomUrl = dailyData.roomUrl
        dailyRoomName = dailyData.roomName
        hostToken = dailyData.token
      }
    }

    const { data: roomData } = await supabase.from('rooms').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      host_id: user?.id,
      host_name: user?.full_name || user?.email || 'You',
      room_type: form.roomType,
      status: form.startNow ? 'live' : 'upcoming',
      is_private: form.privacy !== 'public',
      mode: form.mode,
      rsvp_count: 0,
      viewer_count: 0,
      scheduled_at: scheduledAt,
      started_at: form.startNow ? new Date().toISOString() : null,
      daily_room_url: dailyRoomUrl,
      daily_room_name: dailyRoomName,
    }).select('id').single()

    setSubmitting(false)

    if (!form.startNow) {
      setStep(3)
      setDone(true)
    } else {
      onClose()
      if (dailyRoomUrl) {
        const url = hostToken ? `${dailyRoomUrl}?t=${hostToken}` : dailyRoomUrl
        window.open(url, '_blank', 'noopener,noreferrer')
        onSuccess('Room created! Opening your video room in a new tab...')
      } else {
        onSuccess('Room created!')
      }
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(fakeLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalSteps = form.startNow ? 2 : 3
  const canNext = step === 1 ? form.name.trim().length > 0 : true

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Create a Room</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of {totalSteps}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i + 1 <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Room Title *</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Instagram Growth Q&A"
                  className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Tell people what this room is about..."
                  rows={2}
                  className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Room Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_TYPES.map(rt => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => set('roomType', rt.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${form.roomType === rt.id ? 'border-primary bg-primary/10' : 'border-border bg-muted hover:border-border/80'}`}
                    >
                      <span className="text-lg leading-none">{rt.emoji}</span>
                      <p className="text-sm font-semibold text-foreground mt-1.5">{rt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{rt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Mode</label>
                <div className="flex rounded-xl border border-border overflow-hidden">
                  {['creator', 'pro'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set('mode', m)}
                      className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${form.mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      {m === 'creator' ? '🎨 Creator' : '💼 Pro'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Privacy</label>
                <div className="flex gap-2">
                  {[{ id: 'public', icon: Globe, label: 'Public' }, { id: 'unlisted', icon: Hash, label: 'Unlisted' }, { id: 'private', icon: Lock, label: 'Private' }].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => set('privacy', p.id)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${form.privacy === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >
                      <p.icon className="w-4 h-4" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Max Participants</label>
                <div className="flex gap-2">
                  {['10', '25', '50', 'Unlimited'].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set('maxParticipants', n.toLowerCase())}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${form.maxParticipants === n.toLowerCase() ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-muted rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-foreground">Allow Recording</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Save session for replay</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('allowRecording', !form.allowRecording)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.allowRecording ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.allowRecording ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">When</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => set('startNow', true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.startNow ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <Zap className="w-4 h-4" /> Start Now
                  </button>
                  <button
                    type="button"
                    onClick={() => set('startNow', false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${!form.startNow ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <Calendar className="w-4 h-4" /> Schedule
                  </button>
                </div>
                {!form.startNow && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={e => set('scheduledDate', e.target.value)}
                      className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <input
                      type="time"
                      value={form.scheduledTime}
                      onChange={e => set('scheduledTime', e.target.value)}
                      className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Step 3 — Confirmation ── */}
          {step === 3 && (
            <>
              {!done ? (
                <>
                  <div className="bg-muted rounded-xl p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Summary</p>
                    <Row label="Room" value={form.name} />
                    <Row label="Type" value={getTypeInfo(form.roomType).label} />
                    <Row label="Privacy" value={form.privacy} />
                    <Row label="Capacity" value={form.maxParticipants} />
                    <Row label="Mode" value={form.mode} />
                    {!form.startNow && form.scheduledDate && (
                      <Row label="Scheduled" value={`${form.scheduledDate} ${form.scheduledTime}`} />
                    )}
                    <Row label="Recording" value={form.allowRecording ? 'Enabled' : 'Disabled'} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Room Invite Link</p>
                    <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                      <span className="flex-1 text-xs text-foreground truncate font-mono">{fakeLink}</span>
                      <button onClick={copyLink} className="flex items-center gap-1 text-xs text-primary font-semibold">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Room Scheduled!</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">Your room has been created. Share the link to get attendees.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 flex gap-2 border-t border-border">
          {step > 1 && !done && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Back
            </button>
          )}
          {done ? (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canNext || submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === totalSteps ? (form.startNow ? 'Go Live' : 'Schedule Room') : 'Continue'}
              {!submitting && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground capitalize">{label}</span>
      <span className="text-xs font-semibold text-foreground capitalize">{value}</span>
    </div>
  )
}

// ─── LiveRoomCard ──────────────────────────────────────────────────────────────

function LiveRoomCard({ room, onJoin }) {
  const colors = TYPE_COLORS[room.room_type] || TYPE_COLORS.video

  async function handleJoin() {
    supabase.from('rooms').update({ viewer_count: (room.viewer_count || 0) + 1 }).eq('id', room.id).then(() => {})

    if (room.daily_room_url && room.daily_room_name) {
      onJoin('Getting you into the room...')
      const { data } = await supabase.functions.invoke('create-live-room', {
        body: { action: 'join', roomName: room.daily_room_name },
      })
      const token = data?.token
      const url = token ? `${room.daily_room_url}?t=${token}` : room.daily_room_url
      window.open(url, '_blank', 'noopener,noreferrer')
    } else if (room.daily_room_url) {
      window.open(room.daily_room_url, '_blank', 'noopener,noreferrer')
    } else {
      onJoin('This room is not live yet — no video link available.')
    }
  }

  return (
    <div className="flex-shrink-0 w-72 bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
      {/* Banner */}
      <div className={`relative h-24 bg-gradient-to-br ${colors.gradient} flex items-end p-3`}>
        <div className="absolute top-3 left-3">
          <StatusBadge status="live" />
        </div>
        <div className="absolute top-3 right-3">
          <RoomTypeBadge type={room.room_type} />
        </div>
        <div className="flex items-center gap-2">
          <HostAvatar name={room.host_name} size={7} />
          <span className="text-white text-xs font-medium drop-shadow">{room.host_name}</span>
        </div>
      </div>
      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-2">{room.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Users className="w-3.5 h-3.5" />
          <span>{(room.viewer_count || 0).toLocaleString()} watching</span>
          <span className="mx-1.5 opacity-40">·</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDistanceToNow(new Date(room.started_at))}</span>
        </div>
        <button
          onClick={handleJoin}
          className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
        >
          Join Room <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── UpcomingRoomCard ──────────────────────────────────────────────────────────

function UpcomingRoomCard({ room, rsvpd, onRsvp }) {
  const msDiff = new Date(room.scheduled_at) - Date.now()
  const hours = Math.floor(msDiff / 3600000)
  const minutes = Math.floor((msDiff % 3600000) / 60000)
  const countdown = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <RoomTypeBadge type={room.room_type} />
        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
          <Clock className="w-3 h-3" /> in {countdown}
        </span>
      </div>
      <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-2">{room.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{room.description}</p>
      <div className="flex items-center gap-2 mb-4">
        <HostAvatar name={room.host_name} size={6} />
        <span className="text-xs text-muted-foreground">{room.host_name}</span>
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" /> {(room.rsvp_count || 0).toLocaleString()} RSVPs
        </span>
      </div>
      <button
        onClick={() => onRsvp(room.id)}
        className={`w-full py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${rsvpd ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
      >
        {rsvpd ? <><Bell className="w-3.5 h-3.5" /> Reminder Set</> : <><BellOff className="w-3.5 h-3.5" /> Set Reminder</>}
      </button>
    </div>
  )
}

// ─── EndedRoomCard ─────────────────────────────────────────────────────────────

function EndedRoomCard({ room }) {
  const duration = durationLabel(room.started_at, room.ended_at)
  return (
    <div className="bg-card border border-border rounded-2xl p-5 opacity-70 hover:opacity-90 transition-opacity">
      <div className="flex items-start justify-between gap-3 mb-3">
        <RoomTypeBadge type={room.room_type} />
        <StatusBadge status="ended" />
      </div>
      <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-2">{room.name}</h3>
      <div className="flex items-center gap-2 mb-3">
        <HostAvatar name={room.host_name} size={6} />
        <span className="text-xs text-muted-foreground">{room.host_name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{duration}</span>}
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(room.viewer_count || 0).toLocaleString()} peak</span>
        {room.started_at && (
          <span>{formatDistanceToNow(new Date(room.started_at), { addSuffix: true })}</span>
        )}
      </div>
      <div className={`text-xs font-semibold flex items-center gap-1.5 ${room.recording_url ? 'text-primary' : 'text-muted-foreground'}`}>
        {room.recording_url ? <><Play className="w-3.5 h-3.5" /> Recording Available</> : 'No Recording'}
      </div>
    </div>
  )
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2500)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-foreground text-background text-sm font-semibold shadow-2xl animate-fade-in whitespace-nowrap">
      {message}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Rooms() {
  const { user } = useAuth()
  const { mode } = useMode()
  const { plan, isAdmin } = useSubscription()
  const navigate = useNavigate()

  // Rooms is a Pro+ feature — gate free users with an upgrade prompt
  if (plan === 'free' && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-3xl">🎙️</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Rooms is a Pro feature</h2>
        <p className="text-muted-foreground leading-relaxed">
          Host and join live audio, video, and presentation rooms with your community.
          Upgrade to Pro to get access.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            View Pricing Plans
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
          >
            Back to Feed
          </button>
        </div>
      </div>
    )
  }

  const [liveRooms, setLiveRooms] = useState([])
  const [upcomingRooms, setUpcomingRooms] = useState([])
  const [endedRooms, setEndedRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [rsvpdRooms, setRsvpdRooms] = useState(new Set())

  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('rooms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      const rooms = data || []
      setLiveRooms(rooms.filter(r => r.status === 'live'))
      setUpcomingRooms(rooms.filter(r => r.status === 'upcoming'))
      setEndedRooms(rooms.filter(r => r.status === 'ended'))
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg) {
    setToast(msg)
  }

  function filterRooms(rooms) {
    return rooms.filter(r => {
      const modeOk = filter === 'all' || r.mode === filter
      const typeOk = typeFilter === 'all' || r.room_type === typeFilter
      const q = searchQuery.trim().toLowerCase()
      const searchOk = !q || r.name?.toLowerCase().includes(q) || r.host_name?.toLowerCase().includes(q)
      return modeOk && typeOk && searchOk
    })
  }

  async function handleRsvp(roomId) {
    const next = new Set(rsvpdRooms)
    if (next.has(roomId)) {
      next.delete(roomId)
      showToast('Reminder removed')
      await supabase.from('room_rsvps').delete().match({ room_id: roomId, user_id: user?.id })
    } else {
      next.add(roomId)
      showToast('Reminder set!')
      await supabase.from('room_rsvps').upsert({ room_id: roomId, user_id: user?.id, created_at: new Date().toISOString() })
    }
    setRsvpdRooms(next)
  }

  const filteredLive = filterRooms(liveRooms)
  const filteredUpcoming = filterRooms(upcomingRooms)
  const filteredEnded = filterRooms(endedRooms)

  const modeSubtitle = mode === 'pro'
    ? 'Professional workshops, panels, and knowledge rooms'
    : 'Creator sessions, collabs, and live Q&As'

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Rooms</h1>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1" />
          </div>
          <p className="text-muted-foreground text-sm">{modeSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJoinCode(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Hash className="w-4 h-4" /> Join with Code
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Room
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search rooms by name or host..."
            className="w-full bg-muted rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 border border-transparent"
        >
          <option value="all">All Types</option>
          {ROOM_TYPES.map(rt => <option key={rt.id} value={rt.id}>{rt.emoji} {rt.label}</option>)}
        </select>
        <div className="flex rounded-xl border border-border overflow-hidden text-sm">
          {['all', 'creator', 'pro'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-semibold capitalize transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {f === 'all' ? 'All' : f === 'creator' ? '🎨 Creator' : '💼 Pro'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ── Live Now ── */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg font-bold text-foreground">Live Now</h2>
              {filteredLive.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filteredLive.length}</span>
              )}
            </div>
            {filteredLive.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-10 text-center">
                <Radio className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-semibold text-foreground mb-1">No rooms live right now</p>
                <p className="text-sm text-muted-foreground mb-4">Be the first to start a room for your audience.</p>
                <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" /> Start a Room
                </button>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {filteredLive.map(room => (
                  <LiveRoomCard key={room.id} room={room} onJoin={showToast} />
                ))}
              </div>
            )}
          </section>

          {/* ── Upcoming ── */}
          {filteredUpcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-foreground">Upcoming</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filteredUpcoming.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUpcoming.map(room => (
                  <UpcomingRoomCard
                    key={room.id}
                    room={room}
                    rsvpd={rsvpdRooms.has(room.id)}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Past Rooms ── */}
          {filteredEnded.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">Past Rooms</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filteredEnded.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEnded.map(room => (
                  <EndedRoomCard key={room.id} room={room} />
                ))}
              </div>
            </section>
          )}

          {filteredLive.length === 0 && filteredUpcoming.length === 0 && filteredEnded.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-foreground">No rooms found</p>
              <p className="text-sm mt-1">Try a different search or filter</p>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showJoinCode && <JoinCodeModal onClose={() => setShowJoinCode(false)} />}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onSuccess={msg => { setShowCreate(false); showToast(msg) }}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
