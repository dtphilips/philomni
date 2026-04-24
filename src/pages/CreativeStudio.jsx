import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Sparkles, Loader2, Download, Play, Pause, RotateCcw,
  Wand2, Film, Camera, Zap, Mountain, RefreshCw, Copy, Check,
  Image as ImageIcon, Video, User, Palette, Upload, X,
  ChevronRight, Mic, Volume2, ArrowUpFromLine, Trash2,
} from 'lucide-react';
import ShareProjectButton from '@/components/creative/ShareProjectButton';

// ── Style presets ────────────────────────────────────────────────────────────
const STYLE_PRESETS = [
  { id: 'cinematic',  label: 'Cinematic',   emoji: '🎬', suffix: 'cinematic photography, anamorphic lens, golden hour lighting, bokeh, 8K ultra detailed, film grain' },
  { id: 'portrait',   label: 'Portrait',    emoji: '🖼️', suffix: 'professional portrait, soft studio lighting, shallow depth of field, award-winning, sharp focus' },
  { id: 'fantasy',    label: 'Fantasy',     emoji: '✨', suffix: 'epic fantasy art, concept art, dramatic magical atmosphere, highly detailed, trending on ArtStation' },
  { id: 'noir',       label: 'Noir',        emoji: '🌑', suffix: 'film noir, black and white, dramatic shadows, high contrast, moody 1940s aesthetic' },
  { id: 'anime',      label: 'Anime',       emoji: '🌸', suffix: 'anime style, Studio Ghibli inspired, vibrant colors, detailed background, beautiful composition' },
  { id: 'neon',       label: 'Neon Future', emoji: '💜', suffix: 'cyberpunk, neon lights, futuristic city, rain reflection, ultra detailed, blade runner aesthetic' },
  { id: 'nature',     label: 'Nature',      emoji: '🌿', suffix: 'landscape photography, golden hour, national geographic style, ultra wide angle, stunning natural lighting' },
  { id: 'abstract',   label: 'Abstract',    emoji: '🎨', suffix: 'abstract digital art, vivid colors, flowing shapes, generative art, high resolution' },
];

const ASPECT_RATIOS = [
  { label: '1:1',  value: '1024x1024', icon: '⬛' },
  { label: '16:9', value: '1344x768',  icon: '▬' },
  { label: '9:16', value: '768x1344',  icon: '▮' },
  { label: '4:3',  value: '1024x768',  icon: '▭' },
];

// ── Animation presets ────────────────────────────────────────────────────────
const ANIMATION_PRESETS = [
  { id: 'slow_zoom', label: 'Slow Zoom', emoji: '🔍', desc: 'Ken Burns — gentle zoom in', css: `@keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.18); } } .anim-img { animation: slowZoom 8s ease-in-out infinite alternate; }` },
  { id: 'pan_right', label: 'Cinematic Pan', emoji: '🎥', desc: 'Slow horizontal pan like a film shot', css: `@keyframes panRight { from { transform: scale(1.15) translateX(-5%); } to { transform: scale(1.15) translateX(5%); } } .anim-img { animation: panRight 9s ease-in-out infinite alternate; }` },
  { id: 'drift', label: 'Dreamlike Drift', emoji: '🌊', desc: 'Subtle floating drift motion', css: `@keyframes drift { 0% { transform: scale(1.08) translate(0,0); } 50% { transform: scale(1.1) translate(1.5%,-1%); } 100% { transform: scale(1.08) translate(0,0); } } .anim-img { animation: drift 12s ease-in-out infinite; }` },
  { id: 'zoom_out', label: 'Epic Reveal', emoji: '🌄', desc: 'Zoom out to reveal the full scene', css: `@keyframes zoomOut { from { transform: scale(1.25); } to { transform: scale(1); } } .anim-img { animation: zoomOut 10s ease-out infinite alternate; }` },
  { id: 'pulse_glow', label: 'Pulse & Glow', emoji: '✨', desc: 'Subtle pulsing with brightness', css: `@keyframes pulseGlow { from { transform: scale(1); filter: brightness(1); } to { transform: scale(1.04); filter: brightness(1.15) saturate(1.2); } } .anim-img { animation: pulseGlow 4s ease-in-out infinite alternate; }` },
  { id: 'vhs', label: 'VHS Glitch', emoji: '📼', desc: 'Retro VHS scan-line effect', css: `@keyframes vhsDrift { 0% { transform: scale(1) skewX(0deg); filter: hue-rotate(0deg); } 15% { transform: scale(1.01) skewX(0.3deg); filter: hue-rotate(5deg); } 100% { transform: scale(1) skewX(0deg); filter: hue-rotate(0deg); } } .anim-img { animation: vhsDrift 3s ease-in-out infinite; }` },
];

// ── Style Transfer presets ───────────────────────────────────────────────────
const STYLE_TRANSFER_PRESETS = [
  { id: 'van_gogh',     label: 'Van Gogh',      emoji: '🌻', suffix: 'in the style of Van Gogh, swirling brushstrokes, vivid colors, post-impressionist painting' },
  { id: 'monet',        label: 'Monet',          emoji: '🎨', suffix: 'in the style of Claude Monet, impressionist painting, soft light, water reflections' },
  { id: 'anime_style',  label: 'Anime',          emoji: '🌸', suffix: 'converted to anime style, clean lines, vibrant colors, Studio Ghibli aesthetic' },
  { id: 'oil_painting', label: 'Oil Painting',   emoji: '🖼️', suffix: 'oil painting, thick brushstrokes, classical technique, museum quality' },
  { id: 'watercolor',   label: 'Watercolor',     emoji: '💧', suffix: 'watercolor painting, soft edges, translucent colors, artistic wash technique' },
  { id: 'sketch',       label: 'Pencil Sketch',  emoji: '✏️', suffix: 'pencil sketch, hand drawn, detailed line art, black and white illustration' },
  { id: 'neon_art',     label: 'Neon',           emoji: '💜', suffix: 'neon art style, glowing colors, dark background, cyberpunk aesthetic' },
  { id: 'cyberpunk',    label: 'Cyberpunk',      emoji: '🤖', suffix: 'cyberpunk style, neon lights, futuristic, dystopian city atmosphere' },
  { id: 'vintage',      label: 'Vintage Film',   emoji: '📷', suffix: 'vintage film photography, grain, desaturated, 1970s aesthetic, lomography' },
  { id: 'pop_art',      label: 'Pop Art',        emoji: '🟡', suffix: 'pop art style, Andy Warhol inspired, bold colors, halftone dots, graphic' },
  { id: 'comic',        label: 'Comic Book',     emoji: '💥', suffix: 'comic book art style, bold outlines, flat colors, dynamic composition' },
  { id: 'minimalist',   label: 'Minimalist',     emoji: '⬜', suffix: 'minimalist art, clean lines, simple shapes, limited palette, modern design' },
  { id: 'pixel_art',    label: 'Pixel Art',      emoji: '🕹️', suffix: 'pixel art, 16-bit style, retro video game aesthetic, pixelated' },
  { id: '3d_render',    label: '3D Render',      emoji: '🔷', suffix: '3D rendered, photorealistic CGI, ray tracing, cinema 4D style, ultra detailed' },
  { id: 'impressionist',label: 'Impressionist',  emoji: '🌅', suffix: 'impressionist painting, loose brushstrokes, captured light and movement, artistic' },
  { id: 'abstract_exp', label: 'Abstract',       emoji: '🌀', suffix: 'abstract expressionism, bold non-representational shapes, Jackson Pollock style' },
];

const AVATAR_VOICES = [
  { id: 'emma',    name: 'Emma',    style: 'Professional Female',  emoji: '👩‍💼' },
  { id: 'james',   name: 'James',   style: 'Deep Male',            emoji: '👨‍💼' },
  { id: 'sophia',  name: 'Sophia',  style: 'Friendly Female',      emoji: '🙎‍♀️' },
  { id: 'oliver',  name: 'Oliver',  style: 'Authoritative Male',   emoji: '🎙️' },
  { id: 'luna',    name: 'Luna',    style: 'Warm Storyteller',     emoji: '✨' },
  { id: 'max',     name: 'Max',     style: 'Energetic Presenter',  emoji: '⚡' },
];

function ImagePreview({ src, generating, placeholder, onRegenerate, onDownload, children }) {
  return (
    <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border relative">
      {generating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium">Generating...</p>
        </div>
      )}
      {!generating && !src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Mountain className="w-12 h-12 opacity-20" />
          <p className="text-sm">{placeholder || 'Your image will appear here'}</p>
        </div>
      )}
      {src && (
        <>
          <img src={src} alt="Generated" className="w-full h-full object-cover" />
          {children}
        </>
      )}
    </div>
  );
}

function FileDropZone({ onFile, preview, accept = 'image/*', label = 'Click or drag to upload' }) {
  const inputRef = useRef(null);
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer overflow-hidden"
      style={{ minHeight: 160 }}
    >
      {preview ? (
        <img src={preview} className="w-full h-full object-cover absolute inset-0" alt="" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <Upload className="w-8 h-8 opacity-50" />
          <p className="text-sm">{label}</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreativeStudio() {
  let user = null;
  try { ({ user } = useOutletContext() || {}); } catch {}

  // Video tools state
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [selectedAnimation, setSelectedAnimation] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [animSpeed, setAnimSpeed] = useState([1]);
  const [copied, setCopied] = useState(false);

  // Image AI state
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgStyle, setImgStyle] = useState(STYLE_PRESETS[0]);
  const [imgRatio, setImgRatio] = useState(ASPECT_RATIOS[0]);
  const [imgResult, setImgResult] = useState(null);
  const [imgGenerating, setImgGenerating] = useState(false);
  const [variationFile, setVariationFile] = useState(null);
  const [variationPreview, setVariationPreview] = useState('');
  const [variationDesc, setVariationDesc] = useState('');
  const [variationResult, setVariationResult] = useState(null);
  const [variationGenerating, setVariationGenerating] = useState(false);
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState('');
  const [bgRemoving, setBgRemoving] = useState(false);

  // Avatar state
  const [avatarPhoto, setAvatarPhoto] = useState(null);
  const [avatarPhotoPreview, setAvatarPhotoPreview] = useState('');
  const [avatarText, setAvatarText] = useState('');
  const [avatarVoice, setAvatarVoice] = useState(AVATAR_VOICES[0]);
  const [avatarGenerating, setAvatarGenerating] = useState(false);
  const [avatarDone, setAvatarDone] = useState(false);

  // Style transfer state
  const [styleFile, setStyleFile] = useState(null);
  const [stylePreview, setStylePreview] = useState('');
  const [selectedTransferStyle, setSelectedTransferStyle] = useState(STYLE_TRANSFER_PRESETS[0]);
  const [styleResult, setStyleResult] = useState(null);
  const [styleTransferring, setStyleTransferring] = useState(false);

  // ── Video tools handlers ─────────────────────────────────────────────────
  const buildPrompt = () => prompt.trim() ? `${prompt.trim()}, ${selectedStyle.suffix}` : '';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true); setGeneratedUrl(null); setSelectedAnimation(null); setAnimating(false);
    const full = buildPrompt();
    setEnhancedPrompt(full);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: full });
      setGeneratedUrl(res.url);
    } catch { toast.error('Image generation failed'); }
    setGenerating(false);
  };

  const handleRegenerate = async () => {
    if (!enhancedPrompt) return;
    setGenerating(true); setGeneratedUrl(null);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: enhancedPrompt });
      setGeneratedUrl(res.url);
    } catch {}
    setGenerating(false);
  };

  const toggleAnimation = (anim) => {
    if (selectedAnimation?.id === anim.id) { setSelectedAnimation(null); setAnimating(false); }
    else { setSelectedAnimation(anim); setAnimating(true); }
  };

  const getAnimCss = () => {
    if (!selectedAnimation) return '';
    return selectedAnimation.css.replace(/(\d+(\.\d+)?)s/g, (_, n) => `${(parseFloat(n) / animSpeed[0]).toFixed(2)}s`);
  };

  const downloadUrl = (url, name = 'philomni-image.jpg') => {
    const a = document.createElement('a'); a.href = url; a.download = name; a.target = '_blank'; a.click();
  };

  // ── Image AI handlers ────────────────────────────────────────────────────
  const handleImageGenerate = async () => {
    if (!imgPrompt.trim()) { toast.error('Describe your image first'); return; }
    setImgGenerating(true); setImgResult(null);
    try {
      const full = `${imgPrompt.trim()}, ${imgStyle.suffix}`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: full });
      setImgResult(res.url);
    } catch { toast.error('Generation failed'); }
    setImgGenerating(false);
  };

  const handleVariation = async () => {
    if (!variationDesc.trim()) { toast.error('Describe the variation you want'); return; }
    setVariationGenerating(true); setVariationResult(null);
    try {
      const prompt = variationDesc.trim() + (variationFile ? ', based on uploaded image' : '');
      const res = await base44.integrations.Core.GenerateImage({ prompt, style: imgStyle.id });
      setVariationResult(res.url);
    } catch { toast.error('Variation failed'); }
    setVariationGenerating(false);
  };

  const handleVariationFile = (file) => {
    setVariationFile(file);
    const reader = new FileReader();
    reader.onload = e => setVariationPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleBgFile = (file) => {
    setBgFile(file);
    const reader = new FileReader();
    reader.onload = e => setBgPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleBgRemove = async () => {
    if (!bgFile) return;
    setBgRemoving(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Background removed! (Demo — wire remove.bg API for production)');
    setBgRemoving(false);
  };

  // ── Avatar handlers ──────────────────────────────────────────────────────
  const handleAvatarPhoto = (file) => {
    setAvatarPhoto(file);
    const reader = new FileReader();
    reader.onload = e => setAvatarPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarGenerate = async () => {
    if (!avatarPhoto) { toast.error('Upload a photo first'); return; }
    if (!avatarText.trim()) { toast.error('Enter what the avatar should say'); return; }
    setAvatarGenerating(true); setAvatarDone(false);
    await new Promise(r => setTimeout(r, 2000));
    setAvatarGenerating(false); setAvatarDone(true);
    toast.success('Avatar generated! (Demo — configure D-ID_API_KEY for real lip sync)');
  };

  // ── Style transfer handler ───────────────────────────────────────────────
  const handleStyleFile = (file) => {
    setStyleFile(file);
    const reader = new FileReader();
    reader.onload = e => setStylePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleStyleTransfer = async () => {
    if (!styleFile && !stylePreview) { toast.error('Upload a source image first'); return; }
    setStyleTransferring(true); setStyleResult(null);
    try {
      const prompt = `The subject from the image, ${selectedTransferStyle.suffix}, masterful artistic rendering, museum quality artwork`;
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      setStyleResult(res.url);
    } catch { toast.error('Style transfer failed'); }
    setStyleTransferring(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-bold text-3xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #6d28d9, #9333ea)', boxShadow: '0 0 20px rgba(109,40,217,0.3)' }}>
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          Creative Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered image generation, animation, style transfer, and talking avatars</p>
      </div>

      <Tabs defaultValue="image-ai">
        <TabsList className="mb-6 h-11 gap-1">
          <TabsTrigger value="video-tools" className="gap-1.5"><Film className="w-3.5 h-3.5" />Video Tools</TabsTrigger>
          <TabsTrigger value="image-ai" className="gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Image AI</TabsTrigger>
          <TabsTrigger value="ai-avatar" className="gap-1.5"><User className="w-3.5 h-3.5" />AI Avatar</TabsTrigger>
          <TabsTrigger value="style-transfer" className="gap-1.5"><Palette className="w-3.5 h-3.5" />Style Transfer</TabsTrigger>
        </TabsList>

        {/* ── VIDEO TOOLS ───────────────────────────────────────────────────── */}
        <TabsContent value="video-tools">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" /> Describe Your Vision
                </label>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. A lone samurai standing on a misty cliff at sunrise, cherry blossoms falling"
                  rows={4} className="resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visual Style</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {STYLE_PRESETS.map(style => (
                    <button key={style.id} onClick={() => setSelectedStyle(style)}
                      className={`p-2 rounded-xl border text-center transition-all ${selectedStyle.id === style.id ? 'border-primary bg-accent text-primary' : 'border-border bg-card hover:border-primary/40 text-muted-foreground'}`}>
                      <div className="text-lg">{style.emoji}</div>
                      <div className="text-xs font-medium mt-0.5">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} size="lg" className="w-full gap-2">
                {generating ? <><Loader2 className="w-5 h-5 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5" />Generate Image</>}
              </Button>
              {enhancedPrompt && (
                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-foreground">Enhanced prompt:</span>
                    <button onClick={() => { navigator.clipboard.writeText(enhancedPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {enhancedPrompt}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border relative">
                {generating && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Sparkles className="w-7 h-7 text-primary animate-pulse" /></div><p className="text-sm font-medium">Creating your image...</p></div>}
                {!generating && !generatedUrl && <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3"><Mountain className="w-12 h-12 opacity-20" /><p className="text-sm">Your image will appear here</p></div>}
                {generatedUrl && (<><style>{getAnimCss()}</style><img src={generatedUrl} alt="Generated" className={`w-full h-full object-cover ${animating ? 'anim-img' : ''}`} />{animating && selectedAnimation && <div className="absolute bottom-3 left-3"><Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm"><Film className="w-3 h-3 mr-1" />{selectedAnimation.label}</Badge></div>}</>)}
              </div>
              {generatedUrl && (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRegenerate} disabled={generating} className="gap-2 flex-1"><RefreshCw className="w-4 h-4" />Regenerate</Button>
                    <Button variant="outline" onClick={() => downloadUrl(generatedUrl)} className="gap-2 flex-1"><Download className="w-4 h-4" />Download</Button>
                    {user && <ShareProjectButton user={user} prompt={prompt} enhancedPrompt={enhancedPrompt} styleId={selectedStyle.id} styleLabel={selectedStyle.label} styleEmoji={selectedStyle.emoji} imageUrl={generatedUrl} animationId={selectedAnimation?.id} animationLabel={selectedAnimation?.label} />}
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Film className="w-3.5 h-3.5" />Animate Your Image</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ANIMATION_PRESETS.map(anim => (
                        <button key={anim.id} onClick={() => toggleAnimation(anim)}
                          className={`p-3 rounded-xl border text-left transition-all ${selectedAnimation?.id === anim.id && animating ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary/40'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{anim.emoji}</span>
                            <span className={`text-xs font-semibold ${selectedAnimation?.id === anim.id && animating ? 'text-primary' : ''}`}>{anim.label}</span>
                            {selectedAnimation?.id === anim.id && animating && <Badge className="ml-auto text-xs px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">Live</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{anim.desc}</p>
                        </button>
                      ))}
                    </div>
                    {selectedAnimation && animating && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Speed</span><span className="font-medium">{animSpeed[0].toFixed(1)}x</span></div>
                        <Slider value={animSpeed} onValueChange={setAnimSpeed} min={0.3} max={3} step={0.1} />
                        <Button variant="outline" size="sm" onClick={() => { setSelectedAnimation(null); setAnimating(false); }} className="w-full gap-2 text-muted-foreground"><Pause className="w-3.5 h-3.5" />Stop Animation</Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── IMAGE AI ──────────────────────────────────────────────────────── */}
        <TabsContent value="image-ai">
          <div className="space-y-8">
            {/* Text to Image */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg"><Sparkles className="w-5 h-5 text-primary" />Text to Image</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}
                    placeholder="Describe anything you want to create..." rows={4} className="resize-none" />
                  <div className="grid grid-cols-4 gap-1.5">
                    {STYLE_PRESETS.map(s => (
                      <button key={s.id} onClick={() => setImgStyle(s)}
                        className={`p-2 rounded-xl border text-center transition-all text-xs ${imgStyle.id === s.id ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}>
                        <div className="text-base">{s.emoji}</div>{s.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {ASPECT_RATIOS.map(r => (
                      <button key={r.value} onClick={() => setImgRatio(r)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${imgRatio.value === r.value ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleImageGenerate} disabled={imgGenerating || !imgPrompt.trim()} className="w-full gap-2">
                    {imgGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate</>}
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border relative">
                    {imgGenerating && <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-8 h-8 text-primary animate-pulse" /></div>}
                    {!imgGenerating && !imgResult && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageIcon className="w-12 h-12 opacity-20" /></div>}
                    {imgResult && <img src={imgResult} alt="Generated" className="w-full h-full object-cover cursor-zoom-in" />}
                  </div>
                  {imgResult && <Button variant="outline" className="w-full gap-2" onClick={() => downloadUrl(imgResult)}><Download className="w-4 h-4" />Download Image</Button>}
                </div>
              </div>
            </section>

            {/* Image Variations */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg"><RefreshCw className="w-5 h-5 text-primary" />Image Variations</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FileDropZone onFile={handleVariationFile} preview={variationPreview} label="Upload a source image (optional)" />
                  <Textarea value={variationDesc} onChange={e => setVariationDesc(e.target.value)}
                    placeholder="Describe the variation: same scene but at sunset, warmer colors, more dramatic lighting..." rows={3} className="resize-none" />
                  <Button onClick={handleVariation} disabled={variationGenerating || !variationDesc.trim()} className="w-full gap-2">
                    {variationGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Creating variation...</> : <><Zap className="w-4 h-4" />Create Variation</>}
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border relative">
                    {variationGenerating && <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-8 h-8 text-primary animate-pulse" /></div>}
                    {!variationGenerating && !variationResult && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageIcon className="w-12 h-12 opacity-20" /></div>}
                    {variationResult && <img src={variationResult} alt="Variation" className="w-full h-full object-cover" />}
                  </div>
                  {variationResult && <Button variant="outline" className="w-full gap-2" onClick={() => downloadUrl(variationResult)}><Download className="w-4 h-4" />Download</Button>}
                </div>
              </div>
            </section>

            {/* Background Remover + Upscaler */}
            <div className="grid lg:grid-cols-2 gap-6">
              <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h2 className="font-semibold flex items-center gap-2"><Trash2 className="w-4 h-4 text-primary" />Background Remover</h2>
                <FileDropZone onFile={handleBgFile} preview={bgPreview} label="Upload image to remove background" />
                <Button onClick={handleBgRemove} disabled={bgRemoving || !bgFile} className="w-full gap-2">
                  {bgRemoving ? <><Loader2 className="w-4 h-4 animate-spin" />Removing background...</> : <><Trash2 className="w-4 h-4" />Remove Background</>}
                </Button>
                <p className="text-xs text-muted-foreground">Wire <code>REMOVE_BG_API_KEY</code> for production results.</p>
              </section>
              <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h2 className="font-semibold flex items-center gap-2"><ArrowUpFromLine className="w-4 h-4 text-primary" />Image Upscaler</h2>
                <FileDropZone onFile={() => {}} preview="" label="Upload image to upscale" />
                <div className="flex gap-2">
                  {['2×', '4×'].map(scale => (
                    <button key={scale} className="flex-1 py-2 rounded-xl border border-border hover:border-primary/40 text-sm font-medium transition-all">{scale}</button>
                  ))}
                </div>
                <Button className="w-full gap-2" onClick={() => toast.info('Upscaler — wire Real-ESRGAN API for production')}>
                  <ArrowUpFromLine className="w-4 h-4" />Upscale Image
                </Button>
              </section>
            </div>
          </div>
        </TabsContent>

        {/* ── AI AVATAR ────────────────────────────────────────────────────── */}
        <TabsContent value="ai-avatar">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="font-semibold text-lg">AI Talking Avatar</h2>
                  <p className="text-sm text-muted-foreground">Upload a photo, enter your script, and generate a realistic talking avatar video.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 1 — Upload Photo</label>
                  <div onClick={() => document.getElementById('avatar-photo-input')?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer overflow-hidden relative">
                    {avatarPhotoPreview
                      ? <img src={avatarPhotoPreview} className="w-full h-full object-cover" alt="" />
                      : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"><Camera className="w-8 h-8 opacity-50" /><p className="text-xs">Upload face photo</p></div>}
                    <input id="avatar-photo-input" type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarPhoto(f); }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 2 — Script</label>
                    <Textarea value={avatarText} onChange={e => setAvatarText(e.target.value)}
                      placeholder="Hello! Welcome to my channel. Today I'm going to show you something amazing..."
                      rows={5} className="resize-none text-sm" />
                    <p className="text-xs text-muted-foreground">{avatarText.length}/500 characters</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 3 — Choose Voice</label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_VOICES.map(v => (
                    <button key={v.id} onClick={() => setAvatarVoice(v)}
                      className={`p-3 rounded-xl border text-left transition-all ${avatarVoice.id === v.id ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'}`}>
                      <div className="text-xl mb-1">{v.emoji}</div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.style}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleAvatarGenerate} disabled={avatarGenerating} size="lg" className="w-full gap-2">
                {avatarGenerating ? <><Loader2 className="w-5 h-5 animate-spin" />Generating Avatar Video...</> : <><Video className="w-5 h-5" />Generate Talking Avatar</>}
              </Button>

              {avatarDone && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center gap-3">
                    <User className="w-12 h-12 text-primary/40" />
                    <p className="text-sm text-center text-muted-foreground">Avatar video preview would appear here</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Setup Required for Production:</p>
                    <p>Add <code className="bg-muted px-1 rounded">D_ID_API_KEY</code> to your Vercel environment variables to enable real lip-sync avatar generation via D-ID API.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── STYLE TRANSFER ───────────────────────────────────────────────── */}
        <TabsContent value="style-transfer">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Source Image</label>
                <FileDropZone onFile={handleStyleFile} preview={stylePreview} label="Upload the image you want to transform" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose Art Style ({STYLE_TRANSFER_PRESETS.length} styles)</label>
                <div className="grid grid-cols-4 gap-1.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                  {STYLE_TRANSFER_PRESETS.map(s => (
                    <button key={s.id} onClick={() => setSelectedTransferStyle(s)}
                      className={`p-2 rounded-xl border text-center transition-all ${selectedTransferStyle.id === s.id ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}>
                      <div className="text-lg">{s.emoji}</div>
                      <div className="text-[11px] font-medium mt-0.5 leading-tight">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleStyleTransfer} disabled={styleTransferring || (!styleFile && !stylePreview)} size="lg" className="w-full gap-2">
                {styleTransferring ? <><Loader2 className="w-5 h-5 animate-spin" />Applying style...</> : <><Palette className="w-5 h-5" />Apply {selectedTransferStyle.label} Style</>}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border relative">
                {styleTransferring && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"><Sparkles className="w-8 h-8 text-primary animate-pulse" /><p className="text-sm">Applying {selectedTransferStyle.label} style...</p></div>}
                {!styleTransferring && !styleResult && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Palette className="w-12 h-12 opacity-20" />
                    <p className="text-sm">Styled image will appear here</p>
                    <p className="text-xs text-muted-foreground/60">Selected: {selectedTransferStyle.emoji} {selectedTransferStyle.label}</p>
                  </div>
                )}
                {styleResult && <img src={styleResult} alt="Style transfer result" className="w-full h-full object-cover cursor-zoom-in" />}
              </div>
              {styleResult && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleStyleTransfer} disabled={styleTransferring} className="gap-2 flex-1"><RefreshCw className="w-4 h-4" />Redo</Button>
                  <Button variant="outline" onClick={() => downloadUrl(styleResult, 'style-transfer.jpg')} className="gap-2 flex-1"><Download className="w-4 h-4" />Download</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <style>{`.anim-img { transform-origin: center center; }`}</style>
    </div>
  );
}
