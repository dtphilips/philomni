import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { addToWallet } from '../lib/wallet'
import { toast } from 'sonner'
import {
  Briefcase, Search, Star, Clock, DollarSign, Calendar,
  Loader2, CheckCircle2, X, Video,
} from 'lucide-react'

const CATEGORIES = ['All', 'Business', 'Marketing', 'Design', 'Development', 'Finance', 'Career', 'Health', 'Other']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function ServiceCard({ service, onBook }) {
  const statusColor = service.is_available ? 'text-green-400' : 'text-muted-foreground'
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
          {service.users?.avatar_url
            ? <img src={service.users.avatar_url} className="w-full h-full object-cover" alt="" />
            : <span className="text-lg font-bold text-primary">{service.users?.full_name?.[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{service.users?.full_name}</p>
            <span className={`text-[10px] font-medium ${statusColor}`}>
              {service.is_available ? '● Available' : '○ Busy'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{service.category}</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1">{service.title}</h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>

      <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{service.duration} min</span>
        <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />${Number(service.rate).toFixed(2)}</span>
        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{(service.rating||0).toFixed(1)} ({service.rating_count||0})</span>
      </div>

      <button
        onClick={() => onBook(service)}
        disabled={!service.is_available}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Calendar className="w-4 h-4" />
        {service.is_available ? 'Book Session' : 'Unavailable'}
      </button>
    </div>
  )
}

export default function Consulting() {
  const { user } = useAuth()
  const [services,  setServices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [booking,   setBooking]   = useState(null)
  const [bookDate,  setBookDate]  = useState('')
  const [bookTime,  setBookTime]  = useState('')
  const [bookNote,  setBookNote]  = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let q = supabase
        .from('consulting_services')
        .select('*, users!consulting_services_provider_id_fkey(id,full_name,avatar_url,bio)')
        .order('rating', { ascending: false })

      if (category !== 'All') q = q.eq('category', category)
      if (search) q = q.ilike('title', `%${search}%`)

      const { data } = await q
      setServices(data || [])
      setLoading(false)
    }
    fetch()
  }, [search, category])

  const confirmBooking = async () => {
    if (!user?.id) return toast.error('Sign in to book')
    if (!bookDate || !bookTime) return toast.error('Select a date and time')
    setConfirming(true)

    try {
      const scheduledAt = new Date(`${bookDate}T${bookTime}`).toISOString()
      const { error } = await supabase.from('consulting_bookings').insert({
        client_id:   user.id,
        service_id:  booking.id,
        provider_id: booking.provider_id,
        scheduled_at: scheduledAt,
        amount_paid: booking.rate,
        notes:       bookNote,
        status:      'pending',
      })
      if (error) throw error

      // Update session count
      await supabase.from('consulting_services').update({
        total_sessions: (booking.total_sessions || 0) + 1,
        total_revenue:  (booking.total_revenue || 0) + booking.rate,
      }).eq('id', booking.id)

      // 80% to provider
      const providerShare = booking.rate * 0.80
      await addToWallet(booking.provider_id, providerShare, 'consulting_fee', `Consulting booking: ${booking.title}`, booking.id)

      toast.success('✅ Session booked! The provider will confirm shortly.')
      setBooking(null)
      setBookDate(''); setBookTime(''); setBookNote('')
    } catch (err) {
      toast.error(err.message || 'Booking failed')
    }
    setConfirming(false)
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Consulting & 1-on-1 Sessions</h1>
        </div>
        <Link to="/consulting/offer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          <Briefcase className="w-4 h-4" /> Offer Services
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search services…"
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
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
        <div className="text-center py-14 text-muted-foreground">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No services found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <ServiceCard key={s.id} service={s} onBook={setBooking} />
          ))}
        </div>
      )}

      {/* Booking modal */}
      {booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBooking(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <button onClick={() => setBooking(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-foreground mb-1">Book Session</h3>
            <p className="text-sm text-muted-foreground mb-1">{booking.title}</p>
            <p className="text-xs text-muted-foreground mb-4">
              with {booking.users?.full_name} · {booking.duration} min · ${Number(booking.rate).toFixed(2)}
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Date</label>
                <input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)}
                  min={new Date().toISOString().slice(0,10)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Time</label>
                <input type="time" value={bookTime} onChange={e => setBookTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Notes (optional)</label>
                <textarea value={bookNote} onChange={e => setBookNote(e.target.value)}
                  rows={2} placeholder="What do you want to discuss?"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span>Session fee</span>
              <span className="font-semibold text-foreground">${Number(booking.rate).toFixed(2)}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setBooking(null)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={confirmBooking} disabled={confirming}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
