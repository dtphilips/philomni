import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow, format, isToday, isTomorrow, addMinutes, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addDays, getDay, addMonths, subMonths } from 'date-fns'
import {
  Video, Mic, MicOff, VideoOff, Monitor, BookOpen, Headphones, Briefcase,
  Phone, Plus, PhoneOff, Copy, Check, Clock, Users, Calendar, Search,
  ChevronDown, ChevronRight, ChevronLeft, X, Settings, Bell, MessageSquare,
  FileText, File, Download, Upload, Send, Loader2, Zap, Hash, Lock,
  Unlock, Globe, MoreHorizontal, Hand, Radio, Smile,
  Circle, Square, Play, Pause, StopCircle, Mic2, Camera, CameraOff,
  Star, Shield, Crown, UserPlus, Trash2, Edit2, RefreshCw, ArrowLeft,
  AlertTriangle, CheckCircle, LayoutGrid, Maximize2, PanelRightOpen,
  PanelRightClose, PenLine, ClipboardList, StickyNote, Folder,
  Mail, Link, CalendarCheck, DollarSign, BookmarkCheck
} from 'lucide-react'

// ─── SAMPLE DATA ────────────────────────────────────────────────────────────

const SAMPLE_MEETINGS = [
  {
    id: 'm1', title: 'Brand Deal Discussion — Nike Q3', description: 'Review content calendar and deliverables for Nike Q3 campaign.',
    meeting_type: 'video', host_id: 'u1', host_name: 'You',
    meeting_code: 'NK3-2026', password: '4821',
    scheduled_at: new Date(Date.now() + 2 * 3600000).toISOString(),
    duration_minutes: 60, timezone: 'UTC', recurrence: 'once',
    status: 'scheduled', allow_recording: true, waiting_room: true, mute_on_entry: true,
    allow_chat: true, allow_files: true, mode: 'creator',
    participants: [
      { name: 'You', role: 'host', initials: 'Y', color: 'bg-primary' },
      { name: 'Alex Turner', role: 'attendee', initials: 'AT', color: 'bg-violet-500' },
      { name: 'Nike Brand', role: 'attendee', initials: 'NB', color: 'bg-orange-500' },
    ],
  },
  {
    id: 'm2', title: 'Podcast Episode Recording — Ep 14', description: 'Recording episode 14: Creator monetization strategies.',
    meeting_type: 'podcast', host_id: 'u1', host_name: 'You',
    meeting_code: 'POD-1400', password: '',
    scheduled_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    duration_minutes: 90, timezone: 'UTC', recurrence: 'weekly',
    status: 'scheduled', allow_recording: true, waiting_room: false, mute_on_entry: false,
    allow_chat: true, allow_files: true, mode: 'creator',
    participants: [
      { name: 'You', role: 'host', initials: 'Y', color: 'bg-primary' },
      { name: 'Marcus Osei', role: 'co-host', initials: 'MO', color: 'bg-pink-500' },
    ],
  },
  {
    id: 'm3', title: 'Cybersecurity Career Q&A Panel', description: 'Open Q&A with hiring managers for cybersecurity roles.',
    meeting_type: 'presentation', host_id: 'u2', host_name: 'Dr. Adaeze N.',
    meeting_code: 'SEC-PANEL', password: '',
    scheduled_at: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
    duration_minutes: 120, timezone: 'UTC', recurrence: 'once',
    status: 'scheduled', allow_recording: true, waiting_room: false, mute_on_entry: true,
    allow_chat: true, allow_files: false, mode: 'pro',
    participants: [
      { name: 'Dr. Adaeze N.', role: 'host', initials: 'DA', color: 'bg-emerald-500' },
      { name: 'You', role: 'attendee', initials: 'Y', color: 'bg-primary' },
      { name: '248 registered', role: 'attendee', initials: '2K', color: 'bg-blue-500' },
    ],
  },
]

const SAMPLE_PAST_MEETINGS = [
  {
    id: 'pm1', title: 'Content Strategy Review', meeting_type: 'video',
    scheduled_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    started_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 3 * 24 * 3600000 + 3900000).toISOString(),
    duration_minutes: 65, host_name: 'You', recording_url: null, mode: 'creator',
    participants: [
      { name: 'You', initials: 'Y', color: 'bg-primary' },
      { name: 'Sarah K.', initials: 'SK', color: 'bg-violet-500' },
      { name: 'Emma L.', initials: 'EL', color: 'bg-rose-500' },
    ],
    notes: 'Discussed Q3 content strategy. Key points:\n• Increase Reels frequency to 5x/week\n• Launch email newsletter by June 15\n• Focus on brand partnership outreach',
    action_items: [
      { task: 'Draft email newsletter template', assignee: 'You', due: '2026-05-20', done: false },
      { task: 'Send brand partnership pitch deck', assignee: 'Sarah K.', due: '2026-05-18', done: true },
    ],
    chat: [
      { user: 'Sarah K.', content: 'Love the newsletter idea!', time: '2:12 PM' },
      { user: 'Emma L.', content: 'Agreed — should we do weekly or biweekly?', time: '2:14 PM' },
      { user: 'You', content: 'Weekly to start, then assess after 4 weeks', time: '2:15 PM' },
    ],
  },
  {
    id: 'pm2', title: 'Series A Pitch Prep — Investors', meeting_type: 'presentation',
    scheduled_at: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    started_at: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 7 * 24 * 3600000 + 5400000).toISOString(),
    duration_minutes: 90, host_name: 'Simone O.', recording_url: 'https://example.com/recording', mode: 'pro',
    participants: [
      { name: 'Simone O.', initials: 'SO', color: 'bg-orange-500' },
      { name: 'You', initials: 'Y', color: 'bg-primary' },
      { name: 'Fatima H.', initials: 'FH', color: 'bg-teal-500' },
    ],
    notes: 'Reviewed pitch deck. Feedback:\n• Slide 4 market size needs more data\n• Strengthen competitive moat section\n• Add customer quotes to slide 8',
    action_items: [
      { task: 'Update market size slide with TAM/SAM/SOM data', assignee: 'Simone O.', due: '2026-05-15', done: true },
      { task: 'Gather 3 customer testimonials', assignee: 'You', due: '2026-05-16', done: false },
    ],
    chat: [],
  },
]

const SAMPLE_SPACES = [
  {
    id: 'sp1', name: 'Podcast Team', emoji: '🎙', description: 'Production team for weekly creator podcast',
    privacy: 'private', member_count: 4,
    members: [
      { name: 'You', initials: 'Y', color: 'bg-primary', role: 'owner' },
      { name: 'Marcus Osei', initials: 'MO', color: 'bg-pink-500', role: 'member' },
      { name: 'Priya S.', initials: 'PS', color: 'bg-violet-500', role: 'member' },
      { name: 'Alex T.', initials: 'AT', color: 'bg-emerald-500', role: 'member' },
    ],
    messages: [
      { id: 'sm1', user: 'Marcus Osei', initials: 'MO', color: 'bg-pink-500', content: 'Outline for Ep 14 is ready — dropping it here shortly', time: new Date(Date.now() - 7200000).toISOString() },
      { id: 'sm2', user: 'Priya S.', initials: 'PS', color: 'bg-violet-500', content: 'Great! Should we also add a segment on UGC pricing?', time: new Date(Date.now() - 5400000).toISOString() },
      { id: 'sm3', user: 'You', initials: 'Y', color: 'bg-primary', content: "Yes definitely. Let's keep it under 10 mins though", time: new Date(Date.now() - 3600000).toISOString() },
    ],
    files: [
      { id: 'f1', name: 'Episode 14 Outline.pdf', size: 245000, type: 'pdf', uploader: 'Marcus Osei', uploaded_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 'f2', name: 'Brand Mentions Script.docx', size: 89000, type: 'docx', uploader: 'You', uploaded_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    notes: '# Podcast Team Notes\n\n## Episode 14 — Creator Monetization\n- Guest: TBD\n- Record date: May 18\n- Topics: Brand deals, digital products, courses\n\n## Recurring Checklist\n- [ ] Outline ready 3 days before\n- [ ] Guest briefed 24h before\n- [ ] Intro/outro updated',
  },
  {
    id: 'sp2', name: 'Brand Client — Nike', emoji: '👟', description: 'Collaboration space for Nike Q3 campaign',
    privacy: 'private', member_count: 3,
    members: [
      { name: 'You', initials: 'Y', color: 'bg-primary', role: 'owner' },
      { name: 'Alex Turner', initials: 'AT', color: 'bg-violet-500', role: 'member' },
      { name: 'Nike Brand', initials: 'NB', color: 'bg-orange-500', role: 'member' },
    ],
    messages: [
      { id: 'sm4', user: 'Nike Brand', initials: 'NB', color: 'bg-orange-500', content: 'Hey! Just sent over the Q3 brief. Let us know your thoughts', time: new Date(Date.now() - 172800000).toISOString() },
      { id: 'sm5', user: 'You', initials: 'Y', color: 'bg-primary', content: 'Got it — reviewing now. Looks exciting!', time: new Date(Date.now() - 170000000).toISOString() },
    ],
    files: [
      { id: 'f3', name: 'Nike Q3 Campaign Brief.pdf', size: 1240000, type: 'pdf', uploader: 'Nike Brand', uploaded_at: new Date(Date.now() - 172800000).toISOString() },
    ],
    notes: '# Nike Q3 Campaign\n\n## Deliverables\n- 4x Instagram Reels (15-30s)\n- 2x YouTube integrations\n- 8x Story frames\n\n## Key Dates\n- Brief received: May 15\n- Draft due: June 1\n- Live: June 15',
  },
]

const DIRECT_CONTACTS = [
  { id: 'dc1', name: 'Sarah Kim', initials: 'SK', color: 'bg-violet-500', last_met: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'dc2', name: 'Marcus Osei', initials: 'MO', color: 'bg-pink-500', last_met: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'dc3', name: 'Dr. Adaeze N.', initials: 'DA', color: 'bg-emerald-500', last_met: new Date(Date.now() - 86400000 * 7).toISOString() },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function meetingTypeIcon(type) {
  const icons = { video: '📹', audio: '🎤', presentation: '🖥', workshop: '🎓', podcast: '🎙', interview: '💼' }
  return icons[type] || '📹'
}

function meetingTypeColor(type) {
  const colors = {
    video: 'from-blue-600 to-blue-800',
    audio: 'from-violet-600 to-violet-800',
    presentation: 'from-teal-600 to-teal-800',
    workshop: 'from-amber-600 to-amber-800',
    podcast: 'from-pink-600 to-pink-800',
    interview: 'from-slate-600 to-slate-800',
  }
  return colors[type] || 'from-blue-600 to-blue-800'
}

function fmtTime(dateStr) {
  return format(new Date(dateStr), 'h:mm a')
}

function fmtDate(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE, MMM d')
}

function durationLabel(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fileIcon(type) {
  const icons = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', img: '🖼', png: '🖼', jpg: '🖼', video: '🎬', mp4: '🎬', audio: '🎵', mp3: '🎵', zip: '📦' }
  return icons[type?.toLowerCase()] || '📎'
}

function fileSizeLabel(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase()
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

function Avatar({ initials, color = 'bg-primary', size = 8 }) {
  return (
    <div className={`${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.4}px` }}>
      {initials}
    </div>
  )
}

// ─── SCHEDULE MODAL ───────────────────────────────────────────────────────────

function ScheduleModal({ onClose, onSave }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [meetingType, setMeetingType] = useState('video')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [timezone, setTimezone] = useState('UTC')
  const [recurrence, setRecurrence] = useState('once')
  const [participants, setParticipants] = useState([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [openInvite, setOpenInvite] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState('')
  const [waitingRoom, setWaitingRoom] = useState(true)
  const [allowRecording, setAllowRecording] = useState(true)
  const [muteOnEntry, setMuteOnEntry] = useState(false)
  const [allowChat, setAllowChat] = useState(true)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedCode] = useState(genCode)
  const meetingLink = `https://philomni.app/meet/${generatedCode}`

  const [searchResults, setSearchResults] = useState([])
  const [emailInvite, setEmailInvite] = useState('')
  const [externalEmails, setExternalEmails] = useState([])

  useEffect(() => {
    if (!participantSearch.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from('users').select('id,full_name,email').ilike('full_name', `%${participantSearch}%`).limit(6)
        setSearchResults((data || []).filter(u => !participants.find(p => p.id === u.id)))
      } catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [participantSearch, participants])

  const times = []
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) {
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  function addParticipant(contact) {
    setParticipants(prev => [...prev, { ...contact, role: 'attendee' }])
    setParticipantSearch('')
  }

  function copyLink() {
    navigator.clipboard.writeText(meetingLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function copyFullInvite() {
    const text = `You are invited to a meeting on Philomni\n\nTitle: ${title}\nDate: ${fmtDate(date + 'T' + startTime)}\nTime: ${fmtTime(date + 'T' + startTime + ':00')}\nDuration: ${durationLabel(duration)}\n\nJoin Link: ${meetingLink}\nMeeting ID: ${generatedCode}${password ? `\nPassword: ${password}` : ''}\n\nSee you there!`
    navigator.clipboard.writeText(text)
  }

  async function handleDone() {
    setLoading(true)
    const meetingData = {
      id: 'm' + Date.now(),
      title, description, meeting_type: meetingType,
      host_id: 'u1', host_name: 'You',
      meeting_code: generatedCode, password,
      scheduled_at: new Date(date + 'T' + startTime).toISOString(),
      duration_minutes: duration, timezone, recurrence,
      status: 'scheduled', allow_recording: allowRecording,
      waiting_room: waitingRoom, mute_on_entry: muteOnEntry,
      allow_chat: allowChat, allow_files: true, mode: 'creator',
      participants: [{ name: 'You', role: 'host', initials: 'Y', color: 'bg-primary' }, ...participants],
    }
    try {
      await supabase.from('meetings').insert({
        title, description, meeting_type: meetingType,
        meeting_code: generatedCode, password,
        scheduled_at: meetingData.scheduled_at,
        duration_minutes: duration, timezone, recurrence,
        status: 'scheduled', allow_recording: allowRecording,
        waiting_room: waitingRoom, mute_on_entry: muteOnEntry,
        allow_chat: allowChat,
      })
      const when = `${fmtDate(date + 'T' + startTime)} at ${fmtTime(date + 'T' + startTime + ':00')}`
      for (const p of participants) {
        if (p.id) {
          try {
            await supabase.from('notifications').insert({ user_id: p.id, type: 'meeting_invite', message: `You're invited to: ${title} on ${when}`, link: meetingLink })
          } catch {}
        }
      }
    } catch (e) { /* ignore */ }
    setLoading(false)
    onSave(meetingData)
  }

  const types = [
    { value: 'video', label: 'Video', icon: '📹' },
    { value: 'audio', label: 'Audio', icon: '🎤' },
    { value: 'presentation', label: 'Presentation', icon: '🖥' },
    { value: 'workshop', label: 'Workshop', icon: '🎓' },
    { value: 'podcast', label: 'Podcast', icon: '🎙' },
    { value: 'interview', label: 'Interview', icon: '💼' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground text-lg">Schedule Meeting</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          {[1,2,3,4,5].map(s => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
              {s < 5 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
            </React.Fragment>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting title..." className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this meeting about?" rows={3} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Meeting Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {types.map(t => (
                    <button key={t.value} onClick={() => setMeetingType(t.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${meetingType === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground hover:border-primary/50'}`}>
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Start Time</label>
                  <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary">
                    {times.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Duration</label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary">
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Timezone</label>
                <input value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Recurrence</label>
                <div className="flex gap-2">
                  {['once','daily','weekly','monthly'].map(r => (
                    <button key={r} onClick={() => setRecurrence(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${recurrence === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                      {r === 'once' ? 'One-time' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="relative">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Search people on Philomni</label>
                <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} placeholder="Search by name..." className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => {
                        setParticipants(prev => [...prev, { id: u.id, name: u.full_name, email: u.email, initials: (u.full_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: 'bg-violet-500', role: 'attendee' }])
                        setParticipantSearch('')
                      }} className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{u.full_name?.[0]||'?'}</div>
                        <div>
                          <p className="text-sm text-foreground">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                      <span className="text-xs font-medium text-primary">{p.name}</span>
                      <button onClick={() => setParticipants(prev => prev.filter((_, xi) => xi !== i))} className="text-primary/60 hover:text-primary"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Add by email (external)</label>
                <div className="flex gap-2">
                  <input value={emailInvite} onChange={e => setEmailInvite(e.target.value)} placeholder="email@example.com" type="email"
                    className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary" />
                  <button onClick={() => { if (emailInvite.trim()) { setExternalEmails(prev => [...prev, emailInvite]); setEmailInvite('') } }}
                    className="px-3 py-2 bg-muted border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground">Add</button>
                </div>
                {externalEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {externalEmails.map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                        {e} <button onClick={() => setExternalEmails(prev => prev.filter((_, xi) => xi !== i))}><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm text-foreground">Anyone with link can join</span>
                <button onClick={() => setOpenInvite(!openInvite)} className={`w-10 h-5 rounded-full transition-colors ${openInvite ? 'bg-primary' : 'bg-border'} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${openInvite ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              {[
                { label: 'Waiting Room', value: waitingRoom, set: setWaitingRoom, desc: 'Participants wait until host admits them' },
                { label: 'Allow Recording', value: allowRecording, set: setAllowRecording, desc: 'Host can record the meeting' },
                { label: 'Mute on Entry', value: muteOnEntry, set: setMuteOnEntry, desc: 'All participants enter muted' },
                { label: 'Allow Chat', value: allowChat, set: setAllowChat, desc: 'Enable in-meeting chat' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <button onClick={() => item.set(!item.value)} className={`w-10 h-5 rounded-full transition-colors ${item.value ? 'bg-primary' : 'bg-border'} relative`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password (optional)</label>
                <div className="flex gap-2">
                  <input value={password} onChange={e => setPassword(e.target.value)} placeholder="No password" className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
                  <button onClick={() => setPassword(Math.floor(1000 + Math.random() * 9000).toString())} className="px-3 py-2 bg-muted border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground">Auto-generate</button>
                </div>
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <div className="bg-muted rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Meeting Code</p>
                  <p className="font-mono font-semibold text-foreground text-lg">{generatedCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Meeting Link</p>
                  <p className="text-sm text-primary break-all">{meetingLink}</p>
                </div>
                {password && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Password</p>
                    <p className="font-mono text-foreground">{password}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <button onClick={copyLink} className="w-full flex items-center justify-center gap-2 p-3 bg-muted rounded-xl hover:bg-muted/80 text-sm text-foreground">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} Copy Link
                </button>
                <button onClick={copyFullInvite} className="w-full flex items-center justify-center gap-2 p-3 bg-muted rounded-xl hover:bg-muted/80 text-sm text-foreground">
                  <FileText size={16} /> Copy Full Invite
                </button>
              </div>
            </>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 5 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 1 && !title.trim()}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90">
              Continue
            </button>
          ) : (
            <button onClick={handleDone} disabled={loading}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── JOIN CODE MODAL ──────────────────────────────────────────────────────────

function JoinCodeModal({ onClose }) {
  const [code, setCode] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Join with Code</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
        </div>
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Enter meeting code..." className="w-full bg-muted border border-border rounded-xl px-3 py-3 text-foreground font-mono text-lg text-center focus:outline-none focus:border-primary" maxLength={12} />
        <button disabled={!code.trim()} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50">Join Meeting</button>
      </div>
    </div>
  )
}

// ─── CREATE SPACE MODAL ───────────────────────────────────────────────────────

function CreateSpaceModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎙')
  const [privacy, setPrivacy] = useState('private')
  const [loading, setLoading] = useState(false)
  const emojis = ['🎙', '📁', '👟', '🎓', '💼', '🚀']

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    const spaceData = {
      id: 'sp' + Date.now(), name, description, emoji, privacy,
      member_count: 1,
      members: [{ name: 'You', initials: 'Y', color: 'bg-primary', role: 'owner' }],
      messages: [], files: [], notes: `# ${name}\n\n`,
    }
    try {
      await supabase.from('meeting_spaces').insert({ name, description, emoji, privacy })
    } catch (e) { /* ignore */ }
    setLoading(false)
    onSave(spaceData)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Create Space</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Emoji</label>
          <div className="flex gap-2">
            {emojis.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'}`}>{e}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Space name..." className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this space for?" rows={2} className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
        </div>
        <div className="flex gap-2">
          {['private','public'].map(p => (
            <button key={p} onClick={() => setPrivacy(p)} className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${privacy === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{p}</button>
          ))}
        </div>
        <button onClick={handleSave} disabled={!name.trim() || loading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />} Create Space
        </button>
      </div>
    </div>
  )
}

// ─── INSTANT MEETING MODAL ────────────────────────────────────────────────────

function InstantMeetingModal({ onClose, onJoin }) {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
  const [instantSearch, setInstantSearch] = useState('')
  const [instantResults, setInstantResults] = useState([])
  const code = useMemo(() => 'INSTANT-' + Math.random().toString(36).slice(2, 6).toUpperCase(), [])
  const link = `https://philomni.app/meet/${code}`
  const meeting = {
    id: 'instant-' + Date.now(), title: 'Instant Meeting', meeting_type: 'video',
    host_name: 'You', meeting_code: code, scheduled_at: new Date().toISOString(),
    duration_minutes: 60, status: 'live', allow_recording: false,
    participants: [{ name: 'You', role: 'host', initials: 'Y', color: 'bg-primary' }],
  }

  useEffect(() => {
    if (!instantSearch.trim()) { setInstantResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from('users').select('id,full_name,email').ilike('full_name', `%${instantSearch}%`).limit(5)
        setInstantResults(data || [])
      } catch { setInstantResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [instantSearch])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{step === 1 ? 'Start Instant Meeting' : 'Invite People'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
        </div>

        {step === 1 && (
          <>
            <div className="bg-muted rounded-xl p-4 text-center">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap size={24} className="text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Your meeting link</p>
              <p className="text-sm text-primary font-mono break-all">{link}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-muted rounded-xl text-sm text-foreground hover:bg-muted/80">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} Copy Link
            </button>
            <button onClick={() => setStep(2)} className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm">
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-muted-foreground">Optional — start with 0 invites anytime</p>
            <input value={instantSearch} onChange={e => setInstantSearch(e.target.value)} placeholder="Search Philomni users..."
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {instantResults.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 bg-muted rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{u.full_name?.[0]||'?'}</div>
                  <span className="flex-1 text-sm text-foreground">{u.full_name}</span>
                  <button onClick={async () => {
                    try { await supabase.from('notifications').insert({ user_id: u.id, type: 'meeting_invite', message: `Join my instant meeting`, link }) } catch {}
                  }} className="px-2 py-1 bg-primary text-primary-foreground rounded-lg text-xs">Invite</button>
                </div>
              ))}
            </div>
            <button onClick={() => onJoin(meeting)} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm">
              Start Meeting
            </button>
            <button onClick={() => onJoin(meeting)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1">
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── FULL CALENDAR ────────────────────────────────────────────────────────────

const CAL_TYPE_COLOR = {
  video: 'bg-blue-500', audio: 'bg-violet-500', presentation: 'bg-teal-500',
  workshop: 'bg-amber-500', podcast: 'bg-pink-500', interview: 'bg-slate-500',
}
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am – 9pm

function FullCalendar({ meetings, onSchedule, onSelectMeeting }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [calView, setCalView] = useState('month')

  function nav(dir) {
    if (calView === 'month') setViewDate(d => addMonths(d, dir))
    else if (calView === 'week') setViewDate(d => addDays(d, dir * 7))
    else setViewDate(d => addDays(d, dir))
  }

  function msForDay(day) {
    return meetings.filter(m => isSameDay(new Date(m.scheduled_at), day))
  }

  const monthStart = startOfMonth(viewDate)
  const calStart = addDays(monthStart, -getDay(monthStart))
  const calDays = Array.from({ length: 42 }, (_, i) => addDays(calStart, i))

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const headerTitle = calView === 'month'
    ? format(viewDate, 'MMMM yyyy')
    : calView === 'week'
    ? `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
    : format(viewDate, 'EEEE, MMMM d, yyyy')

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => nav(-1)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronLeft size={16} /></button>
          <span className="font-semibold text-foreground text-sm min-w-[180px] text-center">{headerTitle}</span>
          <button onClick={() => nav(1)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight size={16} /></button>
          <button onClick={() => setViewDate(new Date())} className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground ml-1">Today</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {['Day','Week','Month'].map(v => (
              <button key={v} onClick={() => setCalView(v.toLowerCase())}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${calView === v.toLowerCase() ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{v}</button>
            ))}
          </div>
          <button onClick={onSchedule} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90">
            <Plus size={13} /> Schedule
          </button>
        </div>
      </div>

      {/* Month View */}
      {calView === 'month' && (
        <>
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calDays.map((day, idx) => {
              const dayMs = msForDay(day)
              const isCurrentMonth = day.getMonth() === viewDate.getMonth()
              const isCurrentDay = isToday(day)
              return (
                <div key={idx} onClick={() => { setViewDate(day); setCalView('day') }}
                  className={`min-h-[76px] p-1 border-b border-r border-border cursor-pointer hover:bg-muted/40 transition-colors ${!isCurrentMonth ? 'opacity-35' : ''} ${isCurrentDay ? 'bg-primary/5' : ''}`}>
                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-0.5 ${isCurrentDay ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-0.5">
                    {dayMs.slice(0, 2).map((m, i) => (
                      <button key={i} onClick={e => { e.stopPropagation(); onSelectMeeting(m) }}
                        className={`w-full text-left text-[10px] px-1 py-0.5 rounded text-white truncate ${CAL_TYPE_COLOR[m.meeting_type] || 'bg-primary'}`}>
                        {format(new Date(m.scheduled_at), 'h:mma')} {m.title}
                      </button>
                    ))}
                    {dayMs.length > 2 && <p className="text-[9px] text-muted-foreground px-1">+{dayMs.length - 2} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Week View */}
      {calView === 'week' && (
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="grid border-b border-border" style={{ gridTemplateColumns: '44px repeat(7, 1fr)' }}>
              <div className="border-r border-border" />
              {weekDays.map(day => (
                <div key={day.toISOString()} onClick={() => { setViewDate(day); setCalView('day') }}
                  className={`py-2 text-center cursor-pointer hover:bg-muted/50 border-r border-border last:border-r-0 ${isToday(day) ? 'bg-primary/5' : ''}`}>
                  <p className="text-[10px] text-muted-foreground">{format(day, 'EEE')}</p>
                  <p className={`text-sm font-semibold ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</p>
                </div>
              ))}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {HOURS.map(h => (
                <div key={h} className="grid border-b border-border/40" style={{ gridTemplateColumns: '44px repeat(7, 1fr)' }}>
                  <div className="border-r border-border flex items-start justify-end pr-1.5 pt-1">
                    <span className="text-[9px] text-muted-foreground">{h < 12 ? `${h}am` : h === 12 ? '12p' : `${h-12}pm`}</span>
                  </div>
                  {weekDays.map(day => {
                    const slotMs = meetings.filter(m => { const d = new Date(m.scheduled_at); return isSameDay(d, day) && d.getHours() === h })
                    return (
                      <div key={day.toISOString()} className={`border-r border-border/20 last:border-r-0 h-10 p-0.5 ${isToday(day) ? 'bg-primary/3' : 'hover:bg-muted/30'}`}>
                        {slotMs.map((m, i) => (
                          <button key={i} onClick={() => onSelectMeeting(m)}
                            className={`w-full text-[9px] text-white px-1 py-0.5 rounded truncate text-left ${CAL_TYPE_COLOR[m.meeting_type] || 'bg-primary'}`}>
                            {m.title}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day View */}
      {calView === 'day' && (
        <div className="max-h-72 overflow-y-auto">
          {HOURS.map(h => {
            const hourMs = msForDay(viewDate).filter(m => new Date(m.scheduled_at).getHours() === h)
            return (
              <div key={h} className="flex gap-3 px-4 py-2 border-b border-border/40 hover:bg-muted/20">
                <div className="w-10 flex-shrink-0 text-right pt-0.5">
                  <span className="text-[10px] text-muted-foreground">{h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`}</span>
                </div>
                <div className="flex-1 min-h-[2rem] space-y-1">
                  {hourMs.map((m, i) => (
                    <button key={i} onClick={() => onSelectMeeting(m)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs text-white ${CAL_TYPE_COLOR[m.meeting_type] || 'bg-primary'}`}>
                      <p className="font-medium">{m.title}</p>
                      <p className="opacity-80">{format(new Date(m.scheduled_at), 'h:mm a')} · {durationLabel(m.duration_minutes)} · {m.participants?.length || 1} people</p>
                    </button>
                  ))}
                  {hourMs.length === 0 && (
                    <button onClick={onSchedule}
                      className="w-full py-1 border border-dashed border-border rounded-lg text-[10px] text-muted-foreground hover:border-primary/50 hover:text-primary opacity-0 hover:opacity-100 transition-opacity">
                      + Add meeting at {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MEETING CARD ─────────────────────────────────────────────────────────────

function MeetingCard({ meeting, onJoin, onDetails, isLive }) {
  const [copied, setCopied] = useState(false)
  const endTime = addMinutes(new Date(meeting.scheduled_at), meeting.duration_minutes)

  function copyLink() {
    navigator.clipboard.writeText(`https://philomni.app/meet/${meeting.meeting_code}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meetingTypeColor(meeting.meeting_type)} flex items-center justify-center text-lg flex-shrink-0`}>
          {meetingTypeIcon(meeting.meeting_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm truncate">{meeting.title}</h3>
            {isLive && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-medium animate-pulse">LIVE</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtTime(meeting.scheduled_at)} – {fmtTime(endTime.toISOString())} · {durationLabel(meeting.duration_minutes)}
          </p>
          {meeting.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{meeting.description}</p>}
          <div className="flex items-center gap-1 mt-2">
            {meeting.participants?.slice(0, 4).map((p, i) => (
              <Avatar key={i} initials={p.initials} color={p.color} size={6} />
            ))}
            {meeting.participants?.length > 4 && <span className="text-xs text-muted-foreground ml-1">+{meeting.participants.length - 4}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onJoin(meeting)} className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${isLive ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
          <Video size={13} /> {isLive ? 'Join Now' : 'Join'}
        </button>
        <button onClick={copyLink} className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs text-muted-foreground flex items-center gap-1.5">
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
        <button onClick={() => onDetails(meeting)} className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs text-muted-foreground">Details</button>
      </div>
    </div>
  )
}

// ─── PAST MEETING CARD ────────────────────────────────────────────────────────

function PastMeetingCard({ meeting, onView }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meetingTypeColor(meeting.meeting_type)} flex items-center justify-center text-base flex-shrink-0 opacity-70`}>
            {meetingTypeIcon(meeting.meeting_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{meeting.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(meeting.scheduled_at)} · {durationLabel(meeting.duration_minutes)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {meeting.participants?.slice(0, 3).map((p, i) => <Avatar key={i} initials={p.initials} color={p.color} size={5} />)}
              <span className="text-xs text-muted-foreground ml-1">{meeting.participants?.length} people</span>
              {meeting.recording_url && <span className="ml-2 text-xs text-red-400 flex items-center gap-0.5"><Circle size={8} className="fill-red-400" /> REC</span>}
            </div>
          </div>
        </div>
        <button onClick={() => onView(meeting)} className="text-xs text-primary hover:underline flex-shrink-0">View</button>
      </div>
    </div>
  )
}

// ─── PAST MEETING DETAIL ──────────────────────────────────────────────────────

function PastMeetingDetail({ meeting, onBack, onScheduleFollowup }) {
  const [actionItems, setActionItems] = useState(meeting.action_items || [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div>
          <p className="text-xs text-muted-foreground">Past Meeting</p>
          <h2 className="font-semibold text-foreground">{meeting.title}</h2>
        </div>
      </div>
      <div className={`h-24 rounded-2xl bg-gradient-to-br ${meetingTypeColor(meeting.meeting_type)} flex items-center px-6 gap-4`}>
        <span className="text-4xl">{meetingTypeIcon(meeting.meeting_type)}</span>
        <div>
          <p className="font-bold text-white text-lg">{meeting.title}</p>
          <p className="text-white/70 text-sm">{fmtDate(meeting.scheduled_at)} · {durationLabel(meeting.duration_minutes)} · {meeting.host_name}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Date', value: fmtDate(meeting.scheduled_at) },
          { label: 'Duration', value: durationLabel(meeting.duration_minutes) },
          { label: 'Host', value: meeting.host_name },
          { label: 'Participants', value: meeting.participants?.length },
        ].map(item => (
          <div key={item.label} className="bg-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {meeting.participants?.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Avatar initials={p.initials} color={p.color} size={9} />
            <span className="text-xs text-muted-foreground">{p.name?.split(' ')[0]}</span>
          </div>
        ))}
      </div>
      {meeting.recording_url && (
        <div className="bg-black rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur cursor-pointer hover:bg-white/30 transition-colors">
              <Play size={24} className="text-white ml-1" />
            </div>
            <p className="text-white/70 text-sm">Meeting Recording</p>
          </div>
        </div>
      )}
      {meeting.chat?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2"><MessageSquare size={15} /> Chat Transcript</h3>
          <div className="space-y-2">
            {meeting.chat.map((c, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="font-medium text-foreground flex-shrink-0">{c.user}:</span>
                <span className="text-muted-foreground">{c.content}</span>
                <span className="text-xs text-muted-foreground ml-auto">{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {meeting.notes && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2"><StickyNote size={15} /> Notes</h3>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{meeting.notes}</pre>
        </div>
      )}
      {actionItems?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2"><ClipboardList size={15} /> Action Items</h3>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2 bg-muted rounded-xl">
                <button onClick={() => setActionItems(prev => prev.map((x, xi) => xi === i ? { ...x, done: !x.done } : x))}
                  className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : 'border-border'}`}>
                  {item.done && <Check size={12} className="text-white" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.task}</p>
                  <p className="text-xs text-muted-foreground">{item.assignee} · Due {item.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={onScheduleFollowup} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
        <Calendar size={15} /> Schedule Follow-up
      </button>
    </div>
  )
}

// ─── SPACE VIEW ───────────────────────────────────────────────────────────────

function SpaceView({ space, onBack }) {
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState(space.messages || [])
  const [msgInput, setMsgInput] = useState('')
  const [notes, setNotes] = useState(space.notes || '')
  const [files, setFiles] = useState(space.files || [])
  const [uploading, setUploading] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!msgInput.trim()) return
    const msg = {
      id: 'msg' + Date.now(), user: 'You', initials: 'Y', color: 'bg-primary',
      content: msgInput, time: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    setMsgInput('')
    try {
      await supabase.from('space_messages').insert({ space_id: space.id, content: msgInput, user_name: 'You' })
    } catch (e) { /* ignore */ }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Use the shared 'uploads' storage bucket with a meetings/ prefix path
      const path = `meetings/spaces/${space.id}/${Date.now()}-${file.name}`
      const { data: uploadData } = await supabase.storage.from('uploads').upload(path, file)
      let publicUrl = null
      if (uploadData?.path) {
        const { data: { publicUrl: url } } = supabase.storage.from('uploads').getPublicUrl(uploadData.path)
        publicUrl = url
      }
      // Save metadata to meeting_files table
      const meta = {
        meeting_id: space.id, file_name: file.name,
        file_url: publicUrl, file_size: file.size,
        file_type: file.name.split('.').pop(), uploader_id: null,
        uploaded_at: new Date().toISOString(),
      }
      await supabase.from('meeting_files').insert(meta)
      setFiles(prev => [...prev, { id: 'f' + Date.now(), name: file.name, size: file.size, type: meta.file_type, uploader: 'You', uploaded_at: meta.uploaded_at }])
    } catch (e) { console.error('[Meetings] space file upload:', e.message) }
    setUploading(false)
  }

  async function saveNotes() {
    try {
      await supabase.from('meeting_spaces').update({ notes }).eq('id', space.id)
    } catch (e) { /* ignore */ }
  }

  const tabs = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'notes', label: 'Notes', icon: '📋' },
    { id: 'members', label: 'Members', icon: '👥' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={16} /></button>
        <span className="text-xl">{space.emoji}</span>
        <div>
          <h2 className="font-semibold text-foreground text-sm">{space.name}</h2>
          <p className="text-xs text-muted-foreground">{space.member_count} members</p>
        </div>
      </div>
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.user === 'You' ? 'flex-row-reverse' : ''}`}>
                  <Avatar initials={m.initials} color={m.color} size={8} />
                  <div className={`max-w-xs ${m.user === 'You' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    <span className={`text-xs text-muted-foreground ${m.user === 'You' ? 'text-right' : ''}`}>{m.user} · {timeAgo(m.time)}</span>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${m.user === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{m.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Message..." className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              <button onClick={sendMessage} className="p-2.5 bg-primary rounded-xl text-primary-foreground hover:bg-primary/90"><Send size={16} /></button>
            </div>
          </div>
        )}
        {tab === 'files' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Files</h3>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            </div>
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <span className="text-2xl">{fileIcon(f.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{fileSizeLabel(f.size)} · {f.uploader} · {timeAgo(f.uploaded_at)}</p>
                </div>
                <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"><Download size={14} /></button>
              </div>
            ))}
          </div>
        )}
        {tab === 'notes' && (
          <div className="p-4 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-3">Shared Notes</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
              className="flex-1 bg-muted border border-border rounded-xl p-3 text-sm text-foreground font-mono focus:outline-none focus:border-primary resize-none min-h-64"
              placeholder="Start writing notes..." />
            <p className="text-xs text-muted-foreground mt-2">Auto-saved on blur</p>
          </div>
        )}
        {tab === 'members' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input value={inviteInput} onChange={e => setInviteInput(e.target.value)} placeholder="Invite by name or email..."
                className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
              <button className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium">Invite</button>
            </div>
            {space.members?.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <Avatar initials={m.initials} color={m.color} size={9} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${m.role === 'owner' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ACTIVE MEETING VIEW ──────────────────────────────────────────────────────

function ActiveMeetingView({ meeting, onEnd }) {
  const [elapsed, setElapsed] = useState(0)
  const [speakingIdx, setSpeakingIdx] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showRecordConfirm, setShowRecordConfirm] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState(null)
  const mediaRecorderRef = useRef(null)
  const recordingChunksRef = useRef([])
  const startedAtRef = useRef(new Date())
  const [isSharing, setIsSharing] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSidebarTabs, setActiveSidebarTabs] = useState({ chat: false, people: false, files: false, notes: false })
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'speaker'
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [notes, setNotes] = useState('')
  const [actionInput, setActionInput] = useState('')
  const [actions, setActions] = useState([])
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [inviteTab, setInviteTab] = useState('search')
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteResults, setInviteResults] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  const participants = meeting.participants || [{ name: 'You', role: 'host', initials: 'Y', color: 'bg-primary' }]
  const meetingLink = `https://philomni.app/meet/${meeting.meeting_code || 'meet'}`

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setSpeakingIdx(idx => (idx + 1) % participants.length), 2500)
    return () => clearInterval(t)
  }, [participants.length])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  useEffect(() => {
    if (!inviteSearch.trim()) { setInviteResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.from('users').select('id,full_name,email').ilike('full_name', `%${inviteSearch}%`).limit(5)
        setInviteResults(data || [])
      } catch { setInviteResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [inviteSearch])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      const recorder = new MediaRecorder(stream)
      recordingChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' })
        const path = `recordings/${meeting.id}/${Date.now()}.webm`
        try {
          const { data } = await supabase.storage.from('uploads').upload(path, blob)
          const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
          setRecordingUrl(publicUrl)
          await supabase.from('meetings').update({ recording_url: publicUrl }).eq('id', meeting.id)
        } catch {}
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setShowRecordConfirm(false)
    } catch { setShowRecordConfirm(false) }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  function fmtElapsed(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  async function sendChat() {
    if (!chatInput.trim()) return
    const msg = { id: Date.now(), user: 'You', content: chatInput, time: new Date().toISOString() }
    setChatMessages(prev => [...prev, msg])
    setChatInput('')
    try {
      await supabase.from('meeting_messages').insert({ meeting_id: meeting.id, content: chatInput, user_name: 'You' })
    } catch (e) { /* ignore */ }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Use shared 'uploads' storage bucket with meetings/ prefix path
      const path = `meetings/${meeting.id}/${Date.now()}-${file.name}`
      const { data: uploadData } = await supabase.storage.from('uploads').upload(path, file)
      let publicUrl = null
      if (uploadData?.path) {
        const { data: { publicUrl: url } } = supabase.storage.from('uploads').getPublicUrl(uploadData.path)
        publicUrl = url
      }
      await supabase.from('meeting_files').insert({
        meeting_id: meeting.id, file_name: file.name, file_url: publicUrl,
        file_size: file.size, file_type: file.name.split('.').pop(),
        uploaded_at: new Date().toISOString(),
      }).catch(() => {})
      setFiles(prev => [...prev, { id: Date.now(), name: file.name, size: file.size, type: file.name.split('.').pop(), uploader: 'You', uploaded_at: new Date().toISOString() }])
    } catch (e) { console.error('[Meetings] file upload:', e.message) }
    setUploading(false)
  }

  function toggleSidebar(tab) {
    if (sidebarOpen && sidebarTab === tab) { setSidebarOpen(false) }
    else { setSidebarTab(tab); setSidebarOpen(true) }
  }

  const tileGradients = ['from-blue-700 to-blue-900', 'from-violet-700 to-violet-900', 'from-teal-700 to-teal-900', 'from-pink-700 to-pink-900', 'from-amber-700 to-amber-900']

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* HEADER */}
      <div className="h-14 flex items-center justify-between px-4 bg-gray-900 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">{meeting.title}</span>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <Circle size={8} className="fill-red-400 animate-pulse" /> REC
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm font-mono">{fmtElapsed(elapsed)}</span>
          <button onClick={() => setLeaveConfirm(true)} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Leave</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* VIDEO GRID */}
        <div className="flex-1 bg-black relative flex flex-col">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button onClick={() => setViewMode(v => v === 'grid' ? 'speaker' : 'grid')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs flex items-center gap-1.5">
              <LayoutGrid size={13} /> {viewMode === 'grid' ? 'Speaker' : 'Grid'}
            </button>
          </div>
          {viewMode === 'grid' ? (
            <div className={`flex-1 p-4 grid gap-3 ${participants.length <= 1 ? 'grid-cols-1' : participants.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
              {participants.map((p, i) => (
                <div key={i} className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${tileGradients[i % tileGradients.length]} ${speakingIdx === i ? 'ring-2 ring-green-400' : ''}`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">{p.initials}</div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-white text-sm font-medium">{p.name}</span>
                      <span className="text-white/60 text-xs capitalize">{p.role}</span>
                    </div>
                    {speakingIdx === i && <span className="text-xs text-green-400 font-medium">Speaking</span>}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    {isMuted && p.name === 'You' && <MicOff size={14} className="text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 gap-3">
              <div className={`flex-1 relative rounded-2xl overflow-hidden bg-gradient-to-br ${tileGradients[speakingIdx % tileGradients.length]}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-bold">{participants[speakingIdx]?.initials}</div>
                  <span className="text-white text-lg font-semibold">{participants[speakingIdx]?.name}</span>
                  <span className="text-green-400 text-sm font-medium">Speaking</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {participants.map((p, i) => (
                  <div key={i} className={`w-32 h-20 flex-shrink-0 relative rounded-xl overflow-hidden bg-gradient-to-br ${tileGradients[i % tileGradients.length]} ${speakingIdx === i ? 'ring-2 ring-green-400' : ''}`}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">{p.initials}</div>
                      <span className="text-white text-xs">{p.name?.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        {sidebarOpen && (
          <div className="w-72 flex-shrink-0 bg-gray-900 border-l border-white/10 flex flex-col">
            <div className="flex border-b border-white/10">
              {[['chat','💬'],['people','👥'],['files','📁'],['notes','📝']].map(([id, icon]) => (
                <button key={id} onClick={() => setSidebarTab(id)} className={`flex-1 py-2.5 text-xs transition-colors ${sidebarTab === id ? 'text-white border-b-2 border-primary' : 'text-white/40 hover:text-white/70'}`}>{icon}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 && <p className="text-white/30 text-xs text-center mt-8">No messages yet</p>}
                    {chatMessages.map(m => (
                      <div key={m.id} className={`flex gap-2 ${m.user === 'You' ? 'flex-row-reverse' : ''}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${m.user === 'You' ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'}`}>
                          {m.user !== 'You' && <p className="font-medium mb-0.5 text-white/60">{m.user}</p>}
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 border-t border-white/10 flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Message..." className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30" />
                    <button onClick={sendChat} className="p-2 bg-primary rounded-xl text-primary-foreground"><Send size={14} /></button>
                  </div>
                </div>
              )}
              {sidebarTab === 'people' && (
                <div className="p-3 space-y-2">
                  <button onClick={() => setShowInvitePanel(!showInvitePanel)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90">
                    <UserPlus size={13} /> Invite People
                  </button>
                  {showInvitePanel && (
                    <div className="bg-gray-800 rounded-xl overflow-hidden border border-white/10">
                      <div className="flex border-b border-white/10">
                        {[['search','Search'],['email','Email'],['link','Link']].map(([id,label]) => (
                          <button key={id} onClick={() => setInviteTab(id)}
                            className={`flex-1 py-2 text-[10px] transition-colors ${inviteTab === id ? 'text-white border-b border-primary' : 'text-white/40 hover:text-white/60'}`}>{label}</button>
                        ))}
                      </div>
                      <div className="p-2">
                        {inviteTab === 'search' && (
                          <div className="space-y-1.5">
                            <input value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} placeholder="Search Philomni users..."
                              className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none" />
                            {inviteResults.map(u => (
                              <div key={u.id} className="flex items-center gap-2 p-1.5 bg-white/5 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{u.full_name?.[0]||'?'}</div>
                                <p className="flex-1 text-[11px] text-white truncate">{u.full_name}</p>
                                <button onClick={async () => {
                                  try { await supabase.from('notifications').insert({ user_id: u.id, type: 'meeting_invite', message: `You've been invited to join: ${meeting.title}`, link: meetingLink }) } catch {}
                                  setInviteSearch('')
                                }} className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-[10px]">Invite</button>
                              </div>
                            ))}
                            {inviteSearch && inviteResults.length === 0 && <p className="text-[10px] text-white/30 text-center py-1">No users found</p>}
                          </div>
                        )}
                        {inviteTab === 'email' && (
                          <div className="space-y-1.5">
                            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" type="email"
                              className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none" />
                            <button onClick={() => { console.log('Email invite:', inviteEmail, meetingLink); setEmailSent(true); setTimeout(() => { setEmailSent(false); setInviteEmail('') }, 2000) }}
                              disabled={!inviteEmail.trim() || emailSent}
                              className="w-full py-1.5 bg-primary text-primary-foreground rounded-lg text-xs disabled:opacity-50 flex items-center justify-center gap-1">
                              {emailSent ? <><Check size={10} /> Sent!</> : <><Mail size={10} /> Send Invite</>}
                            </button>
                          </div>
                        )}
                        {inviteTab === 'link' && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-primary font-mono break-all px-1">{meetingLink}</p>
                            <button onClick={() => { navigator.clipboard.writeText(meetingLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
                              className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs flex items-center justify-center gap-1">
                              {linkCopied ? <><Check size={10} className="text-green-400" /> Copied!</> : <><Copy size={10} /> Copy Link</>}
                            </button>
                            <button onClick={() => {
                              const txt = `Join my Philomni meeting:\nTopic: ${meeting.title}\nLink: ${meetingLink}\nMeeting ID: ${meeting.meeting_code}${meeting.password ? `\nPassword: ${meeting.password}` : ''}`
                              navigator.clipboard.writeText(txt); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000)
                            }} className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs flex items-center justify-center gap-1">
                              {inviteCopied ? <><Check size={10} className="text-green-400" /> Copied!</> : <><FileText size={10} /> Copy Full Invite</>}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-white/40 px-1 pt-1">In this meeting</p>
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                      <Avatar initials={p.initials} color={p.color} size={9} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{p.name}</p>
                        <p className="text-xs text-white/40 capitalize">{p.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {speakingIdx === i ? <span className="text-xs text-green-400">Speaking</span> : <span className="text-xs text-white/30">Muted</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sidebarTab === 'files' && (
                <div className="p-3 space-y-2">
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 p-2 bg-white/10 rounded-xl text-sm text-white hover:bg-white/20">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload File
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-xl">
                      <span>{fileIcon(f.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{f.name}</p>
                        <p className="text-xs text-white/40">{fileSizeLabel(f.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sidebarTab === 'notes' && (
                <div className="p-3 flex flex-col gap-3 h-full">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Take notes..."
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none min-h-40" />
                  <div>
                    <p className="text-xs text-white/40 mb-2">Action Items</p>
                    <div className="flex gap-2">
                      <input value={actionInput} onChange={e => setActionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && actionInput.trim() && (setActions(prev => [...prev, { task: actionInput, done: false }]), setActionInput(''))}
                        placeholder="Add action item..." className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30" />
                    </div>
                    <div className="space-y-1.5 mt-2">
                      {actions.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white">
                          <button onClick={() => setActions(prev => prev.map((x, xi) => xi === i ? { ...x, done: !x.done } : x))}
                            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${a.done ? 'bg-green-500 border-green-500' : 'border-white/30'}`}>
                            {a.done && <Check size={10} className="text-white" />}
                          </button>
                          <span className={a.done ? 'line-through text-white/40' : ''}>{a.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS BAR */}
      <div className="h-18 flex items-center justify-center gap-1 px-4 py-3 bg-gray-900 border-t border-white/10 flex-shrink-0">
        <button onClick={() => setIsMuted(!isMuted)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:bg-white/10'}`}>
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />} {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button onClick={() => setIsVideoOff(!isVideoOff)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:bg-white/10'}`}>
          {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />} Video
        </button>
        <button onClick={() => setIsSharing(!isSharing)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${isSharing ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10'}`}>
          <Monitor size={18} /> Share
        </button>
        <button onClick={() => isRecording ? stopRecording() : setShowRecordConfirm(true)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${isRecording ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:bg-white/10'}`}>
          <Circle size={18} className={isRecording ? 'fill-red-400 animate-pulse' : ''} /> {isRecording ? 'Stop Rec' : 'Record'}
        </button>
        <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs text-white/70 hover:bg-white/10">
          <Hand size={18} /> React
        </button>
        <div className="w-px h-8 bg-white/10 mx-1" />
        <button onClick={() => toggleSidebar('chat')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${sidebarOpen && sidebarTab === 'chat' ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10'}`}>
          <MessageSquare size={18} /> Chat
        </button>
        <button onClick={() => toggleSidebar('people')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${sidebarOpen && sidebarTab === 'people' ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10'}`}>
          <Users size={18} /> People
        </button>
        <button onClick={() => toggleSidebar('files')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${sidebarOpen && sidebarTab === 'files' ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10'}`}>
          <Folder size={18} /> Files
        </button>
        <button onClick={() => toggleSidebar('notes')} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs transition-colors ${sidebarOpen && sidebarTab === 'notes' ? 'bg-primary/20 text-primary' : 'text-white/70 hover:bg-white/10'}`}>
          <PenLine size={18} /> Notes
        </button>
        <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs text-white/70 hover:bg-white/10">
          <MoreHorizontal size={18} /> More
        </button>
      </div>

      {/* RECORD CONFIRM MODAL */}
      {showRecordConfirm && (
        <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Circle size={20} className="text-red-400" />
              </div>
              <h3 className="text-white font-semibold">Start Recording?</h3>
            </div>
            <p className="text-white/60 text-sm">All participants will be notified that this meeting is being recorded.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRecordConfirm(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm">Cancel</button>
              <button onClick={startRecording} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium">Start Recording</button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE CONFIRM */}
      {leaveConfirm && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-80 space-y-4">
            <h3 className="text-white font-semibold">Leave Meeting?</h3>
            <p className="text-white/60 text-sm">Choose how you want to leave.</p>
            <div className="space-y-2">
              <button onClick={() => { if (isRecording) stopRecording(); onEnd(notes, actions, recordingUrl) }} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium">Leave and end for all</button>
              <button onClick={() => { if (isRecording) stopRecording(); onEnd(notes, actions, recordingUrl) }} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm">Just leave</button>
              <button onClick={() => setLeaveConfirm(false)} className="w-full py-2 text-white/40 hover:text-white/70 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────

function LeftPanel({ meetings, pastMeetings, spaces, contacts, collapsed, onToggle, onSelectMeeting, onSelectPast, onSelectSpace, onJoin, onNewMeeting, onNewSpace, selectedId }) {
  const now = Date.now()
  const isLive = (m) => Math.abs(new Date(m.scheduled_at).getTime() - now) < 5 * 60000

  function SectionHeader({ label, id, action, actionLabel }) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5">
        <button onClick={() => onToggle(id)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground flex-1">
          {collapsed[id] ? <ChevronRight size={12} /> : <ChevronDown size={12} />} {label}
        </button>
        {action && (
          <button onClick={action} className="p-0.5 rounded text-muted-foreground hover:text-foreground"><Plus size={13} /></button>
        )}
      </div>
    )
  }

  return (
    <div className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
      <div className="p-3 border-b border-border">
        <h1 className="font-bold text-foreground text-sm">Meetings</h1>
        <p className="text-xs text-muted-foreground">Collaboration hub</p>
      </div>
      <div className="flex-1 py-2">
        {/* Upcoming */}
        <SectionHeader label="Upcoming" id="upcoming" action={onNewMeeting} />
        {!collapsed.upcoming && (
          <div className="space-y-0.5 mb-2">
            {meetings.filter(m => m.status === 'scheduled').map(m => (
              <button key={m.id} onClick={() => onSelectMeeting(m)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left transition-colors ${selectedId === m.id ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''}`}>
                <span className="text-base">{meetingTypeIcon(m.meeting_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${selectedId === m.id ? 'text-primary' : 'text-foreground'}`}>{m.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(m.scheduled_at)} {fmtTime(m.scheduled_at)}</p>
                </div>
                {isLive(m) && (
                  <button onClick={e => { e.stopPropagation(); onJoin(m) }} className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-md flex-shrink-0">Join</button>
                )}
              </button>
            ))}
          </div>
        )}
        {/* Spaces */}
        <SectionHeader label="My Spaces" id="spaces" action={onNewSpace} />
        {!collapsed.spaces && (
          <div className="space-y-0.5 mb-2">
            {spaces.map(s => (
              <button key={s.id} onClick={() => onSelectSpace(s)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left transition-colors ${selectedId === s.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                <span className="text-base">{s.emoji}</span>
                <span className={`text-xs font-medium truncate ${selectedId === s.id ? 'text-primary' : 'text-foreground'}`}>{s.name}</span>
              </button>
            ))}
          </div>
        )}
        {/* Direct */}
        <SectionHeader label="Direct" id="direct" />
        {!collapsed.direct && (
          <div className="space-y-0.5 mb-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted group">
                <Avatar initials={c.initials} color={c.color} size={7} />
                <span className="text-xs text-foreground flex-1 truncate">{c.name}</span>
                <button className="opacity-0 group-hover:opacity-100 text-xs bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Phone size={10} /> Call
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Past */}
        <SectionHeader label="Past" id="past" />
        {!collapsed.past && (
          <div className="space-y-0.5">
            {pastMeetings.map(m => (
              <button key={m.id} onClick={() => onSelectPast(m)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left ${selectedId === m.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                <span className="text-base opacity-60">{meetingTypeIcon(m.meeting_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${selectedId === m.id ? 'text-primary' : 'text-foreground'}`}>{m.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(m.scheduled_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MEETING DETAIL VIEW ──────────────────────────────────────────────────────

function MeetingDetailView({ meeting, onBack, onJoin }) {
  const [copied, setCopied] = useState(false)
  const endTime = addMinutes(new Date(meeting.scheduled_at), meeting.duration_minutes)

  function copyInvite() {
    const text = `You're invited!\n\nTitle: ${meeting.title}\nDate: ${fmtDate(meeting.scheduled_at)}\nTime: ${fmtTime(meeting.scheduled_at)}\nDuration: ${durationLabel(meeting.duration_minutes)}\n\nJoin: https://philomni.app/meet/${meeting.meeting_code}\nID: ${meeting.meeting_code}${meeting.password ? `\nPassword: ${meeting.password}` : ''}`
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div>
          <p className="text-xs text-muted-foreground">Upcoming Meeting</p>
          <h2 className="font-semibold text-foreground">{meeting.title}</h2>
        </div>
      </div>
      <div className={`h-28 rounded-2xl bg-gradient-to-br ${meetingTypeColor(meeting.meeting_type)} flex items-center px-6 gap-4`}>
        <span className="text-5xl">{meetingTypeIcon(meeting.meeting_type)}</span>
        <div>
          <p className="font-bold text-white text-xl">{meeting.title}</p>
          <p className="text-white/70">{fmtDate(meeting.scheduled_at)} at {fmtTime(meeting.scheduled_at)} · {durationLabel(meeting.duration_minutes)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Type', value: meeting.meeting_type ? meeting.meeting_type.charAt(0).toUpperCase() + meeting.meeting_type.slice(1) : '' },
          { label: 'Date', value: fmtDate(meeting.scheduled_at) },
          { label: 'Time', value: `${fmtTime(meeting.scheduled_at)} – ${fmtTime(endTime.toISOString())}` },
          { label: 'Duration', value: durationLabel(meeting.duration_minutes) },
          { label: 'Host', value: meeting.host_name },
          { label: 'Meeting Code', value: meeting.meeting_code },
        ].map(item => (
          <div key={item.label} className="bg-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium text-foreground mt-0.5 font-mono">{item.value}</p>
          </div>
        ))}
        {meeting.password && (
          <div className="bg-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Password</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{'•'.repeat(meeting.password.length)}</p>
          </div>
        )}
      </div>
      {meeting.description && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Description / Agenda</h3>
          <p className="text-sm text-muted-foreground">{meeting.description}</p>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Participants ({meeting.participants?.length})</h3>
        <div className="space-y-2">
          {meeting.participants?.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <Avatar initials={p.initials} color={p.color} size={9} />
              <span className="text-sm text-foreground flex-1">{p.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.role === 'host' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{p.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-muted rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-1">Meeting Settings</h3>
        {[
          { label: 'Waiting Room', value: meeting.waiting_room },
          { label: 'Allow Recording', value: meeting.allow_recording },
          { label: 'Mute on Entry', value: meeting.mute_on_entry },
          { label: 'Allow Chat', value: meeting.allow_chat },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.value ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>{item.value ? 'On' : 'Off'}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => onJoin(meeting)} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
          <Video size={18} /> Join Meeting
        </button>
        <button onClick={copyInvite} className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl text-sm text-foreground flex items-center gap-2">
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} Copy Invite
        </button>
        <button className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl text-sm text-foreground flex items-center gap-2">
          <Edit2 size={16} /> Edit
        </button>
      </div>
    </div>
  )
}

// ─── BOOKING SETUP ────────────────────────────────────────────────────────────

function BookingSetup({ user, onDone }) {
  const [step, setStep] = useState(1)
  const [availability, setAvailability] = useState({
    Mon: { active: true, start: '09:00', end: '17:00' },
    Tue: { active: true, start: '09:00', end: '17:00' },
    Wed: { active: true, start: '09:00', end: '17:00' },
    Thu: { active: true, start: '09:00', end: '17:00' },
    Fri: { active: true, start: '09:00', end: '17:00' },
    Sat: { active: false, start: '10:00', end: '14:00' },
    Sun: { active: false, start: '10:00', end: '14:00' },
  })
  const [timezone, setTimezone] = useState('UTC')
  const [meetingTypes, setMeetingTypes] = useState([
    { id: 1, name: '15-min Quick Chat', duration: 15, price: 0, description: 'A quick intro or catch-up', emoji: '☕' },
    { id: 2, name: '30-min Consultation', duration: 30, price: 0, description: 'Discuss a specific topic in depth', emoji: '💬' },
    { id: 3, name: '60-min Deep Dive', duration: 60, price: 0, description: 'Full strategy or detailed review', emoji: '🚀' },
  ])
  const [bufferMins, setBufferMins] = useState(0)
  const [maxPerDay, setMaxPerDay] = useState(0)
  const [minNoticeHours, setMinNoticeHours] = useState(2)
  const [windowDays, setWindowDays] = useState(30)
  const [confirmMsg, setConfirmMsg] = useState('Thanks for booking! You will receive a meeting link shortly.')
  const [sendEmail, setSendEmail] = useState(true)
  const [allowReschedule, setAllowReschedule] = useState(true)
  const [allowCancel, setAllowCancel] = useState(true)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await supabase.from('booking_availability').upsert({
        user_id: user?.id,
        available_days: availability,
        timezone,
        buffer_minutes: bufferMins,
        max_per_day: maxPerDay || null,
        min_notice_hours: minNoticeHours,
        booking_window_days: windowDays,
        meeting_types: meetingTypes,
        is_active: true,
        confirmation_message: confirmMsg,
      })
    } catch {}
    setSaving(false)
    onDone()
  }

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={onDone} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Set Up Your Booking Page</h2>
          <p className="text-muted-foreground text-sm">Let people book time with you</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {[1,2,3,4].map(s => (
          <React.Fragment key={s}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
            {s < 4 && <div className={`flex-1 h-0.5 transition-colors ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Your Available Hours</h3>
          {Object.entries(availability).map(([day, cfg]) => (
            <div key={day} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              <button onClick={() => setAvailability(prev => ({ ...prev, [day]: { ...cfg, active: !cfg.active } }))}
                className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${cfg.active ? 'bg-primary' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${cfg.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className={`w-8 text-sm font-medium flex-shrink-0 ${cfg.active ? 'text-foreground' : 'text-muted-foreground'}`}>{day}</span>
              {cfg.active ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={cfg.start} onChange={e => setAvailability(prev => ({ ...prev, [day]: { ...cfg, start: e.target.value } }))}
                    className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground" />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input type="time" value={cfg.end} onChange={e => setAvailability(prev => ({ ...prev, [day]: { ...cfg, end: e.target.value } }))}
                    className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground" />
                </div>
              ) : <span className="text-xs text-muted-foreground">Unavailable</span>}
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Timezone</label>
            <input value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Meeting Types You Offer</h3>
          {meetingTypes.map((mt, i) => (
            <div key={mt.id} className="p-4 bg-muted rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mt.emoji}</span>
                <input value={mt.name} onChange={e => setMeetingTypes(prev => prev.map((x,xi) => xi===i ? {...x,name:e.target.value} : x))}
                  className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                <button onClick={() => setMeetingTypes(prev => prev.filter((_,xi) => xi!==i))}
                  className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                  <select value={mt.duration} onChange={e => setMeetingTypes(prev => prev.map((x,xi) => xi===i ? {...x,duration:Number(e.target.value)} : x))}
                    className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground">
                    {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price</label>
                  <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1.5">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input type="number" min="0" value={mt.price} onChange={e => setMeetingTypes(prev => prev.map((x,xi) => xi===i ? {...x,price:Number(e.target.value)} : x))}
                      className="flex-1 bg-transparent text-xs text-foreground focus:outline-none" placeholder="0 = Free" />
                  </div>
                </div>
              </div>
              <input value={mt.description} onChange={e => setMeetingTypes(prev => prev.map((x,xi) => xi===i ? {...x,description:e.target.value} : x))}
                placeholder="Brief description..." className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary" />
            </div>
          ))}
          <button onClick={() => setMeetingTypes(prev => [...prev, { id: Date.now(), name: 'Custom Session', duration: 60, price: 0, description: '', emoji: '⭐' }])}
            className="w-full py-2.5 border border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary flex items-center justify-center gap-2">
            <Plus size={14} /> Add Meeting Type
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-foreground">Buffer & Limits</h3>
          {[
            { label: 'Buffer between meetings', value: bufferMins, set: setBufferMins, opts: [[0,'None'],[5,'5 min'],[10,'10 min'],[15,'15 min'],[30,'30 min']] },
            { label: 'Max bookings per day', value: maxPerDay, set: setMaxPerDay, opts: [[0,'Unlimited'],[3,'3'],[5,'5'],[8,'8'],[10,'10']] },
            { label: 'Minimum notice (hours)', value: minNoticeHours, set: setMinNoticeHours, opts: [[1,'1 hr'],[2,'2 hrs'],[4,'4 hrs'],[24,'24 hrs'],[48,'48 hrs']] },
            { label: 'Booking window (days)', value: windowDays, set: setWindowDays, opts: [[14,'14 days'],[30,'30 days'],[60,'60 days'],[90,'90 days']] },
          ].map(item => (
            <div key={item.label}>
              <label className="text-sm font-medium text-foreground mb-2 block">{item.label}</label>
              <div className="flex flex-wrap gap-2">
                {item.opts.map(([val,lbl]) => (
                  <button key={val} onClick={() => item.set(val)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${item.value === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{lbl}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Confirmation Settings</h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Message to booker</label>
            <textarea value={confirmMsg} onChange={e => setConfirmMsg(e.target.value)} rows={3}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
          {[
            { label: 'Send email confirmation', value: sendEmail, set: setSendEmail },
            { label: 'Allow rescheduling', value: allowReschedule, set: setAllowReschedule },
            { label: 'Allow cancellation', value: allowCancel, set: setAllowCancel },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <span className="text-sm text-foreground">{item.label}</span>
              <button onClick={() => item.set(!item.value)} className={`w-10 h-5 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={() => step > 1 ? setStep(s => s-1) : onDone()} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{step === 1 ? 'Cancel' : 'Back'}</button>
        {step < 4
          ? <button onClick={() => setStep(s => s+1)} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">Continue</button>
          : <button onClick={save} disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center gap-2">{saving && <Loader2 size={14} className="animate-spin" />} Save & Go Live</button>
        }
      </div>
    </div>
  )
}

// ─── MY BOOKINGS ──────────────────────────────────────────────────────────────

function MyBookings({ user, onSetup, onManage }) {
  const [bookings, setBookings] = useState([])
  const [hasPage, setHasPage] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const bookingLink = `https://philomni.app/book/${user?.username || user?.id || 'me'}`

  useEffect(() => {
    if (!user?.id) return
    supabase.from('booking_availability').select('is_active').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.is_active) setHasPage(true) }).catch(() => {})
    supabase.from('session_bookings').select('*').eq('host_id', user.id).order('scheduled_at', { ascending: true })
      .then(({ data }) => { if (data?.length) setBookings(data) }).catch(() => {})
  }, [user?.id])

  const upcoming = bookings.filter(b => new Date(b.scheduled_at) > new Date())
  const past = bookings.filter(b => new Date(b.scheduled_at) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">My Booking Page</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{hasPage ? 'Your page is live' : 'Not set up yet'}</p>
        </div>
        <div className="flex gap-2">
          {hasPage && (
            <button onClick={() => { navigator.clipboard.writeText(bookingLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-xl text-xs text-foreground hover:bg-muted/80">
              {linkCopied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} Share Link
            </button>
          )}
          <button onClick={hasPage ? onManage : onSetup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90">
            <Settings size={12} /> {hasPage ? 'Manage' : 'Set Up'}
          </button>
        </div>
      </div>

      {!hasPage && (
        <div className="bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 rounded-2xl p-6 text-center">
          <CalendarCheck size={32} className="text-primary mx-auto mb-3" />
          <p className="font-semibold text-foreground">Let people book time with you</p>
          <p className="text-sm text-muted-foreground mt-1">Share your link and let clients book sessions directly</p>
          <button onClick={onSetup} className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
            Set Up Booking Page
          </button>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Upcoming Sessions ({upcoming.length})</h4>
          <div className="space-y-2">
            {upcoming.map((b, i) => (
              <div key={b.id||i} className="p-4 bg-card border border-border rounded-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{b.meeting_type_name || 'Session'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">with {b.booker_name || 'Client'} · {b.booker_email}</p>
                    <p className="text-xs text-primary mt-1">{fmtDate(b.scheduled_at)} at {fmtTime(b.scheduled_at)}</p>
                    {b.topic && <p className="text-xs text-muted-foreground mt-1 italic">"{b.topic}"</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full flex-shrink-0">{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Past Sessions</h4>
          <div className="space-y-2">
            {past.slice(0,3).map((b, i) => (
              <div key={b.id||i} className="p-3 bg-muted rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{b.meeting_type_name || 'Session'} with {b.booker_name || 'Client'}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(b.scheduled_at)}</p>
                </div>
                <span className="text-xs text-muted-foreground">{durationLabel(b.duration_minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CENTER DASHBOARD ─────────────────────────────────────────────────────────

function CenterDashboard({ meetings, pastMeetings, onSchedule, onJoinCode, onInstant, onSelectMeeting, onSelectPast, onJoin, user }) {
  const [tab, setTab] = useState('overview')
  const [showBookingSetup, setShowBookingSetup] = useState(false)

  if (showBookingSetup) {
    return <BookingSetup user={user} onDone={() => setShowBookingSetup(false)} />
  }

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const meetingsThisWeek = meetings.filter(m => { const d = new Date(m.scheduled_at); return d >= weekStart && d <= weekEnd })
  const hoursInMeetings = meetings.reduce((acc, m) => acc + (m.duration_minutes || 0), 0) / 60
  const todayMeetings = meetings.filter(m => isToday(new Date(m.scheduled_at)))
  const isLive = (m) => Math.abs(new Date(m.scheduled_at).getTime() - Date.now()) < 5 * 60000
  const displayMeetings = todayMeetings.length > 0 ? todayMeetings : meetings

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-border px-4 pt-4 flex-shrink-0">
        {[['overview','Overview'],['calendar','Calendar'],['booking','Booking']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'} 👋</h2>
              <p className="text-muted-foreground text-sm mt-0.5">{format(now, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'This Week', value: meetingsThisWeek.length, sub: 'meetings', icon: <Calendar size={18} className="text-primary" /> },
                { label: 'Total Hours', value: `${hoursInMeetings.toFixed(1)}h`, sub: 'in meetings', icon: <Clock size={18} className="text-violet-500" /> },
                { label: 'Today', value: todayMeetings.length, sub: todayMeetings.length !== 1 ? 'meetings' : 'meeting', icon: <Zap size={18} className="text-amber-500" /> },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">{stat.icon}<span className="text-xs text-muted-foreground">{stat.label}</span></div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={onInstant} className="flex flex-col items-center gap-2 p-4 bg-green-600/10 border border-green-600/20 rounded-2xl hover:bg-green-600/20 transition-colors">
                <Zap size={22} className="text-green-500" />
                <span className="text-sm font-medium text-foreground">Start Instant</span>
                <span className="text-xs text-muted-foreground">No setup needed</span>
              </button>
              <button onClick={onSchedule} className="flex flex-col items-center gap-2 p-4 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/20 transition-colors">
                <Calendar size={22} className="text-primary" />
                <span className="text-sm font-medium text-foreground">Schedule</span>
                <span className="text-xs text-muted-foreground">Plan ahead</span>
              </button>
              <button onClick={onJoinCode} className="flex flex-col items-center gap-2 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl hover:bg-violet-500/20 transition-colors">
                <Hash size={22} className="text-violet-500" />
                <span className="text-sm font-medium text-foreground">Join with Code</span>
                <span className="text-xs text-muted-foreground">Enter meeting ID</span>
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">{todayMeetings.length > 0 ? "Today's Meetings" : "Upcoming Meetings"}</h3>
              <div className="space-y-3">
                {displayMeetings.map(m => (
                  <MeetingCard key={m.id} meeting={m} onJoin={onJoin} onDetails={onSelectMeeting} isLive={isLive(m)} />
                ))}
                {displayMeetings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No upcoming meetings</p>
                    <button onClick={onSchedule} className="mt-3 text-primary text-sm hover:underline">Schedule one now</button>
                  </div>
                )}
              </div>
            </div>
            {pastMeetings.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Recent Past Meetings</h3>
                <div className="space-y-3">
                  {pastMeetings.slice(0, 3).map(m => (
                    <PastMeetingCard key={m.id} meeting={m} onView={onSelectPast} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'calendar' && (
          <div className="p-6">
            <FullCalendar meetings={meetings} onSchedule={onSchedule} onSelectMeeting={onSelectMeeting} />
          </div>
        )}

        {tab === 'booking' && (
          <div className="p-6">
            <MyBookings user={user} onSetup={() => setShowBookingSetup(true)} onManage={() => setShowBookingSetup(true)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function Meetings() {
  const { user } = useAuth()
  const { mode } = useMode()
  const navigate = useNavigate()

  const [meetings, setMeetings] = useState(SAMPLE_MEETINGS)
  const [pastMeetings, setPastMeetings] = useState(SAMPLE_PAST_MEETINGS)
  const [spaces, setSpaces] = useState(SAMPLE_SPACES)
  const [loading, setLoading] = useState(false)

  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [selectedPast, setSelectedPast] = useState(null)
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [activeMeeting, setActiveMeeting] = useState(null)
  const activeMeetingStartRef = useRef(null)

  const [showSchedule, setShowSchedule] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [showInstant, setShowInstant] = useState(false)
  const [showCreateSpace, setShowCreateSpace] = useState(false)

  const [leftCollapsed, setLeftCollapsed] = useState({
    upcoming: false, spaces: false, direct: false, past: true
  })

  useEffect(() => {
    if (!user?.id) return
    supabase.from('meetings').select('*')
      .or(`host_id.eq.${user.id},status.eq.scheduled`)
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => {
        if (data?.length) setMeetings(prev => {
          const ids = new Set(data.map(m => m.id))
          return [...data, ...prev.filter(m => !ids.has(m.id))]
        })
      })
      .catch(() => {})
    supabase.from('meetings').select('*').eq('status', 'ended')
      .order('ended_at', { ascending: false }).limit(10)
      .then(({ data }) => {
        if (data?.length) setPastMeetings(prev => {
          const ids = new Set(data.map(m => m.id))
          return [...data, ...prev.filter(m => !ids.has(m.id))]
        })
      })
      .catch(() => {})
    supabase.from('meeting_spaces').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) setSpaces(prev => {
          const ids = new Set(data.map(s => s.id))
          return [...data.map(s => ({ ...s, messages: [], files: [], members: [], notes: '' })), ...prev.filter(s => !ids.has(s.id))]
        })
      })
      .catch(() => {})
  }, [user?.id])

  function handleSaveMeeting(data) {
    setMeetings(prev => [data, ...prev])
    setShowSchedule(false)
  }

  function handleSaveSpace(data) {
    setSpaces(prev => [data, ...prev])
    setShowCreateSpace(false)
  }

  async function handleMeetingEnd(meeting, notes, actions, recUrl) {
    const endedAt = new Date()
    const startedAt = activeMeetingStartRef.current || new Date(meeting.scheduled_at)
    const duration = Math.max(1, Math.round((endedAt - startedAt) / 60000))
    const endedMeeting = {
      ...meeting,
      status: 'ended',
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_minutes: duration,
      notes: notes || '',
      action_items: actions || [],
      recording_url: recUrl || meeting.recording_url || null,
      chat: [],
    }
    setPastMeetings(prev => [endedMeeting, ...prev])
    setMeetings(prev => prev.filter(m => m.id !== meeting.id))
    setActiveMeeting(null)
    setLeftCollapsed(prev => ({ ...prev, past: false }))
    try {
      await supabase.from('meetings').update({
        status: 'ended',
        ended_at: endedAt.toISOString(),
        duration_minutes: duration,
        recording_url: recUrl || null,
      }).eq('id', meeting.id)
    } catch {}
  }

  if (activeMeeting) {
    return <ActiveMeetingView
      meeting={activeMeeting}
      onEnd={(notes, actions, recUrl) => handleMeetingEnd(activeMeeting, notes, actions, recUrl)}
    />
  }

  let centerContent
  if (selectedSpace) {
    centerContent = <SpaceView space={selectedSpace} onBack={() => setSelectedSpace(null)} />
  } else if (selectedPast) {
    centerContent = <PastMeetingDetail meeting={selectedPast} onBack={() => setSelectedPast(null)} onScheduleFollowup={() => setShowSchedule(true)} />
  } else if (selectedMeeting) {
    centerContent = <MeetingDetailView meeting={selectedMeeting} onBack={() => setSelectedMeeting(null)} onJoin={() => { activeMeetingStartRef.current = new Date(); setActiveMeeting(selectedMeeting) }} />
  } else {
    centerContent = (
      <CenterDashboard
        meetings={meetings}
        pastMeetings={pastMeetings}
        onSchedule={() => setShowSchedule(true)}
        onJoinCode={() => setShowJoinCode(true)}
        onInstant={() => setShowInstant(true)}
        onSelectMeeting={setSelectedMeeting}
        onSelectPast={setSelectedPast}
        onJoin={(m) => { activeMeetingStartRef.current = new Date(); setActiveMeeting(m) }}
        user={user}
      />
    )
  }

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-background">
      <LeftPanel
        meetings={meetings}
        pastMeetings={pastMeetings}
        spaces={spaces}
        contacts={DIRECT_CONTACTS}
        collapsed={leftCollapsed}
        onToggle={(key) => setLeftCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
        onSelectMeeting={setSelectedMeeting}
        onSelectPast={setSelectedPast}
        onSelectSpace={setSelectedSpace}
        onJoin={(m) => { activeMeetingStartRef.current = new Date(); setActiveMeeting(m) }}
        onNewMeeting={() => setShowSchedule(true)}
        onNewSpace={() => setShowCreateSpace(true)}
        selectedId={selectedMeeting?.id || selectedPast?.id || selectedSpace?.id}
      />
      <div className="flex-1 overflow-y-auto border-l border-r border-border">
        {centerContent}
      </div>
      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} onSave={handleSaveMeeting} />}
      {showJoinCode && <JoinCodeModal onClose={() => setShowJoinCode(false)} />}
      {showInstant && <InstantMeetingModal onClose={() => setShowInstant(false)} onJoin={(m) => { setActiveMeeting(m); setShowInstant(false) }} />}
      {showCreateSpace && <CreateSpaceModal onClose={() => setShowCreateSpace(false)} onSave={handleSaveSpace} />}
    </div>
  )
}
