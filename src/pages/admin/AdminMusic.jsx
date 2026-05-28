import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import {
  Music, Upload, Loader2, Trash2, Edit3,
  CheckCircle2, XCircle, Star, ShieldCheck, Play,
  Eye, BarChart2,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  'Afrobeats', 'Pop', 'R&B', 'Hip Hop', 'Gospel',
  'Electronic', 'Ambient', 'Lo-Fi', 'Classical', 'Jazz', 'Other',
]

const MOODS = [
  'Energetic', 'Chill', 'Romantic', 'Melancholic',
  'Motivational', 'Dark', 'Happy', 'Spiritual', 'Neutral',
]

const EMPTY_FORM = {
  title: '', artist: 'Philomni Originals', album: '', genre: '',
  mood: '', bpm: '', tags: '', isrc_code: '', copyright_year: '2026',
  socan_registered: false, is_premium: false,
}

const fmtCount = (n) => {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

async function ensureBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === 'philomni-music')) {
      await supabase.storage.createBucket('philomni-music', {
        public: true,
        allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'image/jpeg', 'image/png', 'audio/mp3'],
        fileSizeLimit: 52428800,
      })
    }
  } catch (_) {}
}

async function uploadFile(file, folder) {
  await ensureBucket()
  const ext  = file.name.split('.').pop() || 'bin'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { data, error } = await supabase.storage
    .from('philomni-music')
    .upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from('philomni-music').getPublicUrl(data.path).data.publicUrl
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ track, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: track.title || '',
    artist: track.artist || 'Philomni Originals',
    album: track.album || '',
    genre: track.genre || '',
    mood: track.mood || '',
    bpm: track.bpm || '',
    tags: (track.tags || []).join(', '),
    isrc_code: track.isrc_code || '',
    copyright_year: track.copyright_year || '2026',
    socan_registered: track.socan_registered || false,
    is_premium: track.is_premium || false,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('music_tracks').update({
      title: form.title,
      artist: form.artist,
      album: form.album || null,
      genre: form.genre || null,
      mood: form.mood || null,
      bpm: form.bpm ? parseInt(form.bpm) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      isrc_code: form.isrc_code || null,
      copyright_year: parseInt(form.copyright_year) || 2026,
      socan_registered: form.socan_registered,
      is_premium: form.is_premium,
    }).eq('id', track.id)
    if (error) { toast.error(error.message) }
    else {
      toast.success('Track updated')
      onSaved()
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">Edit Track</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Title *', key: 'title', type: 'text' },
            { label: 'Artist', key: 'artist', type: 'text' },
            { label: 'Album', key: 'album', type: 'text' },
            { label: 'ISRC Code', key: 'isrc_code', type: 'text', placeholder: 'CB-XXX-YY-NNNNN' },
            { label: 'BPM', key: 'bpm', type: 'number' },
            { label: 'Tags (comma separated)', key: 'tags', type: 'text' },
            { label: 'Copyright Year', key: 'copyright_year', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Genre</label>
              <select value={form.genre} onChange={e => set('genre', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mood</label>
              <select value={form.mood} onChange={e => set('mood', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select mood</option>
                {MOODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.socan_registered} onChange={e => set('socan_registered', e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">SOCAN Registered</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_premium} onChange={e => set('is_premium', e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">Premium Track</span>
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminMusic() {
  const { user } = useAuth()
  if (user && !user.is_admin) return <Navigate to="/" replace />

  const [tracks, setTracks]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [audioFile, setAudioFile]     = useState(null)
  const [coverFile, setCoverFile]     = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [audioDuration, setAudioDuration] = useState(null)
  const [audioSize, setAudioSize]     = useState(null)
  const [editTrack, setEditTrack]     = useState(null)

  // Stats
  const [stats, setStats] = useState({ total: 0, plays: 0, usage: 0, topTrack: null })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTracks = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('music_tracks')
      .select('*')
      .order('created_at', { ascending: false })
    setTracks(data || [])
    setLoading(false)
  }

  const fetchStats = async () => {
    const [{ count: plays }, { count: usage }] = await Promise.all([
      supabase.from('music_plays').select('*', { count: 'exact', head: true }),
      supabase.from('music_usage').select('*', { count: 'exact', head: true }),
    ])
    setStats(prev => ({ ...prev, plays: plays || 0, usage: usage || 0 }))
  }

  useEffect(() => {
    fetchTracks()
    fetchStats()
  }, [])

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      total: tracks.length,
      topTrack: tracks.reduce((best, t) => (!best || (t.play_count || 0) > (best.play_count || 0)) ? t : best, null),
    }))
  }, [tracks])

  // ── Audio file handler ───────────────────────────────────────────────────
  const handleAudioChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioFile(file)
    setAudioSize((file.size / 1024 / 1024).toFixed(2) + ' MB')
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.onloadedmetadata = () => {
      const s = Math.round(audio.duration)
      const m = Math.floor(s / 60)
      const sec = s % 60
      setAudioDuration(`${m}:${sec.toString().padStart(2, '0')}`)
    }
  }

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!form.title.trim()) { toast.error('Track title is required'); return }
    if (!audioFile) { toast.error('Audio file is required'); return }
    setUploading(true)
    try {
      const [audioUrl, coverUrl] = await Promise.all([
        uploadFile(audioFile, 'audio'),
        coverFile ? uploadFile(coverFile, 'covers') : Promise.resolve(null),
      ])
      const { error } = await supabase.from('music_tracks').insert({
        title: form.title,
        artist: form.artist || 'Philomni Originals',
        album: form.album || null,
        genre: form.genre || null,
        mood: form.mood || null,
        bpm: form.bpm ? parseInt(form.bpm) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        isrc_code: form.isrc_code || null,
        copyright_year: parseInt(form.copyright_year) || 2026,
        socan_registered: form.socan_registered,
        is_premium: form.is_premium,
        audio_url: audioUrl,
        cover_art_url: coverUrl,
        uploaded_by: user.id,
        is_philomni_original: true,
        license_type: 'philomni_exclusive',
        label: 'Philomni Technologies Inc.',
        status: 'active',
        play_count: 0,
      })
      if (error) throw error
      toast.success('Track uploaded successfully')
      setForm(EMPTY_FORM)
      setAudioFile(null)
      setCoverFile(null)
      setCoverPreview(null)
      setAudioDuration(null)
      setAudioSize(null)
      fetchTracks()
    } catch (err) {
      toast.error(err.message)
    }
    setUploading(false)
  }

  // ── Deactivate / Delete ──────────────────────────────────────────────────
  const toggleStatus = async (track) => {
    const next = track.status === 'active' ? 'inactive' : 'active'
    await supabase.from('music_tracks').update({ status: next }).eq('id', track.id)
    setTracks(prev => prev.map(t => t.id === track.id ? { ...t, status: next } : t))
    toast.success(`Track ${next === 'active' ? 'activated' : 'deactivated'}`)
  }

  const deleteTrack = async (id) => {
    if (!window.confirm('Delete this track permanently?')) return
    await supabase.from('music_tracks').delete().eq('id', id)
    setTracks(prev => prev.filter(t => t.id !== id))
    toast.success('Track deleted')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Music className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Music Library Management</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Music,    label: 'Total Tracks',        value: stats.total,    color: 'text-primary'       },
          { icon: Eye,      label: 'Total Plays',         value: fmtCount(stats.plays), color: 'text-blue-400' },
          { icon: BarChart2,label: 'Used in Posts',       value: fmtCount(stats.usage), color: 'text-green-400' },
          { icon: Play,     label: 'Most Played',         value: stats.topTrack ? stats.topTrack.title.slice(0,14) + '…' : '—', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <s.icon className={`w-7 h-7 flex-shrink-0 ${s.color}`} />
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Form */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-foreground">Upload New Track</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Track Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Track title"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
            <input value={form.artist} onChange={e => set('artist', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Album */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Album (optional)</label>
            <input value={form.album} onChange={e => set('album', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* ISRC */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">ISRC Code</label>
            <input value={form.isrc_code} onChange={e => set('isrc_code', e.target.value)}
              placeholder="CB-XXX-YY-NNNNN"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Genre</label>
            <select value={form.genre} onChange={e => set('genre', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select genre</option>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Mood</label>
            <select value={form.mood} onChange={e => set('mood', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select mood</option>
              {MOODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* BPM */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">BPM (optional)</label>
            <input type="number" value={form.bpm} onChange={e => set('bpm', e.target.value)}
              placeholder="120"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Copyright year */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Copyright Year</label>
            <input type="number" value={form.copyright_year} onChange={e => set('copyright_year', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (comma separated)</label>
          <input value={form.tags} onChange={e => set('tags', e.target.value)}
            placeholder="chill, study, late night…"
            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.socan_registered} onChange={e => set('socan_registered', e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-foreground">SOCAN Registered</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_premium} onChange={e => set('is_premium', e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-foreground">Premium (Pro/ProMax only)</span>
          </label>
        </div>

        {/* File uploads */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Audio file */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Audio File (.mp3 or .wav) *</label>
            <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/40 text-muted-foreground hover:text-foreground">
              {audioFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{audioFile.name}</p>
                  {audioSize && <p className="text-xs text-muted-foreground mt-0.5">{audioSize} · {audioDuration}</p>}
                </div>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload audio file</span>
                </>
              )}
              <input type="file" accept="audio/mpeg,audio/wav,audio/mp3" className="hidden" onChange={handleAudioChange} />
            </label>
          </div>

          {/* Cover art */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Cover Art (.jpg or .png)</label>
            <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/40 text-muted-foreground hover:text-foreground overflow-hidden relative">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload cover art</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverChange} />
            </label>
          </div>
        </div>

        <button onClick={handleUpload} disabled={uploading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload Track'}
        </button>
      </div>

      {/* Track list */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4">
          All Tracks ({tracks.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No tracks yet. Upload the first one above.
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map(track => (
              <div key={track.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                {/* Cover */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {track.cover_art_url
                    ? <img src={track.cover_art_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-muted-foreground/40" /></div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{track.title}</p>
                    {track.is_premium && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">PRO</span>
                    )}
                    {track.socan_registered && (
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" title="SOCAN Registered" />
                    )}
                    {track.status === 'inactive' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">INACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {track.artist}
                    {track.genre && <span className="ml-1.5 text-muted-foreground/60">· {track.genre}</span>}
                    {track.mood && <span className="ml-1.5 text-muted-foreground/60">· {track.mood}</span>}
                    {track.isrc_code && <span className="ml-1.5 font-mono text-muted-foreground/50"> · {track.isrc_code}</span>}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[60px]">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Play className="w-3 h-3" /> {fmtCount(track.play_count)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditTrack(track)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                    title="Edit">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleStatus(track)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      track.status === 'active'
                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    title={track.status === 'active' ? 'Deactivate' : 'Activate'}>
                    {track.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteTrack(track.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTrack && (
        <EditModal
          track={editTrack}
          onClose={() => setEditTrack(null)}
          onSaved={fetchTracks}
        />
      )}
    </div>
  )
}
