import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Music, Play, Pause, Heart, Eye, Mic2, Loader2,
  Users, Calendar, ExternalLink, ArrowLeft,
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

function TrackRow({ track, index, allTracks }) {
  const { user } = useAuth()
  const { playTrack, togglePlayPause, toggleLike, likedIds, currentTrack, isPlaying } = useMusic()
  const isActive     = currentTrack?.id === track.id
  const isNowPlaying = isActive && isPlaying
  const isLiked      = likedIds?.has(track.id)

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
          {track.genre && <span className="text-[10px] text-muted-foreground/60">{track.genre}</span>}
          {track.mood  && <span className="text-[10px] text-muted-foreground/40">· {track.mood}</span>}
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

      {/* Like */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleLike(track) }}
        className={`w-7 h-7 rounded flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${
          isLiked ? '!opacity-100 text-red-500' : 'text-muted-foreground hover:text-red-400'
        }`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
      </button>
    </div>
  )
}

export default function ArtistProfile() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const { playTrack } = useMusic()
  const navigate = useNavigate()

  const [profile, setProfile]     = useState(null)
  const [tracks, setTracks]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('popular')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [{ data: prof }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('music_tracks')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('play_count', { ascending: false }),
      ])
      if (!cancelled) {
        setProfile(prof)
        setTracks(t || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  // Check follow status
  useEffect(() => {
    if (!currentUser || !userId) return
    supabase.from('follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
  }, [currentUser?.id, userId])

  const handleFollow = async () => {
    if (!currentUser) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows')
        .insert({ follower_id: currentUser.id, following_id: userId })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  // Derived stats
  const totalPlays    = tracks.reduce((s, t) => s + (t.play_count || 0), 0)
  const popularTracks = [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
  const discography   = [...tracks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  // Genre tags
  const genres = [...new Set(tracks.map(t => t.genre).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Mic2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Artist not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary hover:underline">Go back</button>
      </div>
    )
  }

  const displayName = profile.display_name || profile.full_name || profile.username || 'Artist'
  const avatarUrl   = profile.avatar_url
  const bannerUrl   = profile.banner_url

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-0">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/30 via-primary/10 to-muted" />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Profile info */}
      <div className="flex items-end gap-4 px-2 -mt-12 mb-6 relative z-10">
        {/* Avatar */}
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full border-4 border-background object-cover flex-shrink-0 shadow-lg" />
        ) : (
          <div className="w-24 h-24 rounded-full border-4 border-background bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Mic2 className="w-10 h-10 text-primary/70" />
          </div>
        )}

        <div className="flex-1 min-w-0 pb-1">
          <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {genres.slice(0, 3).map(g => (
              <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{g}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pb-1 flex-shrink-0">
          {tracks.length > 0 && (
            <button
              onClick={() => playTrack(popularTracks[0], currentUser?.id, popularTracks)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Play
            </button>
          )}
          {currentUser && currentUser.id !== userId && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
                isFollowing
                  ? 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
                  : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {followLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6 px-1">
        {[
          { label: 'Tracks', value: tracks.length },
          { label: 'Total Plays', value: fmtCount(totalPlays) },
          { label: 'Genres', value: genres.length || '–' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {tracks.length > 0 && (
        <>
          <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-5">
            {['popular', 'discography', 'about'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'popular' && (
            <div>
              {popularTracks.map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} allTracks={popularTracks} />
              ))}
            </div>
          )}

          {activeTab === 'discography' && (
            <div>
              {discography.map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} allTracks={discography} />
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              {profile.bio && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">About</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>📍</span> {profile.location}
                </div>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> {profile.website}
                </a>
              )}
              {genres.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map(g => (
                      <span key={g} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.created_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tracks.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <Music className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">No public tracks yet</p>
        </div>
      )}
    </div>
  )
}
