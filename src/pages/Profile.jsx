import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Camera, Edit2, Save, X, Loader2, Upload, ImagePlus } from 'lucide-react'

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState({ full_name: '', bio: '', headline: '', location: '' })
  // Avatar / banner upload
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const avatarInputRef = useRef()
  const bannerInputRef = useRef()

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

  const handleAvatarUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setAvatarUploading(true)
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    try {
      const path = `avatars/${user.id}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      await refreshProfile()
    } catch (err) {
      console.error('Avatar upload failed:', err)
      setAvatarPreview(null)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleBannerUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setBannerUploading(true)
    const previewUrl = URL.createObjectURL(file)
    setBannerPreview(previewUrl)
    try {
      const path = `banners/${user.id}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
      await supabase.from('users').update({ banner_url: publicUrl }).eq('id', user.id)
      await refreshProfile()
    } catch (err) {
      console.error('Banner upload failed:', err)
      setBannerPreview(null)
    } finally {
      setBannerUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('users').update(form).eq('id', user.id)
    await refreshProfile()
    setEditing(false)
    setSaving(false)
  }

  if (!user) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  const bannerSrc = bannerPreview || user.banner_url
  const avatarSrc = avatarPreview || user.avatar_url

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner */}
      <div className="relative h-40 rounded-2xl overflow-hidden group">
        <div
          className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/40"
          style={bannerSrc ? { background: `url(${bannerSrc}) center/cover no-repeat` } : {}}
        />
        {/* Banner upload button */}
        <button
          onClick={() => bannerInputRef.current?.click()}
          disabled={bannerUploading}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
          {bannerUploading
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <div className="flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-xl text-xs font-medium">
                <ImagePlus className="w-4 h-4" /> Change Banner
              </div>}
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleBannerUpload(e.target.files[0])} />
      </div>

      {/* Avatar + actions */}
      <div className="flex items-end justify-between px-4 -mt-10 mb-4">
        {/* Avatar with upload overlay */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background overflow-hidden flex items-center justify-center text-2xl font-bold text-primary bg-primary/10">
            {avatarSrc
              ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              : (user.full_name?.[0] ?? '?')}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
            {avatarUploading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Camera className="w-5 h-5 text-white" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleAvatarUpload(e.target.files[0])} />
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

      {/* Upload hints */}
      {!editing && (
        <p className="text-xs text-muted-foreground text-center mb-2 opacity-60">Hover over avatar or banner to change photos</p>
      )}

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
