import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ShoppingBag, Plus, Loader2, Star, DollarSign } from 'lucide-react'

export default function CreatorMarket() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'services' })
  const [posting, setPosting] = useState(false)
  const [tab, setTab] = useState('browse')

  useEffect(() => {
    supabase.from('creator_content').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setListings(data ?? []); setLoading(false) })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setPosting(true)
    const { data } = await supabase.from('creator_content').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: form.price ? parseFloat(form.price) : 0,
      category: form.category,
      creator_id: user.id,
      creator_name: user.full_name,
      creator_avatar: user.avatar_url,
      status: 'active',
    }).select().single()
    if (data) { setListings(prev => [data, ...prev]); setShowForm(false); setForm({ title: '', description: '', price: '', category: 'services' }) }
    setPosting(false)
  }

  const myListings = listings.filter(l => l.creator_id === user?.id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Creator Market</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Buy and sell creator services</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> List Service
        </button>
      </div>

      <div className="flex bg-muted rounded-xl p-1 mb-6">
        {['browse', 'mine'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            {t === 'browse' ? 'Browse' : 'My Listings'}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Service title" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your service" rows={3}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              type="number" placeholder="Price ($)" min="0"
              className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="services">Services</option>
              <option value="templates">Templates</option>
              <option value="presets">Presets</option>
              <option value="courses">Courses</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={posting}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} List It
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (tab === 'browse' ? listings : myListings).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No listings yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(tab === 'browse' ? listings : myListings).map(l => (
            <div key={l.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-foreground text-sm leading-snug">{l.title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">{l.category}</span>
              </div>
              {l.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{l.description}</p>}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{l.creator_name}</p>
                <p className="font-bold text-foreground text-sm flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" />{l.price > 0 ? l.price.toLocaleString() : 'Free'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
