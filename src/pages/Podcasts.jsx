import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { Mic2, Play, Pause, Plus, Loader2, Upload, X, Bell, BellOff, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Podcasts() {
  const { user } = useAuth()
  const { mode } = useMode()
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(null)       // episode id
  const [currentEp, setCurrentEp] = useState(null)  // full episode object for player
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [audioFile, setAudioFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [subscribed, setSubscribed] = useState(new Set()) // set of creator_ids subscribed to
  const [dragging, setDragging] = useState(false)
  // Player state
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef(new Audio())
  const fileInputRef = useRef()

  useEffect(() => {
    supabase.from('podcasts').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setEpisodes(data ?? []); setLoading(false) })
    const audio = audioRef.current
    const onTime = () => setCurrentTime(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    const onEnded = () => { setPlaying(null); setCurrentTime(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
    }
  }, [])

  // Load subscriptions
  useEffect(() => {
    if (!user?.id) return
    supabase.from('podcast_subscriptions').select('creator_id').eq('subscriber_id', user.id)
      .then(({ data }) => { if (data) setSubscribed(new Set(data.map(s => s.creator_id))) })
  }, [user?.id])

  // Sync volume/mute
  useEffect(() => {
    const audio = audioRef.current
    audio.volume = muted ? 0 : Math.min(1, volume / 100)
  }, [volume, muted])

  const togglePlay = (ep) => {
    const audio = audioRef.current
    if (playing === ep.id) {
      audio.pause()
      setPlaying(null)
    } else {
      if (!ep.audio_url) return
      audio.src = ep.audio_url
      audio.play().catch(console.error)
      setPlaying(ep.id)
      setCurrentEp(ep)
      setCurrentTime(0)
    }
  }

  const handleSeek = (e) => {
    const t = Number(e.target.value)
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  const skip = (secs) => {
    const audio = audioRef.current
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + secs))
  }

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('audio/')) return
    setAudioFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const uploadAudio = async () => {
    if (!audioFile || !user?.id) return null
    setUploading(true)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => { if (prev >= 90) { clearInterval(interval); return prev } return prev + 12 })
    }, 300)
    const path = `podcasts/${user.id}/${Date.now()}-${audioFile.name}`
    const { data, error } = await supabase.storage.from('uploads').upload(path, audioFile)
    clearInterval(interval)
    setUploadProgress(100)
    if (error) { setUploading(false); return null }
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
    setUploading(false)
    return publicUrl
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !audioFile) return
    setPosting(true)
    const audioUrl = await uploadAudio()
    if (!audioUrl) { setPosting(false); return }
    const { data } = await supabase.from('podcasts').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      audio_url: audioUrl,
      creator_id: user.id,
      creator_name: user.full_name,
    }).select().single()
    if (data) {
      setEpisodes(prev => [data, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '' })
      setAudioFile(null)
      setUploadProgress(0)
    }
    setPosting(false)
  }

  const handleSubscribe = async (creatorId) => {
    if (!creatorId || creatorId === user?.id) return
    if (subscribed.has(creatorId)) {
      await supabase.from('podcast_subscriptions').delete()
        .eq('subscriber_id', user.id).eq('creator_id', creatorId)
      setSubscribed(prev => { const s = new Set(prev); s.delete(creatorId); return s })
    } else {
      await supabase.from('podcast_subscriptions').insert({ subscriber_id: user.id, creator_id: creatorId })
      setSubscribed(prev => new Set([...prev, creatorId]))
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Podcasts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {mode === 'pro'
              ? 'Business, industry, and professional development podcasts'
              : 'Discover and share episodes'}
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Upload Episode
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Upload Episode</h3>
            <button type="button" onClick={() => { setShowForm(false); setAudioFile(null); setUploadProgress(0) }}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>

          {/* Audio file drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragging ? 'border-primary bg-primary/5' : audioFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border hover:border-primary/50'
            }`}>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
              onChange={e => handleFileSelect(e.target.files[0])} />
            {audioFile ? (
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Mic2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{audioFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setAudioFile(null) }}
                  className="ml-auto p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Drop audio file here</p>
                <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, OGG · Max 200 MB</p>
              </>
            )}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Episode title" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Episode description (optional)" rows={2}
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={posting || uploading || !audioFile}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
              {(posting || uploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? 'Uploading…' : 'Publish Episode'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setAudioFile(null) }}
              className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      {/* Mode label + Categories */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10">
            {mode === 'pro' ? '💼 Professional Podcasts' : '🎨 Creator Podcasts'}
          </span>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          {(mode === 'pro'
            ? [
                { emoji: '💼', label: 'Business' },
                { emoji: '💻', label: 'Technology' },
                { emoji: '💰', label: 'Finance' },
                { emoji: '🏆', label: 'Leadership' },
                { emoji: '🚀', label: 'Entrepreneurship' },
                { emoji: '📊', label: 'Marketing' },
                { emoji: '🔒', label: 'Cybersecurity' },
                { emoji: '📈', label: 'Self Improvement' },
                { emoji: '📰', label: 'Industry News' },
              ]
            : [
                { emoji: '😂', label: 'Comedy' },
                { emoji: '🔍', label: 'True Crime' },
                { emoji: '⚽', label: 'Sports' },
                { emoji: '🎵', label: 'Music' },
                { emoji: '🎬', label: 'Pop Culture' },
                { emoji: '📱', label: 'Creator Stories' },
                { emoji: '💪', label: 'Motivation' },
              ]
          ).map(cat => (
            <button key={cat.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors">
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Featured shows row */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(mode === 'pro'
            ? [
                { emoji: '💼', title: 'The Tim Ferriss Show', desc: 'World-class performers & their tactics', tag: 'Business' },
                { emoji: '🚀', title: 'How I Built This', desc: 'Stories behind iconic companies', tag: 'Entrepreneurship' },
                { emoji: '💰', title: 'Planet Money', desc: 'Economic stories explained simply', tag: 'Finance' },
                { emoji: '🔒', title: 'Risky Business', desc: 'Security news and interviews', tag: 'Cybersecurity' },
              ]
            : [
                { emoji: '📱', title: 'Creator Lab', desc: 'Tactics from 7-figure creators', tag: 'Creator Economy' },
                { emoji: '🎵', title: 'Trap Lore Ross', desc: 'Hip-hop history deep dives', tag: 'Music' },
                { emoji: '😂', title: 'SmartLess', desc: 'Comedy with Hollywood stars', tag: 'Comedy' },
                { emoji: '💡', title: 'The Daily', desc: 'Top news stories explained', tag: 'News' },
              ]
          ).map(show => (
            <div key={show.title} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">{show.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{show.title}</p>
                <p className="text-xs text-muted-foreground truncate">{show.desc}</p>
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full mt-1 inline-block">{show.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <p className="text-xs text-muted-foreground font-medium">Community Episodes</p>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Episode list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mic2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No episodes yet</p>
          <p className="text-sm mt-1">Upload the first episode!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map(ep => (
            <div key={ep.id} className={`bg-card border rounded-2xl p-4 transition-all ${playing === ep.id ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
              <div className="flex items-start gap-4">
                {/* Play button */}
                <button
                  onClick={() => ep.audio_url && togglePlay(ep)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    ep.audio_url ? (playing === ep.id ? 'bg-primary text-primary-foreground' : 'bg-primary/15 hover:bg-primary/25 text-primary') : 'bg-muted text-muted-foreground cursor-default'
                  }`}
                >
                  {playing === ep.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{ep.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ep.creator_name}</p>
                  {ep.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ep.description}</p>}
                </div>

                {/* Subscribe */}
                {ep.creator_id && ep.creator_id !== user?.id && (
                  <button
                    onClick={() => handleSubscribe(ep.creator_id)}
                    title={subscribed.has(ep.creator_id) ? 'Unsubscribe' : 'Subscribe'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                      subscribed.has(ep.creator_id)
                        ? 'bg-primary/15 text-primary hover:bg-primary/25'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}>
                    {subscribed.has(ep.creator_id) ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    {subscribed.has(ep.creator_id) ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>

              {/* Playing indicator */}
              {playing === ep.id && (
                <div className="flex gap-0.5 items-end h-4 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${40 + i * 15}%`, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom mini player */}
      {currentEp && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border px-4 py-3">
          <div className="max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-muted-foreground w-8 text-right">{formatTime(currentTime)}</span>
              <input type="range" min={0} max={duration || 100} step={0.1} value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 accent-primary cursor-pointer" />
              <span className="text-[10px] text-muted-foreground w-8">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Episode info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{currentEp.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{currentEp.creator_name}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button onClick={() => skip(-10)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => togglePlay(currentEp)}
                  className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                  {playing === currentEp.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => skip(10)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => setMuted(v => !v)} className="p-1 text-muted-foreground hover:text-foreground">
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input type="range" min={0} max={100} value={muted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); setMuted(false) }}
                  className="w-16 h-1 accent-primary cursor-pointer" />
              </div>

              {/* Close */}
              <button onClick={() => { audioRef.current.pause(); setPlaying(null); setCurrentEp(null) }}
                className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
