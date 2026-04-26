import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Music, Play, Pause, Plus, Loader2, Mic, Upload } from 'lucide-react'

const SAMPLE_TRACKS = [
  { id: 's1', title: 'Lo-fi Chill Beats', genre: 'Lo-fi', duration: '3:24', audio_url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3' },
  { id: 's2', title: 'Upbeat Pop', genre: 'Pop', duration: '2:58', audio_url: 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3' },
  { id: 's3', title: 'Epic Cinematic', genre: 'Cinematic', duration: '4:12', audio_url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3' },
  { id: 's4', title: 'Hip Hop Groove', genre: 'Hip Hop', duration: '3:05', audio_url: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3' },
]

export default function AudioStudio() {
  const { user } = useAuth()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(null)
  const [tab, setTab] = useState('library')
  const audioRef = useRef(new Audio())
  const [form, setForm] = useState({ title: '', genre: '', audio_url: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    supabase.from('audio_tracks').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { setTracks(data ?? []); setLoading(false) })
    const audio = audioRef.current
    return () => { audio.pause() }
  }, [])

  const togglePlay = (id, url) => {
    const audio = audioRef.current
    if (playing === id) { audio.pause(); setPlaying(null); return }
    audio.src = url
    audio.play().catch(console.error)
    setPlaying(id)
  }

  const submit = async (e) => {
    e.preventDefault()
    setPosting(true)
    const { data } = await supabase.from('audio_tracks').insert({
      title: form.title.trim(),
      genre: form.genre.trim() || null,
      audio_url: form.audio_url.trim(),
      created_by: user.id,
    }).select().single()
    if (data) { setTracks(prev => [data, ...prev]); setForm({ title: '', genre: '', audio_url: '' }) }
    setPosting(false)
  }

  const allTracks = tab === 'samples' ? SAMPLE_TRACKS : tracks

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Audio Studio</h1>

      <div className="flex bg-muted rounded-xl p-1 mb-6">
        {['library', 'samples', 'upload'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            {t === 'library' ? 'My Library' : t === 'samples' ? 'Sample Tracks' : 'Upload'}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Track title" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
            placeholder="Genre (optional)"
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={form.audio_url} onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))}
            placeholder="Audio file URL" required
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button type="submit" disabled={posting}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {posting && <Loader2 className="w-4 h-4 animate-spin" />} Add Track
          </button>
        </form>
      ) : loading && tab === 'library' ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : allTracks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tracks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allTracks.map(track => (
            <div key={track.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <button onClick={() => togglePlay(track.id, track.audio_url)}
                className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary hover:bg-primary/25 flex-shrink-0">
                {playing === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{track.genre ?? 'Unknown'} {track.duration ? `· ${track.duration}` : ''}</p>
              </div>
              {playing === track.id && (
                <div className="flex gap-0.5 items-end h-5 flex-shrink-0">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
