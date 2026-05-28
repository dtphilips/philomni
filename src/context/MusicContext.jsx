import React, {
  createContext, useContext, useState, useRef, useEffect, useCallback,
} from 'react'
import { supabase } from '../lib/supabase'

const MusicContext = createContext(null)

// ─── helpers ─────────────────────────────────────────────────────────────────
const loadLS = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}
const saveLS = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function buildShuffled(queue, currentIndex) {
  const indices = queue.map((_, i) => i).filter(i => i !== currentIndex)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return [currentIndex, ...indices]
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function MusicProvider({ children }) {
  // ── Post-selection (Use in Post flow) ─────────────────────────────────────
  const [selectedTrack, setSelectedTrack] = useState(null)

  // ── Audio element ──────────────────────────────────────────────────────────
  const audioRef = useRef(null)

  // ── Player display state ───────────────────────────────────────────────────
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [volume, setVolume]             = useState(loadLS('music_volume', 80))
  const [muted, setMuted]               = useState(loadLS('music_muted', false))

  // ── Queue / playback mode ──────────────────────────────────────────────────
  // repeatMode: 'off' | 'all' | 'one'
  const [repeatMode, setRepeatMode]   = useState(() => loadLS('music_repeat', 'off'))
  const [shuffle, setShuffle]         = useState(() => loadLS('music_shuffle', false))
  const [queue, setQueue]             = useState([])          // full track list
  const [queueIndex, setQueueIndex]   = useState(-1)          // current position
  const [shuffledQueue, setShuffledQ] = useState([])          // shuffled order (index list)
  const [showQueue, setShowQueue]     = useState(false)

  // ── Liked tracks ──────────────────────────────────────────────────────────
  const [likedIds, setLikedIds] = useState(new Set())

  // ── Stable ref for audio event handlers (avoids stale closures) ───────────
  const S = useRef({
    queue: [], queueIndex: -1, shuffledQueue: [],
    repeatMode: 'off', shuffle: false,
    volume: 80, muted: false,
  })
  // Keep S in sync with state
  useEffect(() => {
    S.current.queue        = queue
    S.current.queueIndex   = queueIndex
    S.current.shuffledQueue = shuffledQueue
    S.current.repeatMode   = repeatMode
    S.current.shuffle      = shuffle
    S.current.volume       = volume
    S.current.muted        = muted
  }, [queue, queueIndex, shuffledQueue, repeatMode, shuffle, volume, muted])

  // ── Load liked tracks from DB when auth changes ────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) { setLikedIds(new Set()); return }
      try {
        const { data } = await supabase
          .from('saved_tracks')
          .select('track_id')
          .eq('user_id', session.user.id)
        if (data) setLikedIds(new Set(data.map(r => r.track_id)))
      } catch {}
    })
    // Also load immediately for current session
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      try {
        const { data } = await supabase
          .from('saved_tracks')
          .select('track_id')
          .eq('user_id', user.id)
        if (data) setLikedIds(new Set(data.map(r => r.track_id)))
      } catch {}
    })()
    return () => subscription.unsubscribe()
  }, [])

  // ── Wire audio events ──────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime   = () => setCurrentTime(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    const onEnded  = () => {
      const { repeatMode: rm, shuffle: sh, queue: q, queueIndex: qi, shuffledQueue: sq } = S.current
      if (rm === 'one') {
        audio.currentTime = 0
        audio.play().catch(console.error)
        return
      }
      // Advance to next
      let nextIdx
      if (sh && sq.length) {
        const pos = sq.indexOf(qi)
        if (pos === -1 || pos === sq.length - 1) {
          if (rm === 'all') nextIdx = sq[0]
          else { setIsPlaying(false); setCurrentTime(0); return }
        } else {
          nextIdx = sq[pos + 1]
        }
      } else {
        if (qi >= q.length - 1) {
          if (rm === 'all') nextIdx = 0
          else { setIsPlaying(false); setCurrentTime(0); return }
        } else {
          nextIdx = qi + 1
        }
      }
      const nextTrack = q[nextIdx]
      if (!nextTrack) { setIsPlaying(false); setCurrentTime(0); return }
      audio.src = nextTrack.audio_url
      audio.volume = S.current.muted ? 0 : S.current.volume / 100
      audio.play().catch(console.error)
      setCurrentTrack(nextTrack)
      setQueueIndex(nextIdx)
      setCurrentTime(0)
      setDuration(0)
      setIsPlaying(true)
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, []) // intentionally empty — uses S ref

  // ── Sync volume/muted ──────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = muted ? 0 : volume / 100
    saveLS('music_volume', volume)
    saveLS('music_muted', muted)
  }, [volume, muted])

  // ── playTrack ──────────────────────────────────────────────────────────────
  // contextQueue: optional array of tracks to use as queue. If omitted, single-track queue.
  const playTrack = useCallback(async (track, userId, contextQueue) => {
    const audio = audioRef.current
    if (!audio) return

    const newQueue = contextQueue && contextQueue.length ? contextQueue : [track]
    const newIndex = newQueue.findIndex(t => t.id === track.id)
    const idx      = newIndex >= 0 ? newIndex : 0

    // If same track and already in the same queue context, just toggle
    if (S.current.currentTrack?.id === track.id && !contextQueue) {
      if (S.current.isPlaying) { audio.pause(); setIsPlaying(false) }
      else { audio.play().catch(console.error); setIsPlaying(true) }
      return
    }

    setQueue(newQueue)
    setQueueIndex(idx)
    if (S.current.shuffle) {
      const sq = buildShuffled(newQueue, idx)
      setShuffledQ(sq)
    } else {
      setShuffledQ([])
    }

    audio.src = track.audio_url
    audio.volume = S.current.muted ? 0 : S.current.volume / 100
    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(0)
    audio.play().catch(console.error)
    setIsPlaying(true)

    // Update S immediately
    S.current.queue        = newQueue
    S.current.queueIndex   = idx
    S.current.currentTrack = track
    S.current.isPlaying    = true

    // Record play stats
    if (track.id && !String(track.id).startsWith('demo_')) {
      try {
        await supabase.from('music_tracks')
          .update({ play_count: (track.play_count || 0) + 1 })
          .eq('id', track.id)
        if (userId) {
          await supabase.from('music_plays').insert({
            track_id: track.id, user_id: userId, context: 'music_library',
          }).catch(() => {})
        }
      } catch {}
    }
  }, [])

  // ── playNext / playPrev ────────────────────────────────────────────────────
  const playNext = useCallback(() => {
    const { queue: q, queueIndex: qi, shuffledQueue: sq, shuffle: sh, repeatMode: rm } = S.current
    const audio = audioRef.current
    if (!audio || !q.length) return

    let nextIdx
    if (sh && sq.length) {
      const pos = sq.indexOf(qi)
      if (pos === sq.length - 1) {
        if (rm === 'all') nextIdx = sq[0]
        else return
      } else {
        nextIdx = sq[pos + 1]
      }
    } else {
      if (qi >= q.length - 1) {
        if (rm === 'all') nextIdx = 0
        else return
      } else {
        nextIdx = qi + 1
      }
    }

    const nextTrack = q[nextIdx]
    if (!nextTrack) return
    audio.src = nextTrack.audio_url
    audio.volume = S.current.muted ? 0 : S.current.volume / 100
    audio.play().catch(console.error)
    setCurrentTrack(nextTrack)
    setQueueIndex(nextIdx)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(true)
  }, [])

  const playPrev = useCallback(() => {
    const { queue: q, queueIndex: qi, shuffledQueue: sq, shuffle: sh } = S.current
    const audio = audioRef.current
    if (!audio || !q.length) return

    // If more than 3s in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      setCurrentTime(0)
      return
    }

    let prevIdx
    if (sh && sq.length) {
      const pos = sq.indexOf(qi)
      prevIdx = pos > 0 ? sq[pos - 1] : sq[sq.length - 1]
    } else {
      prevIdx = qi > 0 ? qi - 1 : 0
    }

    const prevTrack = q[prevIdx]
    if (!prevTrack) return
    audio.src = prevTrack.audio_url
    audio.volume = S.current.muted ? 0 : S.current.volume / 100
    audio.play().catch(console.error)
    setCurrentTrack(prevTrack)
    setQueueIndex(prevIdx)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(true)
  }, [])

  const jumpToQueueIndex = useCallback((idx) => {
    const { queue: q } = S.current
    const audio = audioRef.current
    if (!audio || !q[idx]) return
    const track = q[idx]
    audio.src = track.audio_url
    audio.volume = S.current.muted ? 0 : S.current.volume / 100
    audio.play().catch(console.error)
    setCurrentTrack(track)
    setQueueIndex(idx)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(true)
  }, [])

  // ── togglePlayPause ────────────────────────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play().catch(console.error); setIsPlaying(true) }
  }, [currentTrack, isPlaying])

  // ── Seek ───────────────────────────────────────────────────────────────────
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

  // ── Close player ───────────────────────────────────────────────────────────
  const closePlayer = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setQueue([])
    setQueueIndex(-1)
    setShuffledQ([])
  }, [])

  // ── Repeat / Shuffle ───────────────────────────────────────────────────────
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      const next = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'
      saveLS('music_repeat', next)
      return next
    })
  }, [])

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const next = !prev
      saveLS('music_shuffle', next)
      if (next && S.current.queue.length) {
        const sq = buildShuffled(S.current.queue, S.current.queueIndex)
        setShuffledQ(sq)
      } else {
        setShuffledQ([])
      }
      return next
    })
  }, [])

  // ── Like / Unlike tracks ───────────────────────────────────────────────────
  const toggleLike = useCallback(async (track) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isLiked = likedIds.has(track.id)
    if (isLiked) {
      await supabase.from('saved_tracks')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', track.id)
      setLikedIds(prev => { const n = new Set(prev); n.delete(track.id); return n })
    } else {
      await supabase.from('saved_tracks')
        .insert({ user_id: user.id, track_id: track.id })
      setLikedIds(prev => new Set([...prev, track.id]))
    }
  }, [likedIds])

  // ── Queue panel toggle ─────────────────────────────────────────────────────
  const toggleQueue = useCallback(() => setShowQueue(prev => !prev), [])

  // ── Use in Post ────────────────────────────────────────────────────────────
  const useTrackForPost  = useCallback((track) => setSelectedTrack(track), [])
  const clearSelectedTrack = useCallback(() => setSelectedTrack(null), [])

  // ── Up next (for queue panel display) ─────────────────────────────────────
  const upNextTracks = (() => {
    if (!queue.length || queueIndex < 0) return []
    if (shuffle && shuffledQueue.length) {
      const pos = shuffledQueue.indexOf(queueIndex)
      return shuffledQueue.slice(pos + 1, pos + 6).map(i => queue[i]).filter(Boolean)
    }
    return queue.slice(queueIndex + 1, queueIndex + 6)
  })()

  return (
    <MusicContext.Provider value={{
      // Post selection
      selectedTrack, useTrackForPost, clearSelectedTrack,
      // Player state
      currentTrack, isPlaying, currentTime, duration, volume, muted,
      setVolume, setMuted,
      // Queue state
      queue, queueIndex, upNextTracks, showQueue,
      // Playback modes
      repeatMode, shuffle,
      // Liked
      likedIds,
      // Actions
      playTrack, togglePlayPause, seek, seekBy, closePlayer,
      playNext, playPrev, jumpToQueueIndex,
      cycleRepeatMode, toggleShuffle,
      toggleLike, toggleQueue,
    }}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </MusicContext.Provider>
  )
}

export const useMusic = () => useContext(MusicContext)
