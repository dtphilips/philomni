import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMusic } from '../context/MusicContext'
import {
  Music, Play, Pause, Loader2, Upload, Search, Eye,
  Headphones, MoreVertical, Trash2, CheckCircle2,
  AlertCircle, Download, Lock, Star, Users,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  'All', 'Afrobeats', 'Afropop', 'Amapiano', 'Pop', 'Hip Hop', 'R&B',
  'Gospel', 'Soul', 'Electronic', 'Lo-Fi', 'Indie', 'Rock', 'Country',
  'Jazz', 'Classical', 'Ambient', 'Reggae', 'Dancehall', 'Latin',
  'Blues', 'Folk', 'World', 'Spoken Word', 'Other',
]

const UPLOAD_GENRES = GENRES.filter(g => g !== 'All')

const MOODS = ['Energetic', 'Chill', 'Romantic', 'Melancholic', 'Motivational', 'Dark', 'Happy', 'Spiritual', 'Neutral']

const fmtCount = (n) => {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// ─── PlayingBars ─────────────────────────────────────────────────────────────

function PlayingBars() {
  return (
    <div className="flex gap-[2px] items-end h-3.5 flex-shrink-0">
      {[0.5, 1, 0.7, 0.9].map((h, i) => (
        <div key={i} className="w-0.5 bg-primary rounded-full"
          style={{ height: `${h * 100}%`, animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate` }}
        />
      ))}
    </div>
  )
}

// ─── TrackRow — shared by both tabs ──────────────────────────────────────────

function TrackRow({ track, onPlay, onUseInPost, plan, onDelete, ownTrack = false }) {
  const { currentTrack, isPlaying } = useMusic()
  const isActive     = currentTrack?.id === track.id
  const isNowPlaying = isActive && isPlaying
  const canDownload  = plan === 'pro' || plan === 'promax'
  const canUse       = track.available_for_use !== false
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
      isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:bg-muted/20'
    }`}>
      {/* Cover */}
      <div className="relative flex-shrink-0">
        {track.cover_art_url
          ? <img src={track.cover_art_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
          : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary/70" />
            </div>
          )
        }
        {track.is_premium && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-bold text-foreground truncate">{track.title}</p>
          {track.is_philomni_original && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap flex-shrink-0">
              ✦ Original
            </span>
          )}
          {ownTrack && track.status === 'pending_review' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold">Pending Review</span>
          )}
          {ownTrack && track.status === 'active' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">Live</span>
          )}
          {isNowPlaying && <PlayingBars />}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist || 'Unknown artist'}</p>
      </div>

      {/* Chips */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        {track.genre && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{track.genre}</span>
        )}
        {track.mood && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{track.mood}</span>
        )}
      </div>

      {/* Play count */}
      <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground/60 flex-shrink-0">
        <Eye className="w-3 h-3" /> {fmtCount(track.play_count)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onPlay(track)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isNowPlaying ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
          }`}
          title={isNowPlaying ? 'Pause' : 'Play'}
        >
          {isNowPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {onUseInPost && canUse && (
          <button
            onClick={() => onUseInPost(track)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-all"
            title="Use in Post"
          >🎵</button>
        )}

        {canDownload ? (
          <a href={track.audio_url} download={`${track.title}.mp3`} target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all" title="Download">
            <Download className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground/40 cursor-not-allowed" title="Pro required to download">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}

        {ownTrack && onDelete && (
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-all">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[140px]">
                <button
                  onClick={() => { onDelete(track.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AudioStudio() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { playTrack, useTrackForPost } = useMusic()
  const plan = user?.plan || 'free'
  const canUpload = plan === 'creator' || plan === 'pro' || plan === 'promax' || user?.is_admin

  const audioRef     = useRef(null)
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('library')

  // ── Library tab state ─────────────────────────────────────────────────────
  const [libTracks, setLibTracks]   = useState([])
  const [libLoading, setLibLoading] = useState(true)
  const [libSearch, setLibSearch]   = useState('')
  const [libGenre, setLibGenre]     = useState('All')

  // ── My Music tab state ────────────────────────────────────────────────────
  const [myTracks, setMyTracks]     = useState([])
  const [myLoading, setMyLoading]   = useState(true)

  // ── Upload form state ─────────────────────────────────────────────────────
  const [showUpload, setShowUpload]   = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [audioFile, setAudioFile]     = useState(null)
  const [audioUploaded, setAudioUploaded] = useState(false)
  const [audioUploadedUrl, setAudioUploadedUrl] = useState('')
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')

  const [form, setForm] = useState({
    title: '', artist: '', genre: '', mood: '', bpm: '',
    available_for_use: true,
  })
  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // ── Fetch library ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLibLoading(true)
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('status', 'active')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      if (!cancelled) { setLibTracks(data || []) ; setLibLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Fetch my tracks ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setMyLoading(true)
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('uploaded_by', user.id)
        .eq('track_type', 'artist_track')
        .order('created_at', { ascending: false })
      if (!cancelled) { setMyTracks(data || []); setMyLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  // ── Delete own track ──────────────────────────────────────────────────────
  async function deleteMyTrack(id) {
    if (!window.confirm('Delete this track? This cannot be undone.')) return
    await supabase.from('music_tracks').delete().eq('id', id).eq('uploaded_by', user.id)
    setMyTracks(t => t.filter(x => x.id !== id))
  }

  // ── Upload audio file ─────────────────────────────────────────────────────
  const handleAudioChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioFile(file)
    setAudioUploaded(false)
    setAudioUploadedUrl('')
    setUploadProgress(0)
    setUploadError('')
  }

  const handleUpload = async () => {
    if (!audioFile) { setUploadError('Select an audio file first.'); return }
    setUploading(true)
    setUploadError('')
    setUploadProgress(15)
    setUploadStage('Uploading…')

    try {
      const sanitize = (name) => name
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_').toLowerCase()

      const fileName  = Date.now() + '_' + sanitize(audioFile.name)
      const audioPath = 'artist/' + user.id + '/' + fileName

      const { data: storageData, error: storageError } = await supabase.storage
        .from('philomni-music')
        .upload(audioPath, audioFile, {
          contentType: audioFile.type || 'audio/mpeg',
          cacheControl: '3600',
          upsert: true,
        })

      if (storageError) {
        console.error('STORAGE ERROR:', storageError)
        throw new Error(storageError.message)
      }

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
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setSaveError('Title is required'); return }
    if (!form.genre)        { setSaveError('Genre is required'); return }

    let url = audioUploadedUrl
    if (!audioUploaded || !url) {
      url = await handleUpload()
      if (!url) return
    }

    setSaving(true)
    setSaveError('')
    try {
      const { error } = await supabase.from('music_tracks').insert({
        title:             form.title.trim(),
        artist:            form.artist.trim() || user?.full_name || 'Unknown Artist',
        genre:             form.genre,
        mood:              form.mood || null,
        bpm:               form.bpm ? parseInt(form.bpm) : null,
        audio_url:         url,
        uploaded_by:       user.id,
        track_type:        'artist_track',
        is_philomni_original: false,
        is_public:         true,
        available_for_use: form.available_for_use,
        status:            'pending_review',   // requires admin approval
        play_count:        0,
      })

      if (error) {
        console.error('DB INSERT ERROR:', JSON.stringify(error))
        throw new Error(error.message + (error.details ? ' | ' + error.details : ''))
      }

      // Reload my tracks
      const { data } = await supabase
        .from('music_tracks').select('*')
        .eq('uploaded_by', user.id).eq('track_type', 'artist_track')
        .order('created_at', { ascending: false })
      setMyTracks(data || [])

      // Reset form
      setShowUpload(false)
      setAudioFile(null)
      setAudioUploaded(false)
      setAudioUploadedUrl('')
      setUploadProgress(0)
      setUploadStage('')
      setForm({ title: '', artist: '', genre: '', mood: '', bpm: '', available_for_use: true })
      if (fileInputRef.current) fileInputRef.current.value = ''

    } catch (err) {
      setSaveError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Library filtering ─────────────────────────────────────────────────────
  const q = libSearch.toLowerCase()
  const filteredLib = libTracks.filter(t => {
    const matchGenre  = libGenre === 'All' || t.genre === libGenre
    const matchSearch = !q || [t.title, t.artist, t.genre, t.mood, ...(t.tags || [])]
      .some(v => (v || '').toLowerCase().includes(q))
    return matchGenre && matchSearch
  })

  const originalsCount    = filteredLib.filter(t => t.is_philomni_original || t.track_type === 'philomni_original').length
  const artistTracksCount = filteredLib.filter(t => !t.is_philomni_original && t.track_type !== 'philomni_original').length

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePlay      = (track) => playTrack(track, user?.id)
  const handleUseInPost = (track) => { useTrackForPost(track); navigate('/') }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-32">
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audio Studio</h1>
          <p className="text-sm text-muted-foreground">Browse tracks, manage your music, upload originals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        {[
          { key: 'library',  label: 'Music Library' },
          { key: 'my-music', label: 'My Music'       },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ MUSIC LIBRARY TAB ════════════════════════════════════════════════ */}
      {activeTab === 'library' && (
        <div>
          {/* Search + genre filter */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input value={libSearch} onChange={e => setLibSearch(e.target.value)}
              placeholder="Search title, artist, genre, mood…"
              className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
            {GENRES.map(g => (
              <button key={g} onClick={() => setLibGenre(g)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  libGenre === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                {g}
              </button>
            ))}
          </div>

          {libLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filteredLib.length === 0 ? (
            <p className="text-center py-16 text-sm text-muted-foreground">No tracks match your search</p>
          ) : (
            <div className="space-y-8">
              {/* Philomni Originals */}
              {originalsCount > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-amber-400">✦</span>
                    <h2 className="text-sm font-bold text-amber-400">Philomni Originals</h2>
                    <span className="text-xs text-muted-foreground ml-auto">{originalsCount} track{originalsCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {filteredLib
                      .filter(t => t.is_philomni_original || t.track_type === 'philomni_original')
                      .map(track => (
                        <TrackRow key={track.id} track={track} onPlay={handlePlay} onUseInPost={handleUseInPost} plan={plan} />
                      ))}
                  </div>
                </section>
              )}
              {/* Artist Music */}
              {artistTracksCount > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-bold text-foreground">Artist Music</h2>
                    <span className="text-xs text-muted-foreground ml-auto">{artistTracksCount} track{artistTracksCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {filteredLib
                      .filter(t => !t.is_philomni_original && t.track_type !== 'philomni_original')
                      .map(track => (
                        <TrackRow key={track.id} track={track} onPlay={handlePlay} onUseInPost={handleUseInPost} plan={plan} />
                      ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ MY MUSIC TAB ═════════════════════════════════════════════════════ */}
      {activeTab === 'my-music' && (
        <div>
          {/* Upload button / gating */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Your Artist Tracks</p>
              <p className="text-xs text-muted-foreground">Tracks you've shared with the Philomni community</p>
            </div>
            {canUpload ? (
              <button onClick={() => setShowUpload(o => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Upload className="w-4 h-4" />
                {showUpload ? 'Cancel' : 'Upload Track'}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5" />
                Creator or Pro plan required
              </div>
            )}
          </div>

          {/* ── Upload form ────────────────────────────────────────────────── */}
          {showUpload && (
            <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Upload a Track</h3>

              {/* Audio file picker */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Audio File <span className="text-destructive">*</span>
                  <span className="text-muted-foreground/60 font-normal ml-1">(.mp3 or .wav)</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  audioUploaded ? 'border-green-500/50 bg-green-500/5' : audioFile ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 bg-muted/40'
                }`}>
                  {audioUploaded ? (
                    <>
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                      <p className="text-sm font-semibold text-green-500">Uploaded!</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[260px] text-center">{audioFile?.name}</p>
                    </>
                  ) : audioFile ? (
                    <>
                      <span className="text-2xl">🎵</span>
                      <p className="text-sm font-semibold text-foreground truncate max-w-[260px] text-center">{audioFile.name}</p>
                      <p className="text-[10px] text-primary">Click Upload & Save to upload</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to select audio file</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav"
                    className="hidden" onChange={handleAudioChange} disabled={uploading} />
                </label>

                {/* Progress bar */}
                {(uploading || uploadProgress > 0) && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={audioUploaded ? 'text-green-500' : 'text-muted-foreground'}>{uploadStage}</span>
                      <span className={`font-mono ${audioUploaded ? 'text-green-500' : 'text-muted-foreground'}`}>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${audioUploaded ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{uploadError}
                  </p>
                )}
              </div>

              {/* Form fields */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Track Title <span className="text-destructive">*</span></label>
                  <input value={form.title} onChange={e => setF('title', e.target.value)}
                    placeholder="My Track Name"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Artist Name</label>
                  <input value={form.artist} onChange={e => setF('artist', e.target.value)}
                    placeholder={user?.full_name || 'Your name'}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Genre <span className="text-destructive">*</span></label>
                  <select value={form.genre} onChange={e => setF('genre', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select genre</option>
                    {UPLOAD_GENRES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Mood</label>
                  <select value={form.mood} onChange={e => setF('mood', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select mood</option>
                    {MOODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">BPM (optional)</label>
                  <input type="number" value={form.bpm} onChange={e => setF('bpm', e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {/* Available for use toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setF('available_for_use', !form.available_for_use)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${form.available_for_use ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.available_for_use ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Allow others to use this track</p>
                  <p className="text-xs text-muted-foreground">Other creators can add your track to their posts and reels</p>
                </div>
              </label>

              {/* Info note */}
              <p className="text-xs text-muted-foreground/70 bg-muted/50 rounded-lg px-3 py-2">
                🔍 Your track will be reviewed before appearing in the public Music Library.
              </p>

              {saveError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{saveError}
                </p>
              )}

              {/* Save button */}
              <button onClick={handleSave} disabled={saving || uploading || !audioFile}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                {saving || uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? 'Uploading…' : 'Saving…'}</>
                  : <><CheckCircle2 className="w-4 h-4" /> Submit Track for Review</>
                }
              </button>
            </div>
          )}

          {/* ── My tracks list ────────────────────────────────────────────── */}
          {myLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : myTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Music className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">No tracks yet</p>
              {canUpload
                ? <p className="text-xs text-muted-foreground">Upload your first track above</p>
                : <p className="text-xs text-muted-foreground">Upgrade to Creator or Pro to share your music</p>
              }
            </div>
          ) : (
            <div className="space-y-2">
              {myTracks.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onPlay={handlePlay}
                  onUseInPost={handleUseInPost}
                  onDelete={deleteMyTrack}
                  plan={plan}
                  ownTrack
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
