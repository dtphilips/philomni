import React from 'react'
import { Link } from 'react-router-dom'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Music, X,
} from 'lucide-react'
import { useMusic } from '../context/MusicContext'

const fmtTime = (s) => {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function FloatingMusicPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, muted, setVolume, setMuted,
    togglePlayPause, seek, seekBy, closePlayer, useTrackForPost,
  } = useMusic()

  if (!currentTrack) return null

  const handleSeek = (e) => seek(Number(e.target.value))
  const handleVolume = (e) => { setVolume(Number(e.target.value)); setMuted(false) }

  const handleUseInPost = () => {
    useTrackForPost(currentTrack)
  }

  const coverGradient = currentTrack.color || 'from-violet-500 to-purple-600'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-md border-t border-border shadow-2xl px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center gap-3">

        {/* Cover + info */}
        <div className="flex items-center gap-2.5 w-44 flex-shrink-0 min-w-0">
          {currentTrack.cover_art_url
            ? <img src={currentTrack.cover_art_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            : (
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${coverGradient} flex items-center justify-center flex-shrink-0`}>
                <Music className="w-4 h-4 text-white/80" />
              </div>
            )
          }
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{currentTrack.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentTrack.artist || 'Philomni Originals'}</p>
          </div>
        </div>

        {/* Controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-3">
            <button onClick={() => seekBy(-10)}
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button onClick={togglePlayPause}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0">
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => seekBy(10)}
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-7 text-right flex-shrink-0">
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
            <span className="text-[10px] text-muted-foreground w-7 flex-shrink-0">
              {fmtTime(duration)}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Volume */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button onClick={() => setMuted(m => !m)}
              className="text-muted-foreground hover:text-foreground transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range" min={0} max={100}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="w-16 h-1 accent-primary cursor-pointer"
            />
          </div>

          {/* Use in Post */}
          <Link
            to="/"
            onClick={handleUseInPost}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors whitespace-nowrap"
          >
            🎵 Use in Post
          </Link>

          {/* Close */}
          <button onClick={closePlayer}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
