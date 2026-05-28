import React, { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import {
  Music, Upload, Loader2, Trash2, Edit3,
  CheckCircle2, XCircle, ShieldCheck, Play,
  Eye, BarChart2, AlertCircle,
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

// ─── Upload stage labels ──────────────────────────────────────────────────────

const STAGES = [
  'Starting upload…',
  'Uploading audio file…',
  'Uploading cover art…',
  'Saving to database…',
  'Done!',
]

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
    else { toast.success('Track updated'); onSaved(); onClose() }
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
            { label: 'Title *', key: 'title' },
            { label: 'Artist', key: 'artist' },
            { label: 'Album', key: 'album' },
            { label: 'ISRC Code', key: 'isrc_code', placeholder: 'CB-XXX-YY-NNNNN', mono: true },
            { label: 'BPM', key: 'bpm', type: 'number' },
            { label: 'Tags (comma separated)', key: 'tags' },
            { label: 'Copyright Year', key: 'copyright_year', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={`w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${f.mono ? 'font-mono' : ''}`}
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

  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const [tracks, setTracks]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [uploading, setUploading]       = useState(false)
  const [uploadStage, setUploadStage]   = useState('')  // current step description
  const [uploadProgress, setUploadProgress] = useState(0) // 0–100
  const [uploadError, setUploadError]   = useState('')  // inline error shown to admin
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [audioFile, setAudioFile]       = useState(null)
  const [coverFile, setCoverFile]       = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [audioDuration, setAudioDuration] = useState(null)
  const [audioSize, setAudioSize]       = useState(null)
  const [editTrack, setEditTrack]       = useState(null)
  const [stats, setStats]               = useState({ total: 0, plays: 0, usage: 0, topTrack: null })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTracks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('fetchTracks error:', error)
    setTracks(data || [])
    setLoading(false)
  }

  const fetchStats = async () => {
    const [playsRes, usageRes] = await Promise.all([
      supabase.from('music_plays').select('*', { count: 'exact', head: true }),
      supabase.from('music_usage').select('*', { count: 'exact', head: true }),
    ])
    setStats(prev => ({
      ...prev,
      plays: playsRes.count || 0,
      usage: usageRes.count || 0,
    }))
  }

  useEffect(() => { fetchTracks(); fetchStats() }, [])

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      total: tracks.length,
      topTrack: tracks.reduce(
        (best, t) => (!best || (t.play_count || 0) > (best.play_count || 0)) ? t : best,
        null
      ),
    }))
  }, [tracks])

  // ── Audio file picker ────────────────────────────────────────────────────
  const handleAudioChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('Audio file selected:', file.name, file.type, file.size)
    setAudioFile(file)
    setUploadError('')
    setAudioSize((file.size / 1024 / 1024).toFixed(2) + ' MB')
    const audio = new Audio()
    const objectUrl = URL.createObjectURL(file)
    audio.src = objectUrl
    audio.onloadedmetadata = () => {
      const s = Math.round(audio.duration)
      setAudioDuration(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
      URL.revokeObjectURL(objectUrl)
    }
    audio.onerror = () => {
      console.warn('Could not read audio metadata for duration')
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('Cover file selected:', file.name, file.type, file.size)
    setCoverFile(file)
    setUploadError('')
    setCoverPreview(URL.createObjectURL(file))
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    // Inline validation
    if (!form.title.trim()) {
      setUploadError('Track title is required')
      return
    }
    if (!audioFile) {
      setUploadError('Please select an audio file (.mp3 or .wav)')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadProgress(0)
    setUploadStage(STAGES[0])

    try {
      // ── Step 1: Upload audio file ────────────────────────────────────────
      console.log('Starting upload...')
      console.log('Audio file:', audioFile.name, audioFile.type, audioFile.size, 'bytes')
      setUploadStage(STAGES[1])
      setUploadProgress(15)

      const audioPath = `audio/${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      console.log('Uploading audio to path:', audioPath)

      const { data: audioData, error: audioError } = await supabase.storage
        .from('philomni-music')
        .upload(audioPath, audioFile, { cacheControl: '3600', upsert: false })

      console.log('Storage audio response:', audioData, audioError)

      if (audioError) {
        console.error('Audio upload error:', audioError)
        throw new Error('Audio upload failed: ' + audioError.message)
      }

      setUploadProgress(40)

      // ── Step 2: Get public URL for audio ─────────────────────────────────
      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('philomni-music')
        .getPublicUrl(audioPath)

      console.log('Audio public URL:', audioUrl)

      // ── Step 3: Upload cover art (optional) ───────────────────────────────
      let coverUrl = null
      if (coverFile) {
        setUploadStage(STAGES[2])
        setUploadProgress(55)
        console.log('Uploading cover art:', coverFile.name)

        const coverPath = `covers/${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { data: coverData, error: coverError } = await supabase.storage
          .from('philomni-music')
          .upload(coverPath, coverFile, { cacheControl: '3600', upsert: false })

        console.log('Storage cover response:', coverData, coverError)

        if (coverError) {
          // Non-fatal — log but continue without cover art
          console.warn('Cover art upload failed (continuing without it):', coverError.message)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('philomni-music')
            .getPublicUrl(coverPath)
          coverUrl = publicUrl
          console.log('Cover art URL:', coverUrl)
        }
      }

      setUploadProgress(70)

      // ── Step 4: Insert into database ──────────────────────────────────────
      setUploadStage(STAGES[3])
      console.log('Inserting to database...')

      const insertPayload = {
        title: form.title.trim(),
        artist: form.artist.trim() || 'Philomni Originals',
        album: form.album.trim() || null,
        genre: form.genre || null,
        mood: form.mood || null,
        bpm: form.bpm ? parseInt(form.bpm, 10) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        isrc_code: form.isrc_code.trim() || null,
        copyright_year: parseInt(form.copyright_year, 10) || 2026,
        socan_registered: form.socan_registered,
        is_premium: form.is_premium,
        audio_url: audioUrl,
        cover_art_url: coverUrl,
        is_philomni_original: true,
        license_type: 'philomni_exclusive',
        label: 'Philomni Technologies Inc.',
        uploaded_by: user.id,
        status: 'active',
        play_count: 0,
      }

      console.log('Insert payload:', insertPayload)

      const { data: insertedRow, error: dbError } = await supabase
        .from('music_tracks')
        .insert(insertPayload)
        .select()
        .single()

      console.log('Database response:', insertedRow, dbError)

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error('Database error: ' + dbError.message)
      }

      // ── Step 5: Success ───────────────────────────────────────────────────
      setUploadProgress(100)
      setUploadStage(STAGES[4])
      toast.success('Track uploaded successfully!')

      // Reset form
      setForm(EMPTY_FORM)
      setAudioFile(null)
      setCoverFile(null)
      setCoverPreview(null)
      setAudioDuration(null)
      setAudioSize(null)
      setUploadError('')
      if (audioInputRef.current) audioInputRef.current.value = ''
      if (coverInputRef.current) coverInputRef.current.value = ''

      fetchTracks()

    } catch (err) {
      console.error('Upload failed:', err)
      setUploadError(err.message || 'Upload failed. Check console for details.')
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadStage('')
      setTimeout(() => setUploadProgress(0), 1500)
    }
  }

  // ── Deactivate / Delete ──────────────────────────────────────────────────
  const toggleStatus = async (track) => {
    const next = track.status === 'active' ? 'inactive' : 'active'
    await supabase.from('music_tracks').update({ status: next }).eq('id', track.id)
    setTracks(prev => prev.map(t => t.id === track.id ? { ...t, status: next } : t))
    toast.success(`Track ${next === 'active' ? 'activated' : 'deactivated'}`)
  }

  const deleteTrack = async (id) => {
    if (!window.confirm('Delete this track permanently? This cannot be undone.')) return
    const { error } = await supabase.from('music_tracks').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setTracks(prev => prev.filter(t => t.id !== id))
    toast.success('Track deleted')
  }

  const canUpload = form.title.trim().length > 0 && audioFile !== null

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
          { icon: Music,    label: 'Total Tracks',  value: stats.total,              color: 'text-primary'    },
          { icon: Eye,      label: 'Total Plays',   value: fmtCount(stats.plays),    color: 'text-blue-400'   },
          { icon: BarChart2,label: 'Used in Posts', value: fmtCount(stats.usage),    color: 'text-green-400'  },
          { icon: Play,     label: 'Most Played',   value: stats.topTrack ? stats.topTrack.title.slice(0, 14) + '…' : '—', color: 'text-amber-400' },
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

      {/* ── Upload Form ── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-foreground">Upload New Track</h2>

        {/* Inline error banner */}
        {uploadError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-mono text-xs break-all">{uploadError}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Track Title <span className="text-destructive">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => { set('title', e.target.value); setUploadError('') }}
              placeholder="Track title"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
            <input
              value={form.artist}
              onChange={e => set('artist', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Album */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Album (optional)</label>
            <input
              value={form.album}
              onChange={e => set('album', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* ISRC */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">ISRC Code</label>
            <input
              value={form.isrc_code}
              onChange={e => set('isrc_code', e.target.value)}
              placeholder="CB-XXX-YY-NNNNN"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Genre</label>
            <select
              value={form.genre}
              onChange={e => set('genre', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select genre</option>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Mood</label>
            <select
              value={form.mood}
              onChange={e => set('mood', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select mood</option>
              {MOODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* BPM */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">BPM (optional)</label>
            <input
              type="number"
              value={form.bpm}
              onChange={e => set('bpm', e.target.value)}
              placeholder="120"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Copyright year */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Copyright Year</label>
            <input
              type="number"
              value={form.copyright_year}
              onChange={e => set('copyright_year', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="chill, study, late night…"
            className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.socan_registered}
              onChange={e => set('socan_registered', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">SOCAN Registered</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_premium}
              onChange={e => set('is_premium', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Premium (Pro/ProMax only)</span>
          </label>
        </div>

        {/* File uploads */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Audio file */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Audio File <span className="text-destructive">*</span>
              <span className="text-muted-foreground/60 font-normal ml-1">(.mp3 or .wav, max 50 MB)</span>
            </label>
            <label
              className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                audioFile
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-primary/40 bg-muted/40 hover:bg-muted/60'
              }`}
            >
              {audioFile ? (
                <>
                  <span className="text-xl">🎵</span>
                  <p className="text-sm font-semibold text-foreground truncate max-w-full px-2 text-center">
                    {audioFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {audioSize}{audioDuration ? ` · ${audioDuration}` : ''}
                  </p>
                  <p className="text-[10px] text-primary">Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select audio file</span>
                  <span className="text-xs text-muted-foreground/60">MP3 or WAV</span>
                </>
              )}
              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,.wav,audio/mpeg,audio/wav,audio/mp3,audio/x-wav"
                className="hidden"
                onChange={handleAudioChange}
              />
            </label>
          </div>

          {/* Cover art */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Cover Art
              <span className="text-muted-foreground/60 font-normal ml-1">(optional, .jpg or .png)</span>
            </label>
            <label
              className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                coverFile
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-primary/40 bg-muted/40 hover:bg-muted/60'
              }`}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  <p className="text-[10px] text-primary">Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select cover art</span>
                  <span className="text-xs text-muted-foreground/60">JPG or PNG</span>
                </>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="hidden"
                onChange={handleCoverChange}
              />
            </label>
          </div>
        </div>

        {/* Progress bar (shown while uploading) */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{uploadStage}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Readiness hint */}
        {!canUpload && !uploading && (
          <p className="text-xs text-muted-foreground/60 text-center">
            {!form.title.trim() && !audioFile
              ? 'Enter a title and select an audio file to enable upload'
              : !form.title.trim()
              ? 'Enter a track title to enable upload'
              : 'Select an audio file to enable upload'}
          </p>
        )}

        {/* Upload button — only disabled while uploading, NOT based on file state */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            : <><Upload className="w-4 h-4" /> Upload Track</>
          }
        </button>
      </div>

      {/* ── Track list ── */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4">
          All Tracks ({tracks.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No tracks yet. Upload the first one above.
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map(track => (
              <div key={track.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">

                {/* Cover */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {track.cover_art_url
                    ? <img src={track.cover_art_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground/40" />
                      </div>
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
                    {track.isrc_code && (
                      <span className="ml-1.5 font-mono text-muted-foreground/50"> · {track.isrc_code}</span>
                    )}
                  </p>
                </div>

                {/* Play count */}
                <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[60px]">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Play className="w-3 h-3" /> {fmtCount(track.play_count)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditTrack(track)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleStatus(track)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      track.status === 'active'
                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    title={track.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {track.status === 'active'
                      ? <CheckCircle2 className="w-3.5 h-3.5" />
                      : <XCircle className="w-3.5 h-3.5" />
                    }
                  </button>
                  <button
                    onClick={() => deleteTrack(track.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Delete"
                  >
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
