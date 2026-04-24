import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload, Play, Pause, Download, Scissors, X,
  Volume2, Loader2, Check, RefreshCw
} from 'lucide-react';
import TimelineVoiceNotes from './TimelineVoiceNotes';

export default function AudioEditor({ projectId }) {
  const [audioFile, setAudioFile] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [editorTab, setEditorTab] = useState('edit');

  // Trim handles (in seconds)
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // Fade settings (in seconds)
  const [fadeIn, setFadeIn] = useState([0]);
  const [fadeOut, setFadeOut] = useState([0]);

  const [waveformData, setWaveformData] = useState([]);

  const ctxRef = useRef(null);
  const sourceRef = useRef(null);
  const startTimeRef = useRef(0);
  const startOffsetRef = useRef(0);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const loadFile = async (file) => {
    if (!file || !file.type.startsWith('audio/')) return;
    setLoading(true);
    setAudioFile(file);
    setIsPlaying(false);
    setCurrentTime(0);
    setExportDone(false);
    stopPlayback();

    const ctx = getCtx();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
    setDuration(decoded.duration);
    setTrimStart(0);
    setTrimEnd(decoded.duration);
    setFadeIn([0]);
    setFadeOut([0]);

    // Build waveform peak data
    const raw = decoded.getChannelData(0);
    const BARS = 120;
    const blockSize = Math.floor(raw.length / BARS);
    const peaks = [];
    for (let i = 0; i < BARS; i++) {
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const abs = Math.abs(raw[i * blockSize + j]);
        if (abs > max) max = abs;
      }
      peaks.push(max);
    }
    setWaveformData(peaks);
    setLoading(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (file) loadFile(file);
  };

  const stopPlayback = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (_) {}
      sourceRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setIsPlaying(false);
  };

  const play = () => {
    if (!audioBuffer) return;
    const ctx = getCtx();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // Apply fade in / fade out via gain node
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    const segDuration = trimEnd - trimStart;
    const fadeInSec = Math.min(fadeIn[0], segDuration * 0.45);
    const fadeOutSec = Math.min(fadeOut[0], segDuration * 0.45);

    gainNode.gain.setValueAtTime(fadeInSec > 0 ? 0 : 1, now);
    if (fadeInSec > 0) {
      gainNode.gain.linearRampToValueAtTime(1, now + fadeInSec);
    }
    if (fadeOutSec > 0) {
      gainNode.gain.setValueAtTime(1, now + segDuration - fadeOutSec);
      gainNode.gain.linearRampToValueAtTime(0, now + segDuration);
    }

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    const offset = startOffsetRef.current < trimStart || startOffsetRef.current >= trimEnd
      ? trimStart
      : startOffsetRef.current;

    source.start(0, offset, trimEnd - offset);
    source.onended = () => {
      setIsPlaying(false);
      startOffsetRef.current = trimStart;
      setCurrentTime(trimStart);
      cancelAnimationFrame(animFrameRef.current);
    };

    sourceRef.current = source;
    startTimeRef.current = ctx.currentTime - (offset - trimStart);
    startOffsetRef.current = offset;
    setIsPlaying(true);

    const tick = () => {
      if (!ctxRef.current) return;
      const elapsed = ctxRef.current.currentTime - startTimeRef.current;
      const t = trimStart + elapsed;
      if (t <= trimEnd) {
        setCurrentTime(t);
        startOffsetRef.current = t;
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const togglePlayback = () => {
    if (isPlaying) { stopPlayback(); } else { play(); }
  };

  const handleExport = async () => {
    if (!audioBuffer) return;
    setExporting(true);
    const ctx = getCtx();
    const segDuration = trimEnd - trimStart;
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(trimStart * sampleRate);
    const endSample = Math.floor(trimEnd * sampleRate);
    const frameCount = endSample - startSample;

    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, frameCount, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = offlineCtx.createGain();
    const fadeInSec = Math.min(fadeIn[0], segDuration * 0.45);
    const fadeOutSec = Math.min(fadeOut[0], segDuration * 0.45);

    gainNode.gain.setValueAtTime(fadeInSec > 0 ? 0 : 1, 0);
    if (fadeInSec > 0) gainNode.gain.linearRampToValueAtTime(1, fadeInSec);
    if (fadeOutSec > 0) {
      gainNode.gain.setValueAtTime(1, segDuration - fadeOutSec);
      gainNode.gain.linearRampToValueAtTime(0, segDuration);
    }

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    source.start(0, trimStart, segDuration);

    const rendered = await offlineCtx.startRendering();

    // Encode to WAV
    const wavBlob = encodeWav(rendered);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(audioFile?.name || 'audio').replace(/\.[^/.]+$/, '')}_edited.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setExporting(false);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${sec.toString().padStart(2, '0')}.${ms}`;
  };

  const trimmedDuration = trimEnd - trimStart;
  const BARS = waveformData.length;

  // Waveform bar color based on position
  const barColor = (i) => {
    const t = (i / BARS) * duration;
    if (t < trimStart || t > trimEnd) return 'bg-muted-foreground/30';
    const progress = (i / BARS) * duration;
    if (progress <= currentTime) return 'bg-primary';
    return 'bg-primary/40';
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Audio Editor</p>
        <p className="text-xs text-muted-foreground">Upload an audio file, trim it, add fades, and export the edited clip.</p>
      </div>

      {/* File upload */}
      {!audioFile ? (
        <label
          onDragOver={e => e.preventDefault()}
          onDrop={handleFileDrop}
          className="flex flex-col items-center justify-center gap-3 h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all"
        >
          <Upload className="w-7 h-7 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Drop an audio file or <span className="text-primary font-medium">browse</span></p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">MP3, WAV, OGG, M4A, FLAC</p>
          </div>
          <input type="file" accept="audio/*" className="hidden" onChange={handleFileDrop} />
        </label>
      ) : (
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl border border-border">
          <Scissors className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs font-medium truncate flex-1">{audioFile.name}</span>
          <Badge variant="secondary" className="text-xs">{fmt(duration)}</Badge>
          <button
            onClick={() => { stopPlayback(); setAudioFile(null); setAudioBuffer(null); setWaveformData([]); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Decoding audio...</span>
        </div>
      )}

      {audioBuffer && !loading && (
        <>
          {/* Waveform */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waveform</p>
            <div className="flex items-end gap-px h-16 w-full">
              {waveformData.map((peak, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-colors duration-75 ${barColor(i)}`}
                  style={{ height: `${Math.max(4, peak * 100)}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Trim controls */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" /> Trim
              </p>
              <Badge variant="secondary" className="text-xs">
                {fmt(trimmedDuration)} selected
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Start</span>
                <span className="font-medium">{fmt(trimStart)}</span>
              </div>
              <Slider
                value={[trimStart]}
                onValueChange={([v]) => {
                  stopPlayback();
                  setTrimStart(Math.min(v, trimEnd - 0.1));
                  setCurrentTime(Math.min(v, trimEnd - 0.1));
                  startOffsetRef.current = Math.min(v, trimEnd - 0.1);
                }}
                min={0}
                max={duration}
                step={0.01}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">End</span>
                <span className="font-medium">{fmt(trimEnd)}</span>
              </div>
              <Slider
                value={[trimEnd]}
                onValueChange={([v]) => {
                  stopPlayback();
                  setTrimEnd(Math.max(v, trimStart + 0.1));
                }}
                min={0}
                max={duration}
                step={0.01}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { stopPlayback(); setTrimStart(0); setTrimEnd(duration); startOffsetRef.current = 0; setCurrentTime(0); }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Fade controls */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fade Effects</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fade In</span>
                  <span className="font-medium">{fadeIn[0].toFixed(1)}s</span>
                </div>
                <Slider value={fadeIn} onValueChange={setFadeIn} min={0} max={Math.min(5, trimmedDuration * 0.4)} step={0.1} />
                <div className="flex justify-between text-xs text-muted-foreground/60">
                  <span>None</span><span>5s</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fade Out</span>
                  <span className="font-medium">{fadeOut[0].toFixed(1)}s</span>
                </div>
                <Slider value={fadeOut} onValueChange={setFadeOut} min={0} max={Math.min(5, trimmedDuration * 0.4)} step={0.1} />
                <div className="flex justify-between text-xs text-muted-foreground/60">
                  <span>None</span><span>5s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for editing + voice notes */}
          <Tabs value={editorTab} onValueChange={setEditorTab} className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
              {projectId && <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>}
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              {/* Playback + Export */}
              <div className="flex gap-2">
                <Button onClick={togglePlayback} variant="outline" size="lg" className="flex-1 gap-2">
                  {isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Preview</>}
                </Button>
                <Button onClick={handleExport} disabled={exporting} size="lg" className="flex-1 gap-2">
                  {exporting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
                  ) : exportDone ? (
                    <><Check className="w-4 h-4" /> Downloaded!</>
                  ) : (
                    <><Download className="w-4 h-4" /> Export WAV</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Export renders your trimmed & faded clip as a WAV file — fully in your browser, no upload needed.
              </p>
            </TabsContent>

            {projectId && (
              <TabsContent value="comments">
                <TimelineVoiceNotes projectId={projectId} currentTime={currentTime} duration={duration} />
              </TabsContent>
            )}
          </Tabs>
          </>
          )}
          </div>
          );
}

// ── WAV encoder ──────────────────────────────────────────────────────────────
function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const channelData = [];
  for (let c = 0; c < numChannels; c++) channelData.push(audioBuffer.getChannelData(c));
  const numFrames = audioBuffer.length;
  const dataLength = numFrames * numChannels * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channelData[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}