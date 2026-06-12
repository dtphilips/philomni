import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Briefcase, Plus, Clock, DollarSign, Star, Edit3,
  Trash2, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Calendar,
  Users, MessageSquare, Video, ExternalLink, Link2, Copy,
  TrendingUp, ChevronDown, ChevronUp, Mail,
} from 'lucide-react'
import { addToWallet } from '../lib/wallet'

const CATEGORY_SUGGESTIONS = [
  'Business', 'Marketing', 'Design', 'Development', 'Finance', 'Career',
  'Health & Wellness', 'Legal', 'Real Estate', 'Education', 'Coaching',
  'Sales', 'HR & Recruiting', 'Social Media', 'Branding', 'Content Creation',
  'Photography', 'Music', 'Sports & Fitness', 'Parenting', 'Relationships',
  'Tech & AI', 'Cybersecurity', 'Data & Analytics', 'Product Management',
  'Startup', 'Investing', 'Tax & Accounting', 'Immigration', 'Other',
]

const FREQUENCY_OPTIONS = [
  { value: 'one-time',    label: 'One-time session' },
  { value: 'weekly',      label: 'Weekly' },
  { value: '2x-week',     label: 'Twice a week' },
  { value: 'biweekly',    label: 'Every 2 weeks' },
  { value: 'monthly',     label: 'Monthly' },
  { value: 'custom',      label: 'Custom…' },
]

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_COLOR = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize font-medium ${STATUS_COLOR[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

export default function ConsultingOffer() {
  const { user } = useAuth()
  const [services,  setServices]  = useState([])
  const [bookings,  setBookings]  = useState([])
  const [reviews,   setReviews]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('services')
  const [saving,    setSaving]    = useState(false)
  const [editId,    setEditId]    = useState(null)

  // Confirm-with-meeting-link modal
  const [confirmingBooking, setConfirmingBooking] = useState(null)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Expanded booking card
  const [expandedBooking, setExpandedBooking] = useState(null)

  const [catQuery,       setCatQuery]       = useState('')
  const [catOpen,        setCatOpen]        = useState(false)
  const [customFreq,     setCustomFreq]     = useState('')

  const empty = {
    title: '', description: '', category: '',
    duration: 30, rate: '', frequency: 'one-time',
    availability: DAY_KEYS.reduce((a, d) => ({ ...a, [d]: d !== 'Sat' && d !== 'Sun' }), {
      work_start: '09:00',
      work_end:   '17:00',
    }),
  }
  const [form, setForm] = useState(empty)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAvail = (k, v) => setForm(f => ({ ...f, availability: { ...f.availability, [k]: v } }))

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); clearTimeout(timeout); return }
      try {
        const uid = session.user.id
        const [s, b, r] = await Promise.all([
          supabase.from('consulting_services').select('*').eq('provider_id', uid).order('created_at', { ascending: false }),
          supabase.from('consulting_bookings')
            .select('*, users!consulting_bookings_client_id_fkey(full_name,avatar_url,email), consulting_services(title,session_duration,hourly_rate)')
            .eq('provider_id', uid)
            .order('scheduled_at', { ascending: true }),
          supabase.from('consulting_reviews')
            .select('*, users!consulting_reviews_user_id_fkey(full_name,avatar_url), consulting_services(title)')
            .eq('consulting_services.provider_id', uid),
        ])
        setServices(s.data || [])
        setBookings(b.data || [])
        setReviews(r.data || [])
      } finally {
        setLoading(false)
        clearTimeout(timeout)
      }
    }
    init()
    return () => clearTimeout(timeout)
  }, [])

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.rate || parseFloat(form.rate) <= 0) return toast.error('Rate must be greater than 0')
    setSaving(true)
    try {
      const freqValue = form.frequency === 'custom' ? (customFreq.trim() || 'custom') : form.frequency
      const data = {
        provider_id:      user.id,
        title:            form.title.trim(),
        description:      form.description,
        category:         form.category.trim() || 'Other',
        session_duration: parseInt(form.duration) || 30,
        hourly_rate:      parseFloat(form.rate),
        frequency:        freqValue,
        is_available:     true,
        availability:     form.availability,
      }
      if (editId) {
        await supabase.from('consulting_services').update(data).eq('id', editId)
        toast.success('Service updated!')
      } else {
        await supabase.from('consulting_services').insert(data)
        toast.success('Service listed!')
      }
      setForm(empty); setEditId(null); setTab('services')
      const { data: updated } = await supabase.from('consulting_services').select('*').eq('provider_id', user.id).order('created_at', { ascending: false })
      setServices(updated || [])
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  const toggleAvailability = async (service) => {
    const newVal = !service.is_available
    await supabase.from('consulting_services').update({ is_available: newVal }).eq('id', service.id)
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_available: newVal } : s))
  }

  const deleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return
    await supabase.from('consulting_services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
    toast.success('Service deleted')
  }

  const handleConfirm = async () => {
    if (!confirmingBooking) return
    setConfirming(true)
    try {
      const update = { status: 'confirmed' }
      if (meetingUrl.trim()) update.meeting_url = meetingUrl.trim()
      await supabase.from('consulting_bookings').update(update).eq('id', confirmingBooking.id)
      setBookings(prev => prev.map(b => b.id === confirmingBooking.id ? { ...b, ...update } : b))
      toast.success('Booking confirmed! Client will see the meeting link.')
      setConfirmingBooking(null)
      setMeetingUrl('')
    } catch (err) {
      toast.error(err.message || 'Failed to confirm')
    }
    setConfirming(false)
  }

  const updateBookingStatus = async (id, status) => {
    await supabase.from('consulting_bookings').update({ status }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    if (status === 'completed' && user?.id) {
      const booking = bookings.find(b => b.id === id)
      const sessionRate = booking?.consulting_services?.hourly_rate || 0
      if (sessionRate > 0) {
        await addToWallet(user.id, sessionRate * 0.80, 'consulting_fee',
          `Session completed: ${booking?.consulting_services?.title || 'Consulting'}`, id)
        toast.success(`Session completed! $${(sessionRate * 0.80).toFixed(2)} added to your wallet.`)
        return
      }
    }
    toast.success(`Booking ${status}`)
  }

  const copyLink = (url) => {
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  const totalRevenue  = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + ((b.consulting_services?.hourly_rate || 0) * 0.80), 0)
  const totalSessions = bookings.filter(b => b.status === 'completed').length
  const pendingCount  = bookings.filter(b => b.status === 'pending').length
  const avgRating     = services.length ? (services.reduce((s, svc) => s + (svc.rating || 0), 0) / services.length).toFixed(1) : '—'

  const now       = new Date()
  const upcoming  = bookings.filter(b => b.status !== 'cancelled' && new Date(b.scheduled_at) >= now)
  const needsAction = bookings.filter(b => b.status === 'pending')
  const confirmed   = bookings.filter(b => b.status === 'confirmed' && new Date(b.scheduled_at) >= now)
  const completed   = bookings.filter(b => b.status === 'completed')

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">My Consulting</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Services',      value: services.length,        icon: Briefcase,   color: 'text-blue-400',   bg: 'bg-blue-400/10' },
          { label: 'Total Sessions', value: totalSessions,          icon: Users,       color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Earned (80%)',  value: `$${(totalRevenue*0.80).toFixed(0)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Avg Rating',    value: avgRating,               icon: Star,        color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['services', 'My Services'],
          ['create',   editId ? 'Edit Service' : 'Add Service'],
          ['bookings', 'Bookings'],
          ['reviews',  'Reviews'],
        ].map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'create' && !editId) setForm(empty) }}
            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {l}
            {t === 'bookings' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SERVICES TAB */}
      {tab === 'services' && (
        loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">No services yet</p>
            <button onClick={() => setTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mx-auto">
              <Plus className="w-4 h-4" /> Create Your First Service
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(svc => {
              const avail = svc.availability || {}
              const activeDays = DAY_KEYS.filter(d => avail[d])
              return (
                <div key={svc.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{svc.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${svc.is_available ? 'bg-green-400/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                          {svc.is_available ? 'Live' : 'Hidden'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.session_duration} min</span>
                        <span className="flex items-center gap-1 text-green-400 font-semibold"><DollarSign className="w-3 h-3" />${Number(svc.hourly_rate || 0).toFixed(2)}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{(svc.rating||0).toFixed(1)} ({svc.rating_count||0})</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{svc.total_sessions} sessions</span>
                      </div>
                      {activeDays.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {DAY_KEYS.map(d => (
                            <span key={d}
                              className={`text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-medium ${activeDays.includes(d) ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground/30'}`}>
                              {d[0]}
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {avail.work_start || '09:00'}–{avail.work_end || '17:00'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleAvailability(svc)}
                        title={svc.is_available ? 'Hide service' : 'Show service'}
                        className={`p-1.5 rounded-lg transition-colors ${svc.is_available ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'text-muted-foreground bg-muted hover:bg-muted/80'}`}>
                        {svc.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => {
                        const freq = svc.frequency || 'one-time'
                        const isPreset = FREQUENCY_OPTIONS.some(f => f.value === freq)
                        setForm({
                          title: svc.title, description: svc.description || '',
                          category: svc.category || '', duration: svc.session_duration,
                          rate: svc.hourly_rate?.toString() || '',
                          frequency: isPreset ? freq : 'custom',
                          availability: svc.availability || empty.availability,
                        })
                        setCatQuery(svc.category || '')
                        setCustomFreq(isPreset ? '' : freq)
                        setEditId(svc.id); setTab('create')
                      }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary bg-muted hover:bg-muted/80">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteService(svc.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive bg-muted hover:bg-muted/80">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            <button onClick={() => { setTab('create'); setEditId(null); setForm(empty) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              <Plus className="w-4 h-4" /> Add Another Service
            </button>
          </div>
        )
      )}

      {/* CREATE/EDIT TAB */}
      {tab === 'create' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Service Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. 1-on-1 Brand Strategy Session"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} placeholder="What will clients get from this session? What problems do you solve?"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {/* Category combobox */}
            <div className="sm:col-span-2 relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Category <span className="text-muted-foreground/50">(type yours or pick a suggestion)</span>
              </label>
              <input
                value={catQuery}
                onChange={e => { setCatQuery(e.target.value); set('category', e.target.value); setCatOpen(true) }}
                onFocus={() => setCatOpen(true)}
                onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                placeholder="e.g. Business, Coaching, Tech & AI…"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {catOpen && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {CATEGORY_SUGGESTIONS
                    .filter(c => c.toLowerCase().includes(catQuery.toLowerCase()))
                    .map(c => (
                      <button key={c} type="button"
                        onMouseDown={() => { setCatQuery(c); set('category', c); setCatOpen(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl">
                        {c}
                      </button>
                    ))}
                  {catQuery && !CATEGORY_SUGGESTIONS.some(c => c.toLowerCase() === catQuery.toLowerCase()) && (
                    <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                      Press Enter to use "<span className="text-foreground font-medium">{catQuery}</span>"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Session Duration</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Session Frequency</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              {form.frequency === 'custom' && (
                <input
                  value={customFreq}
                  onChange={e => setCustomFreq(e.target.value)}
                  placeholder="e.g. 3x per week, every other day…"
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Rate per Session (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input type="number" min="1" step="1" value={form.rate} onChange={e => set('rate', e.target.value)}
                  placeholder="50"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">You keep <span className="text-green-400 font-semibold">80%</span> = ${form.rate ? (parseFloat(form.rate||0)*0.8).toFixed(2) : '0.00'} per session</p>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-4 border border-border">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Availability</p>
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Available Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_KEYS.map(day => (
                  <button key={day} type="button"
                    onClick={() => setAvail(day, !form.availability[day])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.availability[day] ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Working hours start</label>
                <input type="time" value={form.availability.work_start || '09:00'}
                  onChange={e => setAvail('work_start', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Working hours end</label>
                <input type="time" value={form.availability.work_end || '17:00'}
                  onChange={e => setAvail('work_end', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setTab('services'); setEditId(null); setForm(empty) }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {editId ? 'Update Service' : 'List Service'}
            </button>
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {tab === 'bookings' && (
        <div className="space-y-5">
          {/* Needs action */}
          {needsAction.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <p className="text-sm font-semibold text-foreground">Needs Your Attention ({needsAction.length})</p>
              </div>
              <div className="space-y-3">
                {needsAction.map(b => (
                  <BookingCard key={b.id} booking={b} onConfirm={() => { setConfirmingBooking(b); setMeetingUrl('') }}
                    onDecline={() => updateBookingStatus(b.id, 'cancelled')}
                    onComplete={() => updateBookingStatus(b.id, 'completed')}
                    expanded={expandedBooking === b.id} onToggle={() => setExpandedBooking(v => v === b.id ? null : b.id)}
                    onCopyLink={copyLink} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming confirmed */}
          {confirmed.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Upcoming Confirmed ({confirmed.length})</p>
              <div className="space-y-3">
                {confirmed.map(b => (
                  <BookingCard key={b.id} booking={b}
                    onComplete={() => updateBookingStatus(b.id, 'completed')}
                    expanded={expandedBooking === b.id} onToggle={() => setExpandedBooking(v => v === b.id ? null : b.id)}
                    onCopyLink={copyLink} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Completed Sessions</p>
              <div className="space-y-2">
                {completed.map(b => (
                  <BookingCard key={b.id} booking={b} compact
                    expanded={expandedBooking === b.id} onToggle={() => setExpandedBooking(v => v === b.id ? null : b.id)}
                    onCopyLink={copyLink} />
                ))}
              </div>
            </div>
          )}

          {bookings.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No bookings yet</p>
              <p className="text-xs mt-1">Share your profile to start getting clients</p>
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet</p>
              <p className="text-xs mt-1">Reviews appear after sessions are completed</p>
            </div>
          ) : reviews.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {r.users?.avatar_url ? <img src={r.users.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-xs font-bold text-primary">{r.users?.full_name?.[0]}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.users?.full_name}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              {r.consulting_services?.title && (
                <p className="text-xs text-primary/70 mb-1">re: {r.consulting_services.title}</p>
              )}
              {r.review && <p className="text-xs text-muted-foreground leading-relaxed">{r.review}</p>}
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM WITH MEETING LINK MODAL */}
      {confirmingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmingBooking(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <button onClick={() => setConfirmingBooking(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-foreground">Confirm Booking</h3>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 mb-4 text-sm space-y-1">
              <p className="font-medium text-foreground">{confirmingBooking.users?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(confirmingBooking.scheduled_at).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })} at {new Date(confirmingBooking.scheduled_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
              </p>
              {confirmingBooking.notes && <p className="text-xs text-muted-foreground italic">"{confirmingBooking.notes}"</p>}
            </div>

            <div className="space-y-2 mb-4">
              <label className="block text-xs font-medium text-muted-foreground">Meeting Link <span className="text-muted-foreground/50">(client will see this)</span></label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <p className="text-xs text-muted-foreground">You can also add this later from your bookings list.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmingBooking(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={confirming}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking: b, onConfirm, onDecline, onComplete, compact, expanded, onToggle, onCopyLink }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden transition-all ${b.status === 'pending' ? 'border-yellow-500/30' : b.status === 'confirmed' ? 'border-blue-500/20' : ''}`}>
      <div className={`flex items-start gap-3 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
          {b.users?.avatar_url
            ? <img src={b.users.avatar_url} className="w-full h-full object-cover" alt="" />
            : <span className="text-sm font-bold text-primary">{b.users?.full_name?.[0] || '?'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{b.users?.full_name}</p>
              <p className="text-xs text-muted-foreground">{b.consulting_services?.title || b.notes}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize font-medium ${STATUS_COLOR[b.status] || 'bg-muted text-muted-foreground'}`}>
                {b.status}
              </span>
              <button onClick={onToggle} className="text-muted-foreground hover:text-foreground p-0.5">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(b.scheduled_at).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(b.scheduled_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
              {b.consulting_services?.session_duration && ` · ${b.consulting_services.session_duration} min`}
            </span>
            <span className="flex items-center gap-1 text-green-400 font-semibold">
              <DollarSign className="w-3 h-3" />{Number(b.consulting_services?.hourly_rate||0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-border/50 pt-3 space-y-2.5">
          {b.users?.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <a href={`mailto:${b.users.email}`} className="text-primary hover:underline">{b.users.email}</a>
            </div>
          )}
          {b.notes && (
            <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground italic">
              "{b.notes}"
            </div>
          )}
          {b.meeting_url && (
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <a href={b.meeting_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate flex-1">
                {b.meeting_url}
              </a>
              <button onClick={() => onCopyLink?.(b.meeting_url)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <Copy className="w-3 h-3" />
              </button>
              <a href={b.meeting_url} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-muted text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {(onConfirm || onDecline || onComplete) && (
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {onConfirm && b.status === 'pending' && (
            <button onClick={onConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm + Add Link
            </button>
          )}
          {onDecline && b.status === 'pending' && (
            <button onClick={onDecline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> Decline
            </button>
          )}
          {onComplete && b.status === 'confirmed' && (
            <button onClick={onComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-medium hover:bg-blue-500/25 transition-colors">
              <TrendingUp className="w-3.5 h-3.5" /> Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
