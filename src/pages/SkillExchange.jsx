import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Zap, Plus, Loader2, Star } from 'lucide-react'

export default function SkillExchange() {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', offering: '', seeking: '', description: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    supabase.from('skill_exchanges').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setSkills(data ?? []); setLoading(false) })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setPosting(true)
    const { data } = await supabase.from('skill_exchanges').insert({
      title: form.title.trim(),
      offering: form.offering.trim(),
      seeking: form.seeking.trim(),
      description: form.description.trim() || null,
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: user.avatar_url,
    }).select().single()
    if (data) { setSkills(prev => [data, ...prev]); setShowForm(false); setForm({ title: '', offering: '', seeking: '', description: '' }) }
    setPosting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Exchange</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Trade skills with other creators</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Offer Skill
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Skill exchange title" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={form.offering} onChange={e => setForm(f => ({ ...f, offering: e.target.value }))}
            placeholder="What you're offering (e.g. Video editing)" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={form.seeking} onChange={e => setForm(f => ({ ...f, seeking: e.target.value }))}
            placeholder="What you're seeking (e.g. Graphic design)" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="More details…" rows={2}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={posting}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Post
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : skills.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No skill exchanges yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {s.user_name?.[0] ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.user_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/10 rounded-xl p-2.5">
                  <p className="text-xs text-emerald-400 font-medium mb-0.5">Offering</p>
                  <p className="text-sm text-foreground">{s.offering}</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-2.5">
                  <p className="text-xs text-primary font-medium mb-0.5">Seeking</p>
                  <p className="text-sm text-foreground">{s.seeking}</p>
                </div>
              </div>
              {s.description && <p className="text-xs text-muted-foreground mt-2">{s.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
