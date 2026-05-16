import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Music, Play, Pause, Heart, Search, Volume2, VolumeX, SkipBack, SkipForward, Library, Mic2, Headphones } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── helpers ────────────────────────────────────────────────────────────────
const MX = (slug) => `https://assets.mixkit.co/sfx/preview/${slug}.mp3`
const SJ = (path) => `https://www.soundjay.com/${path}`
const fmtPlays = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── data ────────────────────────────────────────────────────────────────────
const INDIE_TRACKS = [
  { id: 'i1',  title: 'Midnight Drive',      artist: 'Luna Wave',      genre: 'Indie Pop',  duration: '3:24', plays: 1240, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',   color: 'from-violet-500 to-purple-600' },
  { id: 'i2',  title: 'Summer Haze',         artist: 'The Wanderers',  genre: 'Lo-fi',      duration: '2:58', plays: 890,  audio_url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',         color: 'from-amber-400 to-orange-500' },
  { id: 'i3',  title: 'Neon Lights',         artist: 'Cyber Dreams',   genre: 'Synthwave',  duration: '4:05', plays: 2100, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',          color: 'from-cyan-400 to-blue-500' },
  { id: 'i4',  title: 'Coffee Shop Morning', artist: 'Acoustic Soul',  genre: 'Acoustic',   duration: '3:12', plays: 670,  audio_url: 'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3', color: 'from-emerald-400 to-green-600' },
  { id: 'i5',  title: 'City Rain',           artist: 'Urban Melody',   genre: 'Ambient',    duration: '5:30', plays: 1560, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3',      color: 'from-slate-400 to-blue-600' },
  { id: 'i6',  title: 'Golden Hour',         artist: 'Sunshine Band',  genre: 'Chill',      duration: '3:45', plays: 3200, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-life-is-a-dream-837.mp3',      color: 'from-yellow-400 to-orange-400' },
  { id: 'i7',  title: 'Retro Wave',          artist: 'Electric Youth', genre: 'Retro',      duration: '3:55', plays: 1890, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3',      color: 'from-pink-400 to-rose-600' },
  { id: 'i8',  title: 'Peaceful Mind',       artist: 'Zen Garden',     genre: 'Meditation', duration: '6:00', plays: 4100, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',           color: 'from-teal-400 to-cyan-600' },
  { id: 'i9',  title: 'Street Code',         artist: 'MC Flow',        genre: 'Hip Hop',    duration: '2:48', plays: 5600, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',           color: 'from-red-400 to-orange-600' },
  { id: 'i10', title: 'Jazz Nights',         artist: 'Blue Note Trio', genre: 'Jazz',       duration: '4:20', plays: 920,  audio_url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',         color: 'from-indigo-400 to-purple-600' },
  { id: 'i11', title: 'Electric Storm',      artist: 'Thunder Keys',   genre: 'Electronic', duration: '3:38', plays: 2800, audio_url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',    color: 'from-blue-400 to-violet-600' },
  { id: 'i12', title: 'Hometown Blues',      artist: 'Folk Story',     genre: 'Folk',       duration: '4:10', plays: 740,  audio_url: 'https://assets.mixkit.co/music/preview/mixkit-life-is-a-dream-837.mp3',      color: 'from-stone-400 to-amber-600' },
]

const SOUNDS = [
  { id: 's1',  category: 'UI Sounds',  name: 'Button Click',      icon: '🖱️', audio_url: MX('mixkit-interface-click-1126') },
  { id: 's2',  category: 'UI Sounds',  name: 'Success Chime',     icon: '✅', audio_url: MX('mixkit-correct-answer-tone-2870') },
  { id: 's3',  category: 'UI Sounds',  name: 'Error Buzz',        icon: '❌', audio_url: MX('mixkit-wrong-answer-fail-notification-946') },
  { id: 's4',  category: 'UI Sounds',  name: 'Notification Ding', icon: '🔔', audio_url: MX('mixkit-software-interface-start-2574') },
  { id: 's5',  category: 'UI Sounds',  name: 'Pop',               icon: '💥', audio_url: MX('mixkit-bubble-pop-up-alert-notification-2357') },
  { id: 's6',  category: 'Nature',     name: 'Ocean Waves',       icon: '🌊', audio_url: MX('mixkit-ocean-waves-loop-1196') },
  { id: 's7',  category: 'Nature',     name: 'Rain Shower',       icon: '🌧️', audio_url: MX('mixkit-light-rain-loop-2393') },
  { id: 's8',  category: 'Nature',     name: 'Thunder Crack',     icon: '⛈️', audio_url: MX('mixkit-thunder-and-rain-2403') },
  { id: 's9',  category: 'Nature',     name: 'Forest Birds',      icon: '🐦', audio_url: MX('mixkit-morning-forest-birds-2472') },
  { id: 's10', category: 'Nature',     name: 'Campfire',          icon: '🔥', audio_url: MX('mixkit-campfire-crackles-1330') },
  { id: 's11', category: 'Electronic', name: 'Laser Zap',         icon: '⚡', audio_url: MX('mixkit-sci-fi-laser-short-pulse-854') },
  { id: 's12', category: 'Electronic', name: 'Synth Sweep',       icon: '🎛️', audio_url: MX('mixkit-synth-pop-hit-2300') },
  { id: 's13', category: 'Electronic', name: 'Power Up',          icon: '🚀', audio_url: MX('mixkit-game-bonus-reached-2065') },
  { id: 's14', category: 'Electronic', name: 'Glitch',            icon: '📡', audio_url: MX('mixkit-fast-glitch-effect-2369') },
  { id: 's15', category: 'Electronic', name: 'Alarm',             icon: '🚨', audio_url: MX('mixkit-classic-short-alarm-993') },
  { id: 's16', category: 'Foley',      name: 'Door Knock',        icon: '🚪', audio_url: SJ('door/sounds/door-knock-1.mp3') },
  { id: 's17', category: 'Foley',      name: 'Keyboard Typing',   icon: '⌨️', audio_url: MX('mixkit-typewriter-soft-note-1125') },
  { id: 's18', category: 'Foley',      name: 'Camera Shutter',    icon: '📷', audio_url: MX('mixkit-camera-shutter-click-1133') },
  { id: 's19', category: 'Foley',      name: 'Footsteps',         icon: '👟', audio_url: MX('mixkit-footsteps-in-grass-2476') },
  { id: 's20', category: 'Foley',      name: 'Paper Rustle',      icon: '📄', audio_url: SJ('paper/sounds/paper-1.mp3') },
  { id: 's21', category: 'Music',      name: 'Drum Hit',          icon: '🥁', audio_url: MX('mixkit-drum-snare-2140') },
  { id: 's22', category: 'Music',      name: 'Guitar Strum',      icon: '🎸', audio_url: MX('mixkit-acoustic-guitar-strum-2367') },
  { id: 's23', category: 'Music',      name: 'Piano Chord',       icon: '🎹', audio_url: MX('mixkit-piano-chord-2369') },
  { id: 's24', category: 'Music',      name: 'Trumpet Fanfare',   icon: '🎺', audio_url: MX('mixkit-trumpet-fanfare-2335') },
  { id: 's25', category: 'Music',      name: 'Crowd Applause',    icon: '👏', audio_url: MX('mixkit-crowd-applause-2211') },
]

const SFX_CATEGORIES = ['All', ...new Set(SOUNDS.map((s) => s.category))]
const CAT_COLORS = {
  'UI Sounds': 'text-blue-400',
  Nature:      'text-emerald-400',
  Electronic:  'text-purple-400',
  Foley:       'text-amber-400',
  Music:       'text-pink-400',
}

const TABS = [
  { id: 'all',      label: 'All Music',           icon: Library },
  { id: 'indie',    label: 'Independent Artists', icon: Mic2 },
  { id: 'sfx',      label: 'Sound Effects',       icon: Headphones },
  { id: 'favorites',label: 'Favorites',           icon: Heart },
]

// ─── sub-components ──────────────────────────────────────────────────────────
function GenreBadge({ genre }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70">
      {genre}
    </span>
  )
}

function CoverArt({ track, size = 'md' }) {
  const dim = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'
  if (track.cover_url) {
    return <img src={track.cover_url} alt={track.title} className={`${dim} rounded-lg object-cover flex-shrink-0`} />
  }
  const gradient = track.color || 'from-violet-500 to-purple-600'
  return (
    <div className={`${dim} rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
      <Music className="w-4 h-4 text-white/80" />
    </div>
  )
}

function PlayingBars() {
  return (
    <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-primary rounded-full animate-pulse"
          style={{ height: `${50 + i * 15}%`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function MusicLibrary() {
  const [activeTab, setActiveTab]       = useState('all')
  const [search, setSearch]             = useState('')
  const [favorites, setFavorites]       = useState(new Set())
  const [dbTracks, setDbTracks]         = useState([])
  const [dbLoading, setDbLoading]       = useState(true)

  // player state
  const audioRef                         = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null) // { id, title, artist, audio_url, color, cover_url }
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [volume, setVolume]             = useState(80)
  const [muted, setMuted]               = useState(false)

  // sfx filter
  const [sfxCategory, setSfxCategory]   = useState('All')

  // ── fetch DB tracks ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data, error } = await supabase
          .from('audio_library')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (!cancelled && !error && data && data.length > 0) {
          setDbTracks(data)
        }
      } catch (_) {
        // fall through to sample data
      } finally {
        if (!cancelled) setDbLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── audio event wiring ───────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime   = () => setCurrentTime(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    const onEnded  = () => { setIsPlaying(false); setCurrentTime(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  // sync volume/muted to audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume / 100
  }, [volume, muted])

  // ── playback helpers ─────────────────────────────────────────────────────
  const playTrack = useCallback((track) => {
    const audio = audioRef.current
    if (!audio) return
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false) }
      else { audio.play().catch(console.error); setIsPlaying(true) }
      return
    }
    audio.src = track.audio_url
    audio.volume = muted ? 0 : volume / 100
    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(0)
    audio.play().catch(console.error)
    setIsPlaying(true)
  }, [currentTrack, isPlaying, muted, volume])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play().catch(console.error); setIsPlaying(true) }
  }

  const seekBy = (delta) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta))
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    audio.currentTime = Number(e.target.value)
    setCurrentTime(Number(e.target.value))
  }

  // ── favorites ────────────────────────────────────────────────────────────
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── derived data ─────────────────────────────────────────────────────────
  const allMusicTracks = dbLoading
    ? INDIE_TRACKS
    : dbTracks.length > 0
      ? dbTracks
      : INDIE_TRACKS

  const q = search.toLowerCase()

  const filteredAll = allMusicTracks.filter(t =>
    (t.title || t.name || '').toLowerCase().includes(q) ||
    (t.artist || '').toLowerCase().includes(q)
  )

  const filteredIndie = INDIE_TRACKS.filter(t =>
    t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  )

  const filteredSfx = SOUNDS.filter(s =>
    (sfxCategory === 'All' || s.category === sfxCategory) &&
    s.name.toLowerCase().includes(q)
  )

  const allFavItems = [
    ...INDIE_TRACKS.filter(t => favorites.has(t.id)),
    ...allMusicTracks.filter(t => favorites.has(t.id) && !INDIE_TRACKS.find(i => i.id === t.id)),
    ...SOUNDS.filter(s => favorites.has(s.id)),
  ]

  // ── track row (All Music + Indie tabs) ────────────────────────────────────
  const TrackRow = ({ track }) => {
    const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying
    const isFav = favorites.has(track.id)
    return (
      <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-primary/30 transition-colors">
        <button
          onClick={() => playTrack(track)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            isCurrentlyPlaying
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-primary/20 hover:text-primary'
          }`}
        >
          {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <CoverArt track={track} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{track.title || track.name}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist || track.artist_name || 'Unknown Artist'}</p>
        </div>

        <GenreBadge genre={track.genre || track.category || ''} />

        <span className="text-xs text-muted-foreground w-10 text-right flex-shrink-0">
          {track.duration || ''}
        </span>

        {isCurrentlyPlaying && <PlayingBars />}

        <button
          onClick={() => toggleFavorite(track.id)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            isFav
              ? 'text-red-400 bg-red-400/10'
              : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>
    )
  }

  // ── indie row (extra: play count) ─────────────────────────────────────────
  const IndieRow = ({ track }) => {
    const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying
    const isFav = favorites.has(track.id)
    return (
      <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-primary/30 transition-colors">
        <button
          onClick={() => playTrack(track)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            isCurrentlyPlaying
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-primary/20 hover:text-primary'
          }`}
        >
          {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* colored gradient cover */}
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0`}>
          <Music className="w-5 h-5 text-white/80" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
        </div>

        <GenreBadge genre={track.genre} />

        <span className="text-xs text-muted-foreground flex-shrink-0">{fmtPlays(track.plays)} plays</span>

        {isCurrentlyPlaying && <PlayingBars />}

        <button
          onClick={() => toggleFavorite(track.id)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            isFav
              ? 'text-red-400 bg-red-400/10'
              : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>
    )
  }

  // ── sfx row ───────────────────────────────────────────────────────────────
  const SfxRow = ({ sound }) => {
    const isCurrentlyPlaying = currentTrack?.id === sound.id && isPlaying
    const isFav = favorites.has(sound.id)
    return (
      <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-primary/30 transition-colors">
        <button
          onClick={() => playTrack({ ...sound, title: sound.name, artist: sound.category, color: 'from-gray-500 to-gray-700' })}
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            isCurrentlyPlaying
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-primary/20 hover:text-primary'
          }`}
        >
          {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <span className="text-xl flex-shrink-0">{sound.icon}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{sound.name}</p>
          <p className={`text-xs ${CAT_COLORS[sound.category] ?? 'text-muted-foreground'}`}>{sound.category}</p>
        </div>

        {isCurrentlyPlaying && <PlayingBars />}

        <button
          onClick={() => toggleFavorite(sound.id)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            isFav
              ? 'text-red-400 bg-red-400/10'
              : 'text-muted-foreground hover:text-red-400 hover:bg-red-400/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col min-h-full pb-28">
      {/* hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Music Library</h1>
        <p className="text-muted-foreground text-sm">Royalty-free tracks & sound effects for your content</p>
      </div>

      {/* search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracks, artists, sounds…"
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* main tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── All Music tab ── */}
      {activeTab === 'all' && (
        <div className="space-y-2">
          {dbLoading && (
            <p className="text-xs text-muted-foreground mb-3">Loading from library… showing sample tracks</p>
          )}
          {filteredAll.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No tracks found</div>
          ) : filteredAll.map((t) => <TrackRow key={t.id} track={t} />)}
        </div>
      )}

      {/* ── Independent Artists tab ── */}
      {activeTab === 'indie' && (
        <div className="space-y-2">
          {filteredIndie.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No tracks found</div>
          ) : filteredIndie.map((t) => <IndieRow key={t.id} track={t} />)}
        </div>
      )}

      {/* ── Sound Effects tab ── */}
      {activeTab === 'sfx' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {SFX_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSfxCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  sfxCategory === c
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredSfx.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No sounds found</div>
            ) : filteredSfx.map((s) => <SfxRow key={s.id} sound={s} />)}
          </div>
        </div>
      )}

      {/* ── Favorites tab ── */}
      {activeTab === 'favorites' && (
        <div className="space-y-2">
          {allFavItems.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center gap-3">
              <Heart className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No favorites yet. Heart tracks to save them here.</p>
            </div>
          ) : allFavItems.map((item) => {
            if ('name' in item && !('title' in item)) return <SfxRow key={item.id} sound={item} />
            if (INDIE_TRACKS.find(t => t.id === item.id)) return <IndieRow key={item.id} track={item} />
            return <TrackRow key={item.id} track={item} />
          })}
        </div>
      )}

      {/* ── Mini Player ── */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border px-4 py-3 shadow-2xl">
          <div className="max-w-5xl mx-auto flex items-center gap-4">

            {/* left: cover + info */}
            <div className="flex items-center gap-3 w-48 flex-shrink-0 min-w-0">
              <CoverArt track={currentTrack} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* center: controls + progress */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => seekBy(-10)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Back 10s"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => seekBy(10)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Forward 10s"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* progress bar */}
              <div className="w-full flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
                  {fmtTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 accent-primary cursor-pointer"
                />
                <span className="text-xs text-muted-foreground w-8 flex-shrink-0">
                  {fmtTime(duration)}
                </span>
              </div>
            </div>

            {/* right: volume */}
            <div className="flex items-center gap-2 w-36 flex-shrink-0 justify-end">
              <button
                onClick={() => setMuted((m) => !m)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                {muted || volume === 0
                  ? <VolumeX className="w-4 h-4" />
                  : <Volume2 className="w-4 h-4" />
                }
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false) }}
                className="w-20 h-1 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
