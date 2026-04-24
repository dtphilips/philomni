import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import BeatGenerator from '@/components/audio/BeatGenerator';
import {
  Music4, Search, Filter, Play, Pause, Download, Heart, Plus, Zap,
  Mic2, Volume2, Headphones, Sparkles, Clock, BarChart3,
} from 'lucide-react';

// ─── Data ───────────────────────────────────────────────────────────────────

const GENRES = ['All', 'Lo-Fi', 'Hip-Hop', 'Ambient', 'Electronic', 'Cinematic', 'Jazz', 'Pop', 'Rock', 'R&B', 'Trap'];

const TRACKS = [
  { id: 1,  genre: 'Lo-Fi',      title: 'Midnight Study Session',  artist: 'ChillWave Studio',    bpm: 75,  key: 'Am',    duration: '3:42', plays: 18420 },
  { id: 2,  genre: 'Hip-Hop',    title: 'Golden Hour Groove',      artist: 'BeatForge',           bpm: 90,  key: 'Cmaj', duration: '2:58', plays: 31200 },
  { id: 3,  genre: 'Ambient',    title: 'Nebula Drift',            artist: 'Cosmo Soundscapes',   bpm: 70,  key: 'Dmaj', duration: '5:12', plays: 9870  },
  { id: 4,  genre: 'Electronic', title: 'Neon Pulse',              artist: 'SynthLab',            bpm: 128, key: 'Fm',   duration: '4:05', plays: 44300 },
  { id: 5,  genre: 'Cinematic',  title: 'Rise of the Wanderer',    artist: 'Epica Audio',         bpm: 85,  key: 'Em',   duration: '3:28', plays: 22100 },
  { id: 6,  genre: 'Jazz',       title: 'Velvet Café',             artist: 'The Blue Note Trio',  bpm: 110, key: 'Bbmaj',duration: '4:15', plays: 7650  },
  { id: 7,  genre: 'Pop',        title: 'Summer Feelings',         artist: 'Pastel Dreams',       bpm: 120, key: 'Gmaj', duration: '3:05', plays: 58900 },
  { id: 8,  genre: 'Rock',       title: 'Voltage Surge',           artist: 'Static Current',      bpm: 140, key: 'Emaj', duration: '3:55', plays: 34200 },
  { id: 9,  genre: 'R&B',        title: 'Silk & Soul',             artist: 'Velvet Rhythm',       bpm: 82,  key: 'Bbmaj',duration: '3:30', plays: 19800 },
  { id: 10, genre: 'Trap',       title: 'Dark Matter 808',         artist: 'LoopSmith',           bpm: 138, key: 'Fm',   duration: '2:45', plays: 67100 },
  { id: 11, genre: 'Lo-Fi',      title: 'Rainy Afternoon',         artist: 'ChillWave Studio',    bpm: 78,  key: 'Cmaj', duration: '4:00', plays: 25400 },
  { id: 12, genre: 'Hip-Hop',    title: 'Block Party Anthem',      artist: 'Street Phonics',      bpm: 96,  key: 'Dm',   duration: '3:12', plays: 41000 },
  { id: 13, genre: 'Ambient',    title: 'Forest Floor Meditation', artist: 'Cosmo Soundscapes',   bpm: 72,  key: 'Am',   duration: '6:00', plays: 12300 },
  { id: 14, genre: 'Electronic', title: 'Digital Sunrise',         artist: 'SynthLab',            bpm: 124, key: 'Amaj', duration: '3:48', plays: 38700 },
  { id: 15, genre: 'Cinematic',  title: 'The Last Horizon',        artist: 'Epica Audio',         bpm: 80,  key: 'Cm',   duration: '4:32', plays: 16500 },
  { id: 16, genre: 'Jazz',       title: 'Midnight Serenade',       artist: 'The Blue Note Trio',  bpm: 104, key: 'Ebmaj',duration: '5:10', plays: 8900  },
  { id: 17, genre: 'Pop',        title: 'Electric Youth',          artist: 'Pastel Dreams',       bpm: 116, key: 'Amaj', duration: '2:55', plays: 72400 },
  { id: 18, genre: 'Rock',       title: 'Shatter the Grid',        artist: 'Static Current',      bpm: 135, key: 'Bmaj', duration: '4:20', plays: 29100 },
  { id: 19, genre: 'R&B',        title: 'Late Night Feels',        artist: 'Velvet Rhythm',       bpm: 88,  key: 'Gm',   duration: '3:40', plays: 23600 },
  { id: 20, genre: 'Trap',       title: 'Phantom Frequency',       artist: 'LoopSmith',           bpm: 142, key: 'Bm',   duration: '2:30', plays: 55800 },
];

const SFX_CATEGORIES = ['UI Sounds', 'Nature', 'Urban', 'Cinematic', 'Electronic', 'Voice'];

const SOUND_EFFECTS = [
  { id: 1,  category: 'UI Sounds',   name: 'Soft Click',          icon: '🖱️',  duration: '0:01' },
  { id: 2,  category: 'UI Sounds',   name: 'Success Chime',       icon: '✅',  duration: '0:02' },
  { id: 3,  category: 'UI Sounds',   name: 'Error Buzz',          icon: '❌',  duration: '0:01' },
  { id: 4,  category: 'Nature',      name: 'Thunderstorm Loop',   icon: '⛈️',  duration: '0:10' },
  { id: 5,  category: 'Nature',      name: 'Ocean Waves',         icon: '🌊',  duration: '0:08' },
  { id: 6,  category: 'Nature',      name: 'Bird Chorus',         icon: '🐦',  duration: '0:05' },
  { id: 7,  category: 'Nature',      name: 'Wind Through Leaves', icon: '🍃',  duration: '0:07' },
  { id: 8,  category: 'Urban',       name: 'City Traffic',        icon: '🚗',  duration: '0:06' },
  { id: 9,  category: 'Urban',       name: 'Subway Station',      icon: '🚇',  duration: '0:09' },
  { id: 10, category: 'Urban',       name: 'Coffee Shop Ambience',icon: '☕',  duration: '0:10' },
  { id: 11, category: 'Cinematic',   name: 'Dramatic Sting',      icon: '🎬',  duration: '0:03' },
  { id: 12, category: 'Cinematic',   name: 'Whoosh Transition',   icon: '💨',  duration: '0:01' },
  { id: 13, category: 'Cinematic',   name: 'Deep Impact Boom',    icon: '💥',  duration: '0:02' },
  { id: 14, category: 'Cinematic',   name: 'Tension Riser',       icon: '📈',  duration: '0:05' },
  { id: 15, category: 'Electronic',  name: 'Glitch Stutter',      icon: '⚡',  duration: '0:01' },
  { id: 16, category: 'Electronic',  name: 'Synth Sweep',         icon: '🎛️',  duration: '0:03' },
  { id: 17, category: 'Electronic',  name: 'Digital Ping',        icon: '📡',  duration: '0:01' },
  { id: 18, category: 'Voice',       name: 'Crowd Cheer',         icon: '👏',  duration: '0:04' },
  { id: 19, category: 'Voice',       name: 'Whisper Reverb',      icon: '🎤',  duration: '0:03' },
  { id: 20, category: 'Voice',       name: 'Radio Announcer',     icon: '📻',  duration: '0:06' },
];

const SORT_OPTIONS = ['Most Popular', 'Newest', 'BPM'];

// ─── Waveform ────────────────────────────────────────────────────────────────

const GENRE_COLORS = {
  'Lo-Fi': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Hip-Hop': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Ambient': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Electronic': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Cinematic': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Jazz': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Pop': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Rock': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'R&B': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Trap': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
};

function WaveformViz({ trackId, isPlaying }) {
  // Deterministic heights per track so they don't re-randomise on render
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
            isPlaying ? 'bg-primary' : 'bg-muted-foreground/40'
          }`}
          style={{
            height: `${h}%`,
            animationDelay: `${i * 50}ms`,
            transform: isPlaying ? `scaleY(${0.5 + Math.sin(i) * 0.5})` : 'scaleY(1)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Track Card ─────────────────────────────────────────────────────────────

function TrackCard({ track, isPlaying, onPlay }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${GENRE_COLORS[track.genre]}`}>
            {track.genre}
          </span>
          <h3 className="text-sm font-semibold text-foreground mt-1 truncate">{track.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
        </div>
        <button
          onClick={() => toast.info('Added to favorites')}
          className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Waveform */}
      <WaveformViz trackId={track.id} isPlaying={isPlaying} />

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{track.bpm} BPM</span>
        <span className="flex items-center gap-1"><Music4 className="w-3 h-3" />{track.key}</span>
        <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{track.duration}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant={isPlaying ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => {
            onPlay(track.id);
            if (!isPlaying) toast.info('Track preview coming soon');
          }}
        >
          {isPlaying ? <><Pause className="w-3 h-3 mr-1" />Pause</> : <><Play className="w-3 h-3 mr-1" />Play</>}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.info('Download coming soon')}
          className="px-2"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.success('Added to project!')}
          className="px-2"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Browse Tracks Tab ───────────────────────────────────────────────────────

function BrowseTracks() {
  const [activeGenre, setActiveGenre] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Most Popular');
  const [playingId, setPlayingId] = useState(null);
  const [bpmRange, setBpmRange] = useState([70, 140]);

  const filtered = useMemo(() => {
    let list = TRACKS;
    if (activeGenre !== 'All') list = list.filter(t => t.genre === activeGenre);
    if (search) list = list.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
    );
    list = list.filter(t => t.bpm >= bpmRange[0] && t.bpm <= bpmRange[1]);
    if (sort === 'Most Popular') list = [...list].sort((a, b) => b.plays - a.plays);
    if (sort === 'BPM') list = [...list].sort((a, b) => a.bpm - b.bpm);
    return list;
  }, [activeGenre, search, sort, bpmRange]);

  const togglePlay = (id) => setPlayingId(prev => prev === id ? null : id);

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
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {SORT_OPTIONS.map(opt => (
            <Button
              key={opt}
              size="sm"
              variant={sort === opt ? 'default' : 'outline'}
              onClick={() => setSort(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      {/* BPM range */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="shrink-0">BPM range:</span>
        <input
          type="range" min={70} max={140} value={bpmRange[0]}
          onChange={e => setBpmRange([+e.target.value, bpmRange[1]])}
          className="w-24 accent-primary"
        />
        <span>{bpmRange[0]}</span>
        <span>–</span>
        <input
          type="range" min={70} max={140} value={bpmRange[1]}
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

      {/* Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                isPlaying={playingId === track.id}
                onPlay={togglePlay}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sound Effects Tab ───────────────────────────────────────────────────────

const SFX_CAT_COLORS = {
  'UI Sounds': 'text-blue-400',
  'Nature': 'text-emerald-400',
  'Urban': 'text-orange-400',
  'Cinematic': 'text-red-400',
  'Electronic': 'text-violet-400',
  'Voice': 'text-pink-400',
};

function SoundEffectsTab() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState(null);

  const filtered = useMemo(() => {
    let list = SOUND_EFFECTS;
    if (activeCategory !== 'All') list = list.filter(s => s.category === activeCategory);
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [activeCategory, search]);

  const togglePlay = (id) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      toast.info('Sound effect preview coming soon');
    }
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sound effects..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category pills */}
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

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(sfx => (
          <motion.div
            key={sfx.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer group"
            onClick={() => togglePlay(sfx.id)}
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
                  : <Play className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                }
              </div>
            </div>
          </motion.div>
        ))}
      </div>
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

  return (
    <div className="space-y-6">
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
        </TabsList>

        <AnimatePresence mode="wait">
          {tab === 'browse' && (
            <TabsContent value="browse" forceMount asChild>
              <motion.div key="browse" variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit">
                <BrowseTracks />
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
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
