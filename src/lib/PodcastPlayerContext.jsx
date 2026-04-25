import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const PodcastPlayerContext = createContext(null);

export function PodcastPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [episode, setEpisode] = useState(null);    // { audio_url, title, podcast_name, cover_image_url, duration_seconds, id }
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [volume, setVolumeState] = useState(1);

  const play = useCallback((ep) => {
    if (!ep?.audio_url) return;
    if (episode?.id === ep.id) {
      // same episode — just resume
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
      return;
    }
    setEpisode(ep);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [episode]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else resume();
  }, [isPlaying, pause, resume]);

  const skip = useCallback((seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  }, [duration]);

  const seek = useCallback((time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setSpeed = useCallback((s) => {
    setSpeedState(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const dismiss = useCallback(() => {
    audioRef.current?.pause();
    setEpisode(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // When episode changes, load and auto-play
  useEffect(() => {
    if (!episode?.audio_url || !audioRef.current) return;
    audioRef.current.src = episode.audio_url;
    audioRef.current.playbackRate = speed;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => setIsPlaying(false));
  }, [episode?.audio_url]); // eslint-disable-line

  return (
    <PodcastPlayerContext.Provider value={{
      episode, isPlaying, currentTime, duration, speed, volume,
      play, pause, resume, toggle, skip, seek, setSpeed, setVolume, dismiss,
      audioRef,
    }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
    </PodcastPlayerContext.Provider>
  );
}

export function usePodcastPlayer() {
  const ctx = useContext(PodcastPlayerContext);
  if (!ctx) throw new Error('usePodcastPlayer must be used within PodcastPlayerProvider');
  return ctx;
}
