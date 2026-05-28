import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Music, Play, Pause, Plus, Loader2, Mic, Upload,
  ChevronRight, ChevronLeft, Check, X, Headphones,
  Heart, MoreVertical, Trash2, Star, Volume2
} from 'lucide-react'

// ─── Sample Indie Tracks ─────────────────────────────────────────────────────
const INDIE_TRACKS = [
  { id: 'i1', title: 'Midnight Drive',      artist: 'Luna Skye',        genre: 'Indie Pop',  url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3' },
  { id: 'i2', title: 'Summer Haze',         artist: 'The Coastal Sons', genre: 'Lo-fi',      url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3' },
  { id: 'i3', title: 'Neon Lights',         artist: 'Synth Riders',     genre: 'Synthwave',  url: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3' },
  { id: 'i4', title: 'Coffee Shop Morning', artist: 'Mara & Felix',     genre: 'Acoustic',   url: 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3' },
  { id: 'i5', title: 'City Rain',           artist: 'GreyWave',         genre: 'Ambient',    url: 'https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3' },
  { id: 'i6', title: 'Golden Hour',         artist: 'Elara Moon',       genre: 'Chill',      url: 'https://assets.mixkit.co/music/preview/mixkit-life-is-a-dream-837.mp3' },
  { id: 'i7', title: 'Retro Wave',          artist: 'Pixel Dusk',       genre: 'Retro',      url: 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3' },
  { id: 'i8', title: 'Peaceful Mind',       artist: 'Zhen & Willow',    genre: 'Meditation', url: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3' },
]

const GENRE_OPTIONS = [
  'Pop','Hip Hop','R&B','Electronic','Lo-fi','Indie','Rock','Country','Jazz','Classical','Ambient','Other'
]

const MOOD_OPTIONS = ['Energetic','Chill','Happy','Sad','Romantic','Dark','Inspiring']

const WIZARD_STEPS = ['Upload File','Track Details','Cover Art','Rights','Publish']

// ─── Animated Playing Bars ───────────────────────────────────────────────────
function PlayingBars() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[60,100,80,40].map((h, i) => (
        <div
          key={i}
          className="w-[3px] bg-primary rounded-full animate-pulse"
          style={{ height: `${h}%`, animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
      <Check className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AudioStudio() {
  const { user } = useAuth()
  const audioRef = useRef(null)

  const [activeTab, setActiveTab] = useState('library')
  const [playingId, setPlayingId] = useState(null)
  const [toast, setToast] = useState(null)

  // My Library
  const [tracks, setTracks] = useState([])
  const [loadingTracks, setLoadingTracks] = useState(true)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Upload Wizard
  const [step, setStep] = useState(0)
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  const [trackDetails, setTrackDetails] = useState({
    title: '', artist: '', genre: '', bpm: '', mood: []
  })
  const [rights, setRights] = useState({
    ownsRights: false, allowUse: false, agreeGuidelines: false
  })

  // ── Load library ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    fetchTracks()
  }, [user])

  async function fetchTracks() {
    setLoadingTracks(true)
    try {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false })
      if (error) console.error('[AudioStudio] music_tracks:', error.message)
      setTracks(data || [])
    } catch (e) {
      console.error('[AudioStudio] fetchTracks:', e.message)
      setTracks([])
    }
    setLoadingTracks(false)
  }

  // ── Audio playback ──────────────────────────────────────────────────────
  function handlePlay(id, url) {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = url
      audioRef.current.play().catch(() => {})
    }
    setPlayingId(id)
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const handleEnded = () => setPlayingId(null)
    el.addEventListener('ended', handleEnded)
    return () => el.removeEventListener('ended', handleEnded)
  }, [])

  // ── Delete track ────────────────────────────────────────────────────────
  async function deleteTrack(id) {
    await supabase.from('music_tracks').delete().eq('id', id)
    setTracks(t => t.filter(x => x.id !== id))
    setOpenMenuId(null)
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    }
  }

  // ── Audio file upload ───────────────────────────────────────────────────
  async function handleAudioFile(file) {
    if (!file) return
    setAudioFile(file)
    setUploading(true)
    setUploadProgress(0)

    let prog = 0
    const interval = setInterval(() => {
      prog += 10
      if (prog >= 90) clearInterval(interval)
      setUploadProgress(prog)
    }, 300)

    const path = `audio/${user.id}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, file, { upsert: true })

    clearInterval(interval)
    setUploadProgress(100)
    setUploading(false)

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      setAudioUrl(urlData.publicUrl)
    }
  }

  // ── Cover upload ────────────────────────────────────────────────────────
  async function handleCoverFile(file) {
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setUploadingCover(true)

    const path = `covers/${user.id}/${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, file, { upsert: true })

    setUploadingCover(false)
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      setCoverUrl(urlData.publicUrl)
    }
  }

  // ── Publish ─────────────────────────────────────────────────────────────
  async function handlePublish(isDraft = false) {
    setPublishing(true)
    await supabase.from('music_tracks').insert({
      title: trackDetails.title,
      genre: trackDetails.genre,
      audio_url: audioUrl,
      cover_url: coverUrl || null,
      bpm: trackDetails.bpm ? parseInt(trackDetails.bpm) : null,
      mood: trackDetails.mood,
      uploaded_by: user.id,
      is_public: !isDraft,
      plays: 0,
    })
    setPublishing(false)
    setPublished(true)
    setTimeout(() => {
      resetWizard()
      setActiveTab('library')
      fetchTracks()
    }, 2000)
  }

  function resetWizard() {
    setStep(0)
    setAudioFile(null)
    setAudioUrl(null)
    setUploadProgress(0)
    setCoverFile(null)
    setCoverPreview(null)
    setCoverUrl(null)
    setTrackDetails({ title: '', artist: '', genre: '', bpm: '', mood: [] })
    setRights({ ownsRights: false, allowUse: false, agreeGuidelines: false })
    setPublished(false)
  }

  // ── Step validation ─────────────────────────────────────────────────────
  function canAdvance() {
    if (step === 0) return !!audioUrl
    if (step === 1) return !!trackDetails.title && !!trackDetails.genre
    if (step === 3) return rights.ownsRights && rights.allowUse && rights.agreeGuidelines
    return true
  }

  function switchTab(key) {
    setActiveTab(key)
    if (key !== 'upload') resetWizard()
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <audio ref={audioRef} className="hidden" />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audio Studio</h1>
          <p className="text-sm text-muted-foreground">Create, manage, and share your music</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        {[
          { key: 'library', label: 'My Library' },
          { key: 'indie',   label: 'Indie Tracks' },
          { key: 'upload',  label: 'Upload Track' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MY LIBRARY TAB ──────────────────────────────────────────────── */}
      {activeTab === 'library' && (
        <div>
          {loadingTracks ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Music className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-lg">No tracks yet</p>
                <p className="text-muted-foreground text-sm mt-1">Upload your first track to get started</p>
              </div>
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Upload Track
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map(track => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:bg-muted/50 transition-colors group"
                >
                  <button
                    onClick={() => handlePlay(track.id, track.audio_url)}
                    className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors flex-shrink-0"
                  >
                    {playingId === track.id ? <PlayingBars /> : <Play className="w-4 h-4 text-primary ml-0.5" />}
                  </button>

                  {track.cover_url ? (
                    <img src={track.cover_url} alt={track.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground">{track.artist || 'Unknown artist'}</p>
                  </div>

                  {track.genre && (
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium hidden sm:inline-flex">
                      {track.genre}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground hidden md:block w-10 text-right">
                    {track.duration || '—'}
                  </span>

                  <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                    <Volume2 className="w-3 h-3" />
                    {track.plays ?? 0}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === track.id ? null : track.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === track.id && (
                      <div className="absolute right-0 top-10 z-20 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[140px]">
                        <button
                          onClick={() => deleteTrack(track.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INDIE TRACKS TAB ────────────────────────────────────────────── */}
      {activeTab === 'indie' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            Discover and use royalty-free indie tracks in your projects.
          </p>
          {INDIE_TRACKS.map(track => (
            <div
              key={track.id}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:bg-muted/50 transition-colors"
            >
              <button
                onClick={() => handlePlay(track.id, track.url)}
                className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors flex-shrink-0"
              >
                {playingId === track.id ? <PlayingBars /> : <Play className="w-4 h-4 text-primary ml-0.5" />}
              </button>

              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground">{track.artist}</p>
              </div>

              <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs hidden sm:inline-flex">
                {track.genre}
              </span>

              <button
                onClick={() => setToast(`"${track.title}" added to your project ✓`)}
                className="px-3 py-1.5 text-xs font-medium bg-primary/15 text-primary rounded-lg hover:bg-primary/25 transition-colors flex-shrink-0"
              >
                Use in Project
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── UPLOAD TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto">

          {published ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xl font-bold">Track Published!</p>
              <p className="text-muted-foreground text-sm">Switching to your library…</p>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {WIZARD_STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                      i < step
                        ? 'bg-primary text-primary-foreground'
                        : i === step
                        ? 'bg-primary/20 text-primary border border-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 rounded-full ${i < step ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-sm font-medium text-muted-foreground mb-6">{WIZARD_STEPS[step]}</p>

              {/* Step 0: Upload File */}
              {step === 0 && (
                <div className="space-y-4">
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith('audio/')) handleAudioFile(file)
                    }}
                    onClick={() => document.getElementById('audio-input').click()}
                    className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Drag &amp; drop your audio file</p>
                      <p className="text-sm text-muted-foreground mt-1">MP3, WAV, M4A, OGG supported</p>
                    </div>
                    <span className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium">
                      Browse Files
                    </span>
                  </div>
                  <input
                    id="audio-input"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={e => handleAudioFile(e.target.files[0])}
                  />

                  {audioFile && (
                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{audioFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        {!uploading && uploadProgress === 100 && (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>

                      {(uploading || uploadProgress > 0) && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{uploading ? 'Uploading…' : 'Complete'}</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {audioUrl && !uploading && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preview</p>
                          <audio src={audioUrl} controls className="w-full" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Track Details */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={trackDetails.title}
                      onChange={e => setTrackDetails(d => ({ ...d, title: e.target.value }))}
                      placeholder="Enter track title"
                      className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Artist Name</label>
                    <input
                      type="text"
                      value={trackDetails.artist}
                      onChange={e => setTrackDetails(d => ({ ...d, artist: e.target.value }))}
                      placeholder="Your artist or project name"
                      className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Genre <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={trackDetails.genre}
                        onChange={e => setTrackDetails(d => ({ ...d, genre: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Select genre</option>
                        {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">BPM</label>
                      <input
                        type="number"
                        value={trackDetails.bpm}
                        onChange={e => setTrackDetails(d => ({ ...d, bpm: e.target.value }))}
                        placeholder="e.g. 120"
                        min="40"
                        max="300"
                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mood</label>
                    <div className="flex flex-wrap gap-2">
                      {MOOD_OPTIONS.map(mood => {
                        const active = trackDetails.mood.includes(mood)
                        return (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => setTrackDetails(d => ({
                              ...d,
                              mood: active ? d.mood.filter(m => m !== mood) : [...d.mood, mood]
                            }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {mood}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Cover Art */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Add cover art to make your track stand out (optional).</p>
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith('image/')) handleCoverFile(file)
                    }}
                    onClick={() => document.getElementById('cover-input').click()}
                    className="relative mx-auto border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors overflow-hidden"
                    style={{ width: 240, height: 240 }}
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center px-4">
                          Drop image here or click to upload
                        </p>
                      </div>
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <input
                    id="cover-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleCoverFile(e.target.files[0])}
                  />
                  {coverPreview && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => { setCoverFile(null); setCoverPreview(null); setCoverUrl(null) }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remove cover
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Rights */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Please confirm the following before publishing your track.
                  </p>
                  {[
                    { key: 'ownsRights',     label: 'I own all rights to this track and have permission to distribute it.' },
                    { key: 'allowUse',       label: 'Allow others to use this track in their projects (free & commercial).' },
                    { key: 'agreeGuidelines', label: 'I agree to the content guidelines and community standards.' },
                  ].map(item => (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        rights[item.key] ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-colors ${
                        rights[item.key] ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {rights[item.key] && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={rights[item.key]}
                        onChange={e => setRights(r => ({ ...r, [item.key]: e.target.checked }))}
                        className="hidden"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                  {!(rights.ownsRights && rights.allowUse && rights.agreeGuidelines) && (
                    <p className="text-xs text-muted-foreground">All three must be checked to continue.</p>
                  )}
                </div>
              )}

              {/* Step 4: Publish */}
              {step === 4 && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">Review your track before publishing.</p>

                  <div className="bg-card border border-border rounded-2xl p-5 flex gap-5">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">{trackDetails.title}</p>
                      {trackDetails.artist && <p className="text-sm text-muted-foreground">{trackDetails.artist}</p>}
                      <div className="flex flex-wrap gap-2">
                        {trackDetails.genre && (
                          <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs">{trackDetails.genre}</span>
                        )}
                        {trackDetails.bpm && (
                          <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs">{trackDetails.bpm} BPM</span>
                        )}
                        {trackDetails.mood.map(m => (
                          <span key={m} className="px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePublish(false)}
                      disabled={publishing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                      Publish to Library
                    </button>
                    <button
                      onClick={() => handlePublish(true)}
                      disabled={publishing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors disabled:opacity-60"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <button
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                {step < WIZARD_STEPS.length - 1 && (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canAdvance() || uploading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Outside click closes menus */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  )
}
