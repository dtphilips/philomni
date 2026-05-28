import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Music, Play, Pause, Search, Eye, Download,
  Lock, Loader2, Star, Heart, Users,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMusic } from '../context/MusicContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  'All', 'Afrobeats', 'Afropop', 'Amapiano', 'Pop', 'Hip Hop', 'R&B',
  'Gospel', 'Soul', 'Electronic', 'Lo-Fi', 'Indie', 'Rock', 'Country',
  'Jazz', 'Classical', 'Ambient', 'Reggae', 'Dancehall', 'Latin',
  'Blues', 'Folk', 'World', 'Spoken Word', 'Other',
]

const fmtTime = (s) => {
  if (!s || !isFinite(s) || s < 0) return '–'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

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
          style={{ height: `${h * 100}%`, animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
      ))}
    </div>
  )
}

// ─── TrackRow ────────────────────────────────────────────────────────────────

function TrackRow({ track, onPlay, onUseInPost, plan, liked, onLike }) {
  const { currentTrack, isPlaying } = useMusic()
  const isActive     = currentTrack?.id === track.id
  const isNowPlaying = isActive && isPlaying
  const canDownload  = plan === 'pro' || plan === 'promax'
  const canUse       = track.available_for_use !== false

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
      isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-border/80 hover:bg-muted/20'
    }`}>
      {/* Cover */}
      <div className="relative flex-shrink-0">
        {track.cover_art_url
          ? <img src={track.cover_art_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
          : (
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary/70" />
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
              ✦ Philomni Original
            </span>
          )}
          {isNowPlaying && <PlayingBars />}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist || 'Philomni Originals'}</p>
        {track.isrc_code && (
          <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">{track.isrc_code}</p>
        )}
      </div>

      {/* Chips */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        {track.genre && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{track.genre}</span>
        )}
        {track.mood && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{track.mood}</span>
        )}
        {track.bpm && (
          <span className="text-[10px] text-muted-foreground/60 font-mono">{track.bpm} bpm</span>
        )}
      </div>

      {/* Duration + plays */}
      <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[60px]">
        <span className="text-xs text-muted-foreground font-mono">{fmtTime(track.duration_seconds)}</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <Eye className="w-2.5 h-2.5" /> {fmtCount(track.play_count)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Play */}
        <button
          onClick={() => onPlay(track)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isNowPlaying ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
          }`}
          title={isNowPlaying ? 'Pause' : 'Play'}
        >
          {isNowPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Like */}
        <button
          onClick={() => onLike(track.id)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            liked ? 'bg-rose-500/20 text-rose-400' : 'bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400'
          }`}
          title={liked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-400' : ''}`} />
        </button>

        {/* Use in Post */}
        {canUse ? (
          <button
            onClick={() => onUseInPost(track)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-all"
            title="Use in Post"
          >🎵</button>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground/30 cursor-not-allowed" title="Artist has disabled use">
            🚫
          </div>
        )}

        {/* Download */}
        {canDownload ? (
          <a href={track.audio_url} download={`${track.title}.mp3`} target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all" title="Download">
            <Download className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground/40 cursor-not-allowed" title="Upgrade to Pro to download">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MusicLibrary() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const { playTrack, useTrackForPost } = useMusic()
  const plan = user?.plan || 'free'

  const [allTracks, setAllTracks] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [genre, setGenre]         = useState('All')
  const [activeTab, setActiveTab] = useState('originals')
  const [likedIds, setLikedIds]   = useState(new Set())

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .eq('status', 'active')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setAllTracks(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Filter ────────────────────────────────────────────────────────────────
  const q = search.toLowerCase()
  const filterFn = (list) => list.filter(t => {
    const matchGenre  = genre === 'All' || t.genre === genre
    const matchSearch = !q || [t.title, t.artist, t.genre, t.mood, ...(t.tags || [])]
      .some(v => (v || '').toLowerCase().includes(q))
    return matchGenre && matchSearch
  })

  const originals    = allTracks.filter(t => t.is_philomni_original || t.track_type === 'philomni_original')
  const artistTracks = allTracks.filter(t => !t.is_philomni_original && t.track_type !== 'philomni_original')

  const displayList  = filterFn(activeTab === 'originals' ? originals : artistTracks)

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePlay      = (track) => playTrack(track, user?.id)
  const handleUseInPost = (track) => { useTrackForPost(track); navigate('/') }
  const handleLike      = (id) => setLikedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto pb-32">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          Philomni Sounds 🎵
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Original music and artist tracks — free to use in your Philomni content.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-5">
        <button
          onClick={() => setActiveTab('originals')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'originals' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="text-amber-400">✦</span>
          Philomni Originals
          {originals.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">{originals.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('artists')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'artists' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-400" />
          Artist Music
          {artistTracks.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">{artistTracks.length}</span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, artist, genre, mood or tag…"
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
      </div>

      {/* Genre filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              genre === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}>
            {g}
          </button>
        ))}
      </div>

      {/* Track list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Music className="w-12 h-12 text-muted-foreground/30 mb-4" />
          {allTracks.length === 0 ? (
            <>
              <p className="text-base font-semibold text-foreground mb-1">Philomni Originals coming soon</p>
              <p className="text-sm text-muted-foreground">Check back shortly for exclusive tracks</p>
              {user?.is_admin && (
                <Link to="/admin/music" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Upload First Track →
                </Link>
              )}
            </>
          ) : activeTab === 'artists' && artistTracks.length === 0 ? (
            <>
              <p className="text-sm font-semibold text-foreground mb-1">No artist tracks yet</p>
              <Link to="/audio-studio" className="mt-3 text-xs text-primary hover:underline">
                Share your music in Audio Studio →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No tracks match your search</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              onPlay={handlePlay}
              onUseInPost={handleUseInPost}
              plan={plan}
              liked={likedIds.has(track.id)}
              onLike={handleLike}
            />
          ))}
        </div>
      )}

      {/* Attribution */}
      {activeTab === 'originals' && originals.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          All Philomni Originals © {new Date().getFullYear()} Philomni Technologies Inc. · Licensed for use on Philomni only.
        </p>
      )}
    </div>
  )
}
