import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Wand2, Play, Pause, Square, Download, Loader2,
  Sparkles, RefreshCw, Music2, Volume2
} from 'lucide-react';
import { toast } from 'sonner';

const MOOD_PRESETS = [
  { label: 'Chill Lo-Fi', emoji: '☕', prompt: 'relaxing lo-fi hip-hop beat with soft piano, gentle vinyl crackle, and slow mellow drums at 75 BPM' },
  { label: 'Hype Trap', emoji: '🔥', prompt: 'hard-hitting trap beat with 808 bass, crispy hi-hats, energetic snare rolls, and dark synth pads at 140 BPM' },
  { label: 'Cinematic', emoji: '🎬', prompt: 'epic cinematic orchestral score with dramatic strings, deep brass hits, building percussion, and emotional piano at 90 BPM' },
  { label: 'Pop Banger', emoji: '🎵', prompt: 'upbeat pop production with four-on-the-floor kick, punchy claps, bright synth leads, and catchy melodic hook at 128 BPM' },
  { label: 'Dark Ambient', emoji: '🌑', prompt: 'dark atmospheric ambient soundscape with deep drones, eerie pads, reverb-heavy textures, and slow evolving sound design' },
  { label: 'Afrobeats', emoji: '🌍', prompt: 'vibrant afrobeats rhythm with percussion-heavy groove, talking drum pattern, bright guitar stabs, and warm bass at 100 BPM' },
  { label: 'R&B Soul', emoji: '💜', prompt: 'smooth R&B soul beat with warm chord progressions, vintage electric piano, silky hi-hats, and deep punchy kick at 85 BPM' },
  { label: 'House Music', emoji: '🏠', prompt: 'classic deep house groove with four-on-the-floor kick, shuffled hi-hats, warm bassline, and soulful organ stabs at 124 BPM' },
];

const DURATIONS = [
  { label: '10s',   value: 10 },
  { label: '15s',   value: 15 },
  { label: '22s',   value: 22 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
];

// ElevenLabs max is ~22s; durations above this need special handling
const ELEVENLABS_MAX = 22;

export default function BeatGenerator() {
  const [prompt, setPrompt]         = useState('');
  const [duration, setDuration]     = useState(22);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl]     = useState(null);
  const [playing, setPlaying]       = useState(false);
  const [volume, setVolume]         = useState([0.8]);
  const [waveHeights, setWaveHeights] = useState(Array(48).fill(4));
  const [lastPromptUsed, setLastPromptUsed] = useState('');
  const audioRef    = useRef(null);
  const waveAnimRef = useRef(null);
  const blobRef     = useRef(null);

  const animateWave = (active) => {
    clearInterval(waveAnimRef.current);
    if (active) {
      waveAnimRef.current = setInterval(() => {
        setWaveHeights(Array(48).fill(0).map(() => 4 + Math.random() * 96));
      }, 80);
    } else {
      setWaveHeights(Array(48).fill(4));
    }
  };

  // Build a prompt with a random seed for uniqueness
  const buildFullPrompt = (basePrompt) => {
    const seed = Math.random().toString(36).slice(2, 8);
    return `${basePrompt} [variation: ${seed}]`;
  };

  const generate = async (basePrompt) => {
    const effectivePrompt = basePrompt || prompt;
    if (!effectivePrompt.trim()) { toast.error('Describe your beat first.'); return; }

    setGenerating(true);
    setAudioUrl(null);
    setPlaying(false);
    if (audioRef.current) audioRef.current.pause();

    const fullPrompt = buildFullPrompt(effectivePrompt);
    setLastPromptUsed(effectivePrompt);

    // Warn about extended durations
    if (duration > ELEVENLABS_MAX) {
      toast.info('Generating extended track — this may take a moment', { duration: 4000 });
    }

    // For durations > ELEVENLABS_MAX, cap at 22s for the API call and note the limitation
    const apiDuration = Math.min(duration, ELEVENLABS_MAX);

    try {
      const res = await fetch('/api/sound-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullPrompt, duration_seconds: apiDuration }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }

      const contentType = res.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.fallback) {
          generateWebAudioBeat();
          return;
        }
        throw new Error(data.error || 'Unexpected response');
      }

      // Audio binary received
      const blob = await res.blob();
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      const url = URL.createObjectURL(blob);
      blobRef.current = url;
      setAudioUrl(url);

      if (duration > ELEVENLABS_MAX) {
        toast.success(`Beat generated! (${apiDuration}s preview — ElevenLabs max is ${ELEVENLABS_MAX}s)`);
      } else {
        toast.success('Beat generated!');
      }
    } catch (err) {
      console.warn('ElevenLabs not available, falling back to Web Audio:', err.message);
      generateWebAudioBeat();
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    generate(lastPromptUsed || prompt);
  };

  // Fallback: generate a short demo beat with Web Audio API
  const generateWebAudioBeat = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Cap at 22s for Web Audio fallback too (rendering longer clips is impractical)
      const totalTime = Math.min(duration, ELEVENLABS_MAX);
      const bpm = 120;
      const beatLen = 60 / bpm;
      const beats = Math.floor(totalTime / beatLen);

      const offCtx = new OfflineAudioContext(2, ctx.sampleRate * totalTime, ctx.sampleRate);
      const masterGain = offCtx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(offCtx.destination);

      // Kick drum on every beat
      for (let i = 0; i < beats; i++) {
        const t = i * beatLen;
        const osc  = offCtx.createOscillator();
        const gain = offCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.15);
        gain.gain.setValueAtTime(1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(t); osc.stop(t + 0.15);
      }

      // Hi-hats on 8ths
      const bufferSize  = offCtx.sampleRate * 0.05;
      const noiseBuffer = offCtx.createBuffer(1, bufferSize, offCtx.sampleRate);
      const data        = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      for (let i = 0; i < beats * 2; i++) {
        const t      = i * (beatLen / 2);
        const src    = offCtx.createBufferSource();
        const g      = offCtx.createGain();
        const filter = offCtx.createBiquadFilter();
        src.buffer = noiseBuffer;
        filter.type = 'highpass'; filter.frequency.value = 8000;
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        src.connect(filter); filter.connect(g); g.connect(masterGain);
        src.start(t); src.stop(t + 0.04);
      }

      // Bass pad
      const bassOsc    = offCtx.createOscillator();
      const bassGain   = offCtx.createGain();
      const bassFilter = offCtx.createBiquadFilter();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = 55;
      bassGain.gain.value = 0.1;
      bassFilter.type = 'lowpass'; bassFilter.frequency.value = 200;
      bassOsc.connect(bassFilter); bassFilter.connect(bassGain); bassGain.connect(masterGain);
      bassOsc.start(0); bassOsc.stop(totalTime);

      offCtx.startRendering().then(buffer => {
        const wav  = encodeWAV(buffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        const url = URL.createObjectURL(blob);
        blobRef.current = url;
        setAudioUrl(url);
        const note = duration > ELEVENLABS_MAX
          ? ` (${totalTime}s demo — add ElevenLabs key for longer AI beats)`
          : '';
        toast.success(`Demo beat generated!${note}`);
      });
    } catch {
      toast.error('Beat generation failed.');
    }
    setGenerating(false);
  };

  function encodeWAV(buffer) {
    const numChannels  = buffer.numberOfChannels;
    const sampleRate   = buffer.sampleRate;
    const numSamples   = buffer.length;
    const bitsPerSample = 16;
    const blockAlign   = numChannels * (bitsPerSample / 8);
    const byteRate     = sampleRate * blockAlign;
    const dataSize     = numSamples * blockAlign;
    const ab   = new ArrayBuffer(44 + dataSize);
    const view = new DataView(ab);
    const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeStr(8, 'WAVE');
    writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true); writeStr(36, 'data'); view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
    }
    return ab;
  }

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      animateWave(false);
    } else {
      audioRef.current.volume = volume[0];
      audioRef.current.play();
      setPlaying(true);
      animateWave(true);
    }
  };

  const handleEnded = () => { setPlaying(false); animateWave(false); };

  const download = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl; a.download = 'philomni-beat.mp3'; a.click();
  };

  return (
    <div className="space-y-6">
      {/* Mood presets */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Moods</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MOOD_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => setPrompt(preset.prompt)}
              className={`text-left p-3 rounded-xl border transition-all ${prompt === preset.prompt ? 'border-primary bg-accent' : 'border-border hover:border-primary/40 bg-card'}`}
            >
              <span className="text-lg">{preset.emoji}</span>
              <p className="text-xs font-medium mt-1 leading-tight">{preset.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt input */}
      <div className="bg-gradient-to-br from-accent/60 to-accent/20 border border-primary/20 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" /> Describe Your Beat
        </p>
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. Dark trap beat with heavy 808 bass, fast hi-hats, and cinematic strings at 145 BPM…"
          rows={3}
          className="bg-card resize-none"
        />

        {/* Duration */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Duration:</span>
          {DURATIONS.map(d => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${duration === d.value ? 'bg-primary text-primary-foreground' : 'border border-border hover:border-primary/50'}`}
            >
              {d.label}
              {d.value > ELEVENLABS_MAX && (
                <span className="ml-1 opacity-60 text-[10px]">~{ELEVENLABS_MAX}s</span>
              )}
            </button>
          ))}
        </div>

        {duration > ELEVENLABS_MAX && (
          <p className="text-xs text-amber-400/80 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            ElevenLabs max is {ELEVENLABS_MAX}s — a {ELEVENLABS_MAX}s preview will be generated for longer durations.
          </p>
        )}

        <Button
          onClick={() => generate()}
          disabled={generating || !prompt.trim()}
          className="w-full gap-2"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Beat…</>
            : <><Sparkles className="w-4 h-4" /> Generate Beat</>}
        </Button>
      </div>

      {/* Player */}
      {audioUrl && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Music2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Generated Beat</p>
              <p className="text-xs text-muted-foreground truncate">
                {Math.min(duration, ELEVENLABS_MAX)}s · Custom AI Beat
              </p>
            </div>
            <Badge variant="outline" className="text-xs">Ready</Badge>
          </div>

          {/* Waveform */}
          <div className="flex items-end justify-center gap-0.5 h-16 bg-muted/50 rounded-xl px-3">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-full transition-all duration-75"
                style={{ height: `${h}%`, opacity: 0.5 + (h / 100) * 0.5 }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Slider
                value={volume}
                onValueChange={v => { setVolume(v); if (audioRef.current) audioRef.current.volume = v[0]; }}
                min={0} max={1} step={0.01}
                className="flex-1"
              />
            </div>

            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
              title="Regenerate (new variation)"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${generating ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={download} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Download">
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Regenerate button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={generating}
            className="w-full gap-2"
          >
            {generating
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating new variation…</>
              : <><RefreshCw className="w-3 h-3" /> Regenerate (new variation)</>}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Powered by ElevenLabs Sound Generation · Add your API key for AI-generated audio
      </p>

      <audio ref={audioRef} src={audioUrl || ''} onEnded={handleEnded} className="hidden" />
    </div>
  );
}
