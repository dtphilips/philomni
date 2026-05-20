import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Search, Loader2, Music2, ExternalLink, SkipForward, SkipBack } from 'lucide-react';

const GENRES = ['All', 'pop', 'rock', 'hiphop', 'electronic', 'jazz', 'classical', 'ambient', 'reggae', 'soul'];

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MusicLibrary() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressInterval = useRef(null);

  const fetchTracks = async (q = '', g = 'All') => {
    setLoading(true);
    try {
      // Route through our server-side proxy to avoid CORS issues and centralise the API key
      const params = new URLSearchParams({
        action: q ? 'search' : 'tracks',
        limit: '30',
        ...(q ? { q } : {}),
        ...(g !== 'All' ? { genre: g } : {}),
      });
      const res = await fetch(`/api/jamendo?${params}`);
      const data = await res.json();
      // proxy returns normalised shape: { tracks: [...] }
      // fall back to raw Jamendo shape if proxy returns results array directly
      setTracks(data.tracks || data.results || []);
    } catch {
      setTracks([]);
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => { fetchTracks(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchTracks(query, genre), 400);
    return () => clearTimeout(timer);
  }, [query, genre]);

  const playTrack = (track, idx) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === track.id) {
      if (audio.paused) { audio.play(); setPlayingId(track.id); }
      else { audio.pause(); setPlayingId(null); }
      return;
    }

    audio.src = track.audio_url || track.audio;
    audio.play();
    setPlayingId(track.id);
    setCurrentIdx(idx);
    setProgress(0);
  };

  const stopTrack = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setPlayingId(null);
    setProgress(0);
  };

  const playNext = () => {
    if (currentIdx === null || tracks.length === 0) return;
    const next = (currentIdx + 1) % tracks.length;
    playTrack(tracks[next], next);
  };

  const playPrev = () => {
    if (currentIdx === null || tracks.length === 0) return;
    const prev = (currentIdx - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prev], prev);
  };

  // Progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnded = () => playNext();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentIdx, tracks]);

  const currentTrack = currentIdx !== null ? tracks[currentIdx] : null;

  return (
    <div className="space-y-4">
      {/* Search + Genre */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search real songs, artists..."
          className="pl-10"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors capitalize ${genre === g ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Now Playing bar */}
      {currentTrack && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {currentTrack.album_image ? (
                <img src={currentTrack.album_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{currentTrack.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist_name}</p>
              {/* Progress bar */}
              <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={playPrev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => playTrack(currentTrack, currentIdx)}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {playingId === currentTrack.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={playNext} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12">
          <Music2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tracks found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tracks.map((track, idx) => {
            const isActive = playingId === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, idx)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/60 border border-transparent'}`}
              >
                {/* Album art */}
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
                  {track.album_image ? (
                    <img src={track.album_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {isActive && !audioRef.current?.paused
                      ? <Pause className="w-4 h-4 text-white" />
                      : <Play className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''}`}>{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist_name}</p>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    {track.musicinfo?.tags?.genres?.slice(0, 2).map(g => (
                      <Badge key={g} variant="secondary" className="text-xs px-1.5 py-0">{g}</Badge>
                    ))}
                  </div>
                </div>

                {/* Duration + link */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                  <a
                    href={track.shareurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Powered by <a href="https://jamendo.com" target="_blank" rel="noopener noreferrer" className="underline">Jamendo</a> · Free, royalty-free music by independent artists under Creative Commons
      </p>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}