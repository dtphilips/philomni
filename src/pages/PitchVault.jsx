import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Briefcase, Plus, Loader2, X, ChevronDown, Check, Eye, DollarSign, Building2 } from 'lucide-react'

const STATUS_COLORS = {
  pending:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  draft:    'bg-muted text-muted-foreground border-border',
}

const STATUS_OPTIONS = ['draft', 'pending', 'accepted', 'rejected']

function ViewPitchModal({ pitch, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">{pitch.title}</h2>
            {pitch.brand && <p className="text-sm text-primary mt-0.5 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{pitch.brand}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {pitch.amount && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-bold text-emerald-400">${Number(pitch.amount).toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-1">deal value</span>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Status</p>
            <span className={`inline-flex text-xs px-3 py-1 rounded-full font-semibold border ${STATUS_COLORS[pitch.status] ?? STATUS_COLORS.draft}`}>
              {pitch.status}
            </span>
          </div>

          {pitch.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Pitch Description</p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-xl p-4 leading-relaxed">{pitch.description}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Created</p>
            <p className="text-sm text-muted-foreground">{new Date(pitch.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}

function StatusDropdown({ pitch, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = async (status) => {
    if (status === pitch.status) { setOpen(false); return }
    setLoading(true)
    const { data } = await supabase.from('pitches').update({ status }).eq('id', pitch.id).select().single()
    if (data) onUpdate(data)
    setLoading(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border transition-all disabled:opacity-60 ${STATUS_COLORS[pitch.status] ?? STATUS_COLORS.draft}`}>
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {pitch.status}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 min-w-[120px] py-1 overflow-hidden">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => handleSelect(s)}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 hover:bg-muted transition-colors ${s === pitch.status ? 'text-primary' : 'text-foreground'}`}>
              {s === pitch.status && <Check className="w-3 h-3" />}
              <span className={s === pitch.status ? '' : 'ml-4'}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PitchVault() {
  const { user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewPitch, setViewPitch] = useState(null)
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
      created_by: user?.id,
    }).select().single()
    if (data) { setPitches(prev => [data, ...prev]); setShowForm(false); setForm({ title: '', brand: '', description: '', amount: '' }) }
    setPosting(false)
  }

  const handleStatusUpdate = (updated) => {
    setPitches(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  const stats = {
    total: pitches.length,
    pending: pitches.filter(p => p.status === 'pending').length,
    accepted: pitches.filter(p => p.status === 'accepted').length,
    value: pitches.filter(p => p.status === 'accepted' && p.amount).reduce((s, p) => s + Number(p.amount), 0),
  }

  return (
    <div className="max-w-2xl mx-auto">
      {viewPitch && <ViewPitchModal pitch={viewPitch} onClose={() => setViewPitch(null)} />}

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

      {/* Stats row */}
      {pitches.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'Accepted', value: stats.accepted },
            { label: 'Earned', value: stats.value ? `$${stats.value.toLocaleString()}` : '$0' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-foreground">New Pitch</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Pitch title" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
            placeholder="Brand / Company name"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Pitch description — what you're offering, deliverables, timeline…" rows={4}
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{p.title}</p>
                  {p.brand && <p className="text-sm text-primary mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{p.brand}</p>}
                  {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <StatusDropdown pitch={p} onUpdate={handleStatusUpdate} />
                  {p.amount && <span className="text-sm font-bold text-foreground">${Number(p.amount).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => setViewPitch(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View Full Pitch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
