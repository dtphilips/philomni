import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import {
  Briefcase, Plus, Clock, DollarSign, Star, Edit3,
  Trash2, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Calendar,
  Users, MessageSquare,
} from 'lucide-react'

const CATEGORIES = ['Business', 'Marketing', 'Design', 'Development', 'Finance', 'Career', 'Health', 'Other']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ConsultingOffer() {
  const { user } = useAuth()
  const [services,  setServices]  = useState([])
  const [bookings,  setBookings]  = useState([])
  const [reviews,   setReviews]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('services')
  const [saving,    setSaving]    = useState(false)
  const [editId,    setEditId]    = useState(null)

  const empty = {
    title: '', description: '', category: 'Business',
    duration: 30, rate: '', availability: DAYS.reduce((a, d) => ({ ...a, [d]: true }), {}),
  }
  const [form, setForm] = useState(empty)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); clearTimeout(timeout); return }
      try {
        const uid = session.user.id
        const [s, b, r] = await Promise.all([
          supabase.from('consulting_services').select('*').eq('provider_id', uid).order('created_at', { ascending: false }),
          supabase.from('consulting_bookings').select('*, users!consulting_bookings_client_id_fkey(full_name,avatar_url)').eq('provider_id', uid).order('created_at', { ascending: false }),
          supabase.from('consulting_reviews').select('*, users!consulting_reviews_user_id_fkey(full_name,avatar_url), consulting_services(title)').eq('consulting_services.provider_id', uid),
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
  }, []) // runs once — session fetched inside

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.rate || parseFloat(form.rate) <= 0) return toast.error('Rate must be greater than 0')
    setSaving(true)

    try {
      const data = {
        provider_id:  user.id,
        title:        form.title.trim(),
        description:  form.description,
        category:     form.category,
        duration:     parseInt(form.duration) || 30,
        rate:         parseFloat(form.rate),
        is_available: true,
        availability: form.availability,
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

  const updateBookingStatus = async (id, status) => {
    await supabase.from('consulting_bookings').update({ status }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    toast.success(`Booking ${status}`)
  }

  const totalRevenue = services.reduce((s, svc) => s + (svc.total_revenue || 0), 0)

  const STATUS_COLOR = {
    pending:   'text-yellow-400 bg-yellow-400/10',
    confirmed: 'text-blue-400 bg-blue-400/10',
    completed: 'text-green-400 bg-green-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">My Consulting</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Services',      value: services.length,          icon: Briefcase, color: 'text-blue-400' },
          { label: 'Total Sessions', value: services.reduce((s,svc) => s+(svc.total_sessions||0),0), icon: Users, color: 'text-purple-400' },
          { label: 'Earned (80%)',   value: `$${(totalRevenue*0.80).toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['services','My Services'],['create', editId ? 'Edit Service' : 'Add Service'],['bookings','Bookings'],['reviews','Reviews']].map(([t,l]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'create' && !editId) setForm(empty) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {l}
            {t === 'bookings' && bookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Services tab */}
      {tab === 'services' && (
        loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : services.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">No services yet</p>
            <button onClick={() => setTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mx-auto">
              <Plus className="w-4 h-4" /> Create Your First Service
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(svc => (
              <div key={svc.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{svc.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration} min</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${Number(svc.rate).toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{(svc.rating||0).toFixed(1)}</span>
                    <span>{svc.total_sessions} sessions</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleAvailability(svc)}
                    className={`p-1.5 rounded-lg transition-colors ${svc.is_available ? 'text-green-400 bg-green-400/10' : 'text-muted-foreground bg-muted'}`}
                    title={svc.is_available ? 'Available' : 'Unavailable'}>
                    {svc.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setForm({ title: svc.title, description: svc.description||'', category: svc.category||'Business', duration: svc.duration, rate: svc.rate?.toString()||'', availability: svc.availability||{} }); setEditId(svc.id); setTab('create') }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary bg-muted">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteService(svc.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive bg-muted">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => { setTab('create'); setEditId(null); setForm(empty) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 transition-colors">
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>
        )
      )}

      {/* Create/Edit tab */}
      {tab === 'create' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Service Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. 1-on-1 Brand Strategy Session"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={3} placeholder="What will clients get from this session?"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Duration (minutes)</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none">
                {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Rate per session (USD) *</label>
              <input type="number" min="1" step="1" value={form.rate} onChange={e => set('rate', e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs text-muted-foreground mb-2">Available Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => set('availability', { ...form.availability, [day]: !form.availability[day] })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.availability[day] ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">You keep <span className="text-green-400 font-semibold">80%</span> of each session fee.</p>

          <div className="flex gap-3">
            <button onClick={() => { setTab('services'); setEditId(null); setForm(empty) }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editId ? 'Update Service' : 'List Service'}
            </button>
          </div>
        </div>
      )}

      {/* Bookings tab */}
      {tab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No bookings yet</p>
            </div>
          ) : bookings.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                    {b.users?.avatar_url
                      ? <img src={b.users.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <span className="text-xs font-bold text-primary">{b.users?.full_name?.[0]}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.users?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : 'Time TBD'}
                    </p>
                    {b.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">"{b.notes}"</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${STATUS_COLOR[b.status] || 'text-muted-foreground'}`}>
                    {b.status}
                  </span>
                  <p className="text-xs font-semibold text-green-400">${Number(b.amount_paid||0).toFixed(2)}</p>
                </div>
              </div>
              {b.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateBookingStatus(b.id, 'confirmed')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                  </button>
                  <button onClick={() => updateBookingStatus(b.id, 'cancelled')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/25">
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </button>
                  {b.status === 'confirmed' && (
                    <button onClick={() => updateBookingStatus(b.id, 'completed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-medium">
                      Mark Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet</p>
            </div>
          ) : reviews.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {r.users?.avatar_url ? <img src={r.users.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-xs font-bold text-primary flex items-center justify-center h-full">{r.users?.full_name?.[0]}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.users?.full_name}</p>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              {r.review && <p className="text-xs text-muted-foreground">{r.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_COLOR = {
  pending:   'text-yellow-400 bg-yellow-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
}
