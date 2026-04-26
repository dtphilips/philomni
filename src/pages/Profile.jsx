import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Camera, Edit2, Save, X, Loader2 } from 'lucide-react'

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState({ full_name: '', bio: '', headline: '', location: '' })

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? '',
        bio: user.bio ?? '',
        headline: user.headline ?? '',
        location: user.location ?? '',
      })
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setPosts(data ?? []))
  }, [user?.id])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('users').update(form).eq('id', user.id)
    await refreshProfile()
    setEditing(false)
    setSaving(false)
  }

  if (!user) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-br from-primary/30 to-purple-900/40 rounded-2xl mb-0 relative" />

      {/* Avatar + actions */}
      <div className="flex items-end justify-between px-4 -mt-10 mb-4">
        <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background overflow-hidden flex items-center justify-center text-2xl font-bold text-primary bg-primary/10">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : (user.full_name?.[0] ?? '?')}
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {editing ? 'Save' : 'Edit Profile'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        {editing ? (
          <div className="space-y-3">
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Full name" className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
              placeholder="Headline (e.g. Content Creator & Podcaster)" className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Bio" rows={3} className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Location" className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground">{user.full_name}</h2>
            {user.headline && <p className="text-sm text-primary mt-0.5">{user.headline}</p>}
            {user.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}
            {user.location && <p className="text-xs text-muted-foreground mt-1">📍 {user.location}</p>}
            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
          </>
        )}
      </div>

      {/* Posts */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Posts ({posts.length})</h3>
      <div className="space-y-3">
        {posts.length === 0
          ? <div className="text-center py-8 text-muted-foreground text-sm">No posts yet</div>
          : posts.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{p.content}</p>
              <p className="text-xs text-muted-foreground mt-2">❤️ {p.like_count ?? 0} · 💬 {p.comment_count ?? 0}</p>
            </div>
          ))}
      </div>
    </div>
  )
}
