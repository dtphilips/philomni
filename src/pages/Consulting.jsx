import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { addToWallet } from '../lib/wallet'
import { toast } from 'sonner'
import {
  Briefcase, Search, Star, Clock, DollarSign, Calendar,
  Loader2, CheckCircle2, X, Video, ChevronLeft, ChevronRight,
  MapPin, User, ArrowRight, Sparkles, Shield, Zap, ExternalLink,
} from 'lucide-react'

const CATEGORIES = [
  'All', 'Business', 'Marketing', 'Design', 'Development', 'Finance', 'Career',
  'Health & Wellness', 'Legal', 'Real Estate', 'Education', 'Coaching',
  'Sales', 'Social Media', 'Branding', 'Tech & AI', 'Startup', 'Investing', 'Other',
]
const DAY_KEYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const FREQUENCY_OPTIONS = [
  { value: 'one-time',  label: 'One-time session' },
  { value: 'weekly',    label: 'Weekly' },
  { value: '2x-week',   label: 'Twice a week' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'custom',    label: 'Custom…' },
]

// Generate available time slots for a given date based on service + already-booked times
function generateSlots(dateStr, duration, workStart, workEnd, bookedISOs) {
  const slots = []
  const [sh, sm] = (workStart || '09:00').split(':').map(Number)
  const [eh, em] = (workEnd   || '17:00').split(':').map(Number)
  let totalMins = sh * 60 + sm
  const endMins = eh * 60 + em

  while (totalMins + duration <= endMins) {
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
    const slotStart = new Date(`${dateStr}T${timeStr}`)
    const slotEnd   = new Date(slotStart.getTime() + duration * 60000)

    const blocked = bookedISOs.some(iso => {
      const bStart = new Date(iso)
      const bEnd   = new Date(bStart.getTime() + duration * 60000)
      return slotStart < bEnd && slotEnd > bStart
    })

    slots.push({ time: timeStr, label: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), blocked })
    totalMins += duration
  }
  return slots
}

function StatusBadge({ status }) {
  const map = {
    pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize font-medium ${map[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

function ServiceCard({ service, onBook }) {
  const avail = service.availability || {}
  const activeDays = DAY_KEYS.filter(d => avail[d])
  const workStart = avail.work_start || '09:00'
  const workEnd   = avail.work_end   || '17:00'

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group">
      {/* Consultant header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-border">
            {service.users?.avatar_url
              ? <img src={service.users.avatar_url} className="w-full h-full object-cover" alt="" />
              : <span className="text-lg font-bold text-primary">{service.users?.full_name?.[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{service.users?.full_name}</p>
              <span className={`text-[10px] font-medium flex items-center gap-0.5 ${service.is_available ? 'text-green-400' : 'text-muted-foreground'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${service.is_available ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                {service.is_available ? 'Available' : 'Busy'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{service.category}</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{service.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{service.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary/60" />{service.duration} min</span>
          <span className="flex items-center gap-1 text-green-400 font-semibold"><DollarSign className="w-3.5 h-3.5" />{Number(service.rate).toFixed(2)}</span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-foreground font-medium">{(service.rating||0).toFixed(1)}</span>
            <span className="text-muted-foreground">({service.rating_count||0})</span>
          </span>
        </div>
        {service.frequency && service.frequency !== 'one-time' && (
          <div className="mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {FREQUENCY_OPTIONS.find(f => f.value === service.frequency)?.label?.replace('…','') || service.frequency}
            </span>
          </div>
        )}

        {/* Available days */}
        {activeDays.length > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {DAY_KEYS.map(d => (
              <span key={d} title={d}
                className={`text-[9px] w-6 h-6 rounded-full flex items-center justify-center font-medium transition-colors ${
                  activeDays.includes(d) ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground/40'
                }`}>
                {d[0]}
              </span>
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">{workStart}–{workEnd}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={() => onBook(service)}
          disabled={!service.is_available}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Calendar className="w-4 h-4" />
          {service.is_available ? 'Book a Session' : 'Currently Unavailable'}
        </button>
      </div>
    </div>
  )
}

export default function Consulting() {
  const { user } = useAuth()
  const [tab,       setTab]       = useState('browse') // 'browse' | 'my-bookings'
  const [services,  setServices]  = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [mbLoading, setMbLoading] = useState(false)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')

  // Booking modal state
  const [booking,   setBooking]   = useState(null)  // service being booked
  const [step,      setStep]      = useState(1)      // 1 = date/slot, 2 = confirm
  const [dateOffset, setDateOffset] = useState(0)    // days from today visible (week window)
  const [selDate,   setSelDate]   = useState(null)
  const [slots,     setSlots]     = useState([])
  const [selSlot,   setSelSlot]   = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookNote,  setBookNote]  = useState('')
  const [confirming, setConfirming] = useState(false)

  // Load services
  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let q = supabase
        .from('consulting_services')
        .select('*, users!consulting_services_provider_id_fkey(id,full_name,avatar_url,bio)')
        .eq('is_available', true)
        .order('rating', { ascending: false })
      if (category !== 'All') q = q.eq('category', category)
      if (search) q = q.ilike('title', `%${search}%`)
      const { data } = await q
      setServices(data || [])
      setLoading(false)
    }
    fetch()
  }, [search, category])

  // Load my bookings
  const loadMyBookings = useCallback(async () => {
    if (!user?.id) return
    setMbLoading(true)
    const { data } = await supabase
      .from('consulting_bookings')
      .select('*, consulting_services(title,duration,rate,provider_id, users!consulting_services_provider_id_fkey(full_name,avatar_url))')
      .eq('client_id', user.id)
      .order('scheduled_at', { ascending: true })
    setMyBookings(data || [])
    setMbLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (tab === 'my-bookings') loadMyBookings()
  }, [tab, loadMyBookings])

  // When a date is selected, fetch booked slots and generate available ones
  useEffect(() => {
    if (!selDate || !booking) return
    const fetchSlots = async () => {
      setSlotsLoading(true)
      setSelSlot(null)
      const dayStart = `${selDate}T00:00:00`
      const dayEnd   = `${selDate}T23:59:59`
      const { data: booked } = await supabase
        .from('consulting_bookings')
        .select('scheduled_at')
        .eq('provider_id', booking.provider_id)
        .in('status', ['pending','confirmed'])
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
      const bookedISOs = (booked || []).map(b => b.scheduled_at)
      const avail = booking.availability || {}
      const generated = generateSlots(
        selDate, booking.duration,
        avail.work_start || '09:00',
        avail.work_end   || '17:00',
        bookedISOs
      )
      setSlots(generated)
      setSlotsLoading(false)
    }
    fetchSlots()
  }, [selDate, booking])

  // Generate the 14-day date strip starting from dateOffset
  const today = new Date()
  today.setHours(0,0,0,0)
  const dateStrip = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i + dateOffset)
    return d
  })

  const isDayAvailable = (date) => {
    if (!booking) return false
    const dayKey = DAY_KEYS[date.getDay()]
    const avail  = booking.availability || {}
    return !!avail[dayKey]
  }

  const openBooking = (service) => {
    setBooking(service)
    setStep(1)
    setSelDate(null)
    setSelSlot(null)
    setSlots([])
    setBookNote('')
    setDateOffset(0)
  }

  const confirmBooking = async () => {
    if (!user?.id) return toast.error('Sign in to book')
    if (!selDate || !selSlot) return toast.error('Select a date and time')
    setConfirming(true)
    try {
      const scheduledAt = new Date(`${selDate}T${selSlot.time}`).toISOString()
      const { error } = await supabase.from('consulting_bookings').insert({
        client_id:    user.id,
        service_id:   booking.id,
        provider_id:  booking.provider_id,
        scheduled_at: scheduledAt,
        amount_paid:  booking.rate,
        notes:        bookNote,
        status:       'pending',
      })
      if (error) throw error
      await supabase.from('consulting_services').update({
        total_sessions: (booking.total_sessions || 0) + 1,
        total_revenue:  (booking.total_revenue  || 0) + booking.rate,
      }).eq('id', booking.id)
      const providerShare = booking.rate * 0.80
      await addToWallet(booking.provider_id, providerShare, 'consulting_fee', `Consulting: ${booking.title}`, booking.id)
      toast.success('Session booked! The provider will confirm shortly.')
      setBooking(null)
    } catch (err) {
      toast.error(err.message || 'Booking failed')
    }
    setConfirming(false)
  }

  const now = new Date()
  const upcoming = myBookings.filter(b => b.status !== 'cancelled' && new Date(b.scheduled_at) >= now)
  const past     = myBookings.filter(b => b.status === 'completed' || new Date(b.scheduled_at) < now)

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Consulting & 1-on-1 Sessions</h1>
          </div>
          <p className="text-sm text-muted-foreground">Book expert sessions with vetted professionals in your field</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {user && (
            <button
              onClick={() => setTab(t => t === 'my-bookings' ? 'browse' : 'my-bookings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${tab === 'my-bookings' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
            >
              <Calendar className="w-4 h-4" /> My Bookings
            </button>
          )}
          <Link to="/consulting/offer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Sparkles className="w-4 h-4 text-primary" /> Offer Services
          </Link>
        </div>
      </div>

      {/* Trust bar */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-400" /> Secure payments</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Provider-confirmed sessions</span>
        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> Instant booking</span>
        <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Reviewed experts</span>
      </div>

      {/* MY BOOKINGS TAB */}
      {tab === 'my-bookings' && (
        <div className="space-y-5">
          {mbLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : myBookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-3">No bookings yet</p>
              <button onClick={() => setTab('browse')} className="text-primary text-sm font-medium hover:underline">Browse consultants →</button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming Sessions</h3>
                  <div className="space-y-3">
                    {upcoming.map(b => (
                      <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                            {b.consulting_services?.users?.avatar_url
                              ? <img src={b.consulting_services.users.avatar_url} className="w-full h-full object-cover" alt="" />
                              : <User className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{b.consulting_services?.title}</p>
                            <p className="text-xs text-muted-foreground">with {b.consulting_services?.users?.full_name}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.scheduled_at).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.scheduled_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                              <span className="flex items-center gap-1 text-green-400 font-medium"><DollarSign className="w-3 h-3" />{Number(b.amount_paid||0).toFixed(2)}</span>
                            </div>
                            {b.notes && <p className="text-xs text-muted-foreground/70 mt-1 italic">"{b.notes}"</p>}
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                        {b.meeting_url && b.status === 'confirmed' && (
                          <a href={b.meeting_url} target="_blank" rel="noreferrer"
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                            <Video className="w-4 h-4" /> Join Session
                            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Past Sessions</h3>
                  <div className="space-y-2">
                    {past.map(b => (
                      <div key={b.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 opacity-70">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{b.consulting_services?.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.scheduled_at).toLocaleDateString()} · {b.consulting_services?.users?.full_name}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* BROWSE TAB */}
      {tab === 'browse' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by expertise, topic, or service…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No services found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(s => (
                <ServiceCard key={s.id} service={s} onBook={openBooking} />
              ))}
            </div>
          )}
        </>
      )}

      {/* BOOKING MODAL */}
      {booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setBooking(null)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="p-5 pb-4 border-b border-border">
              <button onClick={() => setBooking(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {booking.users?.avatar_url
                    ? <img src={booking.users.avatar_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-sm font-bold text-primary">{booking.users?.full_name?.[0]}</span>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{booking.title}</p>
                  <p className="text-xs text-muted-foreground">
                    with {booking.users?.full_name} · {booking.duration} min · <span className="text-green-400 font-semibold">${Number(booking.rate).toFixed(2)}</span>
                  </p>
                </div>
              </div>
              {/* Steps */}
              <div className="flex items-center gap-2 mt-4">
                {[1,2].map(s => (
                  <React.Fragment key={s}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
                    {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />}
                  </React.Fragment>
                ))}
                <span className="ml-2 text-xs text-muted-foreground">{step === 1 ? 'Pick a time' : 'Confirm booking'}</span>
              </div>
            </div>

            {/* Step 1: Date + Slot picker */}
            {step === 1 && (
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Date strip */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Select Date</p>
                    <div className="flex gap-1">
                      <button onClick={() => setDateOffset(d => Math.max(0, d - 7))} disabled={dateOffset === 0}
                        className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDateOffset(d => d + 7)}
                        className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {dateStrip.map((date, i) => {
                      const isAvail = isDayAvailable(date)
                      const dateStr = date.toISOString().slice(0,10)
                      const isSelected = selDate === dateStr
                      const isToday = date.toDateString() === new Date().toDateString()
                      return (
                        <button key={i}
                          onClick={() => isAvail && setSelDate(dateStr)}
                          disabled={!isAvail}
                          className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all ${
                            isSelected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' :
                            isAvail ? 'hover:bg-muted text-foreground' :
                            'opacity-30 cursor-not-allowed text-muted-foreground'
                          }`}
                        >
                          <span className="text-[9px] uppercase font-medium">{DAY_KEYS[date.getDay()][0]}</span>
                          <span className={`text-sm font-bold mt-0.5 ${isToday && !isSelected ? 'text-primary' : ''}`}>{date.getDate()}</span>
                          {isToday && <span className="w-1 h-1 rounded-full bg-current mt-0.5 opacity-60" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selDate && (
                  <div>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                      Available Times — {new Date(selDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
                    </p>
                    {slotsLoading ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No available slots on this day</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map(slot => (
                          <button key={slot.time}
                            onClick={() => !slot.blocked && setSelSlot(slot)}
                            disabled={slot.blocked}
                            className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                              selSlot?.time === slot.time ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' :
                              slot.blocked ? 'bg-muted/50 text-muted-foreground/30 cursor-not-allowed line-through' :
                              'bg-muted text-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
                            }`}
                          >
                            {slot.label}
                            {slot.blocked && <div className="text-[9px] mt-0.5 opacity-60">Booked</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!selDate && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Select an available day above to see open time slots
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
              <div className="p-5 space-y-4">
                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-semibold text-foreground">
                      {new Date(selDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })} at {selSlot?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold text-foreground">{booking.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Session fee</span>
                    <span className="font-bold text-green-400">${Number(booking.rate).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">What would you like to discuss? <span className="text-muted-foreground/50">(optional)</span></label>
                  <textarea value={bookNote} onChange={e => setBookNote(e.target.value)}
                    rows={3} placeholder="Share context so the consultant can prepare…"
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <p className="text-xs text-muted-foreground">
                  The provider will review and confirm your booking. You'll receive a meeting link once confirmed.
                </p>
              </div>
            )}

            {/* Footer actions */}
            <div className="p-5 pt-0 flex gap-3">
              {step === 1 ? (
                <>
                  <button onClick={() => setBooking(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                  <button
                    disabled={!selDate || !selSlot}
                    onClick={() => setStep(2)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Back</button>
                  <button onClick={confirmBooking} disabled={confirming}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm & Book
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
