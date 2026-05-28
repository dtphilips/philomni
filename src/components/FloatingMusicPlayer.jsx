import React from 'react'
import { Link } from 'react-router-dom'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Volume1, Music, X,
  Heart, List, Repeat, Repeat1,
  Shuffle,
} from 'lucide-react'
import { useMusic } from '../context/MusicContext'

const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Queue Panel ─────────────────────────────────────────────────────────────
function QueuePanel({ onClose }) {
  const {
    currentTrack, queue, queueIndex, upNextTracks,
    jumpToQueueIndex, likedIds, toggleLike,
  } = useMusic()

  return (
    <div className="fixed right-0 bottom-[72px] w-72 bg-card border border-border rounded-tl-xl shadow-2xl z-[99] flex flex-col max-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span className="text-sm font-bold text-foreground">Queue</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 pb-2">
        {/* Now Playing */}
        {currentTrack && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Now Playing</p>
            <QueueRow track={currentTrack} active likedIds={likedIds} toggleLike={toggleLike} />
          </div>
        )}

        {/* Next Up */}
        {upNextTracks.length > 0 && (
          <div className="px-3 pt-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Up</p>
            {upNextTracks.map((track, i) => {
              const globalIdx = queue.indexOf(track)
              return (
                <QueueRow
                  key={track.id}
                  track={track}
                  likedIds={likedIds}
                  toggleLike={toggleLike}
                  onClick={() => jumpToQueueIndex(globalIdx)}
                />
              )
            })}
          </div>
        )}

        {upNextTracks.length === 0 && !currentTrack && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No tracks in queue
          </div>
        )}
      </div>
    </div>
  )
}

function QueueRow({ track, active, likedIds, toggleLike, onClick }) {
  const isLiked = likedIds?.has(track.id)
  const coverGradient = track.color || 'from-violet-500 to-purple-600'
  return (
    <div
      className={`flex items-center gap-2 px-1 py-1.5 rounded-lg group cursor-pointer transition-colors ${active ? 'bg-primary/10' : 'hover:bg-muted'}`}
      onClick={onClick}
    >
      {track.cover_art_url
        ? <img src={track.cover_art_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
        : (
          <div className={`w-8 h-8 rounded bg-gradient-to-br ${coverGradient} flex items-center justify-center flex-shrink-0`}>
            <Music className="w-3 h-3 text-white/80" />
          </div>
        )
      }
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${active ? 'text-primary' : 'text-foreground'}`}>{track.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{track.artist || 'Philomni Originals'}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); toggleLike(track) }}
        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all ${isLiked ? '!opacity-100 text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
      >
        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
      </button>
    </div>
  )
}

// ─── Volume Icon helper ───────────────────────────────────────────────────────
function VolumeIcon({ muted, volume }) {
  if (muted || volume === 0) return <VolumeX className="w-4 h-4" />
  if (volume < 40)           return <Volume1 className="w-4 h-4" />
  return <Volume2 className="w-4 h-4" />
}

// ─── Main Player ──────────────────────────────────────────────────────────────
export default function FloatingMusicPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, muted, setVolume, setMuted,
    togglePlayPause, seek,
    playNext, playPrev,
    repeatMode, shuffle,
    cycleRepeatMode, toggleShuffle,
    likedIds, toggleLike,
    showQueue, toggleQueue,
    closePlayer, useTrackForPost,
  } = useMusic()

  if (!currentTrack) return null

  const isLiked       = likedIds?.has(currentTrack.id)
  const coverGradient = currentTrack.color || 'from-violet-500 to-purple-600'
  const progress      = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek   = (e) => seek(Number(e.target.value))
  const handleVolume = (e) => { setVolume(Number(e.target.value)); setMuted(false) }

  return (
    <>
      {/* Queue Panel */}
      {showQueue && <QueuePanel onClose={toggleQueue} />}

      {/* Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-card/98 backdrop-blur-md border-t border-border shadow-2xl">
        <div className="flex items-center h-[72px] px-4 gap-2">

          {/* ── LEFT: Cover + Title + Artist + Heart ─────────────────── */}
          <div className="flex items-center gap-3 w-[240px] flex-shrink-0 min-w-0">
            {currentTrack.cover_art_url
              ? <img src={currentTrack.cover_art_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-md" />
              : (
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${coverGradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Music className="w-5 h-5 text-white/80" />
                </div>
              )
            }
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate leading-tight">{currentTrack.artist || 'Philomni Originals'}</p>
            </div>
            <button
              onClick={() => toggleLike(currentTrack)}
              className={`flex-shrink-0 transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* ── CENTER: Controls + Progress ──────────────────────────── */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0 px-4">
            {/* Playback controls */}
            <div className="flex items-center gap-4">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                title="Shuffle"
                className={`transition-colors hidden sm:block ${shuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={playPrev}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Previous"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlayPause}
                className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0 shadow"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying
                  ? <Pause className="w-4 h-4 fill-current" />
                  : <Play  className="w-4 h-4 fill-current translate-x-0.5" />
                }
              </button>

              {/* Next */}
              <button
                onClick={playNext}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Repeat */}
              <button
                onClick={cycleRepeatMode}
                title={repeatMode === 'off' ? 'Enable repeat' : repeatMode === 'all' ? 'Repeat one' : 'Disable repeat'}
                className={`transition-colors hidden sm:block ${repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {repeatMode === 'one'
                  ? <Repeat1 className="w-4 h-4" />
                  : <Repeat  className="w-4 h-4" />
                }
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full flex items-center gap-2 max-w-md">
              <span className="text-[10px] text-muted-foreground w-8 text-right flex-shrink-0 tabular-nums">
                {fmtTime(currentTime)}
              </span>
              <div className="flex-1 relative h-1 group cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full transition-none"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground w-8 flex-shrink-0 tabular-nums">
                {fmtTime(duration)}
              </span>
            </div>
          </div>

          {/* ── RIGHT: Volume + Queue + Use in Post + Close ───────────── */}
          <div className="flex items-center gap-2 w-[200px] flex-shrink-0 justify-end">
            {/* Volume */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setMuted(m => !m)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title={muted ? 'Unmute' : 'Mute'}
              >
                <VolumeIcon muted={muted} volume={volume} />
              </button>
              <input
                type="range" min={0} max={100}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                className="w-20 h-1 accent-foreground cursor-pointer"
                title={`Volume: ${volume}%`}
              />
            </div>

            {/* Queue */}
            <button
              onClick={toggleQueue}
              title="Queue"
              className={`transition-colors ${showQueue ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>

            {/* Use in Post */}
            <Link
              to="/"
              onClick={() => useTrackForPost(currentTrack)}
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors whitespace-nowrap"
              title="Use in Post"
            >
              🎵 Use
            </Link>

            {/* Close */}
            <button
              onClick={closePlayer}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
