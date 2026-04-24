import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Music, Mic, Play, Square, Loader2, Volume2,
  Radio, Headphones, Wind, Coffee, Moon, Zap, Library, Film, Scissors, History, Share2
} from 'lucide-react';
import MusicLibrary from '@/components/audio/MusicLibrary';
import VoiceStudio from '@/components/audio/VoiceStudio';
import VideoOverlay from '@/components/audio/VideoOverlay';
import AudioEditor from '@/components/audio/AudioEditor';
import AudioRevisionHistory from '@/components/audio/AudioRevisionHistory';
import PresenceIndicator from '@/components/audio/PresenceIndicator';
import SharedProjectDashboard from '@/components/audio/SharedProjectDashboard';
import BeatGenerator from '@/components/audio/BeatGenerator';

// ── Lo-Fi Music Engine (Web Audio API) ──────────────────────────────────────

const PRESETS = [
  { id: 'lofi', label: 'Lo-Fi Beats', icon: Coffee, bpm: 75, desc: 'Chill hip-hop vibes with warm vinyl crackle' },
  { id: 'ambient', label: 'Ambient Space', icon: Moon, bpm: 60, desc: 'Deep atmospheric pads and slow drones' },
  { id: 'nature', label: 'Rain & Wind', icon: Wind, bpm: 0, desc: 'Soft rain, wind, and nature sounds' },
  { id: 'focus', label: 'Focus Flow', icon: Zap, bpm: 90, desc: 'Upbeat electronic beats for deep work' },
  { id: 'jazz', label: 'Late Night Jazz', icon: Radio, bpm: 80, desc: 'Mellow jazz-influenced chords and bass' },
];

const SCALE_FREQS = {
  lofi:   [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9],
  ambient:[130.8, 146.8, 164.8, 196.0, 220.0],
  nature: [],
  focus:  [293.7, 329.6, 369.9, 415.3, 466.2, 523.3],
  jazz:   [220.0, 246.9, 261.6, 311.1, 349.2, 415.3],
};

let globalCtx = null;
function getCtx() {
  if (!globalCtx || globalCtx.state === 'closed') {
    globalCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (globalCtx.state === 'suspended') globalCtx.resume();
  return globalCtx;
}

function createLoFiTrack(ctx, preset, volume, scheduledNodes) {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const freqs = SCALE_FREQS[preset.id] || SCALE_FREQS.lofi;
  const bpm = preset.bpm || 75;
  const beatLen = 60 / bpm;

  if (preset.id !== 'nature') {
    // Bass drone
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = freqs[0] / 2;
    bassGain.gain.setValueAtTime(0.18, ctx.currentTime);
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start();
    scheduledNodes.push(bassOsc);

    // Chord pad
    [0, 2, 4].forEach((idx, i) => {
      const padOsc = ctx.createOscillator();
      const padGain = ctx.createGain();
      padOsc.type = 'sine';
      padOsc.frequency.value = freqs[idx % freqs.length];
      padGain.gain.setValueAtTime(0.07 - i * 0.015, ctx.currentTime);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      padOsc.connect(filter);
      filter.connect(padGain);
      padGain.connect(masterGain);
      padOsc.start();
      scheduledNodes.push(padOsc);
    });
  }

  // Vinyl crackle for lo-fi / jazz
  if (preset.id === 'lofi' || preset.id === 'jazz') {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.012;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 0.5;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(masterGain);
    noiseSource.start();
    scheduledNodes.push(noiseSource);
  }

  // Rain noise
  if (preset.id === 'nature') {
    const rainBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const rainData = rainBuffer.getChannelData(0);
    for (let i = 0; i < rainData.length; i++) rainData[i] = Math.random() * 2 - 1;
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = rainBuffer;
    rainSrc.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1200;
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.35, ctx.currentTime);
    rainSrc.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(masterGain);
    rainSrc.start();
    scheduledNodes.push(rainSrc);
  }

  // Melodic plucks
  if (preset.id !== 'nature' && freqs.length > 0) {
    const scheduleAhead = 30;
    const now = ctx.currentTime;
    for (let t = now; t < now + scheduleAhead; t += beatLen * 2) {
      const freq = freqs[Math.floor(Math.random() * freqs.length)];
      const pluck = ctx.createOscillator();
      const pluckGain = ctx.createGain();
      pluck.type = preset.id === 'focus' ? 'sawtooth' : 'triangle';
      pluck.frequency.value = freq * 2;
      pluckGain.gain.setValueAtTime(0, t);
      pluckGain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      pluckGain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 1.8);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      pluck.connect(filter);
      filter.connect(pluckGain);
      pluckGain.connect(masterGain);
      pluck.start(t);
      pluck.stop(t + beatLen * 2);
      scheduledNodes.push(pluck);
    }
  }

  return masterGain;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AudioStudio() {
  const { user } = useOutletContext();
  const [tab, setTab] = useState('library');
  const [showRevisions, setShowRevisions] = useState(false);
  const [showSharedDashboard, setShowSharedDashboard] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState('audio-project-001');

  // Music state
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([0.6]);
  const scheduledNodesRef = useRef([]);
  const masterGainRef = useRef(null);



  // Sync volume while playing
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume[0], getCtx().currentTime);
    }
  }, [volume]);

  // Update presence when component mounts/tab changes
  useEffect(() => {
    base44.functions.invoke('updatePresence', {
      project_id: currentProjectId,
      status: 'editing',
      current_section: tab
    });
  }, [tab, currentProjectId]);

  // Cleanup on unmount
  useEffect(() => () => stopMusic(), []);

  const stopMusic = () => {
    scheduledNodesRef.current.forEach(n => { try { n.stop(); } catch (_) {} });
    scheduledNodesRef.current = [];
    masterGainRef.current = null;
    setIsPlaying(false);
  };

  const toggleMusic = () => {
    if (isPlaying) { stopMusic(); return; }
    const ctx = getCtx();
    const nodes = [];
    masterGainRef.current = createLoFiTrack(ctx, selectedPreset, volume[0], nodes);
    scheduledNodesRef.current = nodes;
    setIsPlaying(true);
  };

  const handlePresetChange = (preset) => {
    if (isPlaying) stopMusic();
    setSelectedPreset(preset);
  };



  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Headphones className="w-6 h-6 text-primary" /> Audio Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Generate music, soundscapes, and text-to-speech narration</p>
        </div>
        <div className="flex items-center gap-2">
          <PresenceIndicator projectId={currentProjectId} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSharedDashboard(true)}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Team
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevisions(true)}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            Revisions
          </Button>
        </div>
      </div>

      <AudioRevisionHistory
        projectId={currentProjectId}
        isOpen={showRevisions}
        onClose={() => setShowRevisions(false)}
      />

      <SharedProjectDashboard
        projectId={currentProjectId}
        isOpen={showSharedDashboard}
        onClose={() => setShowSharedDashboard(false)}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        {[
          { id: 'library', label: 'Music Library', icon: Library },
          { id: 'music', label: 'Beat Generator', icon: Music },
          { id: 'tts', label: 'Voice Studio', icon: Mic },
          { id: 'video', label: 'Video Overlay', icon: Film },
          { id: 'editor', label: 'Audio Editor', icon: Scissors },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LIBRARY TAB ── */}
      {tab === 'library' && <MusicLibrary />}

      {/* ── BEAT GENERATOR TAB ── */}
      {tab === 'music' && (
        <div className="space-y-5">
          {/* AI Beat Generator */}
          <BeatGenerator />

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or play lo-fi presets</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose a Style</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset)}
                  className={`text-left p-4 rounded-xl border transition-all ${selectedPreset.id === preset.id ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary/40'}`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <preset.icon className={`w-4 h-4 ${selectedPreset.id === preset.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-semibold text-sm">{preset.label}</span>
                    {preset.bpm > 0 && <Badge variant="secondary" className="text-xs ml-auto">{preset.bpm} BPM</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Volume</span>
              <span className="ml-auto text-sm text-muted-foreground">{Math.round(volume[0] * 100)}%</span>
            </div>
            <Slider value={volume} onValueChange={setVolume} min={0} max={1} step={0.01} className="w-full" />
          </div>

          {/* Live waveform bars */}
          {isPlaying && (
            <div className="flex items-end justify-center gap-1 h-12 px-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-primary rounded-full"
                  style={{
                    height: `${30 + Math.sin(i * 0.7) * 40 + 20}%`,
                    animationName: 'audioBar',
                    animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDirection: 'alternate',
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
            </div>
          )}

          <Button onClick={toggleMusic} size="lg" className="w-full gap-2">
            {isPlaying
              ? <><Square className="w-4 h-4" /> Stop</>
              : <><Play className="w-4 h-4" /> Play {selectedPreset.label}</>}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Music plays directly in your browser via the Web Audio API. Best enjoyed with headphones.
          </p>
        </div>
      )}

      {/* ── TTS TAB ── */}
      {tab === 'tts' && <VoiceStudio />}

      {/* ── VIDEO OVERLAY TAB ── */}
      {tab === 'video' && <VideoOverlay />}

      {/* ── AUDIO EDITOR TAB ── */}
      {tab === 'editor' && <AudioEditor />}

      <style>{`
        @keyframes audioBar {
          from { transform: scaleY(0.3); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}