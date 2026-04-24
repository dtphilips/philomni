import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Sparkles, Loader2, Download, Play, Pause, RotateCcw,
  Wand2, Film, Camera, Zap, Mountain, Waves, Sun,
  ChevronRight, Copy, Check, RefreshCw
} from 'lucide-react';
import ShareProjectButton from '@/components/creative/ShareProjectButton';

// ── Style presets ────────────────────────────────────────────────────────────
const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬', suffix: 'cinematic photography, anamorphic lens, golden hour lighting, bokeh, 8K ultra detailed, film grain, dramatic atmosphere' },
  { id: 'portrait', label: 'Portrait', emoji: '🖼️', suffix: 'professional portrait, soft studio lighting, shallow depth of field, award-winning photo, sharp focus on subject' },
  { id: 'fantasy', label: 'Fantasy', emoji: '✨', suffix: 'epic fantasy art, concept art, dramatic lighting, magical atmosphere, highly detailed, trending on ArtStation' },
  { id: 'noir', label: 'Noir', emoji: '🌑', suffix: 'film noir, black and white, dramatic shadows, high contrast, moody atmosphere, 1940s aesthetic' },
  { id: 'anime', label: 'Anime', emoji: '🌸', suffix: 'anime style, Studio Ghibli inspired, vibrant colors, detailed background, beautiful composition' },
  { id: 'neon', label: 'Neon Future', emoji: '💜', suffix: 'cyberpunk, neon lights, futuristic city, rain reflection, ultra detailed, blade runner aesthetic' },
  { id: 'nature', label: 'Nature', emoji: '🌿', suffix: 'landscape photography, golden hour, national geographic style, ultra wide angle, stunning natural lighting' },
  { id: 'abstract', label: 'Abstract', emoji: '🎨', suffix: 'abstract digital art, vivid colors, flowing shapes, generative art, high resolution, artistically composed' },
];

// ── Animation presets ────────────────────────────────────────────────────────
const ANIMATION_PRESETS = [
  {
    id: 'slow_zoom',
    label: 'Slow Zoom',
    emoji: '🔍',
    desc: 'Ken Burns — gentle zoom in',
    css: `
      @keyframes slowZoom {
        from { transform: scale(1); }
        to   { transform: scale(1.18); }
      }
      .anim-img { animation: slowZoom 8s ease-in-out infinite alternate; }
    `,
  },
  {
    id: 'pan_right',
    label: 'Cinematic Pan',
    emoji: '🎥',
    desc: 'Slow horizontal pan like a film shot',
    css: `
      @keyframes panRight {
        from { transform: scale(1.15) translateX(-5%); }
        to   { transform: scale(1.15) translateX(5%); }
      }
      .anim-img { animation: panRight 9s ease-in-out infinite alternate; }
    `,
  },
  {
    id: 'drift',
    label: 'Dreamlike Drift',
    emoji: '🌊',
    desc: 'Subtle floating drift motion',
    css: `
      @keyframes drift {
        0%   { transform: scale(1.08) translate(0, 0); }
        25%  { transform: scale(1.1)  translate(1.5%, -1%); }
        50%  { transform: scale(1.08) translate(0, 1.5%); }
        75%  { transform: scale(1.1)  translate(-1.5%, -0.5%); }
        100% { transform: scale(1.08) translate(0, 0); }
      }
      .anim-img { animation: drift 12s ease-in-out infinite; }
    `,
  },
  {
    id: 'zoom_out',
    label: 'Epic Reveal',
    emoji: '🌄',
    desc: 'Zoom out to reveal the full scene',
    css: `
      @keyframes zoomOut {
        from { transform: scale(1.25); }
        to   { transform: scale(1); }
      }
      .anim-img { animation: zoomOut 10s ease-out infinite alternate; }
    `,
  },
  {
    id: 'pulse_glow',
    label: 'Pulse & Glow',
    emoji: '✨',
    desc: 'Subtle pulsing with brightness glow',
    css: `
      @keyframes pulseGlow {
        from { transform: scale(1); filter: brightness(1) saturate(1); }
        to   { transform: scale(1.04); filter: brightness(1.15) saturate(1.2); }
      }
      .anim-img { animation: pulseGlow 4s ease-in-out infinite alternate; }
    `,
  },
  {
    id: 'vhs',
    label: 'VHS Glitch',
    emoji: '📼',
    desc: 'Retro VHS scan-line effect',
    css: `
      @keyframes vhsDrift {
        0%   { transform: scale(1) skewX(0deg); filter: hue-rotate(0deg); }
        15%  { transform: scale(1.01) skewX(0.3deg); filter: hue-rotate(5deg); }
        30%  { transform: scale(1) skewX(-0.2deg); filter: hue-rotate(-5deg); }
        100% { transform: scale(1) skewX(0deg); filter: hue-rotate(0deg); }
      }
      .anim-img { animation: vhsDrift 3s ease-in-out infinite; }
    `,
  },
];

export default function CreativeStudio() {
  const { user } = useOutletContext();

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');

  // Animation state
  const [selectedAnimation, setSelectedAnimation] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [animSpeed, setAnimSpeed] = useState([1]);
  const [copied, setCopied] = useState(false);

  const imgRef = useRef(null);

  const buildPrompt = () => {
    const base = prompt.trim();
    if (!base) return '';
    return `${base}, ${selectedStyle.suffix}`;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGeneratedUrl(null);
    setSelectedAnimation(null);
    setAnimating(false);

    const fullPrompt = buildPrompt();
    setEnhancedPrompt(fullPrompt);

    const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
    setGeneratedUrl(res.url);
    setGenerating(false);
  };

  const handleRegenerate = async () => {
    if (!enhancedPrompt) return;
    setGenerating(true);
    setGeneratedUrl(null);
    const res = await base44.integrations.Core.GenerateImage({ prompt: enhancedPrompt });
    setGeneratedUrl(res.url);
    setGenerating(false);
  };

  const toggleAnimation = (anim) => {
    if (selectedAnimation?.id === anim.id) {
      setSelectedAnimation(null);
      setAnimating(false);
    } else {
      setSelectedAnimation(anim);
      setAnimating(true);
    }
  };

  const downloadImage = async () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = 'creative-studio.jpg';
    a.target = '_blank';
    a.click();
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(enhancedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate animation duration based on speed slider
  const getAnimCss = () => {
    if (!selectedAnimation) return '';
    const speed = animSpeed[0];
    return selectedAnimation.css.replace(/(\d+(\.\d+)?)s/g, (_, n) => `${(parseFloat(n) / speed).toFixed(2)}s`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          Creative Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Generate cinematic AI images from text, then bring them to life with animation</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* ── LEFT: Generator ── */}
        <div className="space-y-5">

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" /> Describe Your Vision
            </label>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={"e.g. A lone samurai standing on a misty cliff at sunrise, cherry blossoms falling\n\ne.g. A futuristic city skyline at night with rain-soaked streets reflecting neon signs"}
              rows={4}
              className="resize-none leading-relaxed text-sm"
            />
          </div>

          {/* Style presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visual Style</label>
            <div className="grid grid-cols-4 gap-1.5">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedStyle.id === style.id
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border bg-card hover:border-primary/40 text-muted-foreground'
                  }`}
                >
                  <div className="text-lg">{style.emoji}</div>
                  <div className="text-xs font-medium mt-0.5">{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            size="lg"
            className="w-full gap-2 text-base"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating image...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Cinematic Image</>
            )}
          </Button>

          {/* Enhanced prompt display */}
          {enhancedPrompt && (
            <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-foreground mb-1 block">Enhanced prompt:</span>
                <button onClick={copyPrompt} className="flex-shrink-0 flex items-center gap-1 hover:text-foreground transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {enhancedPrompt}
            </div>
          )}
        </div>

        {/* ── RIGHT: Preview + Animation ── */}
        <div className="space-y-5">

          {/* Image preview */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border relative">
            {generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Creating your image...</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedStyle.emoji} {selectedStyle.label} style</p>
                </div>
              </div>
            )}

            {!generating && !generatedUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Mountain className="w-12 h-12 opacity-20" />
                <p className="text-sm">Your image will appear here</p>
              </div>
            )}

            {generatedUrl && (
              <>
                <style>{getAnimCss()}</style>
                <img
                  ref={imgRef}
                  src={generatedUrl}
                  alt="Generated"
                  className={`w-full h-full object-cover ${animating ? 'anim-img' : ''}`}
                />
                {animating && selectedAnimation && (
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
                      <Film className="w-3 h-3 mr-1" /> {selectedAnimation.label}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          {generatedUrl && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={handleRegenerate} disabled={generating} className="gap-2 flex-1">
                <RefreshCw className="w-4 h-4" /> Regenerate
              </Button>
              <Button variant="outline" onClick={downloadImage} className="gap-2 flex-1">
                <Download className="w-4 h-4" /> Download
              </Button>
              <ShareProjectButton
                user={user}
                prompt={prompt}
                enhancedPrompt={enhancedPrompt}
                styleId={selectedStyle.id}
                styleLabel={selectedStyle.label}
                styleEmoji={selectedStyle.emoji}
                imageUrl={generatedUrl}
                animationId={selectedAnimation?.id}
                animationLabel={selectedAnimation?.label}
              />
            </div>
          )}

          {/* Animation panel */}
          {generatedUrl && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Film className="w-3.5 h-3.5" /> Animate Your Image
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ANIMATION_PRESETS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => toggleAnimation(anim)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedAnimation?.id === anim.id && animating
                        ? 'border-primary bg-accent'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{anim.emoji}</span>
                      <span className={`text-xs font-semibold ${selectedAnimation?.id === anim.id && animating ? 'text-primary' : ''}`}>
                        {anim.label}
                      </span>
                      {selectedAnimation?.id === anim.id && animating && (
                        <Badge className="ml-auto text-xs px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">Live</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{anim.desc}</p>
                  </button>
                ))}
              </div>

              {selectedAnimation && animating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Animation Speed</span>
                    <span className="font-medium">{animSpeed[0].toFixed(1)}x</span>
                  </div>
                  <Slider value={animSpeed} onValueChange={setAnimSpeed} min={0.3} max={3} step={0.1} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Slower</span><span>Faster</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedAnimation(null); setAnimating(false); }}
                    className="w-full gap-2 text-muted-foreground"
                  >
                    <Pause className="w-3.5 h-3.5" /> Stop Animation
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .anim-img { transform-origin: center center; }
      `}</style>
    </div>
  );
}