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

// ── Video tool constants ──────────────────────────────────────────────────────
const VIDEO_DURATIONS = ['5s', '8s', '10s'];

const CINEMATIC_STYLES = [
  { id: 'noir',    label: 'Noir',    emoji: '🌑' },
  { id: 'fantasy', label: 'Fantasy', emoji: '✨' },
  { id: 'scifi',   label: 'Sci-Fi',  emoji: '🚀' },
  { id: 'nature',  label: 'Nature',  emoji: '🌿' },
  { id: 'urban',   label: 'Urban',   emoji: '🏙️' },
];

const PRODUCT_BG_STYLES = [
  { id: 'studio',    label: 'Studio White' },
  { id: 'gradient',  label: 'Gradient' },
  { id: 'outdoor',   label: 'Outdoor' },
  { id: 'luxury',    label: 'Luxury Dark' },
];

const PRESET_AVATARS = [
  { id: 'Alex',   gradient: 'from-violet-500 to-purple-700' },
  { id: 'Jordan', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'Sam',    gradient: 'from-emerald-500 to-teal-600' },
  { id: 'Riley',  gradient: 'from-rose-500 to-pink-600' },
  { id: 'Morgan', gradient: 'from-amber-500 to-orange-600' },
  { id: 'Casey',  gradient: 'from-indigo-500 to-blue-700' },
];

function ImagePreview({ src, generating, placeholder, onRegenerate, onDownload, children }) {
  return (
    <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-muted border border-border relative">
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

// ── VideoResult helper ────────────────────────────────────────────────────────
function VideoResult({ videoUrl, isMock, onDownload }) {
  if (!videoUrl) return null;
  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black border border-border">
        <video src={videoUrl} controls className="w-full" />
        {isMock && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-yellow-500/90 text-black border-0 text-xs">Demo video</Badge>
          </div>
        )}
      </div>
      <Button variant="outline" className="w-full gap-2" onClick={onDownload}>
        <Download className="w-4 h-4" />Download Video
      </Button>
    </div>
  );
}

// ── VideoGenerating helper ────────────────────────────────────────────────────
function VideoGenerating() {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-8 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Film className="w-7 h-7 text-primary animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Generating your video...</p>
        <p className="text-xs text-muted-foreground mt-1">This can take 30–90 seconds</p>
      </div>
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreativeStudio() {
  let user = null;
  try { ({ user } = useOutletContext() || {}); } catch {}

  // Image AI / Video Tools shared helpers
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[2]); // default 9:16
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [selectedAnimation, setSelectedAnimation] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [animSpeed, setAnimSpeed] = useState([1]);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState('');

  // Image AI state
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgStyle, setImgStyle] = useState(STYLE_PRESETS[0]);
  const [imgRatio, setImgRatio] = useState(ASPECT_RATIOS[2]); // default 9:16
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
  const [styleImageBase64, setStyleImageBase64] = useState('');
  const [selectedTransferStyle, setSelectedTransferStyle] = useState(STYLE_TRANSFER_PRESETS[0]);
  const [styleResult, setStyleResult] = useState(null);
  const [styleTransferring, setStyleTransferring] = useState(false);

  // ── Video Tools state ────────────────────────────────────────────────────
  // Text-to-Video
  const [t2vPrompt, setT2vPrompt] = useState('');
  const [t2vDuration, setT2vDuration] = useState('8s');
  const [t2vGenerating, setT2vGenerating] = useState(false);
  const [t2vResult, setT2vResult] = useState(null);
  const [t2vMock, setT2vMock] = useState(false);

  // Image-to-Video
  const [i2vFile, setI2vFile] = useState(null);
  const [i2vPreview, setI2vPreview] = useState('');
  const [i2vBase64, setI2vBase64] = useState('');
  const [i2vPrompt, setI2vPrompt] = useState('');
  const [i2vDuration, setI2vDuration] = useState('8s');
  const [i2vGenerating, setI2vGenerating] = useState(false);
  const [i2vResult, setI2vResult] = useState(null);
  const [i2vMock, setI2vMock] = useState(false);

  // Lip Sync
  const [lipFile, setLipFile] = useState(null);
  const [lipPreview, setLipPreview] = useState('');
  const [lipBase64, setLipBase64] = useState('');
  const [lipScript, setLipScript] = useState('');
  const [lipGenerating, setLipGenerating] = useState(false);
  const [lipResult, setLipResult] = useState(null);
  const [lipMock, setLipMock] = useState(false);

  // AI Avatar Video
  const [avSelectedAvatar, setAvSelectedAvatar] = useState(PRESET_AVATARS[0].id);
  const [avScript, setAvScript] = useState('');
  const [avGenerating, setAvGenerating] = useState(false);
  const [avResult, setAvResult] = useState(null);
  const [avMock, setAvMock] = useState(false);

  // Cinematic Scene
  const [cinDesc, setCinDesc] = useState('');
  const [cinStyle, setCinStyle] = useState(CINEMATIC_STYLES[0].id);
  const [cinGenerating, setCinGenerating] = useState(false);
  const [cinResult, setCinResult] = useState(null);
  const [cinMock, setCinMock] = useState(false);

  // Product Showcase
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodBg, setProdBg] = useState(PRODUCT_BG_STYLES[0].id);
  const [prodGenerating, setProdGenerating] = useState(false);
  const [prodResult, setProdResult] = useState(null);
  const [prodMock, setProdMock] = useState(false);

  // ── Shared video API caller ───────────────────────────────────────────────
  const callVideoApi = async (body) => {
    const res = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const downloadUrl = (url, name = 'philomni-video.mp4') => {
    const a = document.createElement('a'); a.href = url; a.download = name; a.target = '_blank'; a.click();
  };

  const downloadImageUrl = (url, name = 'philomni-image.jpg') => {
    const a = document.createElement('a'); a.href = url; a.download = name; a.target = '_blank'; a.click();
  };

  // ── Video handlers ────────────────────────────────────────────────────────
  const handleT2V = async () => {
    if (!t2vPrompt.trim()) { toast.error('Enter a prompt first'); return; }
    setT2vGenerating(true); setT2vResult(null); setT2vMock(false);
    try {
      const data = await callVideoApi({ type: 'text', prompt: t2vPrompt.trim(), duration: t2vDuration });
      setT2vResult(data.video_url);
      setT2vMock(data.status === 'mock');
    } catch (e) { toast.error('Video generation failed: ' + e.message); }
    setT2vGenerating(false);
  };

  const compressImageToBase64 = (file, maxKB = 900) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      // Scale down if too large
      const maxDim = 1280;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      // Try quality steps until under maxKB
      let quality = 0.85;
      const tryExport = () => {
        const b64 = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = (b64.length * 0.75) / 1024;
        if (sizeKB <= maxKB || quality <= 0.3) return resolve(b64);
        quality -= 0.1;
        tryExport();
      };
      tryExport();
    };
    img.src = url;
  });

  const handleI2VFile = async (file) => {
    setI2vFile(file);
    const preview = URL.createObjectURL(file);
    setI2vPreview(preview);
    // Compress before storing as base64 (avoid 413 Request Entity Too Large)
    const b64 = await compressImageToBase64(file);
    setI2vBase64(b64);
  };

  const handleI2V = async () => {
    if (!i2vFile) { toast.error('Upload an image first'); return; }
    setI2vGenerating(true); setI2vResult(null); setI2vMock(false);
    try {
      // Ensure image is compressed (re-compress if needed)
      const compressedUrl = i2vBase64 || await compressImageToBase64(i2vFile);
      const data = await callVideoApi({ type: 'image', imageUrl: compressedUrl, prompt: i2vPrompt.trim(), duration: i2vDuration });
      setI2vResult(data.video_url);
      setI2vMock(data.status === 'mock');
    } catch (e) { toast.error('Video generation failed: ' + e.message); }
    setI2vGenerating(false);
  };

  const handleLipFile = (file) => {
    setLipFile(file);
    const reader = new FileReader();
    reader.onload = e => { setLipPreview(e.target.result); setLipBase64(e.target.result); };
    reader.readAsDataURL(file);
  };

  const handleLipSync = async () => {
    if (!lipFile) { toast.error('Upload a face photo first'); return; }
    if (!lipScript.trim()) { toast.error('Enter the script first'); return; }
    setLipGenerating(true); setLipResult(null); setLipMock(false);
    try {
      const data = await callVideoApi({ type: 'lip', photoUrl: lipBase64, script: lipScript.trim() });
      setLipResult(data.video_url);
      setLipMock(data.status === 'mock');
    } catch (e) { toast.error('Lip sync generation failed: ' + e.message); }
    setLipGenerating(false);
  };

  const handleAvatarVideo = async () => {
    if (!avScript.trim()) { toast.error('Enter a script first'); return; }
    setAvGenerating(true); setAvResult(null); setAvMock(false);
    try {
      const data = await callVideoApi({ type: 'avatar', avatarId: avSelectedAvatar, script: avScript.trim() });
      setAvResult(data.video_url);
      setAvMock(data.status === 'mock');
    } catch (e) { toast.error('Avatar video generation failed: ' + e.message); }
    setAvGenerating(false);
  };

  const handleCinematic = async () => {
    if (!cinDesc.trim()) { toast.error('Describe your scene first'); return; }
    const styleLabel = CINEMATIC_STYLES.find(s => s.id === cinStyle)?.label || cinStyle;
    const enhancedCinPrompt = `${cinDesc.trim()}, ${styleLabel} style, cinematic composition, dramatic lighting, high production value, 4K`;
    setCinGenerating(true); setCinResult(null); setCinMock(false);
    try {
      const data = await callVideoApi({ type: 'text', prompt: enhancedCinPrompt, duration: '10s' });
      setCinResult(data.video_url);
      setCinMock(data.status === 'mock');
    } catch (e) { toast.error('Scene generation failed: ' + e.message); }
    setCinGenerating(false);
  };

  const handleProductShowcase = async () => {
    if (!prodName.trim()) { toast.error('Enter a product name first'); return; }
    const bgLabel = PRODUCT_BG_STYLES.find(b => b.id === prodBg)?.label || prodBg;
    const prodPrompt = `Professional product showcase video of ${prodName.trim()}${prodDesc.trim() ? ': ' + prodDesc.trim() : ''}, ${bgLabel} background, commercial quality, smooth camera movement, product demo`;
    setProdGenerating(true); setProdResult(null); setProdMock(false);
    try {
      const data = await callVideoApi({ type: 'text', prompt: prodPrompt, duration: '8s' });
      setProdResult(data.video_url);
      setProdMock(data.status === 'mock');
    } catch (e) { toast.error('Product showcase generation failed: ' + e.message); }
    setProdGenerating(false);
  };

  // ── Image AI handlers ────────────────────────────────────────────────────
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

  const handleImageGenerate = async () => {
    if (!imgPrompt.trim()) { toast.error('Describe your image first'); return; }
    setImgGenerating(true); setImgResult(null);
    try {
      const full = `${imgPrompt.trim()}, ${imgStyle.suffix}`;
      const params = { prompt: full, size: imgRatio.value };
      if (imgRatio.label === '9:16') params.aspectRatio = '9:16';
      const res = await base44.integrations.Core.GenerateImage(params);
      setImgResult(res.url);
    } catch { toast.error('Generation failed'); }
    setImgGenerating(false);
  };

  const handleVariation = async () => {
    if (!variationDesc.trim()) { toast.error('Describe the variation you want'); return; }
    setVariationGenerating(true); setVariationResult(null);
    try {
      const variationPrompt = variationDesc.trim() + (variationFile ? ', based on uploaded image' : '');
      const res = await base44.integrations.Core.GenerateImage({ prompt: variationPrompt, style: imgStyle.id });
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
    reader.onload = e => {
      setStylePreview(e.target.result);
      setStyleImageBase64(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleStyleTransfer = async () => {
    if (!styleFile && !stylePreview) { toast.error('Upload a source image first'); return; }
    setStyleTransferring(true); setStyleResult(null);
    try {
      const transferPrompt = `${selectedTransferStyle.suffix}, maintaining the exact subject and composition from the reference photo, masterful artistic rendering, museum quality artwork`;
      const params = { prompt: transferPrompt, mode: 'style_transfer' };
      if (styleImageBase64) params.imageUrl = styleImageBase64;
      const res = await base44.integrations.Core.GenerateImage(params);
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
          <div className="space-y-8">

            {/* 1. Text-to-Video */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />Text-to-Video
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prompt</label>
                    <Textarea
                      value={t2vPrompt}
                      onChange={e => setT2vPrompt(e.target.value)}
                      placeholder="A lone samurai standing on a misty cliff at sunrise, cherry blossoms falling..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</label>
                    <div className="flex gap-2">
                      {VIDEO_DURATIONS.map(d => (
                        <button
                          key={d}
                          onClick={() => setT2vDuration(d)}
                          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${t2vDuration === d ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                        >{d}</button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleT2V} disabled={t2vGenerating || !t2vPrompt.trim()} className="w-full gap-2">
                    {t2vGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Video className="w-4 h-4" />Generate Video</>}
                  </Button>
                </div>
                <div>
                  {t2vGenerating ? <VideoGenerating /> : <VideoResult videoUrl={t2vResult} isMock={t2vMock} onDownload={() => downloadUrl(t2vResult)} />}
                  {!t2vGenerating && !t2vResult && (
                    <div className="rounded-xl border border-border bg-muted/30 h-40 flex items-center justify-center text-muted-foreground">
                      <div className="text-center"><Video className="w-10 h-10 opacity-20 mx-auto mb-2" /><p className="text-sm">Video will appear here</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Image-to-Video */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <Camera className="w-5 h-5 text-primary" />Image-to-Video
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Image</label>
                    <FileDropZone onFile={handleI2VFile} preview={i2vPreview} label="Upload image to animate" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motion Prompt</label>
                    <Textarea
                      value={i2vPrompt}
                      onChange={e => setI2vPrompt(e.target.value)}
                      placeholder="The camera slowly zooms in while leaves gently sway in the breeze..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</label>
                    <div className="flex gap-2">
                      {VIDEO_DURATIONS.map(d => (
                        <button
                          key={d}
                          onClick={() => setI2vDuration(d)}
                          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${i2vDuration === d ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                        >{d}</button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleI2V} disabled={i2vGenerating || !i2vFile} className="w-full gap-2">
                    {i2vGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Video className="w-4 h-4" />Animate Image</>}
                  </Button>
                </div>
                <div>
                  {i2vGenerating ? <VideoGenerating /> : <VideoResult videoUrl={i2vResult} isMock={i2vMock} onDownload={() => downloadUrl(i2vResult)} />}
                  {!i2vGenerating && !i2vResult && (
                    <div className="rounded-xl border border-border bg-muted/30 h-40 flex items-center justify-center text-muted-foreground">
                      <div className="text-center"><Video className="w-10 h-10 opacity-20 mx-auto mb-2" /><p className="text-sm">Video will appear here</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Lip Sync Video */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <Mic className="w-5 h-5 text-primary" />Lip Sync Video
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Face Photo</label>
                    <FileDropZone onFile={handleLipFile} preview={lipPreview} label="Upload a clear face photo" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Script (what they will say)</label>
                    <Textarea
                      value={lipScript}
                      onChange={e => setLipScript(e.target.value)}
                      placeholder="Hello! Welcome to our platform. Let me show you what we can do..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <Button onClick={handleLipSync} disabled={lipGenerating || !lipFile || !lipScript.trim()} className="w-full gap-2">
                    {lipGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Mic className="w-4 h-4" />Generate Lip Sync</>}
                  </Button>
                </div>
                <div>
                  {lipGenerating ? <VideoGenerating /> : <VideoResult videoUrl={lipResult} isMock={lipMock} onDownload={() => downloadUrl(lipResult, 'lip-sync.mp4')} />}
                  {!lipGenerating && !lipResult && (
                    <div className="rounded-xl border border-border bg-muted/30 h-40 flex items-center justify-center text-muted-foreground">
                      <div className="text-center"><Mic className="w-10 h-10 opacity-20 mx-auto mb-2" /><p className="text-sm">Lip sync video will appear here</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 4. AI Avatar Video */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />AI Avatar Video
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose Avatar</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_AVATARS.map(av => (
                        <button
                          key={av.id}
                          onClick={() => setAvSelectedAvatar(av.id)}
                          className={`p-3 rounded-xl border transition-all ${avSelectedAvatar === av.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40'}`}
                        >
                          <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${av.gradient} mb-2`} />
                          <p className="text-xs font-medium text-center">{av.id}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Script</label>
                    <Textarea
                      value={avScript}
                      onChange={e => setAvScript(e.target.value)}
                      placeholder="Hi there! I'm here to tell you about our exciting new product..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <Button onClick={handleAvatarVideo} disabled={avGenerating || !avScript.trim()} className="w-full gap-2">
                    {avGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><User className="w-4 h-4" />Generate Avatar Video</>}
                  </Button>
                </div>
                <div>
                  {avGenerating ? <VideoGenerating /> : <VideoResult videoUrl={avResult} isMock={avMock} onDownload={() => downloadUrl(avResult, 'avatar-video.mp4')} />}
                  {!avGenerating && !avResult && (
                    <div className="rounded-xl border border-border bg-muted/30 h-40 flex items-center justify-center text-muted-foreground">
                      <div className="text-center"><User className="w-10 h-10 opacity-20 mx-auto mb-2" /><p className="text-sm">Avatar video will appear here</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 5. Cinematic Scene */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <Film className="w-5 h-5 text-primary" />Cinematic Scene
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scene Description</label>
                    <Textarea
                      value={cinDesc}
                      onChange={e => setCinDesc(e.target.value)}
                      placeholder="A detective walks down a rain-soaked alley, neon signs reflecting in puddles..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {CINEMATIC_STYLES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setCinStyle(s.id)}
                          className={`p-2 rounded-xl border text-center transition-all ${cinStyle === s.id ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                        >
                          <div className="text-base">{s.emoji}</div>
                          <div className="text-[11px] font-medium mt-0.5">{s.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCinematic} disabled={cinGenerating || !cinDesc.trim()} className="w-full gap-2">
                    {cinGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Film className="w-4 h-4" />Generate Scene</>}
                  </Button>
                </div>
                <div>
                  {cinGenerating ? <VideoGenerating /> : <VideoResult videoUrl={cinResult} isMock={cinMock} onDownload={() => downloadUrl(cinResult, 'cinematic-scene.mp4')} />}
                  {!cinGenerating && !cinResult && (
                    <div className="rounded-xl border border-border bg-muted/30 h-40 flex items-center justify-center text-muted-foreground">
                      <div className="text-center"><Film className="w-10 h-10 opacity-20 mx-auto mb-2" /><p className="text-sm">Cinematic video will appear here</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 6. Product Showcase */}
            <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />Product Showcase
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Name</label>
                    <Input
                      value={prodName}
                      onChange={e => setProdName(e.target.value)}
                      placeholder="e.g. AirPods Pro, Luxury Watch, Running Shoes..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description (optional)</label>
                    <Textarea
                      value={prodDesc}
                      onChange={e => setProdDesc(e.target.value)}
                      placeholder="Premium wireless earbuds with active noise cancellation..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Background Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_BG_STYLES.map(b => (
                        <button
                          key={b.id}
                          onClick={() => setProdBg(b.id)}
                          className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${prodBg === b.id ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                        >{b.label}</button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleProductShowcase} disabled={prodGenerating || !prodName.trim()} className="w-full gap-2">
                    {prodGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Zap className="w-4 h-4" />Generate Showcase</>}
                  </Button>
                </div>
                <div>
                  {prodGenerating ? <VideoGenerating /> : <VideoResult videoUrl={prodResult} isMock={prodMock} onDownload={() => downloadUrl(prodResult, 'product-showcase.mp4')} />}
                  {!prodGenerating && !prodResult && (
                    <div className="rounded-xl border border-border bg-muted/30 h-40 flex items-center justify-center text-muted-foreground">
                      <div className="text-center"><Zap className="w-10 h-10 opacity-20 mx-auto mb-2" /><p className="text-sm">Product video will appear here</p></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

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
                  <div className="aspect-[9/16] rounded-xl overflow-hidden bg-muted border border-border relative">
                    {imgGenerating && <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-8 h-8 text-primary animate-pulse" /></div>}
                    {!imgGenerating && !imgResult && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageIcon className="w-12 h-12 opacity-20" /></div>}
                    {imgResult && <img src={imgResult} alt="Generated" className="w-full h-full object-cover cursor-zoom-in" />}
                  </div>
                  {imgResult && <Button variant="outline" className="w-full gap-2" onClick={() => downloadImageUrl(imgResult)}><Download className="w-4 h-4" />Download Image</Button>}
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
                  <div className="aspect-[9/16] rounded-xl overflow-hidden bg-muted border border-border relative">
                    {variationGenerating && <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-8 h-8 text-primary animate-pulse" /></div>}
                    {!variationGenerating && !variationResult && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><ImageIcon className="w-12 h-12 opacity-20" /></div>}
                    {variationResult && <img src={variationResult} alt="Variation" className="w-full h-full object-cover" />}
                  </div>
                  {variationResult && <Button variant="outline" className="w-full gap-2" onClick={() => downloadImageUrl(variationResult)}><Download className="w-4 h-4" />Download</Button>}
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
              <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-muted border border-border relative">
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
                  <Button variant="outline" onClick={() => downloadImageUrl(styleResult, 'style-transfer.jpg')} className="gap-2 flex-1"><Download className="w-4 h-4" />Download</Button>
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
