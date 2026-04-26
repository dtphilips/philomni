import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Calendar, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

function Discussions() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', board: 'general' })
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    supabase.from('discussion_posts').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setPosts(data ?? []); setLoading(false) })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setPosting(true)
    const { data } = await supabase.from('discussion_posts').insert({
      title: form.title.trim(),
      content: form.content.trim(),
      board: form.board,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      reply_count: 0,
    }).select().single()
    if (data) { setPosts(prev => [data, ...prev]); setShowNew(false); setForm({ title: '', content: '', board: 'general' }) }
    setPosting(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Discussions</h2>
        <button onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="w-3.5 h-3.5" /> New Post
        </button>
      </div>

      {showNew && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Discussion title" required
            className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Share your thoughts…" rows={3}
            className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={posting}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Post
            </button>
            <button type="button" onClick={() => setShowNew(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        : posts.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No discussions yet</div>
        : (
          <div className="space-y-3">
            {posts.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
                <button onClick={() => setExpanded(e => e === p.id ? null : p.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.author_name} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                    </div>
                    {expanded === p.id ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
                {expanded === p.id && p.content && (
                  <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{p.content}</p>
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {p.reply_count ?? 0} replies</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.board}</span>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', starts_at: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    supabase.from('events').select('*').neq('type', 'room').order('starts_at', { ascending: true }).limit(20)
      .then(({ data }) => { setEvents(data ?? []); setLoading(false) })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setPosting(true)
    const { data } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      starts_at: form.starts_at || null,
      organizer_id: user.id,
      status: 'upcoming',
      type: 'event',
    }).select().single()
    if (data) { setEvents(prev => [data, ...prev]); setShowNew(false); setForm({ title: '', description: '', starts_at: '' }) }
    setPosting(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Events</h2>
        <button onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="w-3.5 h-3.5" /> New Event
        </button>
      </div>

      {showNew && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Event title" required
            className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description" rows={2}
            className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
            className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <div className="flex gap-2">
            <button type="submit" disabled={posting}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create
            </button>
            <button type="button" onClick={() => setShowNew(false)}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        : events.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No events yet</div>
        : (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{ev.title}</p>
                  {ev.starts_at && <p className="text-xs text-primary mt-0.5">{format(new Date(ev.starts_at), 'MMM d, h:mm a')}</p>}
                  {ev.description && <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

export default function Community() {
  const [tab, setTab] = useState('discussions')
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Community</h1>
      <div className="flex bg-muted rounded-xl p-1 mb-6">
        {['discussions', 'events'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'discussions' ? <Discussions /> : <Events />}
    </div>
  )
}
