import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Music, ImageIcon, Scissors, Loader2, Mic, MicOff, Square,
  Wand2, Type, Sliders, Zap, Play, Pause, RotateCcw,
  Bold, AlignCenter, Palette, Download
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// ── CSS filter presets ───────────────────────────────────────────────────────
const FILTERS = [
  { id: 'none',       label: 'Original',  css: '' },
  { id: 'vivid',      label: 'Vivid',     css: 'saturate(1.8) contrast(1.1)' },
  { id: 'cinematic',  label: 'Cinematic', css: 'contrast(1.2) saturate(0.85) sepia(0.1)' },
  { id: 'bw',         label: 'B&W',       css: 'grayscale(1) contrast(1.15)' },
  { id: 'warm',       label: 'Warm',      css: 'sepia(0.4) saturate(1.3) brightness(1.05)' },
  { id: 'cool',       label: 'Cool',      css: 'hue-rotate(15deg) saturate(1.2) brightness(0.95)' },
  { id: 'fade',       label: 'Fade',      css: 'contrast(0.85) brightness(1.1) saturate(0.7)' },
  { id: 'dramatic',   label: 'Dramatic',  css: 'contrast(1.5) saturate(1.4) brightness(0.9)' },
  { id: 'vintage',    label: 'Vintage',   css: 'sepia(0.6) contrast(0.9) brightness(1.1) saturate(0.8)' },
  { id: 'neon',       label: 'Neon',      css: 'saturate(2.5) contrast(1.3) brightness(1.1)' },
];

const SPEEDS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2 },
];

const TEXT_COLORS = ['#ffffff','#000000','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899'];

const FONT_SIZES = [16, 20, 24, 32, 40, 52, 64];

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'trim',      label: 'Trim',     icon: Scissors },
  { id: 'text',      label: 'Text',     icon: Type },
  { id: 'filters',   label: 'Filters',  icon: Sliders },
  { id: 'speed',     label: 'Speed',    icon: Zap },
  { id: 'voiceover', label: 'Voice',    icon: Mic },
  { id: 'music',     label: 'Music',    icon: Music },
  { id: 'ai',        label: 'AI Magic', icon: Wand2 },
  { id: 'thumbnail', label: 'Cover',    icon: ImageIcon },
];

export default function VideoEditor({ isOpen, onClose, videoUrl, onSave }) {
  const [tab, setTab] = useState('trim');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Trim
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);

  // Caption / hashtags (keep for save payload)
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');

  // Text overlays
  const [textOverlays, setTextOverlays] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [textBold, setTextBold] = useState(true);
  const [textPosition, setTextPosition] = useState('bottom');

  // Filters
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);

  // Speed
  const [speed, setSpeed] = useState(1);

  // Voiceover
  const [recording, setRecording] = useState(false);
  const [voiceoverUrl, setVoiceoverUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);

  // Music
  const [musicUrl, setMusicUrl] = useState('');
  const [musicVolume, setMusicVolume] = useState([0.5]);

  // Thumbnail
  const [thumbnail, setThumbnail] = useState(null);

  // AI Runway
  const [animating, setAnimating] = useState(false);
  const [animatePrompt, setAnimatePrompt] = useState('');
  const [animatedVideoUrl, setAnimatedVideoUrl] = useState(null);

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Compose CSS filter for preview
  const composedFilter = [
    selectedFilter.css,
    `brightness(${brightness[0]}%)`,
    `contrast(${contrast[0]}%)`,
    `saturate(${saturation[0]}%)`,
  ].filter(Boolean).join(' ');

  const handleLoadMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTrimEnd([100]);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    setTextOverlays(prev => [...prev, {
      id: Date.now(),
      text: textInput,
      color: textColor,
      size: textSize,
      bold: textBold,
      position: textPosition,
    }]);
    setTextInput('');
  };

  const removeOverlay = (id) => setTextOverlays(prev => prev.filter(o => o.id !== id));

  // Voiceover recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      mr.ondataavailable = e => voiceChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        setVoiceoverUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch { toast.error('Microphone permission denied.'); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // Music upload
  const handleMusicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      setMusicUrl(r.file_url);
      toast.success('Music added');
    } catch { toast.error('Music upload failed'); }
  };

  // Thumbnail upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      setThumbnail(r.file_url);
      toast.success('Cover image set');
    } catch { toast.error('Upload failed'); }
  };

  // Auto-generate thumbnail from video frame
  const captureThumbnail = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) setThumbnail(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.9);
    toast.success('Thumbnail captured from current frame');
  };

  // Runway AI animate
  const handleAnimateWithAI = async () => {
    if (!animatePrompt.trim()) { toast.error('Describe how you want to animate this.'); return; }
    setAnimating(true);
    setAnimatedVideoUrl(null);
    try {
      const res = await base44.functions.invoke('generateVideo', {
        prompt: animatePrompt,
        imageUrl: videoUrl,
        duration: 5,
      });
      if (res.data?.video_url) {
        setAnimatedVideoUrl(res.data.video_url);
        toast.success('AI animation complete!');
      } else if (res.data?.status === 'processing') {
        toast.info('Video is processing — check back in a moment.');
      }
    } catch { toast.error('AI animation failed. Check your Runway API key.'); }
    setAnimating(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        caption,
        hashtags: hashtags.split(',').map(h => h.trim()).filter(Boolean),
        thumbnail,
        trimStart: (trimStart[0] / 100) * duration,
        trimEnd: (trimEnd[0] / 100) * duration,
        musicUrl,
        musicVolume: musicVolume[0],
        aspectRatio,
        filter: composedFilter,
        speed,
        textOverlays,
        voiceoverUrl,
        animatedVideoUrl,
      });
      onClose();
    } catch { toast.error('Failed to save'); }
    setLoading(false);
  };

  const positionStyle = (pos) => {
    const base = 'absolute left-0 right-0 px-4 py-2 text-center';
    if (pos === 'top') return `${base} top-2`;
    if (pos === 'middle') return `${base} top-1/2 -translate-y-1/2`;
    return `${base} bottom-2`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[95vh] overflow-y-auto p-3 sm:p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wand2 className="w-4 h-4 text-primary" /> Video Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Preview pane */}
          <div className="lg:w-56 xl:w-64 flex-shrink-0 space-y-3">
            <div
              className="relative bg-black rounded-xl overflow-hidden"
              style={{ aspectRatio: aspectRatio.replace(':', '/') }}
            >
              {videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onLoadedMetadata={handleLoadMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setPlaying(false)}
                  className="w-full h-full object-contain"
                  style={{ filter: composedFilter }}
                  muted
                />
              )}
              {/* Text overlays */}
              {textOverlays.map(o => (
                <div
                  key={o.id}
                  className={positionStyle(o.position)}
                  style={{ color: o.color, fontSize: `${o.size * 0.6}px`, fontWeight: o.bold ? 700 : 400, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                >
                  {o.text}
                </div>
              ))}
              {/* Play overlay */}
              <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full p-3">
                  {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                </div>
              </button>
            </div>

            {/* Aspect ratio */}
            <div className="flex gap-1 flex-wrap">
              {['16:9','9:16','1:1','4:3'].map(r => (
                <button key={r} onClick={() => setAspectRatio(r)}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all ${aspectRatio === r ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                  {r}
                </button>
              ))}
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <Label className="text-xs">Caption</Label>
              <Textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add caption…" rows={2} className="resize-none text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hashtags</Label>
              <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#viral, #music" className="text-xs" />
            </div>
          </div>

          {/* Right: tabs + controls */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Tab bar — scrollable on mobile */}
            <div className="flex gap-1 overflow-x-auto pb-1 bg-muted rounded-xl p-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  <t.icon className="w-3.5 h-3.5" />{t.label}
                </button>
              ))}
            </div>

            {/* ── TRIM ── */}
            {tab === 'trim' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Start: {((trimStart[0] / 100) * duration).toFixed(1)}s</span>
                    <span>Duration: {(((trimEnd[0] - trimStart[0]) / 100) * duration).toFixed(1)}s</span>
                    <span>End: {((trimEnd[0] / 100) * duration).toFixed(1)}s</span>
                  </div>
                  {/* Timeline bar */}
                  <div className="relative h-10 bg-muted rounded-lg overflow-hidden cursor-pointer"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = ((e.clientX - rect.left) / rect.width) * 100;
                      if (videoRef.current) videoRef.current.currentTime = (pct / 100) * duration;
                    }}
                  >
                    {/* Trim selection */}
                    <div className="absolute h-full bg-primary/20 border-x-2 border-primary"
                      style={{ left: `${trimStart[0]}%`, width: `${trimEnd[0] - trimStart[0]}%` }} />
                    {/* Playhead */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                      style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start point</Label>
                      <Slider value={trimStart} onValueChange={v => setTrimStart([Math.min(v[0], trimEnd[0] - 5)])} min={0} max={100} step={0.5} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End point</Label>
                      <Slider value={trimEnd} onValueChange={v => setTrimEnd([Math.max(v[0], trimStart[0] + 5)])} min={0} max={100} step={0.5} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TEXT OVERLAYS ── */}
            {tab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Text</Label>
                  <Input value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Your text…" onKeyDown={e => e.key === 'Enter' && addTextOverlay()} />
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                  <div>
                    <Label className="text-xs block mb-1">Size</Label>
                    <select value={textSize} onChange={e => setTextSize(Number(e.target.value))}
                      className="h-8 px-2 rounded-md border border-input bg-transparent text-xs">
                      {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Position</Label>
                    <div className="flex gap-1">
                      {['top','middle','bottom'].map(p => (
                        <button key={p} onClick={() => setTextPosition(p)}
                          className={`px-2 py-1 rounded text-xs border transition-all capitalize ${textPosition === p ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Style</Label>
                    <button onClick={() => setTextBold(v => !v)}
                      className={`p-2 rounded border transition-all ${textBold ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs block mb-2">Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {TEXT_COLORS.map(c => (
                      <button key={c} onClick={() => setTextColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${textColor === c ? 'border-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <Button onClick={addTextOverlay} disabled={!textInput.trim()} size="sm" className="gap-2">
                  <Type className="w-3.5 h-3.5" /> Add Text
                </Button>
                {textOverlays.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Active Overlays</Label>
                    {textOverlays.map(o => (
                      <div key={o.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <span className="flex-1 text-sm truncate" style={{ color: o.color, fontWeight: o.bold ? 700 : 400 }}>{o.text}</span>
                        <Badge variant="secondary" className="text-xs">{o.position}</Badge>
                        <button onClick={() => removeOverlay(o.id)} className="text-muted-foreground hover:text-destructive transition-colors text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── FILTERS ── */}
            {tab === 'filters' && (
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {FILTERS.map(f => (
                    <button key={f.id} onClick={() => setSelectedFilter(f)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${selectedFilter.id === f.id ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'}`}>
                      <div className="w-10 h-8 rounded-md bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                        <div className="w-full h-full" style={{ filter: f.css }} />
                      </div>
                      <span className="text-xs">{f.label}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Brightness</span><span>{brightness[0]}%</span></div>
                    <Slider value={brightness} onValueChange={setBrightness} min={50} max={150} step={1} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Contrast</span><span>{contrast[0]}%</span></div>
                    <Slider value={contrast} onValueChange={setContrast} min={50} max={150} step={1} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Saturation</span><span>{saturation[0]}%</span></div>
                    <Slider value={saturation} onValueChange={setSaturation} min={0} max={200} step={1} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setBrightness([100]); setContrast([100]); setSaturation([100]); setSelectedFilter(FILTERS[0]); }} className="gap-1.5 text-xs">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </Button>
                </div>
              </div>
            )}

            {/* ── SPEED ── */}
            {tab === 'speed' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Adjust playback speed. Changes apply on export.</p>
                <div className="grid grid-cols-3 gap-2">
                  {SPEEDS.map(s => (
                    <button key={s.value} onClick={() => setSpeed(s.value)}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all ${speed === s.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                  {speed < 1 && '🐢 Slow motion — great for dramatic moments and detail shots.'}
                  {speed === 1 && '▶️ Normal speed'}
                  {speed > 1 && '⚡ Fast forward — great for time-lapses and action content.'}
                </div>
              </div>
            )}

            {/* ── VOICEOVER ── */}
            {tab === 'voiceover' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Record a voiceover directly from your microphone. It will be mixed with your video.</p>
                <div className="flex gap-3">
                  {!recording ? (
                    <Button onClick={startRecording} className="gap-2 flex-1">
                      <Mic className="w-4 h-4" /> Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="destructive" className="gap-2 flex-1 animate-pulse">
                      <Square className="w-4 h-4" /> Stop Recording
                    </Button>
                  )}
                  {voiceoverUrl && (
                    <button onClick={() => setVoiceoverUrl(null)} className="px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Remove
                    </button>
                  )}
                </div>
                {recording && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Recording…
                  </div>
                )}
                {voiceoverUrl && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Voiceover recorded:</p>
                    <audio src={voiceoverUrl} controls className="w-full" />
                  </div>
                )}
              </div>
            )}

            {/* ── MUSIC ── */}
            {tab === 'music' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Upload background music to mix with your video.</p>
                <label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Music className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Upload Audio</p>
                    <p className="text-xs text-muted-foreground mt-1">MP3, WAV, AAC</p>
                  </div>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                </label>
                {musicUrl && (
                  <div className="space-y-3">
                    <audio src={musicUrl} controls className="w-full" />
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Music Volume</span><span>{Math.round(musicVolume[0] * 100)}%</span></div>
                      <Slider value={musicVolume} onValueChange={setMusicVolume} min={0} max={1} step={0.01} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI MAGIC (Runway) ── */}
            {tab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary/10 to-accent border border-primary/20 rounded-xl p-4 space-y-1">
                  <p className="font-semibold text-sm flex items-center gap-2"><Wand2 className="w-4 h-4 text-primary" /> Animate with Runway AI</p>
                  <p className="text-xs text-muted-foreground">Describe how you want this clip to move and Runway will generate a new animated version.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Animation Prompt</Label>
                  <Textarea
                    value={animatePrompt}
                    onChange={e => setAnimatePrompt(e.target.value)}
                    placeholder="e.g. Slow cinematic zoom in, dramatic camera pull-back, dynamic transitions with particles…"
                    rows={3}
                  />
                </div>
                <Button onClick={handleAnimateWithAI} disabled={animating || !animatePrompt.trim()} className="w-full gap-2">
                  {animating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating (may take ~60s)…</> : <><Wand2 className="w-4 h-4" /> Animate with AI</>}
                </Button>
                {animating && (
                  <p className="text-xs text-center text-muted-foreground">Runway is generating your video. This typically takes 30–90 seconds…</p>
                )}
                {animatedVideoUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-green-600">AI Animation Complete!</p>
                    <video src={animatedVideoUrl} controls className="w-full rounded-xl" />
                    <a href={animatedVideoUrl} download target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 w-full"><Download className="w-4 h-4" /> Download</Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── THUMBNAIL ── */}
            {tab === 'thumbnail' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Set a custom cover image for your video.</p>
                <div className="flex gap-2">
                  <Button onClick={captureThumbnail} variant="outline" size="sm" className="gap-2 flex-1">
                    <ImageIcon className="w-4 h-4" /> Capture Current Frame
                  </Button>
                  <label className="flex-1">
                    <div className="h-9 px-3 border border-border rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                      <ImageIcon className="w-4 h-4" /> Upload Image
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                  </label>
                </div>
                {thumbnail && (
                  <div className="space-y-2">
                    <img src={thumbnail} alt="Thumbnail" className="w-full rounded-xl object-cover max-h-48" />
                    <button onClick={() => setThumbnail(null)} className="text-xs text-destructive hover:underline">Remove</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-3 border-t border-border mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
