import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Music, Play, Pause, Heart, Eye, ListMusic,
  Loader2, ArrowLeft, MoreHorizontal, Trash2,
  Edit2, Globe, Lock, Check,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMusic } from '../context/MusicContext'

const fmtTime = (s) => {
  if (!s || !isFinite(s) || s < 0) return '–'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const fmtCount = (n) => {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

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

function TrackRow({ track, index, allTracks, isOwner, onRemove }) {
  const { user } = useAuth()
  const { playTrack, togglePlayPause, toggleLike, likedIds, currentTrack, isPlaying } = useMusic()
  const isActive     = currentTrack?.id === track.id
  const isNowPlaying = isActive && isPlaying
  const isLiked      = likedIds?.has(track.id)
  const [menuOpen, setMenuOpen] = useState(false)

  const handlePlay = () => {
    if (isActive) { togglePlayPause(); return }
    playTrack(track, user?.id, allTracks)
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer ${
        isActive ? 'bg-primary/8 border border-primary/20' : 'hover:bg-muted/40 border border-transparent'
      }`}
      onClick={handlePlay}
    >
      {/* Index / playing indicator */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isNowPlaying ? (
          <PlayingBars />
        ) : (
          <>
            <span className="text-xs text-muted-foreground group-hover:hidden tabular-nums">{index + 1}</span>
            <Play className="w-3.5 h-3.5 fill-current text-foreground hidden group-hover:block" />
          </>
        )}
      </div>

      {/* Cover */}
      <div className="relative flex-shrink-0">
        {track.cover_art_url
          ? <img src={track.cover_art_url} alt="" className="w-10 h-10 rounded object-cover" />
          : (
            <div className="w-10 h-10 rounded bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary/70" />
            </div>
          )
        }
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{track.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Link to={`/artist/${track.user_id}`} onClick={e => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary hover:underline truncate">
            {track.artist || 'Philomni Originals'}
          </Link>
          {track.genre && <span className="text-[10px] text-muted-foreground/40">· {track.genre}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground/50 tabular-nums flex-shrink-0">
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
          onClick={(e) => { e.stopPropagation(); toggleLike(track) }}
          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
            isLiked ? '!opacity-100 text-red-500' : 'text-muted-foreground hover:text-red-400'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {isOwner && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p) }}
              className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-40 bg-card border border-border rounded-xl shadow-xl z-50 py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(track); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-muted transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlaylistPage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { playTrack } = useMusic()

  const [playlist, setPlaylist]   = useState(null)
  const [tracks, setTracks]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(false)
  const [editName, setEditName]   = useState('')
  const [editDesc, setEditDesc]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [{ data: pl }, { data: pts }] = await Promise.all([
        supabase.from('playlists').select('*, profiles(display_name, full_name, username, avatar_url)').eq('id', id).single(),
        supabase.from('playlist_tracks').select('*, music_tracks(*)').eq('playlist_id', id).order('order_index'),
      ])
      if (!cancelled) {
        setPlaylist(pl)
        setEditName(pl?.name || '')
        setEditDesc(pl?.description || '')
        setTracks((pts || []).map(pt => pt.music_tracks).filter(Boolean))
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const isOwner = user?.id === playlist?.user_id

  const handleSave = async () => {
    if (!editName.trim()) return
    setSaving(true)
    await supabase.from('playlists')
      .update({ name: editName.trim(), description: editDesc.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    setPlaylist(prev => ({ ...prev, name: editName.trim(), description: editDesc.trim() || null }))
    setEditing(false)
    setSaving(false)
  }

  const handleTogglePublic = async () => {
    await supabase.from('playlists').update({ is_public: !playlist.is_public }).eq('id', id)
    setPlaylist(prev => ({ ...prev, is_public: !prev.is_public }))
  }

  const handleRemoveTrack = async (track) => {
    await supabase.from('playlist_tracks')
      .delete()
      .eq('playlist_id', id)
      .eq('track_id', track.id)
    setTracks(prev => prev.filter(t => t.id !== track.id))
    await supabase.from('playlists').update({ track_count: Math.max(0, tracks.length - 1) }).eq('id', id)
  }

  const totalDuration = tracks.reduce((s, t) => s + (t.duration_seconds || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <ListMusic className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Playlist not found</p>
        <button onClick={() => navigate('/music')} className="mt-4 text-sm text-primary hover:underline">Go to Music Library</button>
      </div>
    )
  }

  const ownerName = playlist.profiles?.display_name || playlist.profiles?.full_name || playlist.profiles?.username || 'Unknown'

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex items-end gap-5 mb-6 p-5 bg-gradient-to-b from-muted/60 to-transparent rounded-2xl">
        {/* Cover */}
        <div className="w-36 h-36 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-xl">
          <ListMusic className="w-16 h-16 text-primary/60" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pb-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Playlist</p>

          {editing ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b border-primary text-foreground outline-none w-full"
              />
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Add a description…"
                rows={2}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving || !editName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground truncate">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{playlist.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{ownerName}</span>
                <span>·</span>
                <span>{tracks.length} tracks</span>
                {totalDuration > 0 && (
                  <>
                    <span>·</span>
                    <span>{fmtTime(totalDuration)}</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Owner controls */}
        {isOwner && !editing && (
          <div className="relative pb-1">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 py-1">
                <button
                  onClick={() => { setEditing(true); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Edit Details
                </button>
                <button
                  onClick={() => { handleTogglePublic(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  {playlist.is_public
                    ? <><Lock className="w-3.5 h-3.5 text-muted-foreground" /> Make Private</>
                    : <><Globe className="w-3.5 h-3.5 text-muted-foreground" /> Make Public</>
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Play controls */}
      {tracks.length > 0 && (
        <div className="flex items-center gap-3 mb-5 px-1">
          <button
            onClick={() => playTrack(tracks[0], user?.id, tracks)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow"
          >
            <Play className="w-4 h-4 fill-current" /> Play
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {playlist.is_public
              ? <><Globe className="w-3.5 h-3.5" /> Public</>
              : <><Lock className="w-3.5 h-3.5" /> Private</>
            }
          </div>
        </div>
      )}

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <ListMusic className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">No tracks in this playlist yet</p>
          <Link to="/music" className="mt-3 text-sm text-primary hover:underline">Browse Music Library →</Link>
        </div>
      ) : (
        <div>
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 pb-2 border-b border-border mb-1">
            <div className="w-6 flex-shrink-0 text-center text-[10px] text-muted-foreground">#</div>
            <div className="w-10 flex-shrink-0" />
            <div className="flex-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title</div>
            <div className="hidden md:block w-16 text-right text-[10px] text-muted-foreground uppercase tracking-wider">Plays</div>
            <div className="hidden sm:block w-10 text-right text-[10px] text-muted-foreground uppercase tracking-wider">Time</div>
            <div className="w-16 flex-shrink-0" />
          </div>

          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              allTracks={tracks}
              isOwner={isOwner}
              onRemove={handleRemoveTrack}
            />
          ))}
        </div>
      )}
    </div>
  )
}
