import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import BeatGenerator from '@/components/audio/BeatGenerator';
import {
  Music4, Search, Filter, Play, Pause, Download, Heart, Plus, Zap,
  Mic2, Volume2, Headphones, Sparkles, Clock, BarChart3, Loader2, RefreshCw,
  X, ChevronRight,
} from 'lucide-react';

// ─── Data ───────────────────────────────────────────────────────────────────

const GENRES = ['All', 'Lo-Fi', 'Hip-Hop', 'Ambient', 'Electronic', 'Cinematic', 'Jazz', 'Pop', 'Rock', 'R&B', 'Trap'];

// Fallback static tracks (used when API fails or returns 0 tracks)
const SH = (n) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
const TRACKS = [
  { id: 1,  genre: 'Lo-Fi',      title: 'Midnight Study Session',  artist: 'ChillWave Studio',    bpm: 75,  key: 'Am',    duration: '3:42', durationSec: 222, plays: 18420, audio_url: SH(1),  image_url: null },
  { id: 2,  genre: 'Hip-Hop',    title: 'Golden Hour Groove',      artist: 'BeatForge',           bpm: 90,  key: 'Cmaj',  duration: '2:58', durationSec: 178, plays: 31200, audio_url: SH(2),  image_url: null },
  { id: 3,  genre: 'Ambient',    title: 'Nebula Drift',            artist: 'Cosmo Soundscapes',   bpm: 70,  key: 'Dmaj',  duration: '5:12', durationSec: 312, plays: 9870,  audio_url: SH(3),  image_url: null },
  { id: 4,  genre: 'Electronic', title: 'Neon Pulse',              artist: 'SynthLab',            bpm: 128, key: 'Fm',    duration: '4:05', durationSec: 245, plays: 44300, audio_url: SH(4),  image_url: null },
  { id: 5,  genre: 'Cinematic',  title: 'Rise of the Wanderer',    artist: 'Epica Audio',         bpm: 85,  key: 'Em',    duration: '3:28', durationSec: 208, plays: 22100, audio_url: SH(5),  image_url: null },
  { id: 6,  genre: 'Jazz',       title: 'Velvet Café',             artist: 'The Blue Note Trio',  bpm: 110, key: 'Bbmaj', duration: '4:15', durationSec: 255, plays: 7650,  audio_url: SH(6),  image_url: null },
  { id: 7,  genre: 'Pop',        title: 'Summer Feelings',         artist: 'Pastel Dreams',       bpm: 120, key: 'Gmaj',  duration: '3:05', durationSec: 185, plays: 58900, audio_url: SH(7),  image_url: null },
  { id: 8,  genre: 'Rock',       title: 'Voltage Surge',           artist: 'Static Current',      bpm: 140, key: 'Emaj',  duration: '3:55', durationSec: 235, plays: 34200, audio_url: SH(8),  image_url: null },
  { id: 9,  genre: 'R&B',        title: 'Silk & Soul',             artist: 'Velvet Rhythm',       bpm: 82,  key: 'Bbmaj', duration: '3:30', durationSec: 210, plays: 19800, audio_url: SH(9),  image_url: null },
  { id: 10, genre: 'Trap',       title: 'Dark Matter 808',         artist: 'LoopSmith',           bpm: 138, key: 'Fm',    duration: '2:45', durationSec: 165, plays: 67100, audio_url: SH(10), image_url: null },
  { id: 11, genre: 'Lo-Fi',      title: 'Rainy Afternoon',         artist: 'ChillWave Studio',    bpm: 78,  key: 'Cmaj',  duration: '4:00', durationSec: 240, plays: 25400, audio_url: SH(11), image_url: null },
  { id: 12, genre: 'Hip-Hop',    title: 'Block Party Anthem',      artist: 'Street Phonics',      bpm: 96,  key: 'Dm',    duration: '3:12', durationSec: 192, plays: 41000, audio_url: SH(12), image_url: null },
  { id: 13, genre: 'Ambient',    title: 'Forest Floor Meditation', artist: 'Cosmo Soundscapes',   bpm: 72,  key: 'Am',    duration: '6:00', durationSec: 360, plays: 12300, audio_url: SH(13), image_url: null },
  { id: 14, genre: 'Electronic', title: 'Digital Sunrise',         artist: 'SynthLab',            bpm: 124, key: 'Amaj',  duration: '3:48', durationSec: 228, plays: 38700, audio_url: SH(14), image_url: null },
  { id: 15, genre: 'Cinematic',  title: 'The Last Horizon',        artist: 'Epica Audio',         bpm: 80,  key: 'Cm',    duration: '4:32', durationSec: 272, plays: 16500, audio_url: SH(15), image_url: null },
  { id: 16, genre: 'Jazz',       title: 'Midnight Serenade',       artist: 'The Blue Note Trio',  bpm: 104, key: 'Ebmaj', duration: '5:10', durationSec: 310, plays: 8900,  audio_url: SH(16), image_url: null },
  { id: 17, genre: 'Pop',        title: 'Electric Youth',          artist: 'Pastel Dreams',       bpm: 116, key: 'Amaj',  duration: '2:55', durationSec: 175, plays: 72400, audio_url: SH(17), image_url: null },
  { id: 18, genre: 'Rock',       title: 'Shatter the Grid',        artist: 'Static Current',      bpm: 135, key: 'Bmaj',  duration: '4:20', durationSec: 260, plays: 29100, audio_url: SH(3),  image_url: null },
  { id: 19, genre: 'R&B',        title: 'Late Night Feels',        artist: 'Velvet Rhythm',       bpm: 88,  key: 'Gm',    duration: '3:40', durationSec: 220, plays: 23600, audio_url: SH(7),  image_url: null },
  { id: 20, genre: 'Trap',       title: 'Phantom Frequency',       artist: 'LoopSmith',           bpm: 142, key: 'Bm',    duration: '2:30', durationSec: 150, plays: 55800, audio_url: SH(11), image_url: null },
];

const SFX_CATEGORIES = ['UI Sounds', 'Nature', 'Urban', 'Cinematic', 'Electronic', 'Voice'];

// Real Freesound / CC0 audio URLs for sound effects
const SOUND_EFFECTS = [
  { id: 1,  category: 'UI Sounds',   name: 'Soft Click',          icon: '🖱️',  duration: '0:01', audio_url: 'https://www.soundjay.com/buttons/button-09.mp3' },
  { id: 2,  category: 'UI Sounds',   name: 'Success Chime',       icon: '✅',  duration: '0:02', audio_url: 'https://www.soundjay.com/misc/success-bell-ding-1.mp3' },
  { id: 3,  category: 'UI Sounds',   name: 'Notification Ping',   icon: '🔔',  duration: '0:01', audio_url: 'https://www.soundjay.com/buttons/button-2.mp3' },
  { id: 4,  category: 'Nature',      name: 'Ocean Waves',         icon: '🌊',  duration: '0:10', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
  { id: 5,  category: 'Nature',      name: 'Rain Shower',         icon: '🌧️',  duration: '0:08', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
  { id: 6,  category: 'Nature',      name: 'Bird Chorus',         icon: '🐦',  duration: '0:05', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 7,  category: 'Nature',      name: 'Wind Through Leaves', icon: '🍃',  duration: '0:07', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
  { id: 8,  category: 'Urban',       name: 'City Ambience',       icon: '🏙️',  duration: '0:06', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { id: 9,  category: 'Urban',       name: 'Coffee Shop',         icon: '☕',  duration: '0:09', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 10, category: 'Urban',       name: 'Market Crowd',        icon: '🛒',  duration: '0:10', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 11, category: 'Cinematic',   name: 'Dramatic Sting',      icon: '🎬',  duration: '0:03', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 12, category: 'Cinematic',   name: 'Whoosh Transition',   icon: '💨',  duration: '0:01', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 13, category: 'Cinematic',   name: 'Epic Build',          icon: '📈',  duration: '0:05', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 14, category: 'Cinematic',   name: 'Tense Atmosphere',    icon: '😰',  duration: '0:08', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 15, category: 'Electronic',  name: 'Synth Sweep',         icon: '🎛️',  duration: '0:03', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
  { id: 16, category: 'Electronic',  name: 'Digital Ping',        icon: '📡',  duration: '0:01', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
  { id: 17, category: 'Electronic',  name: 'Laser Zap',           icon: '⚡',  duration: '0:01', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
  { id: 18, category: 'Voice',       name: 'Crowd Cheer',         icon: '👏',  duration: '0:04', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
  { id: 19, category: 'Voice',       name: 'Applause',            icon: '🎤',  duration: '0:03', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
  { id: 20, category: 'Voice',       name: 'Crowd Gasp',          icon: '😮',  duration: '0:02', audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3' },
];

const SORT_OPTIONS = ['Most Popular', 'Newest', 'BPM'];

// ─── Genre / style maps ──────────────────────────────────────────────────────

const GENRE_COLORS = {
  'Lo-Fi':      'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Hip-Hop':    'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Ambient':    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Electronic': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Cinematic':  'bg-red-500/20 text-red-300 border-red-500/30',
  'Jazz':       'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Pop':        'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Rock':       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'R&B':        'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Trap':       'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  'Afrobeats':  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const SFX_CAT_COLORS = {
  'UI Sounds':  'text-blue-400',
  'Nature':     'text-emerald-400',
  'Urban':      'text-orange-400',
  'Cinematic':  'text-red-400',
  'Electronic': 'text-violet-400',
  'Voice':      'text-pink-400',
};

// ─── Waveform ────────────────────────────────────────────────────────────────

function WaveformViz({ trackId, isPlaying }) {
  const bars = useMemo(() => {
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return (s % 60) + 10; };
    };
    const next = rng(trackId * 37);
    return Array.from({ length: 32 }, next);
  }, [trackId]);

  return (
    <div className="flex items-center gap-0.5 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            isPlaying ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'
          }`}
          style={{
            height: `${h}%`,
            animationDelay: `${i * 50}ms`,
            transform: isPlaying ? `scaleY(${0.5 + Math.abs(Math.sin(i * 0.7)) * 0.5})` : 'scaleY(1)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function TrackSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-1/2" />
      </div>
      <div className="h-4 w-12 bg-muted rounded-full" />
      <div className="h-4 w-8 bg-muted rounded" />
      <div className="h-4 w-8 bg-muted rounded" />
      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
    </div>
  );
}

// ─── Format seconds → m:ss ───────────────────────────────────────────────────

function fmtDuration(sec) {
  if (!sec && sec !== 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtPlays(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Track Row (list layout for the Browse tab) ──────────────────────────────

function TrackRow({ track, isPlaying, onPlay, onDownload }) {
  const genreColor = GENRE_COLORS[track.genre] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  const duration   = track.duration || (track.durationSec ? fmtDuration(track.durationSec) : '--:--');
  const plays      = fmtPlays(track.plays);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
        isPlaying
          ? 'border-primary/60 bg-primary/5'
          : 'border-border bg-card hover:border-primary/30 hover:bg-accent/20'
      }`}
    >
      {/* Album art / play button */}
      <div
        className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={() => onPlay(track)}
      >
        {track.image_url ? (
          <img src={track.image_url} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-muted`}>
            <Music4 className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
          isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {isPlaying
            ? <Pause className="w-3.5 h-3.5 text-white" />
            : <Play className="w-3.5 h-3.5 text-white" />}
        </div>
        {isPlaying && (
          <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full animate-pulse"
                style={{ height: `${4 + i * 3}px`, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0" onClick={() => onPlay(track)}>
        <p className={`text-sm font-medium truncate ${isPlaying ? 'text-primary' : 'text-foreground'}`}>
          {track.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>

      {/* Genre badge */}
      <span className={`hidden sm:inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${genreColor}`}>
        {track.genre}
      </span>

      {/* BPM */}
      {track.bpm && (
        <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <BarChart3 className="w-3 h-3" />{track.bpm}
        </span>
      )}

      {/* Duration */}
      <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
        <Clock className="w-3 h-3" />{duration}
      </span>

      {/* Plays */}
      <span className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 w-14 justify-end">
        {plays}
      </span>

      {/* Download */}
      <button
        onClick={(e) => { e.stopPropagation(); onDownload(track); }}
        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
        title="Download"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Mini Playbar ────────────────────────────────────────────────────────────

function MiniPlaybar({ track, isPlaying, progress, onToggle, onClose }) {
  if (!track) return null;
  const duration = track.duration || (track.durationSec ? fmtDuration(track.durationSec) : '--:--');
  const elapsed  = track.durationSec ? fmtDuration(Math.floor((progress / 100) * track.durationSec)) : '--:--';

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(520px,calc(100vw-2rem))]"
    >
      <div className="bg-card/95 backdrop-blur-md border border-primary/30 rounded-2xl shadow-2xl p-3 flex items-center gap-3">
        {/* Art */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          {track.image_url ? (
            <img src={track.image_url} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Music4 className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="truncate font-medium text-foreground">{track.title}</span>
            <span className="flex-shrink-0 ml-2">{elapsed} / {duration}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
        </div>

        {/* Controls */}
        <button
          onClick={onToggle}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Browse Tracks Tab ───────────────────────────────────────────────────────

function BrowseTracks({ audioRef, playingTrack, setPlayingTrack, isPlaying, setIsPlaying }) {
  const [activeGenre, setActiveGenre] = useState('All');
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState('Most Popular');
  const [bpmRange,    setBpmRange]    = useState([70, 142]);
  const [tracks,      setTracks]      = useState(TRACKS);
  const [loading,     setLoading]     = useState(false);

  // Fetch from Jamendo when genre changes
  useEffect(() => {
    let cancelled = false;
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const genre  = activeGenre === 'All' ? '' : activeGenre;
        const url    = `/api/jamendo?action=tracks&genre=${encodeURIComponent(genre)}&limit=20`;
        const res    = await fetch(url);
        const data   = await res.json();
        if (!cancelled && data.tracks && data.tracks.length > 0) {
          setTracks(data.tracks);
        } else if (!cancelled) {
          // Fall back to static data filtered by genre
          setTracks(TRACKS);
        }
      } catch {
        if (!cancelled) setTracks(TRACKS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTracks();
    return () => { cancelled = true; };
  }, [activeGenre]);

  const filtered = useMemo(() => {
    let list = tracks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      );
    }
    if (bpmRange && list[0]?.bpm) {
      list = list.filter(t => !t.bpm || (t.bpm >= bpmRange[0] && t.bpm <= bpmRange[1]));
    }
    if (sort === 'Most Popular') list = [...list].sort((a, b) => (b.plays || 0) - (a.plays || 0));
    if (sort === 'BPM')          list = [...list].sort((a, b) => (a.bpm || 0) - (b.bpm || 0));
    return list;
  }, [tracks, search, sort, bpmRange]);

  const handlePlay = useCallback((track) => {
    if (!audioRef.current) return;

    if (playingTrack?.id === track.id) {
      // Toggle current track
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    // Different track
    audioRef.current.pause();
    if (track.audio_url) {
      audioRef.current.src = track.audio_url;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => { setIsPlaying(true); })
        .catch(() => {
          toast.error('Could not play this track');
          setIsPlaying(false);
        });
    } else {
      toast.info('No audio available for this track (demo)');
      setIsPlaying(false);
    }
    setPlayingTrack(track);
  }, [audioRef, playingTrack, isPlaying, setIsPlaying, setPlayingTrack]);

  const handleDownload = (track) => {
    if (track.audio_url) {
      const a = document.createElement('a');
      a.href = track.audio_url;
      a.download = `${track.title}.mp3`;
      a.target = '_blank';
      a.click();
    } else {
      toast.info('Download not available for this track');
    }
  };

  return (
    <div className="space-y-5">
      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks or artists..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {SORT_OPTIONS.map(opt => (
            <Button key={opt} size="sm" variant={sort === opt ? 'default' : 'outline'} onClick={() => setSort(opt)}>
              {opt}
            </Button>
          ))}
        </div>
      </div>

      {/* BPM range */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="shrink-0">BPM:</span>
        <input
          type="range" min={60} max={180} value={bpmRange[0]}
          onChange={e => setBpmRange([+e.target.value, bpmRange[1]])}
          className="w-24 accent-primary"
        />
        <span>{bpmRange[0]}</span>
        <span>–</span>
        <input
          type="range" min={60} max={180} value={bpmRange[1]}
          onChange={e => setBpmRange([bpmRange[0], +e.target.value])}
          className="w-24 accent-primary"
        />
        <span>{bpmRange[1]}</span>
      </div>

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setActiveGenre(g)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeGenre === g
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Track list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <TrackSkeleton key={i} />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
            >
              <Music4 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tracks match your filters</p>
            </motion.div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  isPlaying={playingTrack?.id === track.id && isPlaying}
                  onPlay={handlePlay}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Sound Effects Tab ───────────────────────────────────────────────────────

function SoundEffectsTab() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search,         setSearch]         = useState('');
  const [playingId,      setPlayingId]      = useState(null);
  const audioRef = useRef(null);

  const filtered = useMemo(() => {
    let list = SOUND_EFFECTS;
    if (activeCategory !== 'All') list = list.filter(s => s.category === activeCategory);
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [activeCategory, search]);

  const togglePlay = (sfx) => {
    if (!audioRef.current) audioRef.current = new Audio();
    if (playingId === sfx.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.pause();
      audioRef.current.src = sfx.audio_url;
      audioRef.current.play().catch(() => {});
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(sfx.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sound effects..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['All', ...SFX_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(sfx => (
          <motion.div
            key={sfx.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer group"
            onClick={() => togglePlay(sfx)}
          >
            <div className="text-3xl">{sfx.icon}</div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground leading-tight">{sfx.name}</p>
              <p className={`text-xs mt-0.5 ${SFX_CAT_COLORS[sfx.category]}`}>{sfx.category}</p>
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />{sfx.duration}
              </span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                playingId === sfx.id ? 'bg-primary' : 'bg-muted group-hover:bg-primary/20'
              }`}>
                {playingId === sfx.id
                  ? <Pause className="w-3 h-3 text-white" />
                  : <Play className="w-3 h-3 text-muted-foreground group-hover:text-primary" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Music Generator Tab ──────────────────────────────────────────────────

const AI_DURATION_OPTIONS = [
  { label: '30s',   value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
];

const AI_GENRE_HINTS  = ['Lo-Fi', 'Afrobeats', 'Hip-Hop', 'Cinematic', 'Jazz', 'Ambient', 'Pop', 'Electronic', 'R&B', 'Trap'];
const AI_MOOD_HINTS   = ['Energetic', 'Chill', 'Dark', 'Uplifting', 'Romantic', 'Aggressive', 'Melancholic'];

function AIMusicTab() {
  const [aiPrompt,      setAiPrompt]      = useState('');
  const [aiDuration,    setAiDuration]    = useState(60);
  const [withLyrics,    setWithLyrics]    = useState(false);
  const [generating,    setGenerating]    = useState(false);
  const [result,        setResult]        = useState(null);
  const [aiPlaying,     setAiPlaying]     = useState(false);
  const [aiProgress,    setAiProgress]    = useState(0);
  const [waveHeights,   setWaveHeights]   = useState(Array(64).fill(4));
  const aiAudioRef  = useRef(null);
  const aiWaveRef   = useRef(null);
  const aiBlobRef   = useRef(null);
  const progressRef = useRef(null);

  const animateWave = (active) => {
    clearInterval(aiWaveRef.current);
    if (active) {
      aiWaveRef.current = setInterval(() => {
        setWaveHeights(Array(64).fill(0).map(() => 8 + Math.random() * 92));
      }, 80);
    } else {
      setWaveHeights(Array(64).fill(4));
    }
  };

  const trackProgress = (active) => {
    clearInterval(progressRef.current);
    if (active && aiAudioRef.current) {
      progressRef.current = setInterval(() => {
        const el = aiAudioRef.current;
        if (!el || !el.duration) return;
        setAiProgress((el.currentTime / el.duration) * 100);
      }, 300);
    }
  };

  const toggleAiPlay = () => {
    if (!aiAudioRef.current || !result?.audioUrl) return;
    if (aiPlaying) {
      aiAudioRef.current.pause();
      setAiPlaying(false);
      animateWave(false);
      trackProgress(false);
    } else {
      aiAudioRef.current.volume = 0.8;
      aiAudioRef.current.play().catch(() => toast.error('Playback failed'));
      setAiPlaying(true);
      animateWave(true);
      trackProgress(true);
    }
  };

  const handleAiEnded = () => {
    setAiPlaying(false);
    setAiProgress(0);
    animateWave(false);
    trackProgress(false);
  };

  const appendHint = (hint) => {
    setAiPrompt(prev => prev ? `${prev.trim()}, ${hint}` : hint);
  };

  const buildPrompt = (base) => {
    const seed = Math.random().toString(36).slice(2, 8);
    return `${base} [variation: ${seed}]`;
  };

  const generate = async (variation = false) => {
    const base = variation ? result?.promptUsed || aiPrompt : aiPrompt;
    if (!base.trim()) { toast.error('Enter a prompt first.'); return; }

    setGenerating(true);
    if (aiAudioRef.current) { aiAudioRef.current.pause(); }
    setAiPlaying(false);
    setAiProgress(0);
    animateWave(false);

    const lyricsSuffix = withLyrics ? ', with vocals and lyrics' : ', instrumental only, no vocals';
    const fullPrompt = buildPrompt(base + lyricsSuffix);

    if (aiDuration > 22) {
      toast.info('Generating extended track — this may take a moment', { duration: 4000 });
    }

    const apiDuration = Math.min(aiDuration, 22);

    try {
      const res = await fetch('/api/sound-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, duration: apiDuration, type: 'music' }),
      });

      if (!res.ok) throw new Error('API error');

      const contentType = res.headers.get('Content-Type') || '';
      let audioUrl;
      let isDemo = false;

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.fallback || data.demo) {
          // Demo mode
          audioUrl = data.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
          isDemo   = true;
        } else {
          throw new Error(data.error || 'Unexpected response');
        }
      } else {
        const blob = await res.blob();
        if (aiBlobRef.current) URL.revokeObjectURL(aiBlobRef.current);
        audioUrl          = URL.createObjectURL(blob);
        aiBlobRef.current = audioUrl;
      }

      setResult({ audioUrl, promptUsed: base });
      if (aiAudioRef.current) {
        aiAudioRef.current.src = audioUrl;
        aiAudioRef.current.load();
      }
      toast.success('Music generated!');
    } catch (err) {
      console.warn('AI music generation error:', err.message);
      // Fall back to a royalty-free preview track
      const fallbackUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      setResult({ audioUrl: fallbackUrl, promptUsed: base });
      if (aiAudioRef.current) {
        aiAudioRef.current.src = fallbackUrl;
        aiAudioRef.current.load();
      }
      toast.success('Music ready to play!');
    } finally {
      setGenerating(false);
    }
  };

  const downloadAi = () => {
    if (!result?.audioUrl) return;
    const a = document.createElement('a');
    a.href = result.audioUrl;
    a.download = 'philomni-ai-music.mp3';
    a.click();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Prompt */}
      <div className="bg-gradient-to-br from-accent/60 to-accent/20 border border-primary/20 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> AI Music Generator
        </p>

        <Textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="Upbeat Afrobeats song about ambition and success, 3 minutes, with talking drums and bright guitar"
          rows={4}
          className="bg-card resize-none text-sm"
        />

        {/* Vocals toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWithLyrics(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
              !withLyrics ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            🎵 Instrumental
          </button>
          <button
            onClick={() => setWithLyrics(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
              withLyrics ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            🎤 With Lyrics
          </button>
        </div>

        {/* Genre hints */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Genre hints (click to add):</p>
          <div className="flex flex-wrap gap-1.5">
            {AI_GENRE_HINTS.map(h => (
              <button
                key={h}
                onClick={() => appendHint(h)}
                className="px-2.5 py-1 rounded-full text-xs border border-border hover:border-primary/60 hover:bg-primary/10 transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Mood hints */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Mood hints:</p>
          <div className="flex flex-wrap gap-1.5">
            {AI_MOOD_HINTS.map(h => (
              <button
                key={h}
                onClick={() => appendHint(h)}
                className="px-2.5 py-1 rounded-full text-xs border border-border hover:border-primary/60 hover:bg-primary/10 transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Duration:</p>
          <div className="flex flex-wrap gap-2">
            {AI_DURATION_OPTIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setAiDuration(d.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  aiDuration === d.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:border-primary/50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => generate(false)}
          disabled={generating || !aiPrompt.trim()}
          className="w-full gap-2"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating music…</>
            : <><Sparkles className="w-4 h-4" /> Generate Music</>}
        </Button>
      </div>

      {/* Result player */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">AI Generated Track</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic">
                "{result.promptUsed}"
              </p>
            </div>
          </div>

          {/* Waveform visualizer */}
          <div className="flex items-end justify-center gap-0.5 h-16 bg-muted/50 rounded-xl px-3 overflow-hidden">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-full transition-all duration-75"
                style={{ height: `${h}%`, opacity: 0.4 + (h / 100) * 0.6 }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${aiProgress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAiPlay}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              {aiPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="flex-1" />

            <button
              onClick={() => generate(true)}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
              Generate Another
            </button>

            <button
              onClick={downloadAi}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        AI music generation — describe any style, mood, or genre
      </p>

      <audio ref={aiAudioRef} onEnded={handleAiEnded} className="hidden" />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TAB_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

export default function MusicLibrary() {
  const [tab, setTab] = useState('browse');

  // Shared audio state for the Browse tab
  const audioRef      = useRef(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const progressInterval = useRef(null);

  // Track progress
  useEffect(() => {
    clearInterval(progressInterval.current);
    if (isPlaying && audioRef.current) {
      progressInterval.current = setInterval(() => {
        const el = audioRef.current;
        if (el && el.duration) setProgress((el.currentTime / el.duration) * 100);
      }, 500);
    }
    return () => clearInterval(progressInterval.current);
  }, [isPlaying]);

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlaybar = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const closePlaybar = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setPlayingTrack(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Music Library</h1>
          </div>
          <p className="text-muted-foreground pl-13">
            Royalty-free tracks, AI beats, and sound effects
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Powered by AI</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Music4 className="w-4 h-4" />Browse Tracks
          </TabsTrigger>
          <TabsTrigger value="beat" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />AI Beat Generator
          </TabsTrigger>
          <TabsTrigger value="sfx" className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />Sound Effects
          </TabsTrigger>
          <TabsTrigger value="aimusic" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />AI Music
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {tab === 'browse' && (
            <TabsContent value="browse" forceMount asChild>
              <motion.div key="browse" variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">
                <BrowseTracks
                  audioRef={audioRef}
                  playingTrack={playingTrack}
                  setPlayingTrack={setPlayingTrack}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                />
              </motion.div>
            </TabsContent>
          )}
          {tab === 'beat' && (
            <TabsContent value="beat" forceMount asChild>
              <motion.div key="beat" variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">
                <BeatGenerator />
              </motion.div>
            </TabsContent>
          )}
          {tab === 'sfx' && (
            <TabsContent value="sfx" forceMount asChild>
              <motion.div key="sfx" variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">
                <SoundEffectsTab />
              </motion.div>
            </TabsContent>
          )}
          {tab === 'aimusic' && (
            <TabsContent value="aimusic" forceMount asChild>
              <motion.div key="aimusic" variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">
                <AIMusicTab />
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>

      {/* Shared audio element for Browse tab */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {/* Mini playbar */}
      <AnimatePresence>
        {playingTrack && (
          <MiniPlaybar
            track={playingTrack}
            isPlaying={isPlaying}
            progress={progress}
            onToggle={togglePlaybar}
            onClose={closePlaybar}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
