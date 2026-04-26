import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Briefcase, Plus, Loader2, ExternalLink } from 'lucide-react'

const STATUS_COLORS = {
  pending: 'bg-amber-500/15 text-amber-400',
  accepted: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  draft: 'bg-muted text-muted-foreground',
}

export default function PitchVault() {
  const { user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', brand: '', description: '', amount: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    supabase.from('pitches').select('*').eq('created_by', user?.id).order('created_at', { ascending: false })
      .then(({ data }) => { setPitches(data ?? []); setLoading(false) })
  }, [user?.id])

  const submit = async (e) => {
    e.preventDefault()
    setPosting(true)
    const { data } = await supabase.from('pitches').insert({
      title: form.title.trim(),
      brand: form.brand.trim() || null,
      description: form.description.trim() || null,
      amount: form.amount ? parseFloat(form.amount) : null,
      status: 'draft',
    }).select().single()
    if (data) { setPitches(prev => [data, ...prev]); setShowForm(false); setForm({ title: '', brand: '', description: '', amount: '' }) }
    setPosting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pitch Vault</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track your brand deal pitches</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Pitch
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Pitch title" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
            placeholder="Brand / Company name"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Pitch description" rows={3}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            type="number" placeholder="Deal amount ($)" min="0"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <div className="flex gap-2">
            <button type="submit" disabled={posting}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Pitch
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : pitches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No pitches yet</p>
          <p className="text-sm mt-1">Start tracking your brand deals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pitches.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{p.title}</p>
                  {p.brand && <p className="text-sm text-primary mt-0.5">{p.brand}</p>}
                  {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft}`}>
                    {p.status}
                  </span>
                  {p.amount && <span className="text-sm font-bold text-foreground">${p.amount.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
