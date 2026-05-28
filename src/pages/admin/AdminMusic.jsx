import React, { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import {
  Music, Upload, Loader2, Trash2, Edit3,
  CheckCircle2, XCircle, ShieldCheck, Play,
  Eye, BarChart2, AlertCircle, ArrowRight, ChevronLeft,
  Clock, ThumbsUp, ThumbsDown, Users, Star,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  'Afrobeats', 'Afropop', 'Amapiano', 'Pop', 'Hip Hop', 'R&B',
  'Gospel', 'Soul', 'Electronic', 'Lo-Fi', 'Indie', 'Rock',
  'Country', 'Jazz', 'Classical', 'Ambient', 'Reggae', 'Dancehall',
  'Latin', 'Blues', 'Folk', 'World', 'Spoken Word', 'Other',
]

const MOODS = [
  'Energetic', 'Chill', 'Romantic', 'Melancholic',
  'Motivational', 'Dark', 'Happy', 'Spiritual', 'Neutral',
]

const LICENSE_TYPES = [
  { value: 'philomni_exclusive',  label: 'Philomni Exclusive'  },
  { value: 'creative_commons',    label: 'Creative Commons'    },
  { value: 'all_rights_reserved', label: 'All Rights Reserved' },
]

const EMPTY_META = {
  title: '', artist: 'Philomni Originals', album: '', genre: '',
  mood: '', bpm: '', tags: '', isrc_code: '', copyright_year: '2026',
  socan_registered: false, is_premium: false,
  label: 'Philomni Technologies Inc.',
  license_type: 'philomni_exclusive',
  is_philomni_original: true,
  content_id_ready: false,
}

const fmtCount = (n) => {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// Extracts storage path from a Supabase public URL
const extractStoragePath = (url) => {
  if (!url) return null
  const marker = '/philomni-music/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length).split('?')[0]) : null
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ track, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:                track.title               || '',
    artist:               track.artist              || 'Philomni Originals',
    album:                track.album               || '',
    genre:                track.genre               || '',
    mood:                 track.mood                || '',
    bpm:                  track.bpm                 || '',
    tags:                 (track.tags || []).join(', '),
    isrc_code:            track.isrc_code           || '',
    copyright_year:       String(track.copyright_year || '2026'),
    label:                track.label               || 'Philomni Technologies Inc.',
    license_type:         track.license_type        || 'philomni_exclusive',
    is_philomni_original: track.is_philomni_original !== false,
    socan_registered:     track.socan_registered    || false,
    is_premium:           track.is_premium          || false,
    content_id_ready:     track.content_id_ready    || false,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const { error } = await supabase.from('music_tracks').update({
      title:                form.title.trim(),
      artist:               form.artist.trim() || 'Philomni Originals',
      album:                form.album.trim() || null,
      genre:                form.genre || null,
      mood:                 form.mood  || null,
      bpm:                  form.bpm ? parseInt(form.bpm) : null,
      tags:                 form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      isrc_code:            form.isrc_code.trim() || null,
      copyright_year:       parseInt(form.copyright_year) || 2026,
      label:                form.label.trim() || 'Philomni Technologies Inc.',
      license_type:         form.license_type || 'philomni_exclusive',
      is_philomni_original: form.is_philomni_original,
      socan_registered:     form.socan_registered,
      is_premium:           form.is_premium,
      content_id_ready:     form.content_id_ready,
    }).eq('id', track.id)
    if (error) { toast.error(error.message) }
    else { toast.success('Track updated'); onSaved(); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="font-bold text-foreground">Edit Track — {track.title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">×</button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Title *',                 key: 'title' },
            { label: 'Artist',                  key: 'artist' },
            { label: 'Album',                   key: 'album' },
            { label: 'ISRC Code',               key: 'isrc_code', placeholder: 'CB-XXX-26-00001', mono: true },
            { label: 'Label',                   key: 'label' },
            { label: 'BPM',                     key: 'bpm', type: 'number' },
            { label: 'Tags (comma separated)',  key: 'tags' },
            { label: 'Copyright Year',          key: 'copyright_year', type: 'number' },
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
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">License Type</label>
            <select value={form.license_type} onChange={e => set('license_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {LICENSE_TYPES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { key: 'is_philomni_original', label: 'Philomni Original'        },
              { key: 'socan_registered',     label: 'SOCAN Registered'         },
              { key: 'is_premium',           label: 'Premium Track'            },
              { key: 'content_id_ready',     label: 'YouTube Content ID Ready' },
            ].map(t => (
              <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[t.key]} onChange={e => set(t.key, e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">{t.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card">
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
    <div className="flex items-center gap-2 mb-5">
      {[1, 2].map(n => (
        <React.Fragment key={n}>
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
            step === n ? 'bg-primary text-primary-foreground'
            : step > n ? 'bg-green-500 text-white'
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

// ─── Track Row (admin list view) ──────────────────────────────────────────────

function AdminTrackRow({ track, onEdit, onToggle, onDelete, showArtist = false }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      {/* Cover */}
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {track.cover_art_url
          ? <img src={track.cover_art_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground/40" /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">{track.title}</p>
          {track.is_premium && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-amber-400" />PRO
            </span>
          )}
          {track.socan_registered && <ShieldCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0" title="SOCAN Registered" />}
          {track.content_id_ready && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">YT CID</span>
          )}
          {track.status === 'inactive' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">INACTIVE</span>
          )}
          {track.status === 'rejected' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 font-bold">REJECTED</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {showArtist && <span className="font-medium">{track.artist} · </span>}
          {track.genre && <span>{track.genre}</span>}
          {track.isrc_code
            ? <span className="ml-1.5 font-mono text-muted-foreground/60">{track.isrc_code}</span>
            : <span className="ml-1.5 text-red-400/70 text-[10px]">No ISRC</span>
          }
        </p>
      </div>

      {/* Play count */}
      <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/60 flex-shrink-0 min-w-[48px]">
        <Play className="w-3 h-3" /> {fmtCount(track.play_count)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => onEdit(track)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all" title="Edit">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onToggle(track)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            track.status === 'active'
              ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`} title={track.status === 'active' ? 'Deactivate' : 'Activate'}>
          {track.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        </button>
        <button onClick={() => onDelete(track)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [adminTab, setAdminTab] = useState('upload')

  // ── Track list state ──────────────────────────────────────────────────────
  const [originals,    setOriginals]  = useState([])
  const [artistTracks, setArtistTracks] = useState([])
  const [pending,      setPending]    = useState([])
  const [loading,      setLoading]    = useState(true)
  const [editTrack,    setEditTrack]  = useState(null)
  const [statsPlays,   setStatsPlays] = useState(0)

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [wizardStep, setWizardStep]   = useState(1)
  const [audioFile, setAudioFile]     = useState(null)
  const [audioDuration, setAudioDuration] = useState(null)
  const [audioSize, setAudioSize]     = useState(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [audioUploadedUrl, setAudioUploadedUrl] = useState('')
  const [audioUploaded, setAudioUploaded] = useState(false)

  const [meta, setMeta]                 = useState(EMPTY_META)
  const [coverFile, setCoverFile]       = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState('')

  const setM = (k, v) => setMeta(prev => ({ ...prev, [k]: v }))

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTracks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('fetchTracks:', error)
    const all = data || []
    setOriginals(all.filter(t => t.is_philomni_original || t.track_type === 'philomni_original').filter(t => t.status !== 'pending_review'))
    setArtistTracks(all.filter(t => !t.is_philomni_original && t.track_type !== 'philomni_original').filter(t => t.status !== 'pending_review'))
    setPending(all.filter(t => t.status === 'pending_review'))
    setLoading(false)
  }

  const fetchStats = async () => {
    const { count } = await supabase
      .from('music_plays')
      .select('*', { count: 'exact', head: true })
    setStatsPlays(count || 0)
  }

  useEffect(() => { fetchTracks(); fetchStats() }, [])

  // ── Approve / reject ──────────────────────────────────────────────────────
  const approveTrack = async (id) => {
    const { error } = await supabase
      .from('music_tracks')
      .update({ status: 'active', track_type: 'artist_track' })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Track approved — now live in the library')
    fetchTracks()
  }

  const rejectTrack = async (track) => {
    const reason = window.prompt(`Rejection reason for "${track.title}" (shown to artist):`)
    if (reason === null) return   // cancelled
    const { error } = await supabase
      .from('music_tracks')
      .update({ status: 'rejected', rejection_reason: reason || null })
      .eq('id', track.id)
    if (error) { toast.error(error.message); return }
    toast.success('Track rejected')
    fetchTracks()
  }

  // ── Toggle active / inactive ──────────────────────────────────────────────
  const toggleStatus = async (track) => {
    const next = track.status === 'active' ? 'inactive' : 'active'
    await supabase.from('music_tracks').update({ status: next }).eq('id', track.id)
    toast.success(`Track ${next === 'active' ? 'activated' : 'deactivated'}`)
    fetchTracks()
  }

  // ── Delete (DB + storage) ─────────────────────────────────────────────────
  const deleteTrack = async (track) => {
    if (!window.confirm(`Delete "${track.title}" permanently? This removes the file from storage and cannot be undone.`)) return

    // Remove audio from storage
    const audioPath = extractStoragePath(track.audio_url)
    if (audioPath) {
      const { error: se } = await supabase.storage.from('philomni-music').remove([audioPath])
      if (se) console.warn('Audio storage delete (non-fatal):', se.message)
    }

    // Remove cover art from storage
    const coverPath = extractStoragePath(track.cover_art_url)
    if (coverPath) {
      await supabase.storage.from('philomni-music').remove([coverPath])
    }

    // Delete DB row
    const { error } = await supabase.from('music_tracks').delete().eq('id', track.id)
    if (error) { toast.error(error.message); return }
    toast.success('Track and file deleted')
    fetchTracks()
  }

  // ── Step 1 — audio file picker ────────────────────────────────────────────
  const handleAudioChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioFile(file)
    setAudioSize((file.size / 1024 / 1024).toFixed(2) + ' MB')
    setUploadError('')
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

  // ── Upload audio ──────────────────────────────────────────────────────────
  const handleUploadAudio = async () => {
    if (!audioFile) { setUploadError('Please select an audio file first.'); return null }
    setUploading(true)
    setUploadError('')
    setUploadProgress(10)
    setUploadStage('Preparing…')
    try {
      const sanitize = (n) => n
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_').toLowerCase()
      const audioPath = 'audio/' + Date.now() + '_' + sanitize(audioFile.name)
      setUploadProgress(30)
      setUploadStage('Uploading audio…')
      const { error: se } = await supabase.storage.from('philomni-music').upload(audioPath, audioFile, {
        contentType: audioFile.type || 'audio/mpeg',
        cacheControl: '3600',
        upsert: true,
      })
      if (se) throw new Error(se.message)
      setUploadProgress(85)
      setUploadStage('Getting URL…')
      const { data: { publicUrl } } = supabase.storage.from('philomni-music').getPublicUrl(audioPath)
      setUploadProgress(100)
      setUploadStage('Upload complete!')
      setAudioUploadedUrl(publicUrl)
      setAudioUploaded(true)
      return publicUrl
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
      setUploadProgress(0)
      setUploadStage('')
      setAudioUploaded(false)
      setAudioUploadedUrl('')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleNext = async () => {
    if (!audioFile) return
    let url = audioUploadedUrl
    if (!audioUploaded || !url) {
      url = await handleUploadAudio()
      if (!url) return
    }
    setWizardStep(2)
  }

  // ── Cover picker ──────────────────────────────────────────────────────────
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  // ── Save to DB ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!meta.title.trim()) { setSaveError('Track title is required'); return }
    if (!audioUploadedUrl)   { setSaveError('No audio URL — go back and re-upload the file'); return }
    setSaving(true)
    setSaveError('')
    try {
      let coverUrl = null
      if (coverFile) {
        const sanitize = (n) => n
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_').toLowerCase()
        const coverPath = 'covers/' + Date.now() + '_' + sanitize(coverFile.name)
        const { error: ce } = await supabase.storage.from('philomni-music').upload(coverPath, coverFile, { cacheControl: '3600', upsert: false })
        if (!ce) {
          const { data: { publicUrl } } = supabase.storage.from('philomni-music').getPublicUrl(coverPath)
          coverUrl = publicUrl
        }
      }

      const { error: dbError } = await supabase.from('music_tracks').insert({
        title:                meta.title.trim(),
        artist:               meta.artist.trim() || 'Philomni Originals',
        album:                meta.album.trim() || null,
        genre:                meta.genre || null,
        mood:                 meta.mood  || null,
        bpm:                  meta.bpm ? parseInt(meta.bpm, 10) : null,
        tags:                 meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        isrc_code:            meta.isrc_code.trim() || null,
        copyright_year:       parseInt(meta.copyright_year, 10) || 2026,
        label:                meta.label.trim() || 'Philomni Technologies Inc.',
        license_type:         meta.license_type,
        is_philomni_original: true,
        track_type:           'philomni_original',
        is_public:            true,
        available_for_use:    true,
        socan_registered:     meta.socan_registered,
        is_premium:           meta.is_premium,
        content_id_ready:     meta.content_id_ready,
        audio_url:            audioUploadedUrl,
        cover_art_url:        coverUrl,
        uploaded_by:          user.id,
        status:               'active',
        play_count:           0,
      }).select().single()

      if (dbError) throw new Error(
        dbError.message +
        (dbError.details ? ' | ' + dbError.details : '') +
        (dbError.hint   ? ' | Hint: ' + dbError.hint : '')
      )

      toast.success('Track published!')
      resetWizard()
      fetchTracks()
      setAdminTab('originals')  // switch to list tab after saving

    } catch (err) {
      setSaveError(err.message)
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Music className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Music Management</h1>
        <span className="ml-auto text-xs text-muted-foreground">Admin only</span>
      </div>

      {/* ── Stats row (always visible) ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: Music,    label: 'Philomni Originals',
            value: originals.length,
            color: 'text-amber-400', bg: 'bg-amber-400/10',
          },
          {
            icon: Users,    label: 'Artist Tracks',
            value: artistTracks.length,
            color: 'text-blue-400', bg: 'bg-blue-400/10',
          },
          {
            icon: Clock,    label: 'Pending Review',
            value: pending.length,
            color: pending.length > 0 ? 'text-yellow-400' : 'text-muted-foreground',
            bg:   pending.length > 0 ? 'bg-yellow-400/10' : 'bg-muted',
          },
          {
            icon: Play,     label: 'Total Plays',
            value: fmtCount(statsPlays),
            color: 'text-green-400', bg: 'bg-green-400/10',
          },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 4-Tab Nav ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { key: 'upload',    label: 'Upload Original', icon: '✦' },
          { key: 'pending',   label: 'Pending Submissions', count: pending.length },
          { key: 'originals', label: 'Philomni Originals' },
          { key: 'artists',   label: 'All Artist Tracks' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setAdminTab(tab.key)}
            className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              adminTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon && <span className="text-amber-400">{tab.icon}</span>}
            {tab.label}
            {tab.count > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB 1: UPLOAD PHILOMNI ORIGINAL ════════════════════════════════ */}
      {adminTab === 'upload' && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <StepDots step={wizardStep} />

          {/* ── Step 1: Audio file ── */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-foreground">Upload Audio File</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select an .mp3 or .wav file. Click Next to upload and continue.</p>
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-mono text-xs break-all">{uploadError}</span>
                </div>
              )}

              <label className={`flex flex-col items-center justify-center gap-2 px-4 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                audioUploaded ? 'border-green-500/50 bg-green-500/5'
                : audioFile   ? 'border-primary/50 bg-primary/5'
                : 'border-border hover:border-primary/40 bg-muted/40 hover:bg-muted/60'
              }`}>
                {audioUploaded ? (
                  <>
                    <CheckCircle2 className="w-9 h-9 text-green-500" />
                    <p className="text-sm font-bold text-green-500">Upload complete!</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px] text-center">{audioFile?.name}</p>
                    <p className="text-xs text-muted-foreground">{audioSize}{audioDuration ? ` · ${audioDuration}` : ''}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Click to pick a different file</p>
                  </>
                ) : audioFile ? (
                  <>
                    <span className="text-3xl">🎵</span>
                    <p className="text-sm font-bold text-foreground truncate max-w-[300px] text-center">{audioFile.name}</p>
                    <p className="text-xs text-muted-foreground">{audioSize}{audioDuration ? ` · ${audioDuration}` : ''}</p>
                    <p className="text-[10px] text-primary mt-1">Ready — click Next to upload and continue</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-9 h-9 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Click to select audio file</p>
                    <p className="text-xs text-muted-foreground/60">MP3 or WAV · up to 50 MB</p>
                  </>
                )}
                <input ref={audioInputRef} type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav,audio/mp3,audio/x-wav"
                  className="hidden" onChange={handleAudioChange} disabled={uploading} />
              </label>

              {(uploading || uploadProgress > 0) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={audioUploaded ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
                      {uploadStage || (audioUploaded ? 'Upload complete!' : 'Uploading…')}
                    </span>
                    <span className={`font-mono ${audioUploaded ? 'text-green-500' : 'text-muted-foreground'}`}>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${audioUploaded ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={handleUploadAudio} disabled={uploading || !audioFile}
                  className="px-5 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : audioUploaded
                    ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Re-upload</>
                    : <><Upload className="w-4 h-4" /> Upload Now</>
                  }
                </button>
                <button onClick={handleNext} disabled={!audioFile || uploading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : <>Next — Add Details <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Metadata ── */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Track Details</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Audio: <span className="text-green-500 font-medium">{audioFile?.name}</span>
                  </p>
                </div>
                <button onClick={() => setWizardStep(1)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {saveError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-mono text-xs break-all">{saveError}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Track Title <span className="text-destructive">*</span></label>
                  <input value={meta.title} onChange={e => { setM('title', e.target.value); setSaveError('') }}
                    placeholder="Track title"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
                  <input value={meta.artist} onChange={e => setM('artist', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Album (optional)</label>
                  <input value={meta.album} onChange={e => setM('album', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">ISRC Code</label>
                  <input value={meta.isrc_code} onChange={e => setM('isrc_code', e.target.value)}
                    placeholder="CB-XXX-26-00001"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Genre</label>
                  <select value={meta.genre} onChange={e => setM('genre', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select genre</option>
                    {GENRES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Mood</label>
                  <select value={meta.mood} onChange={e => setM('mood', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select mood</option>
                    {MOODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">BPM (optional)</label>
                  <input type="number" value={meta.bpm} onChange={e => setM('bpm', e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Copyright Year</label>
                  <input type="number" value={meta.copyright_year} onChange={e => setM('copyright_year', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Label</label>
                  <input value={meta.label} onChange={e => setM('label', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">License Type</label>
                <select value={meta.license_type} onChange={e => setM('license_type', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {LICENSE_TYPES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (comma separated)</label>
                <input value={meta.tags} onChange={e => setM('tags', e.target.value)}
                  placeholder="chill, study, late night…"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'socan_registered', label: 'SOCAN Registered'         },
                  { key: 'is_premium',       label: 'Premium (Pro/ProMax only)' },
                  { key: 'content_id_ready', label: 'YouTube Content ID Ready' },
                ].map(t => (
                  <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={meta[t.key]} onChange={e => setM(t.key, e.target.checked)} className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-foreground">{t.label}</span>
                  </label>
                ))}
              </div>

              {/* Cover art */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Cover Art <span className="text-muted-foreground/60 font-normal ml-1">(optional · .jpg or .png)</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  coverFile ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 bg-muted/40'
                }`}>
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      <p className="text-[10px] text-primary">Click to change</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload cover art</span>
                    </>
                  )}
                  <input ref={coverInputRef} type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden" onChange={handleCoverChange} />
                </label>
              </div>

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
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Publish to Library'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2: PENDING SUBMISSIONS ══════════════════════════════════════ */}
      {adminTab === 'pending' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : pending.length === 0 ? (
            <div className="text-center py-24">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500/40" />
              <p className="text-base font-semibold text-foreground mb-1">No pending submissions. All caught up! ✅</p>
              <p className="text-xs text-muted-foreground">Artist track submissions will appear here for review</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {pending.length} track{pending.length !== 1 ? 's' : ''} awaiting review
              </p>
              {pending.map(track => (
                <div key={track.id} className="bg-card border border-yellow-500/20 rounded-xl overflow-hidden">
                  <div className="flex items-start gap-4 p-4">
                    {/* Cover */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {track.cover_art_url
                        ? <img src={track.cover_art_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-muted-foreground/40" /></div>
                      }
                    </div>
                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{track.title}</p>
                      <p className="text-xs text-muted-foreground font-medium">{track.artist}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {track.genre && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{track.genre}</span>}
                        {track.mood  && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{track.mood}</span>}
                        {track.bpm   && <span className="text-[10px] text-muted-foreground/60 font-mono">{track.bpm} bpm</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Submitted {new Date(track.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Inline audio player */}
                  {track.audio_url && (
                    <div className="px-4 pb-3">
                      <audio controls src={track.audio_url} className="w-full h-9" />
                    </div>
                  )}

                  {/* Approve / Reject */}
                  <div className="flex border-t border-border">
                    <button onClick={() => approveTrack(track.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-semibold transition-all border-r border-border">
                      <ThumbsUp className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => rejectTrack(track)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-all">
                      <ThumbsDown className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3: PHILOMNI ORIGINALS ═══════════════════════════════════════ */}
      {adminTab === 'originals' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="text-amber-400">✦</span>
              Philomni Originals ({originals.length})
            </h2>
            <button onClick={() => setAdminTab('upload')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload New
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : originals.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground mb-2">No Philomni Originals yet</p>
              <button onClick={() => setAdminTab('upload')}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                Upload First Track →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {originals.map(track => (
                <AdminTrackRow key={track.id} track={track}
                  onEdit={setEditTrack} onToggle={toggleStatus} onDelete={deleteTrack} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 4: ALL ARTIST TRACKS ════════════════════════════════════════ */}
      {adminTab === 'artists' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              All Artist Tracks ({artistTracks.length})
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : artistTracks.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground mb-1">No approved artist tracks yet</p>
              <p className="text-xs text-muted-foreground">Approved submissions will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {artistTracks.map(track => (
                <AdminTrackRow key={track.id} track={track} showArtist
                  onEdit={setEditTrack} onToggle={toggleStatus} onDelete={deleteTrack} />
              ))}
            </div>
          )}
        </div>
      )}

      {editTrack && (
        <EditModal track={editTrack} onClose={() => setEditTrack(null)} onSaved={fetchTracks} />
      )}
    </div>
  )
}
