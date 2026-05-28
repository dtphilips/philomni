import React, { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import {
  Music, Upload, Loader2, Trash2, Edit3,
  CheckCircle2, XCircle, ShieldCheck, Play,
  Eye, BarChart2, AlertCircle, ArrowRight, ChevronLeft,
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

const EMPTY_META = {
  title: '', artist: 'Philomni Originals', album: '', genre: '',
  mood: '', bpm: '', tags: '', isrc_code: '', copyright_year: '2026',
  socan_registered: false, is_premium: false,
}

const fmtCount = (n) => {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
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
            { label: 'Artist',  key: 'artist' },
            { label: 'Album',   key: 'album' },
            { label: 'ISRC Code', key: 'isrc_code', placeholder: 'CB-XXX-YY-NNNNN', mono: true },
            { label: 'BPM',     key: 'bpm', type: 'number' },
            { label: 'Tags (comma separated)', key: 'tags' },
            { label: 'Copyright Year', key: 'copyright_year', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={`w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${f.mono ? 'font-mono' : ''}`} />
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

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2].map(n => (
        <React.Fragment key={n}>
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
            step === n
              ? 'bg-primary text-primary-foreground'
              : step > n
              ? 'bg-green-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}>
            {step > n ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
          </div>
          <span className={`text-xs font-medium ${step === n ? 'text-foreground' : 'text-muted-foreground'}`}>
            {n === 1 ? 'Upload File' : 'Track Details'}
          </span>
          {n < 2 && <div className="flex-1 h-px bg-border mx-1" />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminMusic() {
  const { user } = useAuth()
  if (user && !user.is_admin) return <Navigate to="/" replace />

  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)

  // ── Track list state ──────────────────────────────────────────────────────
  const [tracks, setTracks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editTrack, setEditTrack] = useState(null)
  const [stats, setStats]     = useState({ total: 0, plays: 0, usage: 0, topTrack: null })

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState(1)   // 1 = upload file, 2 = metadata

  // Step 1 — audio file upload
  const [audioFile, setAudioFile]           = useState(null)
  const [audioDuration, setAudioDuration]   = useState(null)
  const [audioSize, setAudioSize]           = useState(null)
  const [uploading, setUploading]           = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage]       = useState('')
  const [uploadError, setUploadError]       = useState('')
  const [audioUploadedUrl, setAudioUploadedUrl] = useState('')   // ← KEY: set after step-1 upload
  const [audioUploaded, setAudioUploaded]   = useState(false)    // ← drives Next button

  // Step 2 — metadata + cover
  const [meta, setMeta]               = useState(EMPTY_META)
  const [coverFile, setCoverFile]     = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')

  const setM = (k, v) => setMeta(prev => ({ ...prev, [k]: v }))

  // ── Fetch ─────────────────────────────────────────────────────────────────
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
    setStats(prev => ({ ...prev, plays: playsRes.count || 0, usage: usageRes.count || 0 }))
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

  // ── Step 1 — audio file picker ────────────────────────────────────────────
  const handleAudioChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('Audio file selected:', file.name, file.type, file.size)
    setAudioFile(file)
    setAudioSize((file.size / 1024 / 1024).toFixed(2) + ' MB')
    setUploadError('')
    // Reset upload state if user picks a new file
    setAudioUploaded(false)
    setAudioUploadedUrl('')
    setUploadProgress(0)

    const audio = new Audio()
    const objUrl = URL.createObjectURL(file)
    audio.src = objUrl
    audio.onloadedmetadata = () => {
      const s = Math.round(audio.duration)
      setAudioDuration(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
      URL.revokeObjectURL(objUrl)
    }
    audio.onerror = () => URL.revokeObjectURL(objUrl)
  }

  // ── Step 1 — upload audio to Supabase Storage ─────────────────────────────
  const handleUploadAudio = async () => {
    if (!audioFile) { setUploadError('Please select an audio file first.'); return }

    setUploading(true)
    setUploadError('')
    setUploadProgress(10)
    setUploadStage('Preparing upload…')

    try {
      const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const audioPath = `audio/${Date.now()}-${safeName}`

      console.log('Starting audio upload to:', audioPath)
      console.log('File:', audioFile.name, audioFile.type, audioFile.size, 'bytes')

      setUploadProgress(25)
      setUploadStage('Uploading audio file…')

      const { data: storageData, error: storageError } = await supabase.storage
        .from('philomni-music')
        .upload(audioPath, audioFile, { cacheControl: '3600', upsert: false })

      console.log('Storage response:', storageData, storageError)

      if (storageError) {
        console.error('Storage upload error:', storageError)
        throw new Error('Storage upload failed: ' + storageError.message)
      }

      setUploadProgress(80)
      setUploadStage('Getting public URL…')

      const { data: { publicUrl } } = supabase.storage
        .from('philomni-music')
        .getPublicUrl(audioPath)

      console.log('Audio public URL:', publicUrl)

      setUploadProgress(100)
      setUploadStage('Upload complete!')

      // ── CRITICAL: store URL in state and mark as uploaded ──
      setAudioUploadedUrl(publicUrl)
      setAudioUploaded(true)           // ← this enables the Next button

      console.log('audioUploaded set to TRUE, URL:', publicUrl)

    } catch (err) {
      console.error('Upload failed:', err)
      setUploadError(err.message || 'Upload failed. Check console for details.')
      setUploadProgress(0)
      setUploadStage('')
      setAudioUploaded(false)
      setAudioUploadedUrl('')
    } finally {
      setUploading(false)
    }
  }

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  const handleNext = () => {
    if (!audioUploaded || !audioUploadedUrl) return
    console.log('Moving to Step 2. audioUploadedUrl:', audioUploadedUrl)
    setWizardStep(2)
  }

  // ── Step 2 — cover file ───────────────────────────────────────────────────
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('Cover file selected:', file.name, file.type)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setSaveError('')
  }

  // ── Step 2 — save to DB ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!meta.title.trim()) { setSaveError('Track title is required'); return }
    if (!audioUploadedUrl) { setSaveError('No audio URL found — please go back and re-upload the file'); return }

    setSaving(true)
    setSaveError('')

    try {
      // Upload cover art (optional)
      let coverUrl = null
      if (coverFile) {
        console.log('Uploading cover art:', coverFile.name)
        const safeName = coverFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const coverPath = `covers/${Date.now()}-${safeName}`
        const { data: coverData, error: coverError } = await supabase.storage
          .from('philomni-music')
          .upload(coverPath, coverFile, { cacheControl: '3600', upsert: false })
        if (coverError) {
          console.warn('Cover upload failed (non-fatal):', coverError.message)
        } else {
          const { data: { publicUrl } } = supabase.storage.from('philomni-music').getPublicUrl(coverPath)
          coverUrl = publicUrl
          console.log('Cover URL:', coverUrl)
        }
      }

      // Insert track into DB
      const payload = {
        title: meta.title.trim(),
        artist: meta.artist.trim() || 'Philomni Originals',
        album: meta.album.trim() || null,
        genre: meta.genre || null,
        mood: meta.mood || null,
        bpm: meta.bpm ? parseInt(meta.bpm, 10) : null,
        tags: meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        isrc_code: meta.isrc_code.trim() || null,
        copyright_year: parseInt(meta.copyright_year, 10) || 2026,
        socan_registered: meta.socan_registered,
        is_premium: meta.is_premium,
        audio_url: audioUploadedUrl,   // ← preserved from Step 1
        cover_art_url: coverUrl,
        is_philomni_original: true,
        license_type: 'philomni_exclusive',
        label: 'Philomni Technologies Inc.',
        uploaded_by: user.id,
        status: 'active',
        play_count: 0,
      }

      console.log('Inserting to database:', payload)

      const { data: inserted, error: dbError } = await supabase
        .from('music_tracks')
        .insert(payload)
        .select()
        .single()

      console.log('DB response:', inserted, dbError)

      if (dbError) throw new Error('Database error: ' + dbError.message)

      toast.success('Track saved successfully!')

      // Full reset
      resetWizard()
      fetchTracks()

    } catch (err) {
      console.error('Save failed:', err)
      setSaveError(err.message || 'Save failed. Check console for details.')
    } finally {
      setSaving(false)
    }
  }

  // ── Reset wizard ──────────────────────────────────────────────────────────
  const resetWizard = () => {
    setWizardStep(1)
    setAudioFile(null)
    setAudioSize(null)
    setAudioDuration(null)
    setUploading(false)
    setUploadProgress(0)
    setUploadStage('')
    setUploadError('')
    setAudioUploadedUrl('')
    setAudioUploaded(false)
    setMeta(EMPTY_META)
    setCoverFile(null)
    setCoverPreview(null)
    setSaveError('')
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  // ── Track management ──────────────────────────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────────────────────────
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
          { icon: Music,    label: 'Total Tracks',  value: stats.total,           color: 'text-primary'   },
          { icon: Eye,      label: 'Total Plays',   value: fmtCount(stats.plays), color: 'text-blue-400'  },
          { icon: BarChart2,label: 'Used in Posts', value: fmtCount(stats.usage), color: 'text-green-400' },
          { icon: Play,     label: 'Most Played',
            value: stats.topTrack ? stats.topTrack.title.slice(0, 14) + '…' : '—',
            color: 'text-amber-400' },
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

      {/* ══ WIZARD ══════════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <StepDots step={wizardStep} />

        {/* ── STEP 1: Upload audio file ── */}
        {wizardStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-foreground mb-0.5">Step 1 — Upload Audio File</h2>
              <p className="text-xs text-muted-foreground">Upload the .mp3 or .wav file first. Once it reaches 100%, the Next button activates.</p>
            </div>

            {/* Error banner */}
            {uploadError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-mono text-xs break-all">{uploadError}</span>
              </div>
            )}

            {/* File picker */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Audio File <span className="text-destructive">*</span>
                <span className="text-muted-foreground/60 font-normal ml-1">(.mp3 or .wav, max 50 MB)</span>
              </label>
              <label className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                audioUploaded
                  ? 'border-green-500/50 bg-green-500/5'
                  : audioFile
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-primary/40 bg-muted/40 hover:bg-muted/60'
              }`}>
                {audioUploaded ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                    <p className="text-sm font-semibold text-green-500">Upload complete!</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[280px] text-center">{audioFile?.name}</p>
                    <p className="text-xs text-muted-foreground">{audioSize}{audioDuration ? ` · ${audioDuration}` : ''}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Click to pick a different file</p>
                  </>
                ) : audioFile ? (
                  <>
                    <span className="text-2xl">🎵</span>
                    <p className="text-sm font-semibold text-foreground truncate max-w-[280px] text-center">{audioFile.name}</p>
                    <p className="text-xs text-muted-foreground">{audioSize}{audioDuration ? ` · ${audioDuration}` : ''}</p>
                    <p className="text-[10px] text-primary mt-1">File selected — click Upload below</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to select audio file</p>
                    <p className="text-xs text-muted-foreground/60">MP3 or WAV · up to 50 MB</p>
                  </>
                )}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav,audio/mp3,audio/x-wav"
                  className="hidden"
                  onChange={handleAudioChange}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Progress bar — shown while uploading OR after complete */}
            {(uploading || uploadProgress > 0) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${audioUploaded ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {uploadStage || (audioUploaded ? 'Upload complete!' : 'Uploading…')}
                  </span>
                  <span className={`font-mono ${audioUploaded ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${audioUploaded ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons row */}
            <div className="flex items-center gap-3 pt-1">
              {/* Upload button — disabled only while already uploading */}
              <button
                onClick={handleUploadAudio}
                disabled={uploading || !audioFile}
                className="flex-1 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : audioUploaded
                  ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Re-upload File</>
                  : <><Upload className="w-4 h-4" /> Upload File</>
                }
              </button>

              {/* Next button — ONLY disabled when upload has NOT completed */}
              <button
                onClick={handleNext}
                disabled={!audioUploaded}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next — Add Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Helper text under buttons */}
            <p className="text-xs text-center text-muted-foreground/60">
              {!audioFile
                ? 'Select a file above, then click Upload File'
                : !audioUploaded
                ? 'Click Upload File to send to Supabase storage, then Next will activate'
                : '✅ File is in Supabase storage — click Next to add track details'}
            </p>
          </div>
        )}

        {/* ── STEP 2: Track metadata ── */}
        {wizardStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground mb-0.5">Step 2 — Track Details</h2>
                <p className="text-xs text-muted-foreground">
                  Audio ready: <span className="text-green-500 font-medium">{audioFile?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            {/* Save error */}
            {saveError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-mono text-xs break-all">{saveError}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Track Title <span className="text-destructive">*</span>
                </label>
                <input value={meta.title} onChange={e => { setM('title', e.target.value); setSaveError('') }}
                  placeholder="Track title"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Artist */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
                <input value={meta.artist} onChange={e => setM('artist', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Album */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Album (optional)</label>
                <input value={meta.album} onChange={e => setM('album', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* ISRC */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">ISRC Code</label>
                <input value={meta.isrc_code} onChange={e => setM('isrc_code', e.target.value)}
                  placeholder="CB-XXX-YY-NNNNN"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Genre</label>
                <select value={meta.genre} onChange={e => setM('genre', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Mood</label>
                <select value={meta.mood} onChange={e => setM('mood', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select mood</option>
                  {MOODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              {/* BPM */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">BPM (optional)</label>
                <input type="number" value={meta.bpm} onChange={e => setM('bpm', e.target.value)}
                  placeholder="120"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Copyright year */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Copyright Year</label>
                <input type="number" value={meta.copyright_year} onChange={e => setM('copyright_year', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (comma separated)</label>
              <input value={meta.tags} onChange={e => setM('tags', e.target.value)}
                placeholder="chill, study, late night…"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={meta.socan_registered} onChange={e => setM('socan_registered', e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">SOCAN Registered</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={meta.is_premium} onChange={e => setM('is_premium', e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">Premium (Pro/ProMax only)</span>
              </label>
            </div>

            {/* Cover art */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Cover Art
                <span className="text-muted-foreground/60 font-normal ml-1">(optional · .jpg or .png)</span>
              </label>
              <label className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                coverFile ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 bg-muted/40 hover:bg-muted/60'
              }`}>
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <p className="text-[10px] text-primary">Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload cover art</span>
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

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => setWizardStep(1)}
                className="px-5 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={resetWizard}
                className="px-5 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {saving ? 'Saving to Library…' : 'Save Track to Library'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Track list ── */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4">All Tracks ({tracks.length})</h2>

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
              <div key={track.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {track.cover_art_url
                    ? <img src={track.cover_art_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-muted-foreground/40" /></div>
                  }
                </div>
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
                <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[60px]">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Play className="w-3 h-3" /> {fmtCount(track.play_count)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditTrack(track)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all" title="Edit">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleStatus(track)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      track.status === 'active'
                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`} title={track.status === 'active' ? 'Deactivate' : 'Activate'}>
                    {track.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteTrack(track.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editTrack && (
        <EditModal track={editTrack} onClose={() => setEditTrack(null)} onSaved={fetchTracks} />
      )}
    </div>
  )
}
