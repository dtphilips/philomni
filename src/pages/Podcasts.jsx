import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Mic2, Play, Pause, Plus, Loader2, Upload } from 'lucide-react'

export default function Podcasts() {
  const { user } = useAuth()
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(null)
  const [audioEl] = useState(() => new Audio())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', audio_url: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    supabase.from('podcasts').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setEpisodes(data ?? []); setLoading(false) })
    return () => { audioEl.pause() }
  }, [])

  const togglePlay = (ep) => {
    if (playing === ep.id) {
      audioEl.pause()
      setPlaying(null)
    } else {
      audioEl.src = ep.audio_url
      audioEl.play()
      setPlaying(ep.id)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setPosting(true)
    const { data } = await supabase.from('podcasts').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      audio_url: form.audio_url.trim() || null,
      creator_id: user.id,
      creator_name: user.full_name,
    }).select().single()
    if (data) { setEpisodes(prev => [data, ...prev]); setShowForm(false); setForm({ title: '', description: '', audio_url: '' }) }
    setPosting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Podcasts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Discover and share episodes</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Upload Episode
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-foreground">Upload Episode</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Episode title" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Episode description" rows={2}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <input value={form.audio_url} onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))}
            placeholder="Audio URL (mp3, m4a…)"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <div className="flex gap-2">
            <button type="submit" disabled={posting}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Upload
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mic2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No episodes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map(ep => (
            <div key={ep.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <button
                onClick={() => ep.audio_url && togglePlay(ep)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${ep.audio_url ? 'bg-primary/15 hover:bg-primary/25 text-primary' : 'bg-muted text-muted-foreground cursor-default'}`}
              >
                {playing === ep.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{ep.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ep.creator_name}</p>
                {ep.description && <p className="text-xs text-muted-foreground mt-1 truncate">{ep.description}</p>}
              </div>
              {!ep.audio_url && <span className="text-xs text-muted-foreground">No audio</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
