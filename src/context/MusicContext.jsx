import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const MusicContext = createContext(null)

export function MusicProvider({ children }) {
  // Track selected for "Use in Post" flow
  const [selectedTrack, setSelectedTrack] = useState(null)

  // Global audio player state
  const audioRef                         = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [volume, setVolume]             = useState(80)
  const [muted, setMuted]               = useState(false)

  // Wire audio events
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

  // Sync volume/muted
  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = muted ? 0 : volume / 100
  }, [volume, muted])

  const playTrack = useCallback(async (track, userId) => {
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
    // Record play stats for DB tracks (non-demo)
    if (track.id && !String(track.id).startsWith('demo_')) {
      try {
        await supabase.from('music_tracks')
          .update({ play_count: (track.play_count || 0) + 1 })
          .eq('id', track.id)
        if (userId) {
          await supabase.from('music_plays').insert({
            track_id: track.id,
            user_id: userId,
            context: 'music_library',
          })
        }
      } catch (_) {}
    }
  }, [currentTrack, isPlaying, muted, volume])

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play().catch(console.error); setIsPlaying(true) }
  }, [currentTrack, isPlaying])

  const seek = useCallback((seconds) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, seconds))
    setCurrentTime(audio.currentTime)
  }, [])

  const seekBy = useCallback((delta) => {
    const audio = audioRef.current
    if (!audio) return
    const next = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta))
    audio.currentTime = next
    setCurrentTime(next)
  }, [])

  const closePlayer = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const useTrackForPost = useCallback((track) => {
    setSelectedTrack(track)
  }, [])

  const clearSelectedTrack = useCallback(() => {
    setSelectedTrack(null)
  }, [])

  return (
    <MusicContext.Provider value={{
      // Post selection
      selectedTrack, useTrackForPost, clearSelectedTrack,
      // Player
      currentTrack, isPlaying, currentTime, duration, volume, muted,
      setVolume, setMuted,
      playTrack, togglePlayPause, seek, seekBy, closePlayer,
    }}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </MusicContext.Provider>
  )
}

export const useMusic = () => useContext(MusicContext)
