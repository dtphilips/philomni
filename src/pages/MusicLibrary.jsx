import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Music, Play, Pause, Search, Eye, Download,
  Lock, Loader2, Star, Heart, Users, Plus,
  Home, Layers, Mic2, ListMusic, BookOpen,
  MoreHorizontal, Check, ChevronRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMusic } from '../context/MusicContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRES = [
  'Afrobeats', 'Afropop', 'Amapiano', 'Pop', 'Hip Hop', 'R&B',
  'Gospel', 'Soul', 'Electronic', 'Lo-Fi', 'Indie', 'Rock', 'Country',
  'Jazz', 'Classical', 'Ambient', 'Reggae', 'Dancehall', 'Latin',
  'Blues', 'Folk', 'World', 'Spoken Word', 'Other',
]

const GENRE_COLORS = {
  'Afrobeats': 'from-orange-500 to-yellow-500',
  'Afropop': 'from-pink-500 to-orange-400',
  'Amapiano': 'from-green-500 to-teal-500',
  'Pop': 'from-pink-500 to-rose-400',
  'Hip Hop': 'from-gray-700 to-gray-500',
  'R&B': 'from-purple-600 to-pink-500',
  'Gospel': 'from-amber-500 to-yellow-400',
  'Soul': 'from-red-600 to-orange-500',
  'Electronic': 'from-cyan-500 to-blue-500',
  'Lo-Fi': 'from-indigo-500 to-blue-400',
  'Indie': 'from-lime-500 to-green-400',
  'Rock': 'from-slate-700 to-slate-500',
  'Country': 'from-yellow-600 to-amber-500',
  'Jazz': 'from-blue-700 to-indigo-600',
  'Classical': 'from-stone-500 to-stone-400',
  'Ambient': 'from-teal-500 to-cyan-400',
  'Reggae': 'from-green-600 to-yellow-500',
  'Dancehall': 'from-yellow-500 to-orange-400',
  'Latin': 'from-red-500 to-pink-400',
  'Blues': 'from-blue-600 to-indigo-500',
  'Folk': 'from-amber-600 to-yellow-500',
  'World': 'from-emerald-500 to-teal-400',
  'Spoken Word': 'from-violet-600 to-purple-500',
  'Other': 'from-gray-500 to-gray-400',
}

const fmtTime = (s) => {
  if (!s || !isFinite(s) || s < 0) return '–'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const fmtCount = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `${(n / 1000).toFixed(1)}K`
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

function TrackRow({ track, index, allTracks, onUseInPost, plan, onAddToPlaylist }) {
  const { playTrack, toggleLike, likedIds, currentTrack, isPlaying, togglePlayPause } = useMusic()
  const { user } = useAuth()
  const isActive     = currentTrack?.id === track.id
  const isNowPlaying = isActive && isPlaying
  const isLiked      = likedIds?.has(track.id)
  const canDownload  = plan === 'pro' || plan === 'promax'
  const canUse       = track.available_for_use !== false
  const [menuOpen, setMenuOpen] = useState(false)

  const handlePlay = () => {
    if (isActive) { togglePlayPause(); return }
    playTrack(track, user?.id, allTracks)
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer ${
      isActive ? 'bg-primary/8 border border-primary/20' : 'hover:bg-muted/40 border border-transparent'
    }`}>
      {/* Index / play indicator */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isNowPlaying ? (
          <PlayingBars />
        ) : (
          <>
            <span className="text-xs text-muted-foreground group-hover:hidden tabular-nums">{index + 1}</span>
            <button onClick={handlePlay} className="hidden group-hover:flex w-5 h-5 items-center justify-center text-foreground">
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </>
        )}
        {isActive && !isNowPlaying && (
          <button onClick={handlePlay} className="flex w-5 h-5 items-center justify-center text-primary">
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
      </div>

      {/* Cover */}
      <div className="relative flex-shrink-0" onClick={handlePlay}>
        {track.cover_art_url
          ? <img src={track.cover_art_url} alt="" className="w-10 h-10 rounded object-cover" />
          : (
            <div className={`w-10 h-10 rounded bg-gradient-to-br ${GENRE_COLORS[track.genre] || 'from-primary/40 to-primary/10'} flex items-center justify-center`}>
              <Music className="w-4 h-4 text-white/80" />
            </div>
          )
        }
        {track.is_premium && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
            <Star className="w-2 h-2 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0" onClick={handlePlay}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{track.title}</p>
          {track.is_philomni_original && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 whitespace-nowrap flex-shrink-0">
              ✦ Original
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Link
            to={`/artist/${track.user_id}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary hover:underline truncate"
          >
            {track.artist || 'Philomni Originals'}
          </Link>
          {track.genre && (
            <span className="text-[10px] text-muted-foreground/50">· {track.genre}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden lg:flex items-center gap-1 flex-shrink-0 text-[10px] text-muted-foreground/50 tabular-nums">
        <Eye className="w-3 h-3" />
        {fmtCount(track.play_count)}
      </div>

      {/* Duration */}
      <div className="hidden sm:block w-10 text-right flex-shrink-0">
        <span className="text-xs text-muted-foreground tabular-nums">{fmtTime(track.duration_seconds)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => toggleLike(track)}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {canUse && (
          <button
            onClick={() => onUseInPost(track)}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-violet-400 transition-colors text-xs"
            title="Use in Post"
          >🎵</button>
        )}

        {canDownload ? (
          <a
            href={track.audio_url}
            download={`${track.title}.mp3`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground/30" title="Upgrade to Pro to download">
            <Lock className="w-3 h-3" />
          </div>
        )}

        {/* Three-dot menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 py-1">
              <button
                onClick={() => { onAddToPlaylist(track); setMenuOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                Add to Playlist
              </button>
              <Link
                to={`/artist/${track.user_id}`}
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Mic2 className="w-3.5 h-3.5 text-muted-foreground" />
                Go to Artist
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── AddToPlaylistModal ───────────────────────────────────────────────────────

function AddToPlaylistModal({ track, playlists, onAdd, onCreateNew, onClose }) {
  const [adding, setAdding] = useState(null)
  const [done, setDone]     = useState(new Set())

  const handleAdd = async (playlist) => {
    setAdding(playlist.id)
    await onAdd(playlist.id, track)
    setDone(prev => new Set([...prev, playlist.id]))
    setAdding(null)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground">Add to Playlist</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>
        <div className="py-2 max-h-64 overflow-y-auto">
          {playlists.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">No playlists yet</p>
          )}
          {playlists.map(pl => (
            <button
              key={pl.id}
              disabled={done.has(pl.id)}
              onClick={() => handleAdd(pl)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left disabled:opacity-60"
            >
              <ListMusic className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-sm text-foreground truncate">{pl.name}</span>
              {adding === pl.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              {done.has(pl.id) && <Check className="w-3.5 h-3.5 text-green-500" />}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={() => { onCreateNew(track); onClose() }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors justify-center"
          >
            <Plus className="w-4 h-4" /> New Playlist
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CreatePlaylistModal ──────────────────────────────────────────────────────

function CreatePlaylistModal({ initialTrack, userId, onCreated, onClose }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data: pl, error } = await supabase
      .from('playlists')
      .insert({ user_id: userId, name: name.trim(), is_public: false })
      .select()
      .single()
    if (error || !pl) { setSaving(false); return }
    if (initialTrack) {
      await supabase.from('playlist_tracks')
        .insert({ playlist_id: pl.id, track_id: initialTrack.id, added_by: userId, order_index: 0 })
    }
    onCreated(pl)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-xs shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-foreground mb-4">New Playlist</h3>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Playlist name…"
          className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim() || saving}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ view, setView, playlists, onCreatePlaylist }) {
  const navItem = (v, icon, label) => (
    <button
      key={v}
      onClick={() => setView(v)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        view === v ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <aside className="w-56 flex-shrink-0 hidden md:flex flex-col gap-0.5 pt-1 pr-4 sticky top-0 self-start max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Discover */}
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-1 mt-1">Discover</p>
      {navItem('home',    <Home className="w-4 h-4" />,    'Home')}
      {navItem('originals', <Star className="w-4 h-4 text-amber-400" />, 'Philomni Originals')}
      {navItem('artists',   <Mic2 className="w-4 h-4" />,  'Artist Music')}
      {navItem('genres',    <Layers className="w-4 h-4" />, 'Browse Genres')}
      {navItem('browse-artists', <Users className="w-4 h-4" />, 'Browse Artists')}

      {/* My Library */}
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-1 mt-4">My Library</p>
      {navItem('liked',     <Heart className="w-4 h-4 text-red-400" />, 'Liked Songs')}

      <button
        onClick={onCreatePlaylist}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-left"
      >
        <Plus className="w-4 h-4" />
        Create Playlist
      </button>

      {playlists.map(pl => (
        <button
          key={pl.id}
          onClick={() => setView(`playlist:${pl.id}`)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left truncate ${
            view === `playlist:${pl.id}` ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ListMusic className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{pl.name}</span>
        </button>
      ))}
    </aside>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MusicLibrary() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const { playTrack, useTrackForPost, likedIds, toggleLike } = useMusic()
  const plan = user?.plan || 'free'

  const [allTracks, setAllTracks]     = useState([])
  const [likedTracks, setLikedTracks] = useState([])
  const [playlists, setPlaylists]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [activeGenre, setActiveGenre] = useState(null) // for genre browse
  const [view, setView]               = useState('home')

  // Modals
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null)
  const [createPlaylistTrack, setCreatePlaylistTrack] = useState(null)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)

  // ── Fetch tracks — public, runs once on mount, no auth dependency ─────────
  const [tracksError, setTracksError] = useState(null)
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true)
        setTracksError(null)
        const { data, error } = await supabase
          .from('music_tracks')
          .select('*')
          .order('created_at', { ascending: false })
        console.log('Tracks loaded:', data?.length, error)
        if (error) {
          setTracksError(error.message)
        } else {
          setAllTracks(data || [])
        }
      } catch (err) {
        console.error('Unexpected tracks error:', err)
        setTracksError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTracks()
  }, []) // runs once — tracks are public, no auth needed

  // ── Fetch playlists — only when user is logged in ─────────────────────────
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('playlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPlaylists(data || []))
  }, [user?.id])

  // Sync liked tracks from likedIds
  useEffect(() => {
    if (!likedIds || !allTracks.length) return
    setLikedTracks(allTracks.filter(t => likedIds.has(t.id)))
  }, [likedIds, allTracks])

  // ── Derived ───────────────────────────────────────────────────────────────
  const originals    = allTracks.filter(t => t.is_philomni_original || t.track_type === 'philomni_original')
  const artistTracks = allTracks.filter(t => !t.is_philomni_original && t.track_type !== 'philomni_original')

  const q = search.toLowerCase()
  const applySearch = (list) => !q ? list : list.filter(t =>
    [t.title, t.artist, t.genre, t.mood, ...(t.tags || [])].some(v => (v || '').toLowerCase().includes(q))
  )

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUseInPost = useCallback((track) => {
    useTrackForPost(track)
    navigate('/')
  }, [useTrackForPost, navigate])

  const handleAddToPlaylist = useCallback(async (playlistId, track) => {
    const maxOrder = playlists.find(p => p.id === playlistId)?.track_count || 0
    await supabase.from('playlist_tracks').insert({
      playlist_id: playlistId, track_id: track.id, added_by: user?.id, order_index: maxOrder,
    })
    await supabase.from('playlists').update({ track_count: maxOrder + 1 }).eq('id', playlistId)
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, track_count: p.track_count + 1 } : p))
  }, [playlists, user?.id])

  const handlePlaylistCreated = useCallback((pl) => {
    setPlaylists(prev => [pl, ...prev])
  }, [])

  // ── Play all ──────────────────────────────────────────────────────────────
  const playAll = (tracks) => {
    if (tracks.length) playTrack(tracks[0], user?.id, tracks)
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const TrackList = ({ tracks, emptyMsg }) => (
    loading ? (
      <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
    ) : tracks.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Music className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMsg || 'No tracks found'}</p>
      </div>
    ) : (
      <div>
        {applySearch(tracks).map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            allTracks={applySearch(tracks)}
            onUseInPost={handleUseInPost}
            plan={plan}
            onAddToPlaylist={(t) => setAddToPlaylistTrack(t)}
          />
        ))}
      </div>
    )
  )

  const SectionHeader = ({ title, count, onPlayAll }) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {count != null && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {onPlayAll && (
        <button onClick={onPlayAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
          <Play className="w-3 h-3 fill-current" /> Play All
        </button>
      )}
    </div>
  )

  // ── Content ───────────────────────────────────────────────────────────────

  let mainContent = null

  if (view === 'home') {
    mainContent = (
      <div>
        <SectionHeader title="Philomni Originals ✦" count={originals.length} onPlayAll={() => playAll(originals)} />
        <div className="mb-8">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : originals.slice(0, 5).map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} allTracks={originals}
              onUseInPost={handleUseInPost} plan={plan}
              onAddToPlaylist={(t) => setAddToPlaylistTrack(t)} />
          ))}
          {originals.length > 5 && (
            <button onClick={() => setView('originals')} className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline px-3">
              Show all {originals.length} originals <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <SectionHeader title="Browse Genres" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {GENRES.slice(0, 12).map(g => (
            <button key={g} onClick={() => { setActiveGenre(g); setView('genre-tracks') }}
              className={`h-20 rounded-xl bg-gradient-to-br ${GENRE_COLORS[g] || 'from-gray-500 to-gray-400'} flex items-end p-3 hover:opacity-90 transition-opacity`}>
              <span className="text-sm font-bold text-white drop-shadow">{g}</span>
            </button>
          ))}
        </div>

        <SectionHeader title="Artist Music" count={artistTracks.length} onPlayAll={() => playAll(artistTracks)} />
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : artistTracks.slice(0, 5).map((track, i) => (
          <TrackRow key={track.id} track={track} index={i} allTracks={artistTracks}
            onUseInPost={handleUseInPost} plan={plan}
            onAddToPlaylist={(t) => setAddToPlaylistTrack(t)} />
        ))}
        {artistTracks.length > 5 && (
          <button onClick={() => setView('artists')} className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline px-3">
            Show all {artistTracks.length} tracks <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  } else if (view === 'originals') {
    mainContent = (
      <div>
        <SectionHeader title="Philomni Originals ✦" count={applySearch(originals).length} onPlayAll={() => playAll(originals)} />
        <TrackList tracks={originals} emptyMsg="No original tracks yet" />
      </div>
    )
  } else if (view === 'artists') {
    mainContent = (
      <div>
        <SectionHeader title="Artist Music" count={applySearch(artistTracks).length} onPlayAll={() => playAll(artistTracks)} />
        <TrackList tracks={artistTracks} emptyMsg="No artist tracks yet" />
      </div>
    )
  } else if (view === 'liked') {
    mainContent = (
      <div>
        <SectionHeader title="Liked Songs" count={likedTracks.length} onPlayAll={() => playAll(likedTracks)} />
        <TrackList tracks={likedTracks} emptyMsg="Heart a track to save it here" />
      </div>
    )
  } else if (view === 'genres') {
    mainContent = (
      <div>
        <SectionHeader title="Browse Genres" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GENRES.map(g => {
            const count = allTracks.filter(t => t.genre === g).length
            return (
              <button key={g} onClick={() => { setActiveGenre(g); setView('genre-tracks') }}
                className={`h-24 rounded-xl bg-gradient-to-br ${GENRE_COLORS[g] || 'from-gray-500 to-gray-400'} flex flex-col items-start justify-end p-4 hover:opacity-90 transition-opacity`}>
                <span className="text-base font-bold text-white drop-shadow">{g}</span>
                {count > 0 && <span className="text-xs text-white/80">{count} tracks</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  } else if (view === 'genre-tracks' && activeGenre) {
    const genreTracks = allTracks.filter(t => t.genre === activeGenre)
    mainContent = (
      <div>
        <button onClick={() => setView('genres')} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">
          ← Back to Genres
        </button>
        <SectionHeader title={activeGenre} count={applySearch(genreTracks).length} onPlayAll={() => playAll(genreTracks)} />
        <TrackList tracks={genreTracks} emptyMsg={`No ${activeGenre} tracks yet`} />
      </div>
    )
  } else if (view === 'browse-artists') {
    // Derive unique artists from allTracks
    const artistMap = new Map()
    allTracks.forEach(t => {
      if (t.user_id && !artistMap.has(t.user_id)) {
        artistMap.set(t.user_id, { userId: t.user_id, name: t.artist || 'Unknown Artist', genre: t.genre, trackCount: 0 })
      }
      if (t.user_id) artistMap.get(t.user_id).trackCount++
    })
    const artists = [...artistMap.values()].sort((a, b) => b.trackCount - a.trackCount)
    mainContent = (
      <div>
        <SectionHeader title="Browse Artists" count={artists.length} />
        {artists.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No artists yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {artists.map(a => (
              <Link key={a.userId} to={`/artist/${a.userId}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-muted/30 transition-all">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${GENRE_COLORS[a.genre] || 'from-primary/40 to-primary/10'} flex items-center justify-center`}>
                  <Mic2 className="w-6 h-6 text-white/80" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground truncate max-w-[100px]">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.trackCount} track{a.trackCount !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  } else if (view.startsWith('playlist:')) {
    const plId = view.replace('playlist:', '')
    mainContent = <PlaylistView playlistId={plId} allTracks={allTracks} plan={plan}
      onUseInPost={handleUseInPost} onAddToPlaylist={(t) => setAddToPlaylistTrack(t)} userId={user?.id} />
  }

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          Philomni Sounds 🎵
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Stream, discover, and use music in your content
        </p>
      </div>

      {/* Search bar (full width, above layout) */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, artist, genre, mood…"
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-0 md:gap-6">
        {/* Sidebar */}
        <Sidebar
          view={view}
          setView={(v) => { setView(v); setSearch('') }}
          playlists={playlists}
          onCreatePlaylist={() => setShowCreatePlaylist(true)}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {tracksError && (
            <div style={{ color: 'red', padding: '10px', background: '#fee', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
              Music library error: {tracksError}
            </div>
          )}
          {mainContent}
        </div>
      </div>

      {/* Add to Playlist modal */}
      {addToPlaylistTrack && (
        <AddToPlaylistModal
          track={addToPlaylistTrack}
          playlists={playlists}
          onAdd={handleAddToPlaylist}
          onCreateNew={(t) => { setCreatePlaylistTrack(t); setAddToPlaylistTrack(null) }}
          onClose={() => setAddToPlaylistTrack(null)}
        />
      )}

      {/* Create Playlist modal */}
      {(showCreatePlaylist || createPlaylistTrack) && (
        <CreatePlaylistModal
          initialTrack={createPlaylistTrack || null}
          userId={user?.id}
          onCreated={handlePlaylistCreated}
          onClose={() => { setShowCreatePlaylist(false); setCreatePlaylistTrack(null) }}
        />
      )}

      {/* Attribution */}
      <p className="mt-10 text-center text-xs text-muted-foreground/40">
        Philomni Originals © {new Date().getFullYear()} Philomni Technologies Inc. · Licensed for use on Philomni only.
      </p>
    </div>
  )
}

// ─── PlaylistView (inline) ────────────────────────────────────────────────────

function PlaylistView({ playlistId, allTracks, plan, onUseInPost, onAddToPlaylist, userId }) {
  const { playTrack } = useMusic()
  const [playlist, setPlaylist]   = useState(null)
  const [tracks, setTracks]       = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [{ data: pl }, { data: pts }] = await Promise.all([
        supabase.from('playlists').select('*').eq('id', playlistId).single(),
        supabase.from('playlist_tracks').select('*, music_tracks(*)').eq('playlist_id', playlistId).order('order_index'),
      ])
      if (!cancelled) {
        setPlaylist(pl)
        setTracks((pts || []).map(pt => pt.music_tracks).filter(Boolean))
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [playlistId])

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
  if (!playlist) return <div className="py-16 text-center text-sm text-muted-foreground">Playlist not found</div>

  return (
    <div>
      {/* Playlist header */}
      <div className="flex items-end gap-4 mb-6 p-4 bg-gradient-to-b from-muted/40 to-transparent rounded-xl">
        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg">
          <ListMusic className="w-10 h-10 text-primary/70" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Playlist</p>
          <h2 className="text-2xl font-bold text-foreground truncate">{playlist.name}</h2>
          {playlist.description && <p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">{tracks.length} tracks</p>
        </div>
      </div>

      {/* Play controls */}
      {tracks.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => playTrack(tracks[0], userId, tracks)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" /> Play
          </button>
        </div>
      )}

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No tracks in this playlist yet</div>
      ) : (
        tracks.map((track, i) => (
          <TrackRow key={track.id} track={track} index={i} allTracks={tracks}
            onUseInPost={onUseInPost} plan={plan} onAddToPlaylist={onAddToPlaylist} />
        ))
      )}
    </div>
  )
}
