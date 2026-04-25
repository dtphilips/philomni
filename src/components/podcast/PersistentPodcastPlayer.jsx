import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  X, ChevronUp, ChevronDown, Mic
} from 'lucide-react';
import { usePodcastPlayer } from '@/lib/PodcastPlayerContext';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

const COLORS = [
  'from-violet-600 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
];

function CoverArt({ episode, size = 'sm' }) {
  const colorIdx = (episode?.id?.charCodeAt(0) || 0) % COLORS.length;
  const sz = size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  if (episode?.cover_image_url) {
    return <img src={episode.cover_image_url} className={`${sz} rounded-lg object-cover flex-shrink-0`} alt="" />;
  }
  return (
    <div className={`${sz} rounded-lg bg-gradient-to-br ${COLORS[colorIdx]} flex items-center justify-center flex-shrink-0`}>
      <Mic className={size === 'lg' ? 'w-6 h-6 text-white/80' : 'w-4 h-4 text-white/80'} />
    </div>
  );
}

export default function PersistentPodcastPlayer() {
  const {
    episode, isPlaying, currentTime, duration, speed, volume,
    toggle, skip, seek, setSpeed, setVolume, dismiss,
  } = usePodcastPlayer();

  const [expanded, setExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {episode && (
        <motion.div
          key="podcast-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:bottom-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Expanded panel */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="mx-2 mb-1 rounded-2xl border border-border p-5"
                style={{
                  background: 'hsl(var(--card))',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <CoverArt episode={episode} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{episode.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{episode.podcast_name}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={e => seek(+e.target.value)}
                    className="w-full h-1.5 accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(duration)}</span>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <button onClick={() => skip(-15)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors group">
                    <SkipBack className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                    <span className="text-[9px] absolute mt-4 text-muted-foreground">15</span>
                  </button>
                  <button
                    onClick={toggle}
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #6d28d9, #9333ea)' }}
                  >
                    {isPlaying
                      ? <Pause className="w-6 h-6 text-white" />
                      : <Play className="w-6 h-6 text-white ml-0.5" />}
                  </button>
                  <button onClick={() => skip(15)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors group">
                    <SkipForward className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                    <span className="text-[9px] absolute mt-4 text-muted-foreground">15</span>
                  </button>
                </div>

                {/* Speed + Volume */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {SPEEDS.map(s => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          speed === s
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-muted-foreground hover:text-foreground">
                      {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={e => setVolume(+e.target.value)}
                      className="w-20 h-1 accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mini bar */}
          <div
            className="mx-2 mb-2 lg:mb-3 rounded-2xl border border-border px-3 py-2 flex items-center gap-3 shadow-xl"
            style={{
              background: 'hsl(var(--card))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Progress underline */}
            <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-b-2xl bg-muted overflow-hidden" style={{ zIndex: 1 }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6d28d9, #9333ea)' }}
              />
            </div>

            <CoverArt episode={episode} />

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{episode.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{episode.podcast_name}</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => skip(-15)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Back 15s"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6d28d9, #9333ea)' }}
              >
                {isPlaying
                  ? <Pause className="w-4 h-4 text-white" />
                  : <Play className="w-4 h-4 text-white ml-0.5" />}
              </button>
              <button
                onClick={() => skip(15)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Forward 15s"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={dismiss}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
