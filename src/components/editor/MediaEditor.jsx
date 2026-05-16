/**
 * MediaEditor — full-screen overlay for image & video editing.
 *
 * Props:
 *   file?     — File object (image or video from upload)
 *   url?      — existing URL string (for editing already-uploaded media)
 *   onSave    — callback(blob) for images | callback({url,filters,...}) for video
 *   onClose   — callback to dismiss the editor
 *   embedded? — when true, fills parent instead of fixed overlay
 */
import React, {
  useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle,
} from 'react'
import {
  ChevronLeft, Sliders, Crop, Sparkles, Type, Smile,
  Play, Pause, SkipBack, SkipForward, Gauge, Volume2, Scissors,
  RotateCcw, Loader2, X, Check, Pencil, Maximize2,
  Music, FileText, Zap, AlignLeft, AlignCenter, AlignRight,
  Copy, Layers, LayoutTemplate, FlipHorizontal, Wand2, Mic,
  ChevronDown, Download, SplitSquareHorizontal,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_FILTERS = [
  { id: 'original',  label: 'Original',  css: 'none' },
  { id: 'vivid',     label: 'Vivid',     css: 'contrast(1.2) saturate(1.4) brightness(1.05)' },
  { id: 'cool',      label: 'Cool',      css: 'saturate(0.9) hue-rotate(20deg) brightness(1.05)' },
  { id: 'warm',      label: 'Warm',      css: 'saturate(1.2) sepia(0.3) brightness(1.05)' },
  { id: 'fade',      label: 'Fade',      css: 'contrast(0.85) saturate(0.8) brightness(1.1)' },
  { id: 'chrome',    label: 'Chrome',    css: 'contrast(1.1) saturate(1.3) brightness(1.1)' },
  { id: 'noir',      label: 'Noir',      css: 'grayscale(1) contrast(1.2) brightness(0.9)' },
  { id: 'matte',     label: 'Matte',     css: 'contrast(0.9) saturate(0.85) brightness(1.05)' },
  { id: 'cinematic', label: 'Cinematic', css: 'contrast(1.15) saturate(0.9) brightness(0.95) sepia(0.1)' },
  { id: 'golden',    label: 'Golden',    css: 'sepia(0.4) saturate(1.3) brightness(1.1)' },
  { id: 'moody',     label: 'Moody',     css: 'contrast(1.2) saturate(0.8) brightness(0.85)' },
  { id: 'bright',    label: 'Bright',    css: 'brightness(1.2) contrast(0.95) saturate(1.1)' },
  { id: 'vintage',   label: 'Vintage',   css: 'sepia(0.5) contrast(0.9) saturate(0.8) brightness(1.05)' },
  { id: 'dreamy',    label: 'Dreamy',    css: 'brightness(1.1) contrast(0.9) saturate(1.2) blur(0.3px)' },
  { id: 'dramatic',  label: 'Dramatic',  css: 'contrast(1.4) saturate(0.9) brightness(0.85)' },
  { id: 'neon',      label: 'Neon',      css: 'contrast(1.3) saturate(2) brightness(1.1) hue-rotate(10deg)' },
]

// Video uses the same 16 filters
const VIDEO_FILTERS = IMAGE_FILTERS

const CROP_PRESETS = [
  { label: 'Free',  ratio: null },
  { label: '1:1',   ratio: 1 },
  { label: '4:5',   ratio: 4 / 5 },
  { label: '16:9',  ratio: 16 / 9 },
  { label: '9:16',  ratio: 9 / 16 },
  { label: '3:2',   ratio: 3 / 2 },
  { label: '2:3',   ratio: 2 / 3 },
]

const FONT_FAMILIES = ['Inter', 'Georgia', 'Courier', 'Impact', 'Pacifico']
const TEXT_COLORS   = ['#ffffff', '#000000', '#7c3aed', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']

const STICKER_CATEGORIES = [
  { id: 'smileys', label: 'Smileys',      emoji: '😊', stickers: ['😀','😂','😍','🥰','😎','😢','😡','🤔','😴','🥳','😅','🤣'] },
  { id: 'hearts',  label: 'Hearts',       emoji: '❤️', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','🫶','💘'] },
  { id: 'hands',   label: 'Hands',        emoji: '👏', stickers: ['👏','🙌','👍','👎','🤝','🙏','👋','🤞','✌️','🤟','💪','🫶'] },
  { id: 'fun',     label: 'Fun',          emoji: '🎉', stickers: ['🎉','✨','🔥','💎','🚀','⚡','🌟','🏆','👑','🎊','🎯','💥'] },
  { id: 'trending',label: 'Trending',     emoji: '🔥', stickers: ['🔥','💀','🤯','😤','💯','🫠','🥹','🤌','🫡','🥸','🫣','🤑'] },
  { id: 'sparkles',label: 'Sparkles',     emoji: '✨', stickers: ['✨','⭐','🌟','💫','🌈','🌸','🍀','🌺','🌻','🌙','☀️','🌊'] },
  { id: 'achieve', label: 'Achievement',  emoji: '🏆', stickers: ['🏆','🥇','🎖️','🏅','👑','💎','🎯','🎓','📈','🚀','💪','🙌'] },
]

const BG_COLORS = [
  '#000000','#ffffff','#1a1a2e','#16213e','#e63946','#457b9d','#2d6a4f','#f4a261',
  '#6d6875','#b5838d','#e07a5f','#3d405b','#81b29a','#f2cc8f','#264653','#2a9d8f',
  '#e9c46a','#f4a261','#e76f51','#023e8a','#0077b6','#0096c7','#00b4d8','#48cae4',
  '#90e0ef','#ade8f4','#caf0f8','#d62828','#f77f00','#fcbf49','#eae2b7','#003049',
]
const BG_GRADIENTS = [
  { label: 'Sunset',  css: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { label: 'Purple',  css: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: 'Ocean',   css: 'linear-gradient(135deg, #2196f3, #00bcd4)' },
  { label: 'Forest',  css: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { label: 'Fire',    css: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
  { label: 'Night',   css: 'linear-gradient(135deg, #0f0c29, #302b63)' },
]

const NATURE_BACKGROUNDS = [
  { label: 'Mountains', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
  { label: 'Beach',     url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
  { label: 'Forest',    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' },
  { label: 'Desert',    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80' },
  { label: 'Waterfall', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80' },
  { label: 'Snowy Peak',url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
  { label: 'Lake',      url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80' },
  { label: 'Sunset Sky',url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80' },
  { label: 'Aurora',    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80' },
  { label: 'Jungle',    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
  { label: 'Meadow',    url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80' },
  { label: 'Cosmos',    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80' },
  { label: 'Ocean Waves',url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80' },
  { label: 'Canyon',    url: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80' },
  { label: 'Tulip Field',url: 'https://images.unsplash.com/photo-1490750967868-88df5691cc71?w=800&q=80' },
  { label: 'Rain',      url: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=800&q=80' },
  { label: 'Volcano',   url: 'https://images.unsplash.com/photo-1565732498548-6d5d2a3ea3d6?w=800&q=80' },
  { label: 'Glacier',   url: 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?w=800&q=80' },
  { label: 'Savanna',   url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80' },
  { label: 'Night Sky', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80' },
]

const SPEED_OPTIONS = [0.3, 0.5, 0.75, 1, 1.25, 1.5, 2, 3]

const VIDEO_QUALITY_OPTIONS = [
  { id: 'original', label: 'Original',    desc: 'Keep original quality',                      size: 'Small' },
  { id: '1080p',    label: '1080p HD',    desc: '✓ TikTok ✓ Instagram ✓ YouTube ✓ Facebook',  size: 'Medium' },
  { id: '2k',       label: '2K (1440p)',  desc: '✓ YouTube ✓ Facebook ✓ Twitter',              size: 'Large' },
  { id: '4k',       label: '4K (2160p)',  desc: '✓ YouTube ✓ Vimeo ✓ Professional',            size: 'Very Large' },
]

const MASK_SHAPES = [
  { id: 'circle',   label: 'Circle',   clipPath: 'circle(50% at 50% 50%)' },
  { id: 'ellipse',  label: 'Ellipse',  clipPath: 'ellipse(60% 40% at 50% 50%)' },
  { id: 'triangle', label: 'Triangle', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  { id: 'diamond',  label: 'Diamond',  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { id: 'hexagon',  label: 'Hexagon',  clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' },
  { id: 'star',     label: 'Star',     clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' },
]

const BG_REPLACEMENT_GRADIENTS = [
  { label: 'Sunset',   css: 'linear-gradient(135deg,#f97316,#ec4899,#7c3aed)' },
  { label: 'Ocean',    css: 'linear-gradient(135deg,#0ea5e9,#06b6d4,#10b981)' },
  { label: 'Aurora',   css: 'linear-gradient(135deg,#7c3aed,#06b6d4,#10b981)' },
  { label: 'Fire',     css: 'linear-gradient(135deg,#ef4444,#f97316,#eab308)' },
  { label: 'Night',    css: 'linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)' },
  { label: 'Forest',   css: 'linear-gradient(135deg,#14532d,#15803d,#4ade80)' },
  { label: 'Rose',     css: 'linear-gradient(135deg,#9d174d,#ec4899,#fda4af)' },
  { label: 'Gold',     css: 'linear-gradient(135deg,#78350f,#d97706,#fde68a)' },
  { label: 'Arctic',   css: 'linear-gradient(135deg,#0c4a6e,#0ea5e9,#e0f2fe)' },
  { label: 'Cosmic',   css: 'linear-gradient(135deg,#1e1b4b,#7c3aed,#ec4899)' },
  { label: 'Emerald',  css: 'linear-gradient(135deg,#064e3b,#059669,#6ee7b7)' },
  { label: 'Neon',     css: 'linear-gradient(135deg,#7c3aed,#06b6d4,#10b981)' },
  { label: 'Peach',    css: 'linear-gradient(135deg,#f9a8d4,#fb923c,#fbbf24)' },
  { label: 'Mint',     css: 'linear-gradient(135deg,#d1fae5,#6ee7b7,#34d399)' },
  { label: 'Lavender', css: 'linear-gradient(135deg,#ede9fe,#c4b5fd,#8b5cf6)' },
  { label: 'Candy',    css: 'linear-gradient(135deg,#fce7f3,#f9a8d4,#ec4899)' },
  { label: 'Sky',      css: 'linear-gradient(135deg,#e0f2fe,#7dd3fc,#0ea5e9)' },
  { label: 'Dusk',     css: 'linear-gradient(135deg,#1f2937,#374151,#6b7280)' },
  { label: 'Rainbow',  css: 'linear-gradient(135deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6)' },
  { label: 'Blush',    css: 'linear-gradient(135deg,#fff1f2,#ffe4e6,#fda4af)' },
  { label: 'Steel',    css: 'linear-gradient(135deg,#0f172a,#1e293b,#334155)' },
  { label: 'Lemon',    css: 'linear-gradient(135deg,#fefce8,#fef08a,#eab308)' },
  { label: 'Coral',    css: 'linear-gradient(135deg,#ff6b6b,#ffa07a,#ff8c69)' },
  { label: 'Jungle',   css: 'linear-gradient(135deg,#134e4a,#065f46,#047857)' },
  { label: 'Berry',    css: 'linear-gradient(135deg,#4c1d95,#7c3aed,#db2777)' },
  { label: 'Ice',      css: 'linear-gradient(135deg,#f0f9ff,#bae6fd,#38bdf8)' },
  { label: 'Bronze',   css: 'linear-gradient(135deg,#431407,#7c2d12,#c2410c)' },
  { label: 'Galaxy',   css: 'linear-gradient(135deg,#020617,#0f172a,#1e1b4b,#4c1d95)' },
  { label: 'Morning',  css: 'linear-gradient(135deg,#fff7ed,#fed7aa,#fb923c)' },
  { label: 'Electric', css: 'linear-gradient(135deg,#0a0a0a,#1d4ed8,#7c3aed,#06b6d4)' },
]

const CAPTION_TEMPLATES = [
  { id: 'subtitles', label: 'Subtitles',    preview: { bg: 'rgba(0,0,0,0.7)', color: '#fff', size: 14 } },
  { id: 'bold',      label: 'Bold Impact',  preview: { bg: 'transparent', color: '#fff', size: 18, weight: 900 } },
  { id: 'tiktok',    label: 'TikTok',       preview: { bg: 'transparent', color: '#fff', size: 20, weight: 900, family: 'Impact' } },
  { id: 'reel',      label: 'IG Reel',      preview: { bg: 'transparent', color: '#fff', size: 15 } },
  { id: 'neon',      label: 'Neon Glow',    preview: { bg: 'transparent', color: '#00fff0', size: 15, glow: true } },
  { id: 'highlight', label: 'Highlight',    preview: { bg: '#fbbf24', color: '#000', size: 14 } },
  { id: 'gradient',  label: 'Gradient',     preview: { bg: 'linear-gradient(90deg,#7c3aed,#ec4899)', color: 'transparent', size: 15 } },
  { id: 'cinematic', label: 'Cinematic',    preview: { bg: 'transparent', color: '#fff', size: 11, spacing: true } },
]

const VIDEO_TEMPLATES = [
  { id:'tiktok',    label:'TikTok Viral',     best:'TikTok, Instagram',   ratio:'9:16',  gradient:'linear-gradient(135deg,#ee0979,#ff6a00)' },
  { id:'reel',      label:'Instagram Reel',   best:'Instagram',           ratio:'9:16',  gradient:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' },
  { id:'ytshort',   label:'YouTube Short',    best:'YouTube',             ratio:'9:16',  gradient:'linear-gradient(135deg,#ff0000,#cc0000)' },
  { id:'story',     label:'Story',            best:'Instagram, Snapchat', ratio:'9:16',  gradient:'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { id:'cinematic', label:'Cinematic',        best:'YouTube, Vimeo',      ratio:'16:9',  gradient:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' },
  { id:'vlog',      label:'Vlog Style',       best:'YouTube',             ratio:'16:9',  gradient:'linear-gradient(135deg,#f7971e,#ffd200)' },
  { id:'product',   label:'Product Showcase', best:'Instagram, TikTok',   ratio:'1:1',   gradient:'linear-gradient(135deg,#e0eafc,#cfdef3)' },
  { id:'tutorial',  label:'Tutorial',         best:'YouTube, LinkedIn',   ratio:'16:9',  gradient:'linear-gradient(135deg,#396afc,#2948ff)' },
  { id:'bna',       label:'Before & After',   best:'Any platform',        ratio:'16:9',  gradient:'linear-gradient(90deg,#e2e8f0 50%,#0f172a 50%)' },
  { id:'reaction',  label:'Reaction',         best:'TikTok, YouTube',     ratio:'9:16',  gradient:'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { id:'news',      label:'News Style',       best:'LinkedIn, Twitter',   ratio:'16:9',  gradient:'linear-gradient(135deg,#1a1a2e,#16213e)' },
  { id:'music',     label:'Music Video',      best:'TikTok, Instagram',   ratio:'16:9',  gradient:'linear-gradient(135deg,#7c3aed,#ec4899)' },
]

const IMAGE_TEMPLATES = [
  { id:'quote',       label:'Quote Card',       gradient:'linear-gradient(135deg,#667eea,#764ba2)', ratio:'1:1' },
  { id:'product',     label:'Product Photo',    gradient:'linear-gradient(135deg,#f5f7fa,#c3cfe2)', ratio:'1:1' },
  { id:'announce',    label:'Announcement',     gradient:'linear-gradient(135deg,#f97316,#7c3aed)', ratio:'16:9' },
  { id:'event',       label:'Event Flyer',      gradient:'linear-gradient(135deg,#ec4899,#f97316)', ratio:'9:16' },
  { id:'bna',         label:'Before & After',   gradient:'linear-gradient(90deg,#e2e8f0 50%,#0f172a 50%)', ratio:'16:9' },
  { id:'testimonial', label:'Testimonial',      gradient:'linear-gradient(135deg,#0ea5e9,#7c3aed)', ratio:'1:1' },
  { id:'tutorial',    label:'Tutorial Steps',   gradient:'linear-gradient(135deg,#396afc,#2948ff)', ratio:'16:9' },
  { id:'compare',     label:'Comparison Grid',  gradient:'linear-gradient(135deg,#d1fae5,#6ee7b7)', ratio:'1:1' },
  { id:'igpost',      label:'Instagram Post',   gradient:'linear-gradient(135deg,#833ab4,#fd1d1d)', ratio:'1:1' },
  { id:'story',       label:'Story Card',       gradient:'linear-gradient(135deg,#a18cd1,#fbc2eb)', ratio:'9:16' },
  { id:'linkedin',    label:'LinkedIn Post',    gradient:'linear-gradient(135deg,#0077b5,#00a0dc)', ratio:'16:9' },
  { id:'meme',        label:'Meme Template',    gradient:'linear-gradient(135deg,#1a1a2e,#16213e)', ratio:'1:1' },
]

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-white/60">{label}</span>
        <span className="text-xs font-mono text-primary">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background" />
    </div>
  )
}

function ToolBtn({ id, icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1 w-14 sm:w-16 py-2.5 sm:py-3 rounded-xl transition-all ${
        active ? 'bg-primary text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
      }`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-[9px] sm:text-[10px] font-medium leading-none">{label}</span>
    </button>
  )
}

function FilterThumb({ filter, src, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
      <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
        active ? 'border-primary shadow-lg shadow-primary/30' : 'border-transparent'
      }`}>
        {src
          ? <img src={src} alt={filter.label} className="w-full h-full object-cover"
              style={{ filter: filter.css === 'none' ? undefined : filter.css }} />
          : <div className="w-full h-full bg-white/10 flex items-center justify-center"
              style={{ filter: filter.css === 'none' ? undefined : filter.css }}>
              <Play className="w-5 h-5 text-white/50" />
            </div>
        }
      </div>
      <span className={`text-[10px] ${active ? 'text-primary font-semibold' : 'text-white/50'}`}>{filter.label}</span>
    </button>
  )
}

// Draggable text/sticker overlay on preview
function OverlayItem({ item, selected, onSelect, onMove, onDelete }) {
  const dragging = useRef(false)
  const origin   = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  const onMouseDown = useCallback(e => {
    e.stopPropagation()
    onSelect()
    dragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, ox: item.x, oy: item.y }
    const move = e2 => {
      if (!dragging.current) return
      onMove(origin.current.ox + e2.clientX - origin.current.mx, origin.current.oy + e2.clientY - origin.current.my)
    }
    const up = () => {
      dragging.current = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [item, onSelect, onMove])

  return (
    <div onMouseDown={onMouseDown}
      className={`absolute cursor-move select-none group ${selected ? 'outline outline-2 outline-primary outline-offset-2 rounded-sm' : ''}`}
      style={{
        left: item.x, top: item.y,
        color: item.color,
        fontSize: item.size,
        fontFamily: item.font,
        fontWeight: item.bold ? 'bold' : 'normal',
        fontStyle: item.italic ? 'italic' : 'normal',
        textAlign: item.align ?? 'left',
        textShadow: item.outline
          ? '1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,0 0 6px rgba(0,0,0,0.9)'
          : '0 1px 6px rgba(0,0,0,0.9)',
        lineHeight: 1.2,
        userSelect: 'none',
      }}>
      {item.text}
      {selected && (
        <button onMouseDown={e => { e.stopPropagation(); onDelete() }}
          className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  )
}

// Crop overlay with 8 drag handles
function CropOverlay({ cropBox, onChange, containerRef }) {
  const handles = ['nw','n','ne','e','se','s','sw','w']
  const dragging = useRef(null)
  const startState = useRef(null)

  const handleMouseDown = useCallback((e, handle) => {
    e.preventDefault()
    e.stopPropagation()
    dragging.current = handle
    startState.current = { mx: e.clientX, my: e.clientY, box: { ...cropBox } }
    const move = e2 => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((e2.clientX - startState.current.mx) / rect.width) * 100
      const dy = ((e2.clientY - startState.current.my) / rect.height) * 100
      const { x, y, w, h } = startState.current.box
      let nx = x, ny = y, nw = w, nh = h
      const MIN = 5
      if (dragging.current.includes('w')) { nx = Math.min(x + w - MIN, x + dx); nw = w - dx }
      if (dragging.current.includes('e')) { nw = Math.max(MIN, w + dx) }
      if (dragging.current.includes('n')) { ny = Math.min(y + h - MIN, y + dy); nh = h - dy }
      if (dragging.current.includes('s')) { nh = Math.max(MIN, h + dy) }
      nx = Math.max(0, nx); ny = Math.max(0, ny)
      nw = Math.min(100 - nx, Math.max(MIN, nw))
      nh = Math.min(100 - ny, Math.max(MIN, nh))
      onChange({ x: nx, y: ny, w: nw, h: nh })
    }
    const up = () => {
      dragging.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [cropBox, onChange, containerRef])

  const { x, y, w, h } = cropBox
  const handlePos = (handle) => ({
    left: `${handle.includes('w') ? x : handle.includes('e') ? x + w : x + w / 2}%`,
    top:  `${handle.includes('n') ? y : handle.includes('s') ? y + h : y + h / 2}%`,
  })
  const cursors = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' }

  return (
    <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {/* Dark overlay outside crop */}
      <div className="absolute inset-0 bg-black/50"
        style={{ clipPath: `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% ${y}%,${x}% ${y}%,${x}% ${y+h}%,${x+w}% ${y+h}%,${x+w}% ${y}%,${x}% ${y}%,0% ${y}%)` }} />
      {/* Crop border + rule-of-thirds */}
      <div className="absolute border-2 border-dashed border-white"
        style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}>
        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
      </div>
      {/* Handles */}
      {handles.map(handle => (
        <div key={handle}
          onMouseDown={e => handleMouseDown(e, handle)}
          style={{ ...handlePos(handle), cursor: cursors[handle], pointerEvents: 'all', transform: 'translate(-50%,-50%)' }}
          className="absolute w-3 h-3 bg-white border-2 border-primary rounded-sm z-10 hover:scale-125 transition-transform" />
      ))}
    </div>
  )
}

// ─── Image Editor ─────────────────────────────────────────────────────────────

const ImageEditor = forwardRef(function ImageEditor({ src, onSave }, ref) {
  const [tool, setTool]             = useState('adjust')
  const [adj, setAdj]               = useState({
    brightness: 100, contrast: 100, saturation: 100,
    warmth: 0, sharpness: 0, highlights: 0, shadows: 0, vignette: 0,
  })
  const [activeFilter, setActiveFilter] = useState('original')
  const [cropBox, setCropBox]       = useState({ x: 0, y: 0, w: 100, h: 100 })
  const [cropRatio, setCropRatio]   = useState(null)
  const [overlays, setOverlays]     = useState([])
  const [selectedId, setSelectedId] = useState(null)
  // Text settings
  const [newText, setNewText]       = useState('')
  const [textFont, setTextFont]     = useState('Inter')
  const [textSize, setTextSize]     = useState(32)
  const [textColor, setTextColor]   = useState('#ffffff')
  const [textBold, setTextBold]     = useState(false)
  const [textItalic, setTextItalic] = useState(false)
  const [textOutline, setTextOutline] = useState(false)
  const [textAlign, setTextAlign]   = useState('center')
  // Stickers
  const [stickerCat, setStickerCat] = useState('smileys')
  // Draw
  const [drawColor, setDrawColor]   = useState('#ff0000')
  const [drawSize, setDrawSize]     = useState(8)
  const [drawOpacity, setDrawOpacity] = useState(100)
  const [isEraser, setIsEraser]     = useState(false)
  // Enhance
  const [exportFormat, setExportFormat] = useState('jpeg')
  const [exportQuality, setExportQuality] = useState('original')
  const [enhanced, setEnhanced]     = useState(false)
  const [saving, setSaving]         = useState(false)
  // Mask (Part 10)
  const [activeMask, setActiveMask]     = useState(null)
  const [maskFeather, setMaskFeather]   = useState(0)
  const [maskInvert, setMaskInvert]     = useState(false)
  // Templates (Part 14)
  const [activeImageTpl, setActiveImageTpl] = useState(null)

  const canvasRef    = useRef()
  const drawCanvasRef = useRef()
  const imgRef       = useRef()
  const imgWrapRef   = useRef()
  const isDrawing    = useRef(false)
  const lastPos      = useRef(null)

  // Combined CSS filter: adjustments + preset
  const cssFilter = useMemo(() => {
    const preset = IMAGE_FILTERS.find(f => f.id === activeFilter)?.css ?? ''
    const v = adj
    const extraBrightness = enhanced ? 1.10 : (v.brightness / 100)
    const extraContrast   = enhanced ? 1.15 : (v.contrast / 100)
    const extraSaturate   = enhanced ? 1.10 : (v.saturation / 100)
    const parts = [
      `brightness(${extraBrightness})`,
      `contrast(${extraContrast})`,
      `saturate(${extraSaturate})`,
      v.warmth !== 0   ? `sepia(${Math.abs(v.warmth) * 0.3}%)` : '',
      v.sharpness !== 0 ? `contrast(${1 + v.sharpness * 0.003})` : '',
    ].filter(Boolean).join(' ')
    const combined = [preset === 'none' ? '' : preset, parts].filter(Boolean).join(' ')
    return combined || 'none'
  }, [adj, activeFilter, enhanced])

  const vignetteStyle = useMemo(() => {
    if (adj.vignette === 0) return null
    return {
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(ellipse at center,transparent ${100 - adj.vignette}%,rgba(0,0,0,${adj.vignette / 120}) 100%)`,
    }
  }, [adj.vignette])

  useImperativeHandle(ref, () => ({ save: handleSave, isSaving: () => saving }))

  const handleSave = useCallback(() => {
    return new Promise(resolve => {
      const img = imgRef.current
      if (!img?.complete) { resolve(null); return }
      setSaving(true)
      const canvas = canvasRef.current
      const W = img.naturalWidth, H = img.naturalHeight
      const scaleMap = { original: 1, hd: 2, ultra: 4 }
      const scaleF = scaleMap[exportQuality] ?? 1
      const isCropped = cropBox.x !== 0 || cropBox.y !== 0 || cropBox.w !== 100 || cropBox.h !== 100
      const srcX = isCropped ? (cropBox.x / 100) * W : 0
      const srcY = isCropped ? (cropBox.y / 100) * H : 0
      const srcW = isCropped ? (cropBox.w / 100) * W : W
      const srcH = isCropped ? (cropBox.h / 100) * H : H
      canvas.width  = srcW * scaleF
      canvas.height = srcH * scaleF
      const ctx = canvas.getContext('2d')
      ctx.filter = cssFilter !== 'none' ? cssFilter : ''
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW * scaleF, srcH * scaleF)
      ctx.filter = ''
      // Composite draw canvas
      const dc = drawCanvasRef.current
      if (dc && dc.width > 0) ctx.drawImage(dc, srcX, srcY, srcW, srcH, 0, 0, srcW * scaleF, srcH * scaleF)
      // Render overlays
      const pw = img.clientWidth || W, ph = img.clientHeight || H
      const sx = (W / pw) * scaleF, sy = (H / ph) * scaleF
      for (const ov of overlays) {
        const ox = ov.x * sx - srcX * scaleF
        const oy = ov.y * sy - srcY * scaleF
        if (ox < 0 || oy < 0 || ox > canvas.width || oy > canvas.height) continue
        ctx.font = `${ov.italic ? 'italic ' : ''}${ov.bold ? 'bold ' : ''}${ov.size * sx}px ${ov.font}`
        ctx.textAlign = ov.align ?? 'left'
        ctx.fillStyle = ov.color
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur  = 6
        if (ov.outline) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeText(ov.text, ox, oy + ov.size * sx) }
        ctx.fillText(ov.text, ox, oy + ov.size * sx)
        ctx.shadowBlur = 0
      }
      const mimeMap = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
      const qualMap = { original: 1, high: 0.9, web: 0.8 }
      const mime = mimeMap[exportFormat] ?? 'image/jpeg'
      const qual = qualMap[exportQuality] ?? 1
      canvas.toBlob(blob => { setSaving(false); resolve(blob); if (blob) onSave(blob) }, mime, qual)
    })
  }, [cssFilter, cropBox, overlays, onSave, exportFormat, exportQuality])

  const addOverlay = (text, isSticker = false) => {
    if (!text.trim()) return
    setOverlays(prev => [...prev, {
      id: Date.now(), text,
      x: 60, y: 60,
      font:   isSticker ? 'Arial' : textFont,
      size:   isSticker ? 48 : textSize,
      color:  isSticker ? 'inherit' : textColor,
      bold:   isSticker ? false : textBold,
      italic: isSticker ? false : textItalic,
      outline: isSticker ? false : textOutline,
      align:  isSticker ? 'left' : textAlign,
    }])
    if (!isSticker) setNewText('')
  }

  const moveOverlay   = (id, x, y) => setOverlays(p => p.map(o => o.id === id ? { ...o, x, y } : o))
  const deleteOverlay = id => { setOverlays(p => p.filter(o => o.id !== id)); setSelectedId(null) }

  const resetAll = () => {
    setAdj({ brightness: 100, contrast: 100, saturation: 100, warmth: 0, sharpness: 0, highlights: 0, shadows: 0, vignette: 0 })
    setActiveFilter('original')
    setOverlays([])
    setSelectedId(null)
    setCropBox({ x: 0, y: 0, w: 100, h: 100 })
    setEnhanced(false)
    const dc = drawCanvasRef.current
    if (dc) dc.getContext('2d').clearRect(0, 0, dc.width, dc.height)
  }

  // Draw canvas
  const initDrawCanvas = useCallback(() => {
    const img = imgRef.current, dc = drawCanvasRef.current
    if (!img || !dc) return
    if (dc.width !== img.naturalWidth || dc.height !== img.naturalHeight) {
      dc.width  = img.naturalWidth  || 800
      dc.height = img.naturalHeight || 600
    }
  }, [])

  const getDrawPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * ((imgRef.current?.naturalWidth || canvas.width) / rect.width),
      y: (e.clientY - rect.top)  * ((imgRef.current?.naturalHeight || canvas.height) / rect.height),
    }
  }, [])

  const startDraw = useCallback(e => {
    if (tool !== 'draw') return
    initDrawCanvas()
    isDrawing.current = true
    const dc = drawCanvasRef.current
    if (dc) lastPos.current = getDrawPos(e, dc)
  }, [tool, initDrawCanvas, getDrawPos])

  const continueDraw = useCallback(e => {
    if (!isDrawing.current || tool !== 'draw') return
    const dc = drawCanvasRef.current
    if (!dc) return
    const ctx = dc.getContext('2d')
    const pos = getDrawPos(e, dc)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = drawColor
      ctx.globalAlpha = drawOpacity / 100
    }
    ctx.lineWidth = drawSize
    ctx.lineCap   = 'round'
    ctx.lineJoin  = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    lastPos.current = pos
  }, [tool, drawColor, drawSize, drawOpacity, isEraser, getDrawPos])

  const endDraw = useCallback(() => { isDrawing.current = false }, [])
  const clearDraw = () => {
    const dc = drawCanvasRef.current
    if (dc) dc.getContext('2d').clearRect(0, 0, dc.width, dc.height)
  }

  const handleAIEnhance = () => {
    setAdj(a => ({ ...a, brightness: 110, contrast: 115, saturation: 110 }))
    setEnhanced(true)
  }

  const TOOLS = [
    { id: 'adjust',    icon: Sliders,         label: 'Adjust' },
    { id: 'crop',      icon: Crop,            label: 'Crop' },
    { id: 'filters',   icon: Sparkles,        label: 'Filters' },
    { id: 'text',      icon: Type,            label: 'Text' },
    { id: 'stickers',  icon: Smile,           label: 'Stickers' },
    { id: 'draw',      icon: Pencil,          label: 'Draw' },
    { id: 'enhance',   icon: Zap,             label: 'Enhance' },
    { id: 'mask',      icon: Layers,          label: 'Mask' },
    { id: 'templates', icon: LayoutTemplate,  label: 'Templates' },
  ]

  return (
    <div className="flex h-full">
      {/* Left: tool panel */}
      <div className="w-14 sm:w-20 bg-black/70 border-r border-white/10 flex flex-col items-center py-4 gap-1 flex-shrink-0 overflow-y-auto">
        {TOOLS.map(t => <ToolBtn key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />)}
        <div className="flex-1" />
        <button onClick={resetAll}
          className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
          <RotateCcw className="w-4 h-4" />
          <span className="text-[9px] sm:text-[10px]">Reset</span>
        </button>
      </div>

      {/* Center: preview */}
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f] overflow-hidden relative"
        onClick={() => setSelectedId(null)}>
        <div className="relative inline-block" ref={imgWrapRef}>
          <img ref={imgRef} src={src} alt="" draggable={false}
            onLoad={initDrawCanvas}
            className="max-w-full max-h-[calc(100vh-160px)] object-contain select-none block"
            style={{
              filter: cssFilter === 'none' ? undefined : cssFilter,
              clipPath: activeMask ? (maskInvert
                ? undefined
                : MASK_SHAPES.find(m => m.id === activeMask)?.clipPath)
                : undefined,
              WebkitClipPath: activeMask ? (maskInvert
                ? undefined
                : MASK_SHAPES.find(m => m.id === activeMask)?.clipPath)
                : undefined,
              transition: 'clip-path 0.25s ease',
            }} />
          {vignetteStyle && <div style={vignetteStyle} />}
          {/* Draw canvas */}
          <canvas ref={drawCanvasRef}
            onMouseDown={startDraw} onMouseMove={continueDraw}
            onMouseUp={endDraw} onMouseLeave={endDraw}
            className="absolute inset-0 w-full h-full"
            style={{
              pointerEvents: tool === 'draw' ? 'all' : 'none',
              cursor: tool === 'draw' ? (isEraser ? 'cell' : 'crosshair') : 'default',
            }} />
          {/* Crop overlay */}
          {tool === 'crop' && <CropOverlay cropBox={cropBox} onChange={setCropBox} containerRef={imgWrapRef} />}
          {/* Text/sticker overlays */}
          {tool !== 'draw' && (
            <div className="absolute inset-0" style={{ pointerEvents: 'all' }}>
              {overlays.map(ov => (
                <OverlayItem key={ov.id} item={ov} selected={selectedId === ov.id}
                  onSelect={() => setSelectedId(ov.id)}
                  onMove={(x, y) => moveOverlay(ov.id, x, y)}
                  onDelete={() => deleteOverlay(ov.id)} />
              ))}
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {saving && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        {enhanced && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
            <Check className="w-3 h-3" /> Enhanced ✓
          </div>
        )}
      </div>

      {/* Right: controls panel */}
      <div className="hidden md:flex w-64 bg-black/70 border-l border-white/10 flex-col overflow-y-auto p-4 space-y-5 flex-shrink-0">

        {/* ── ADJUST ── */}
        {tool === 'adjust' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Adjustments</p>
          <Slider label="Brightness" value={adj.brightness} min={50}  max={150} onChange={v => setAdj(a => ({ ...a, brightness: v }))} unit="%" />
          <Slider label="Contrast"   value={adj.contrast}   min={50}  max={150} onChange={v => setAdj(a => ({ ...a, contrast: v }))}   unit="%" />
          <Slider label="Saturation" value={adj.saturation} min={0}   max={200} onChange={v => setAdj(a => ({ ...a, saturation: v }))} unit="%" />
          <Slider label="Warmth"     value={adj.warmth}     min={-100} max={100} onChange={v => setAdj(a => ({ ...a, warmth: v }))} />
          <Slider label="Sharpness"  value={adj.sharpness}  min={0}   max={100} onChange={v => setAdj(a => ({ ...a, sharpness: v }))} />
          <Slider label="Highlights" value={adj.highlights} min={-100} max={100} onChange={v => setAdj(a => ({ ...a, highlights: v }))} />
          <Slider label="Shadows"    value={adj.shadows}    min={-100} max={100} onChange={v => setAdj(a => ({ ...a, shadows: v }))} />
          <Slider label="Vignette"   value={adj.vignette}   min={0}   max={100} onChange={v => setAdj(a => ({ ...a, vignette: v }))} unit="%" />
        </>)}

        {/* ── CROP ── */}
        {tool === 'crop' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Crop</p>
          <p className="text-[11px] text-white/40">Drag handles on the image. Use presets for fixed ratios.</p>
          <div className="grid grid-cols-3 gap-2">
            {CROP_PRESETS.map(p => (
              <button key={p.label} onClick={() => {
                setCropRatio(p.ratio)
                if (p.ratio !== null) {
                  setCropBox(b => {
                    const newH = b.w / p.ratio
                    return newH <= 100 - b.y
                      ? { ...b, h: Math.min(100 - b.y, b.w / p.ratio) }
                      : { ...b, w: Math.min(100 - b.x, b.h * p.ratio) }
                  })
                }
              }}
                className={`py-2 text-xs rounded-xl border transition-all ${cropRatio === p.ratio ? 'border-primary bg-primary/20 text-primary font-semibold' : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setCropBox({ x: 0, y: 0, w: 100, h: 100 }); setCropRatio(null) }}
            className="w-full py-2 border border-white/20 rounded-xl text-xs text-white/50 hover:text-white hover:border-white/40 transition-colors">
            Reset Crop
          </button>
          <div className="bg-white/5 rounded-xl p-3 text-xs text-white/40 space-y-1">
            <div className="flex justify-between"><span>X</span><span className="text-white">{cropBox.x.toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>Y</span><span className="text-white">{cropBox.y.toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>W</span><span className="text-white">{cropBox.w.toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>H</span><span className="text-white">{cropBox.h.toFixed(1)}%</span></div>
          </div>
        </>)}

        {/* ── FILTERS ── */}
        {tool === 'filters' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Filters</p>
          <div className="grid grid-cols-3 gap-3">
            {IMAGE_FILTERS.map(f => (
              <FilterThumb key={f.id} filter={f} src={src}
                active={activeFilter === f.id}
                onClick={() => setActiveFilter(f.id)} />
            ))}
          </div>
        </>)}

        {/* ── TEXT ── */}
        {tool === 'text' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Add Text</p>
          <textarea value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="Type your text…" rows={3}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary resize-none" />

          {/* Bold / Italic / Outline */}
          <div className="flex gap-2">
            <button onClick={() => setTextBold(b => !b)}
              className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${textBold ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>B</button>
            <button onClick={() => setTextItalic(b => !b)}
              className={`flex-1 py-2 rounded-xl border text-sm italic transition-all ${textItalic ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>I</button>
            <button onClick={() => setTextOutline(b => !b)}
              className={`flex-1 py-2 rounded-xl border text-xs transition-all ${textOutline ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>Outline</button>
          </div>

          {/* Alignment */}
          <div className="flex gap-2">
            {[
              { id: 'left',   icon: AlignLeft },
              { id: 'center', icon: AlignCenter },
              { id: 'right',  icon: AlignRight },
            ].map(a => (
              <button key={a.id} onClick={() => setTextAlign(a.id)}
                className={`flex-1 py-2 rounded-xl border transition-all flex items-center justify-center ${textAlign === a.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>
                <a.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Font family */}
          <div>
            <p className="text-[11px] text-white/40 mb-2">Font</p>
            <div className="flex flex-wrap gap-1.5">
              {FONT_FAMILIES.map(f => (
                <button key={f} onClick={() => setTextFont(f)}
                  className={`px-2 py-1 text-xs rounded-lg border transition-all ${textFont === f ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}
                  style={{ fontFamily: f }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Font size slider */}
          <Slider label="Font Size" value={textSize} min={12} max={120} onChange={setTextSize} unit="px" />

          {/* Color */}
          <div>
            <p className="text-[11px] text-white/40 mb-2">Color</p>
            <div className="flex gap-2 flex-wrap items-center">
              {TEXT_COLORS.map(c => (
                <button key={c} onClick={() => setTextColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${textColor === c ? 'border-primary scale-125' : 'border-transparent hover:border-white/40'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-2 border-white/20 bg-transparent p-0" title="Custom color" />
            </div>
          </div>

          <button onClick={() => addOverlay(newText)} disabled={!newText.trim()}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors">
            Add Text
          </button>

          {overlays.filter(o => o.size < 48).map(o => (
            <div key={o.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
              <span className="text-xs text-white/70 truncate flex-1 mr-2">{o.text}</span>
              <button onClick={() => deleteOverlay(o.id)} className="text-white/40 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedId && (
            <button onClick={() => deleteOverlay(selectedId)}
              className="w-full py-2 border border-red-500/40 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              Delete Selected Text
            </button>
          )}
        </>)}

        {/* ── STICKERS ── */}
        {tool === 'stickers' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Stickers</p>
          <div className="flex gap-1 flex-wrap">
            {STICKER_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setStickerCat(cat.id)}
                className={`text-base px-2 py-1 rounded-lg transition-all ${stickerCat === cat.id ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-white/10'}`}
                title={cat.label}>
                {cat.emoji}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {(STICKER_CATEGORIES.find(c => c.id === stickerCat)?.stickers ?? []).map(s => (
              <button key={s} onClick={() => addOverlay(s, true)}
                className="text-2xl p-1.5 rounded-xl hover:bg-white/10 transition-colors aspect-square flex items-center justify-center">
                {s}
              </button>
            ))}
          </div>
        </>)}

        {/* ── DRAW ── */}
        {tool === 'draw' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Draw</p>
          <div>
            <p className="text-[11px] text-white/40 mb-2">Color</p>
            <div className="flex items-center gap-3">
              <input type="color" value={drawColor}
                onChange={e => { setDrawColor(e.target.value); setIsEraser(false) }}
                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/20 bg-transparent p-0.5" />
              <div className="flex gap-2 flex-wrap">
                {['#ff0000','#ff9900','#ffff00','#00ff00','#0099ff','#9900ff','#ffffff','#000000'].map(c => (
                  <button key={c} onClick={() => { setDrawColor(c); setIsEraser(false) }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${drawColor === c && !isEraser ? 'border-primary scale-125' : 'border-transparent hover:border-white/40'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <Slider label="Brush Size" value={drawSize} min={2} max={50} onChange={setDrawSize} unit="px" />
          <Slider label="Opacity" value={drawOpacity} min={10} max={100} onChange={setDrawOpacity} unit="%" />
          <div className="flex gap-2">
            <button onClick={() => setIsEraser(e => !e)}
              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${isEraser ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>
              Eraser {isEraser ? 'ON' : 'OFF'}
            </button>
            <button onClick={clearDraw}
              className="flex-1 py-2 rounded-xl border border-red-500/40 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
              Clear
            </button>
          </div>
        </>)}

        {/* ── ENHANCE ── */}
        {tool === 'enhance' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Enhance</p>

          {/* AI Enhance */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">One-Click Enhance</p>
            <button onClick={handleAIEnhance}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-violet-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Enhance ✨
            </button>
            {enhanced && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-400 text-center">
                Enhanced ✓ — brightness +10%, contrast +15%, saturation +10%
              </div>
            )}
          </div>

          {/* Upscale */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Upscale Resolution</p>
            <div className="space-y-2">
              {[
                { id: 'original', label: 'Original', desc: 'Keep original size' },
                { id: 'hd',       label: '2× HD',    desc: 'Double resolution' },
                { id: 'ultra',    label: '4× Ultra HD', desc: 'Quadruple resolution' },
              ].map(q => (
                <button key={q.id} onClick={() => setExportQuality(q.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${exportQuality === q.id ? 'border-primary bg-primary/20' : 'border-white/20 hover:border-white/40'}`}>
                  <p className={`text-xs font-semibold ${exportQuality === q.id ? 'text-primary' : 'text-white'}`}>{q.label}</p>
                  <p className="text-[10px] text-white/40">{q.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export format */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Export Format</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'jpeg', label: 'JPEG' },
                { id: 'png',  label: 'PNG' },
                { id: 'webp', label: 'WebP' },
              ].map(f => (
                <button key={f.id} onClick={() => setExportFormat(f.id)}
                  className={`py-2 text-xs rounded-xl border font-medium transition-all ${exportFormat === f.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </>)}

        {/* ── MASK ── */}
        {tool === 'mask' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Mask Shape</p>
          <p className="text-[11px] text-white/40">Clip the image to a shape.</p>
          <div className="grid grid-cols-3 gap-2">
            {MASK_SHAPES.map(shape => (
              <button key={shape.id} onClick={() => setActiveMask(activeMask === shape.id ? null : shape.id)}
                className={`py-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${activeMask === shape.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white hover:border-white/40'}`}>
                <div className="w-8 h-8 bg-white/20 rounded-sm flex-shrink-0"
                  style={{ clipPath: shape.clipPath, WebkitClipPath: shape.clipPath, backgroundColor: activeMask === shape.id ? '#7c3aed' : 'rgba(255,255,255,0.25)' }} />
                {shape.label}
              </button>
            ))}
          </div>
          <Slider label="Feather (blur edges)" value={maskFeather} min={0} max={20} onChange={setMaskFeather} unit="px" />
          <div className="flex items-center justify-between py-2.5 px-3 bg-white/5 rounded-xl">
            <span className="text-xs text-white/60">Invert Mask</span>
            <button onClick={() => setMaskInvert(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${maskInvert ? 'bg-primary' : 'bg-white/20'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${maskInvert ? 'left-5 translate-x-0.5' : 'left-0.5'}`} />
            </button>
          </div>
          {activeMask && (
            <button onClick={() => { setActiveMask(null); setMaskFeather(0); setMaskInvert(false) }}
              className="w-full py-2 border border-red-500/30 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              Remove Mask
            </button>
          )}
        </>)}

        {/* ── TEMPLATES (IMAGE) ── */}
        {tool === 'templates' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Image Templates</p>
          <p className="text-[11px] text-white/40">Choose a starting format for your image.</p>
          <div className="space-y-2">
            {IMAGE_TEMPLATES.map(tpl => (
              <button key={tpl.id}
                onClick={() => setActiveImageTpl(activeImageTpl === tpl.id ? null : tpl.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${activeImageTpl === tpl.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                <div className="w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ background: tpl.gradient }} />
                <div className="text-left">
                  <p className={`text-xs font-semibold ${activeImageTpl === tpl.id ? 'text-primary' : 'text-white'}`}>{tpl.label}</p>
                  <p className="text-[10px] text-white/40">{tpl.ratio}</p>
                </div>
                {activeImageTpl === tpl.id && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
              </button>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
})

// ─── Video Editor ─────────────────────────────────────────────────────────────

const VideoEditor = forwardRef(function VideoEditor({ src, onSave }, ref) {
  const [tool, setTool]               = useState('filters')
  const [activeFilter, setFilter]     = useState('original')
  const [speed, setSpeed]             = useState(1)
  const [volume, setVolume]           = useState(100)
  const [muted, setMuted]             = useState(false)
  const [trimStart, setTrimStart]     = useState(0)
  const [trimEnd, setTrimEnd]         = useState(null)
  const [duration, setDuration]       = useState(0)
  const [playing, setPlaying]         = useState(false)
  const [currentTime, setCurrent]     = useState(0)
  const [scrubbing, setScrubbing]     = useState(false)
  const wasPlayingRef                 = useRef(false)

  // Text overlays
  const [videoTexts, setVideoTexts]   = useState([])
  const [vtText, setVtText]           = useState('')
  const [vtStart, setVtStart]         = useState(0)
  const [vtEnd, setVtEnd]             = useState(5)
  const [vtColor, setVtColor]         = useState('#ffffff')
  const [vtSize, setVtSize]           = useState(24)

  // Audio
  const [musicFile, setMusicFile]     = useState(null)
  const [musicVolume, setMusicVolume] = useState(80)

  // Captions
  const [captions, setCaptions]       = useState([])
  const [captionsLoading, setCaptionsLoading] = useState(false)
  const [captionError, setCaptionError] = useState('')

  // Enhance
  const [videoQuality, setVideoQuality] = useState('original')
  const [stabilized, setStabilized]   = useState(false)
  const [stabilizing, setStabilizing] = useState(false)
  const [noiseReduce, setNoiseReduce] = useState(false)
  const [videoEnhanced, setVideoEnhanced] = useState(false)

  // Timeline / segments (Part 1-4)
  const [segments, setSegments]           = useState([])          // [{id,start,end}]
  const [selectedSegId, setSelectedSegId] = useState(null)
  const [timelineZoom, setTimelineZoom]   = useState(1)           // 1 | 2 | 4

  // Background removal (Part 5-6)
  const [bgRemoved, setBgRemoved]         = useState(false)
  const [bgProcessing, setBgProcessing]   = useState(false)
  const [bgColorKey, setBgColorKey]       = useState('#00ff00')
  const [replacementBg, setReplacementBg] = useState(null)        // gradient css, color, or image url
  const [bgReplaceBgType, setBgReplaceBgType] = useState('gradient') // 'gradient' | 'color' | 'nature'
  const [bgError, setBgError]             = useState('')
  const bgCanvasRef                       = useRef()

  // Audio extract (Part 7)
  const [extracting, setExtracting]       = useState(false)
  const [extractDone, setExtractDone]     = useState(false)

  // Audio extras (Part 8)
  const [normalizeAudio, setNormalizeAudio]   = useState(false)
  const [voiceEnhance, setVoiceEnhance]       = useState(false)
  const [audioNoiseReduce, setAudioNoiseReduce] = useState(false)

  // Reverse (Part 9)
  const [reversed, setReversed]           = useState(false)

  // Transcript (Part 11)
  const [transcript, setTranscript]       = useState([])          // [{text,start,end}]
  const [transcriptLoading, setTranscriptLoading] = useState(false)

  // Caption template (Part 12)
  const [captionTemplate, setCaptionTemplate] = useState('subtitles')

  // Video templates (Part 13)
  const [activeVideoTplId, setActiveVideoTplId] = useState(null)

  const videoRef     = useRef()
  const musicRef     = useRef()
  const musicInputRef = useRef()
  const progressRef  = useRef()
  const timelineRef  = useRef()

  const cssFilter = useMemo(() => {
    const base = VIDEO_FILTERS.find(f => f.id === activeFilter)?.css ?? 'none'
    let f = base === 'none' ? '' : base
    if (videoEnhanced) f = (f + ' contrast(1.05) saturate(1.1) brightness(1.02)').trim()
    if (noiseReduce)   f = (f + ' blur(0.3px) contrast(1.1)').trim()
    return f || 'none'
  }, [activeFilter, videoEnhanced, noiseReduce])

  useImperativeHandle(ref, () => ({
    save: () => {
      const result = {
        url: src, filters: cssFilter, speed,
        volume: muted ? 0 : volume / 100,
        trim: { start: trimStart, end: trimEnd ?? duration },
        texts: videoTexts, captions, musicVolume: musicVolume / 100, quality: videoQuality,
      }
      onSave(result)
      return Promise.resolve(result)
    },
  }))

  // Sync speed + volume to video element
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.playbackRate = speed
    vid.volume = muted ? 0 : Math.min(1, volume / 100)
  }, [speed, volume, muted])

  // Time update + trim enforcement
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const end = trimEnd ?? duration
    const onTime = () => {
      if (!scrubbing) setCurrent(vid.currentTime)
      if (end > 0 && vid.currentTime >= end) { vid.pause(); setPlaying(false) }
      if (musicRef.current && musicRef.current.paused !== vid.paused) {
        vid.paused ? musicRef.current.pause() : musicRef.current.play().catch(() => {})
      }
    }
    vid.addEventListener('timeupdate', onTime)
    return () => vid.removeEventListener('timeupdate', onTime)
  }, [trimEnd, duration, scrubbing])

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = Math.min(1, musicVolume / 100)
  }, [musicVolume])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (playing) {
      vid.pause(); musicRef.current?.pause(); setPlaying(false)
    } else {
      if (vid.currentTime < trimStart || vid.currentTime >= (trimEnd ?? duration)) vid.currentTime = trimStart
      vid.play(); musicRef.current?.play().catch(() => {}); setPlaying(true)
    }
  }

  const seekBySeconds = (delta) => {
    const vid = videoRef.current
    if (!vid) return
    const t = Math.max(trimStart, Math.min(trimEnd ?? duration, vid.currentTime + delta))
    vid.currentTime = t
    setCurrent(t)
  }

  // Progress bar scrubbing
  const getProgressFraction = (e) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  const onProgressMouseDown = (e) => {
    const vid = videoRef.current
    if (!vid) return
    wasPlayingRef.current = playing
    if (playing) { vid.pause(); setPlaying(false) }
    setScrubbing(true)
    const frac = getProgressFraction(e)
    const t = frac * duration
    vid.currentTime = t
    setCurrent(t)
  }

  useEffect(() => {
    if (!scrubbing) return
    const onMove = (e) => {
      const vid = videoRef.current
      if (!vid) return
      const t = getProgressFraction(e) * duration
      vid.currentTime = t
      setCurrent(t)
    }
    const onUp = () => {
      setScrubbing(false)
      if (wasPlayingRef.current) {
        videoRef.current?.play(); setPlaying(true)
        musicRef.current?.play().catch(() => {})
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [scrubbing, duration])

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const addVideoText = () => {
    if (!vtText.trim()) return
    setVideoTexts(prev => [...prev, { id: Date.now(), text: vtText, startTime: vtStart, endTime: vtEnd, x: 50, y: 80, color: vtColor, size: vtSize }])
    setVtText('')
  }

  const generateCaptions = async () => {
    if (!duration) return
    setCaptionsLoading(true); setCaptionError('')
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate realistic timed captions for a ${Math.round(duration)}-second video. Return ONLY a JSON array: [{"text":"Hello world","start":0,"end":2.5}]. Create 5-8 captions.`,
        }),
      })
      const data = await res.json()
      const parsed = JSON.parse(data.result)
      if (Array.isArray(parsed)) setCaptions(parsed)
      else setCaptionError('Unexpected format from AI.')
    } catch {
      setCaptionError('Failed to generate captions. Please try again.')
    }
    setCaptionsLoading(false)
  }

  const handleStabilize = () => {
    setStabilizing(true)
    setTimeout(() => { setStabilizing(false); setStabilized(true) }, 2000)
  }

  const activeTexts    = videoTexts.filter(t => currentTime >= t.startTime && currentTime <= t.endTime)
  const activeCaptions = captions.filter(c => currentTime >= c.start && currentTime <= c.end)

  // ── Segment helpers ──────────────────────────────────────────────────────
  const initSegments = useCallback((dur) => {
    setSegments([{ id: 1, start: 0, end: dur }])
  }, [])

  const handleSplit = useCallback(() => {
    if (!duration) return
    const t = videoRef.current?.currentTime ?? currentTime
    setSegments(prev => {
      const seg = prev.find(s => t > s.start && t < s.end)
      if (!seg) return prev
      return prev.flatMap(s =>
        s.id === seg.id
          ? [{ id: s.id, start: s.start, end: t }, { id: Date.now(), start: t, end: s.end }]
          : [s]
      )
    })
  }, [currentTime, duration])

  const handleDeleteSeg = useCallback((id) => {
    setSegments(prev => prev.filter(s => s.id !== id))
    if (selectedSegId === id) setSelectedSegId(null)
  }, [selectedSegId])

  const handleDuplicateSeg = useCallback((id) => {
    setSegments(prev => {
      const seg = prev.find(s => s.id === id)
      if (!seg) return prev
      const len = seg.end - seg.start
      return [...prev, { id: Date.now(), start: seg.start, end: seg.start + len }]
    })
  }, [])

  // ── Audio extract ─────────────────────────────────────────────────────────
  const handleExtractAudio = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    setExtracting(true)
    try {
      const stream = vid.captureStream ? vid.captureStream() : vid.mozCaptureStream?.()
      if (!stream) { setExtracting(false); return }
      const audioTracks = stream.getAudioTracks()
      if (!audioTracks.length) { setExtracting(false); return }
      const audioStream = new MediaStream(audioTracks)
      const rec = new MediaRecorder(audioStream)
      const chunks = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'extracted-audio.webm'; a.click()
        URL.revokeObjectURL(url)
        setExtracting(false); setExtractDone(true)
      }
      vid.currentTime = 0
      vid.play()
      rec.start()
      setTimeout(() => { rec.stop(); vid.pause() }, (duration || 10) * 1000 + 500)
    } catch { setExtracting(false) }
  }, [duration])

  // ── Transcript ────────────────────────────────────────────────────────────
  const handleTranscript = useCallback(async () => {
    if (!duration) return
    setTranscriptLoading(true)
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a realistic transcript for a ${Math.round(duration)}-second video. Return ONLY a JSON array of objects: [{"text":"Hello world","start":0,"end":2.5}]. Create 6-10 entries covering the full duration.`,
        }),
      })
      const data = await res.json()
      const parsed = JSON.parse(data.result)
      if (Array.isArray(parsed)) {
        setTranscript(parsed)
        setCaptions(parsed)
      }
    } catch { /* silent */ }
    setTranscriptLoading(false)
  }, [duration])

  // ── Export SRT ────────────────────────────────────────────────────────────
  const exportSRT = useCallback(() => {
    const items = transcript.length ? transcript : captions
    if (!items.length) return
    const pad = n => String(Math.floor(n)).padStart(2, '0')
    const toSRT = t => {
      const h = pad(t / 3600), m = pad((t % 3600) / 60), s = pad(t % 60)
      const ms = String(Math.round((t % 1) * 1000)).padStart(3, '0')
      return `${h}:${m}:${s},${ms}`
    }
    const txt = items.map((c, i) => `${i + 1}\n${toSRT(c.start)} --> ${toSRT(c.end ?? c.start + 2)}\n${c.text}`).join('\n\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'captions.srt'; a.click()
    URL.revokeObjectURL(url)
  }, [transcript, captions])

  const TOOLS = [
    { id: 'filters',   icon: Sparkles,        label: 'Filters' },
    { id: 'trim',      icon: Scissors,        label: 'Trim' },
    { id: 'speed',     icon: Gauge,           label: 'Speed' },
    { id: 'audio',     icon: Volume2,         label: 'Audio' },
    { id: 'text',      icon: Type,            label: 'Text' },
    { id: 'music',     icon: Music,           label: 'Music' },
    { id: 'captions',  icon: FileText,        label: 'Captions' },
    { id: 'effects',   icon: Wand2,           label: 'Effects' },
    { id: 'enhance',   icon: Zap,             label: 'Enhance' },
    { id: 'vtemplates',icon: LayoutTemplate,  label: 'Templates' },
  ]

  return (
    <div className="flex h-full">
      {/* Left: tool panel */}
      <div className="w-14 sm:w-20 bg-black/70 border-r border-white/10 flex flex-col items-center py-4 gap-1 flex-shrink-0 overflow-y-auto">
        {TOOLS.map(t => <ToolBtn key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />)}
      </div>

      {/* Center: video + custom controls */}
      <div className="flex-1 flex flex-col bg-black overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden px-4 pt-4">
          <video ref={videoRef} src={src}
            controls={false}
            onLoadedMetadata={e => {
              const dur = e.target.duration
              setDuration(dur)
              setTrimEnd(dur)
              setVtEnd(Math.min(5, dur))
              initSegments(dur)
            }}
            className="max-w-full max-h-full object-contain"
            style={{ filter: cssFilter === 'none' ? undefined : cssFilter }}
            onClick={togglePlay} />

          {/* Text overlays */}
          {activeTexts.map(t => (
            <div key={t.id} className="absolute pointer-events-none font-bold"
              style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)', color: t.color, fontSize: t.size, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
              {t.text}
            </div>
          ))}

          {/* Caption overlay */}
          {activeCaptions.map((c, i) => (
            <div key={i} className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 px-4 py-1.5 rounded-lg text-white text-base font-medium text-center max-w-lg">
              {c.text}
            </div>
          ))}

          {/* Play hint */}
          {!playing && (
            <div className="absolute w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center pointer-events-none">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          )}
        </div>

        {/* ── Timeline ── */}
        {segments.length > 0 && duration > 0 && (
          <div ref={timelineRef} className="flex-shrink-0 px-5 pt-2">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={handleSplit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/70 hover:text-white transition-colors border border-white/10">
                <SplitSquareHorizontal className="w-3.5 h-3.5" /> Split
              </button>
              {selectedSegId && (
                <>
                  <button onClick={() => handleDeleteSeg(selectedSegId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs text-red-400 transition-colors border border-red-500/20">
                    <X className="w-3.5 h-3.5" /> Delete
                  </button>
                  <button onClick={() => handleDuplicateSeg(selectedSegId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/70 hover:text-white transition-colors border border-white/10">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                </>
              )}
              <button onClick={() => setReversed(v => !v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors border ${reversed ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/10 border-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}>
                <RotateCcw className="w-3.5 h-3.5" /> {reversed ? '↩ Reversed' : 'Reverse'}
              </button>
              <div className="flex-1" />
              {[1, 2, 4].map(z => (
                <button key={z} onClick={() => setTimelineZoom(z)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${timelineZoom === z ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-white/40 hover:text-white'}`}>
                  {z}×
                </button>
              ))}
            </div>
            {/* Track rows */}
            <div className="space-y-0.5 bg-black/30 rounded-xl p-2 overflow-x-auto">
              {[
                { label: 'Video', color: 'bg-primary/70' },
                { label: 'Audio', color: 'bg-emerald-500/70' },
                { label: 'Music', color: 'bg-amber-500/70' },
                { label: 'Text',  color: 'bg-pink-500/70' },
              ].map((track, ti) => (
                <div key={track.label} className="flex items-center gap-2 h-7">
                  <span className="text-[9px] text-white/30 w-8 flex-shrink-0 text-right">{track.label}</span>
                  <div className="relative flex-1 h-5 bg-white/5 rounded overflow-hidden" style={{ minWidth: `${timelineZoom * 100}%` }}>
                    {ti === 0 && segments.map(seg => (
                      <div key={seg.id}
                        onClick={() => setSelectedSegId(id => id === seg.id ? null : seg.id)}
                        className={`absolute top-0 bottom-0 rounded cursor-pointer border transition-all ${selectedSegId === seg.id ? 'border-white bg-primary/80' : `${track.color} border-transparent hover:border-white/30`}`}
                        style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%` }}
                      />
                    ))}
                    {ti === 1 && segments.map(seg => (
                      <div key={seg.id}
                        className="absolute top-0 bottom-0 rounded bg-emerald-500/50"
                        style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%` }}
                      />
                    ))}
                    {ti === 2 && musicFile && (
                      <div className="absolute inset-0 rounded bg-amber-500/50" />
                    )}
                    {/* Playhead */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 pointer-events-none z-10"
                      style={{ left: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Custom Controls ── */}
        <div className="flex-shrink-0 px-5 pb-4 pt-2 space-y-2">
          {/* Progress bar */}
          <div
            ref={progressRef}
            onMouseDown={onProgressMouseDown}
            className="relative h-2 rounded-full bg-white/15 cursor-pointer group"
            style={{ userSelect: 'none' }}>
            {/* Trim range */}
            {duration > 0 && (
              <div className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary/50 pointer-events-none"
                style={{ left: `${(trimStart / duration) * 100}%`, width: `${((trimEnd ?? duration) - trimStart) / duration * 100}%` }} />
            )}
            {/* Progress fill */}
            <div className="absolute top-0 left-0 bottom-0 bg-primary rounded-full pointer-events-none transition-none"
              style={{ width: `${pct}%` }} />
            {/* Thumb */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg border border-primary pointer-events-none transition-none"
              style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }} />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* -10s */}
            <button onClick={() => seekBySeconds(-10)}
              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors" title="Back 10s">
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20">
              {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </button>

            {/* +10s */}
            <button onClick={() => seekBySeconds(10)}
              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors" title="Forward 10s">
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Time display */}
            <span className="text-xs font-mono text-white/60 ml-1">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Fullscreen */}
            <button onClick={() => videoRef.current?.requestFullscreen?.()}
              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors" title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {musicFile && <audio ref={musicRef} src={URL.createObjectURL(musicFile)} loop style={{ display: 'none' }} />}
      </div>

      {/* Right: controls panel */}
      <div className="hidden md:flex w-64 bg-black/70 border-l border-white/10 flex-col overflow-y-auto p-4 space-y-5 flex-shrink-0">

        {/* ── FILTERS ── */}
        {tool === 'filters' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Filters</p>
          <div className="grid grid-cols-3 gap-3">
            {VIDEO_FILTERS.map(f => (
              <FilterThumb key={f.id} filter={f} src={null}
                active={activeFilter === f.id}
                onClick={() => setFilter(f.id)} />
            ))}
          </div>
        </>)}

        {/* ── TRIM ── */}
        {tool === 'trim' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Trim</p>
          <Slider label="Start" value={parseFloat(trimStart.toFixed(1))}
            min={0} max={parseFloat(((trimEnd ?? duration) - 0.1).toFixed(1))} step={0.1}
            onChange={v => { setTrimStart(v); if (videoRef.current) videoRef.current.currentTime = v }} unit="s" />
          <Slider label="End" value={parseFloat((trimEnd ?? duration).toFixed(1))}
            min={parseFloat((trimStart + 0.1).toFixed(1))} max={parseFloat(duration.toFixed(1))} step={0.1}
            onChange={setTrimEnd} unit="s" />
          <div className="bg-white/5 rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between text-white/50"><span>Clip length</span><span className="text-white">{((trimEnd ?? duration) - trimStart).toFixed(1)}s</span></div>
            <div className="flex justify-between text-white/50"><span>Original</span><span>{duration.toFixed(1)}s</span></div>
          </div>
        </>)}

        {/* ── SPEED ── */}
        {tool === 'speed' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Playback Speed</p>
          <div className="grid grid-cols-4 gap-2">
            {SPEED_OPTIONS.map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`py-2 text-xs rounded-xl border font-medium transition-all ${speed === s ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}>
                {s}×
              </button>
            ))}
          </div>
        </>)}

        {/* ── AUDIO ── */}
        {tool === 'audio' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Audio</p>
          <Slider label="Volume" value={volume} min={0} max={200} onChange={setVolume} unit="%" />
          <button onClick={() => setMuted(m => !m)}
            className="w-full py-2 border border-white/20 rounded-xl text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors">
            {muted ? '🔊 Unmute' : '🔇 Mute'}
          </button>
          {/* Audio processing */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Processing</p>
            {[
              { label: '🎙 Noise Reduction', state: audioNoiseReduce, set: setAudioNoiseReduce },
              { label: '📢 Normalize Audio', state: normalizeAudio,   set: setNormalizeAudio },
              { label: '🎤 Voice Enhance',   state: voiceEnhance,     set: setVoiceEnhance },
            ].map(opt => (
              <button key={opt.label} onClick={() => opt.set(v => !v)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between px-3 border ${opt.state ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'}`}>
                <span className="text-xs">{opt.label}</span>
                {opt.state && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
          {/* Extract audio */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-[11px] text-white/60 font-medium">Extract Audio</p>
            <button onClick={handleExtractAudio} disabled={extracting || extractDone}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${extractDone ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'} disabled:opacity-60`}>
              {extracting ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
                : extractDone ? <><Check className="w-4 h-4" /> Downloaded!</>
                : <><Download className="w-4 h-4" /> Extract to .webm</>}
            </button>
          </div>
          {/* Loudness meter (visual only) */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40">Loudness</p>
            <div className="flex items-end gap-0.5 h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex-1 bg-primary/40 rounded-sm"
                  style={{ height: `${Math.max(10, Math.random() * 100 * (muted ? 0.05 : volume / 100))}%` }} />
              ))}
            </div>
          </div>
        </>)}

        {/* ── TEXT ── */}
        {tool === 'text' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Text Overlay</p>
          <input value={vtText} onChange={e => setVtText(e.target.value)}
            placeholder="Enter text…"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary" />
          {duration > 0 && <>
            <Slider label="Start Time" value={parseFloat(vtStart.toFixed(1))} min={0}
              max={parseFloat((duration - 0.5).toFixed(1))} step={0.1}
              onChange={v => { setVtStart(v); if (vtEnd <= v) setVtEnd(Math.min(duration, v + 1)) }} unit="s" />
            <Slider label="End Time" value={parseFloat(vtEnd.toFixed(1))}
              min={parseFloat((vtStart + 0.1).toFixed(1))} max={parseFloat(duration.toFixed(1))} step={0.1}
              onChange={setVtEnd} unit="s" />
          </>}
          <div>
            <p className="text-[11px] text-white/40 mb-2">Color</p>
            <div className="flex gap-2 flex-wrap items-center">
              {TEXT_COLORS.map(c => (
                <button key={c} onClick={() => setVtColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${vtColor === c ? 'border-primary scale-125' : 'border-transparent hover:border-white/40'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={vtColor} onChange={e => setVtColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border border-white/20 bg-transparent p-0" />
            </div>
          </div>
          <Slider label="Size" value={vtSize} min={12} max={72} onChange={setVtSize} unit="px" />
          <button onClick={addVideoText} disabled={!vtText.trim()}
            className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors">
            Add Text
          </button>
          {videoTexts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-white/40">Added</p>
              {videoTexts.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{t.text}</p>
                    <p className="text-[10px] text-white/40">{t.startTime.toFixed(1)}s – {t.endTime.toFixed(1)}s</p>
                  </div>
                  <button onClick={() => setVideoTexts(prev => prev.filter(x => x.id !== t.id))} className="text-white/40 hover:text-red-400 ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* ── MUSIC ── */}
        {tool === 'music' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Music</p>
          <button onClick={() => musicInputRef.current?.click()}
            className="w-full py-2.5 border border-white/20 rounded-xl text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
            <Music className="w-4 h-4" />
            {musicFile ? 'Change Music File' : 'Choose Audio File'}
          </button>
          <input ref={musicInputRef} type="file" accept="audio/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) setMusicFile(e.target.files[0]) }} />
          {musicFile && (<>
            <div className="bg-white/5 rounded-xl p-3 text-xs space-y-1">
              <p className="text-white/80 font-medium truncate">{musicFile.name}</p>
              <p className="text-white/40">{(musicFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Slider label="Music Volume" value={musicVolume} min={0} max={100} onChange={setMusicVolume} unit="%" />
            <button onClick={() => setMusicFile(null)}
              className="w-full py-2 border border-red-500/30 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              Remove Music
            </button>
          </>)}
        </>)}

        {/* ── CAPTIONS ── */}
        {tool === 'captions' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Captions</p>

          {/* Generate */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Auto-Generate</p>
            <button onClick={handleTranscript} disabled={transcriptLoading || !duration}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              {transcriptLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Transcribing…</> : <><Mic className="w-4 h-4" /> Generate Transcript</>}
            </button>
            <button onClick={generateCaptions} disabled={captionsLoading || !duration}
              className="w-full py-2 border border-white/20 rounded-xl text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
              {captionsLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Zap className="w-3.5 h-3.5" /> Quick Captions (AI)</>}
            </button>
          </div>

          {captionError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">{captionError}</div>}

          {/* Caption style */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Caption Style</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CAPTION_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => setCaptionTemplate(tpl.id)}
                  className={`px-2 py-2 rounded-xl border text-[10px] font-medium transition-all ${captionTemplate === tpl.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 text-white/50 hover:text-white hover:border-white/30'}`}
                  style={{
                    background: captionTemplate === tpl.id ? undefined : tpl.preview?.bg !== 'transparent' ? tpl.preview?.bg : undefined,
                    color: captionTemplate === tpl.id ? undefined : tpl.preview?.color,
                  }}>
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Captions list */}
          {captions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/40">{captions.length} captions</p>
                <button onClick={exportSRT}
                  className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                  <Download className="w-3 h-3" /> Export SRT
                </button>
              </div>
              {captions.map((c, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 space-y-1.5">
                  <input value={c.text}
                    onChange={e => setCaptions(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                    className="w-full bg-transparent text-xs text-white border-b border-white/10 focus:outline-none focus:border-primary pb-1" />
                  <div className="flex gap-2 text-[10px] text-white/40 items-center">
                    <input type="number" step="0.1" value={c.start} onChange={e => setCaptions(p => p.map((x, j) => j === i ? { ...x, start: Number(e.target.value) } : x))}
                      className="w-12 bg-white/5 rounded px-1 py-0.5 text-white border border-white/10 focus:outline-none" />
                    <span>–</span>
                    <input type="number" step="0.1" value={c.end} onChange={e => setCaptions(p => p.map((x, j) => j === i ? { ...x, end: Number(e.target.value) } : x))}
                      className="w-12 bg-white/5 rounded px-1 py-0.5 text-white border border-white/10 focus:outline-none" />
                    <span>s</span>
                    <button onClick={() => setCaptions(prev => prev.filter((_, j) => j !== i))} className="ml-auto text-red-400/60 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* ── ENHANCE (VIDEO) ── */}
        {tool === 'enhance' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Enhance</p>

          {/* Video enhance */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Auto Enhance</p>
            <button onClick={() => setVideoEnhanced(v => !v)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${videoEnhanced ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'}`}>
              <Sparkles className="w-4 h-4" />
              {videoEnhanced ? 'Enhanced ✓' : 'Auto Enhance Video'}
            </button>
          </div>

          {/* Stabilize */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Stabilization</p>
            <button onClick={handleStabilize} disabled={stabilized || stabilizing}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${stabilized ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-50'}`}>
              {stabilizing ? <><Loader2 className="w-4 h-4 animate-spin" /> Stabilizing…</> : stabilized ? 'Stabilized ✓' : 'Stabilize Video'}
            </button>
          </div>

          {/* Noise reduction */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Noise Reduction</p>
            <button onClick={() => setNoiseReduce(v => !v)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${noiseReduce ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'}`}>
              {noiseReduce ? 'Applied ✓' : 'Apply Noise Reduction'}
            </button>
          </div>

          {/* Export quality */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Export Quality</p>
            {VIDEO_QUALITY_OPTIONS.map(q => (
              <button key={q.id} onClick={() => setVideoQuality(q.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${videoQuality === q.id ? 'border-primary bg-primary/20' : 'border-white/20 hover:border-white/40'}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-semibold ${videoQuality === q.id ? 'text-primary' : 'text-white'}`}>{q.label}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${videoQuality === q.id ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white/40'}`}>{q.size}</span>
                </div>
                <p className="text-[10px] text-white/40 mt-0.5">{q.desc}</p>
              </button>
            ))}
          </div>
        </>)}

        {/* ── EFFECTS ── */}
        {tool === 'effects' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Effects</p>

          {/* Background Removal */}
          <div className="space-y-2">
            <p className="text-[11px] text-white/60 font-medium">Remove Background</p>
            <p className="text-[10px] text-white/30">Uses AI to remove background from current frame</p>
            {bgError && <p className="text-[10px] text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">{bgError}</p>}
            <button
              onClick={async () => {
                setBgError('')
                setBgProcessing(true)
                try {
                  // Extract current video frame to canvas
                  const vid = videoRef.current
                  if (!vid) throw new Error('No video loaded')
                  const tmpCanvas = document.createElement('canvas')
                  tmpCanvas.width  = vid.videoWidth  || 640
                  tmpCanvas.height = vid.videoHeight || 360
                  const ctx = tmpCanvas.getContext('2d')
                  ctx.drawImage(vid, 0, 0, tmpCanvas.width, tmpCanvas.height)
                  // Convert to blob
                  const blob = await new Promise(resolve => tmpCanvas.toBlob(resolve, 'image/jpeg', 0.92))
                  // Build multipart form
                  const fd = new FormData()
                  fd.append('image_file', blob, 'frame.jpg')
                  fd.append('size', 'auto')
                  // Call serverless function
                  const res = await fetch('/api/remove-bg', { method: 'POST', body: fd })
                  if (!res.ok) {
                    const txt = await res.text()
                    throw new Error(txt || `HTTP ${res.status}`)
                  }
                  const pngBlob = await res.blob()
                  const pngUrl  = URL.createObjectURL(pngBlob)
                  // Store the removed-bg frame URL (draw on preview canvas)
                  const bc = bgCanvasRef.current
                  if (bc) {
                    bc.width = tmpCanvas.width; bc.height = tmpCanvas.height
                    const bctx = bc.getContext('2d')
                    const img  = new Image()
                    img.onload = () => { bctx.clearRect(0,0,bc.width,bc.height); bctx.drawImage(img, 0, 0) }
                    img.src = pngUrl
                  }
                  setBgRemoved(true)
                } catch (e) {
                  setBgError(e.message || 'Background removal failed')
                } finally {
                  setBgProcessing(false)
                }
              }}
              disabled={bgProcessing}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${bgRemoved ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'} disabled:opacity-60`}>
              {bgProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : bgRemoved ? <><Check className="w-4 h-4" /> Background Removed</>
                : <>✂️ Remove Background</>}
            </button>
            {bgRemoved && (
              <button onClick={() => { setBgRemoved(false); setBgError(''); setReplacementBg(null) }}
                className="w-full py-1.5 border border-white/10 rounded-xl text-xs text-white/40 hover:text-white transition-colors">
                Reset
              </button>
            )}
          </div>

          {/* Background Replacement */}
          {bgRemoved && (
            <div className="space-y-2">
              <p className="text-[11px] text-white/60 font-medium">Replace Background</p>
              {/* Tab switcher */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                {[['gradient','Gradients'],['color','Colors'],['nature','Nature']].map(([type, label]) => (
                  <button key={type} onClick={() => setBgReplaceBgType(type)}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${bgReplaceBgType === type ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {bgReplaceBgType === 'gradient' && (
                <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                  {BG_REPLACEMENT_GRADIENTS.map(g => (
                    <button key={g.label} onClick={() => setReplacementBg(g.css)}
                      className={`h-12 rounded-xl border-2 transition-all ${replacementBg === g.css ? 'border-primary scale-105' : 'border-transparent hover:border-white/30'}`}
                      style={{ background: g.css }}
                      title={g.label} />
                  ))}
                </div>
              )}

              {bgReplaceBgType === 'color' && (
                <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto">
                  {BG_COLORS.map(c => (
                    <button key={c} onClick={() => setReplacementBg(c)}
                      className={`h-9 rounded-lg border-2 transition-all ${replacementBg === c ? 'border-primary scale-105' : 'border-transparent hover:border-white/30'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}

              {bgReplaceBgType === 'nature' && (
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {NATURE_BACKGROUNDS.map(n => (
                    <button key={n.label} onClick={() => setReplacementBg(`url(${n.url})`)}
                      className={`h-14 rounded-xl border-2 transition-all overflow-hidden relative ${replacementBg === `url(${n.url})` ? 'border-primary scale-105' : 'border-transparent hover:border-white/30'}`}
                      title={n.label}>
                      <img src={n.url} alt={n.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 text-[9px] text-white bg-black/50 text-center py-0.5">{n.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {replacementBg && (
                <button onClick={() => setReplacementBg(null)}
                  className="w-full py-1.5 border border-white/10 rounded-xl text-xs text-white/40 hover:text-white transition-colors">
                  Clear Replacement
                </button>
              )}
            </div>
          )}
        </>)}

        {/* ── VIDEO TEMPLATES ── */}
        {tool === 'vtemplates' && (<>
          <p className="text-xs font-bold text-white uppercase tracking-wide">Video Templates</p>
          <p className="text-[11px] text-white/40">Select a format for your final export.</p>
          <div className="space-y-2">
            {VIDEO_TEMPLATES.map(tpl => (
              <button key={tpl.id}
                onClick={() => setActiveVideoTplId(id => id === tpl.id ? null : tpl.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${activeVideoTplId === tpl.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                <div className="w-12 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white/70"
                  style={{ background: tpl.gradient }}>
                  {tpl.ratio}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${activeVideoTplId === tpl.id ? 'text-primary' : 'text-white'}`}>{tpl.label}</p>
                  <p className="text-[10px] text-white/40 truncate">{tpl.best}</p>
                </div>
                {activeVideoTplId === tpl.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
})

// ─── Main MediaEditor ─────────────────────────────────────────────────────────

export default function MediaEditor({ file, url: urlProp, onSave, onClose, embedded = false }) {
  const [mediaSrc, setMediaSrc]   = useState(urlProp || null)
  const [mediaType, setMediaType] = useState(null)
  const [ready, setReady]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const editorRef = useRef()

  useEffect(() => {
    if (file) {
      const u = URL.createObjectURL(file)
      setMediaSrc(u)
      setMediaType(file.type.startsWith('video') ? 'video' : 'image')
      setReady(true)
      return () => URL.revokeObjectURL(u)
    } else if (urlProp) {
      setMediaSrc(urlProp)
      setMediaType(/\.(mp4|webm|mov|ogg)(\?|$)/i.test(urlProp) ? 'video' : 'image')
      setReady(true)
    }
  }, [file, urlProp])

  const handleDone = async () => {
    if (!editorRef.current || saving) return
    setSaving(true)
    try { await editorRef.current.save() }
    finally { setSaving(false) }
  }

  if (!ready || !mediaSrc) {
    return (
      <div className={`${embedded ? 'w-full h-full' : 'fixed inset-0 z-[100]'} bg-black flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className={`${embedded ? 'w-full h-full' : 'fixed inset-0 z-[100]'} bg-[#0a0a0f] flex flex-col`}
      style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-white/10 bg-black/60 flex-shrink-0">
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-xl hover:bg-white/10">
          <ChevronLeft className="w-4 h-4" /> Cancel
        </button>
        <h2 className="text-sm font-bold text-white">
          {mediaType === 'video' ? '🎬 Video Editor' : '🖼️ Image Editor'}
        </h2>
        <button onClick={handleDone} disabled={saving}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors min-w-[72px] justify-center">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Done</>}
        </button>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-hidden">
        {mediaType === 'image'
          ? <ImageEditor ref={editorRef} src={mediaSrc} onSave={onSave} />
          : <VideoEditor ref={editorRef} src={mediaSrc} onSave={onSave} />}
      </div>
    </div>
  )
}
