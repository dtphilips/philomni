/**
 * MediaEditor — full-screen overlay for image & video editing.
 *
 * Props:
 *   file?     — File object (image or video from upload)
 *   url?      — existing URL string (for editing already-uploaded media)
 *   onSave    — callback(blob) for images | callback({url,filters,trim,...}) for video
 *   onClose   — callback to dismiss the editor
 *   embedded? — when true, fills parent instead of fixed overlay
 */
import React, {
  useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle,
} from 'react'
import {
  ChevronLeft, Sliders, Crop, Sparkles, Type, Smile,
  Play, Pause, SkipBack, Gauge, Volume2, Scissors,
  RotateCcw, Loader2, X, Check, Pencil, Image as ImageIcon,
  Music, FileText, Zap,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_FILTERS = [
  { id: 'original',  label: 'Original',  css: '' },
  { id: 'vivid',     label: 'Vivid',     css: 'saturate(1.8) contrast(1.1)' },
  { id: 'cool',      label: 'Cool',      css: 'hue-rotate(20deg) saturate(1.2)' },
  { id: 'warm',      label: 'Warm',      css: 'sepia(0.3) saturate(1.4) hue-rotate(-15deg)' },
  { id: 'fade',      label: 'Fade',      css: 'opacity(0.85) contrast(0.85) saturate(0.8)' },
  { id: 'chrome',    label: 'Chrome',    css: 'saturate(1.5) contrast(1.2) hue-rotate(-10deg)' },
  { id: 'noir',      label: 'Noir',      css: 'grayscale(1) contrast(1.3)' },
  { id: 'matte',     label: 'Matte',     css: 'contrast(0.85) saturate(0.9) brightness(1.1)' },
  { id: 'cinematic', label: 'Cinematic', css: 'contrast(1.2) saturate(0.7) brightness(0.9) sepia(0.2)' },
  { id: 'golden',    label: 'Golden',    css: 'sepia(0.5) saturate(1.6) brightness(1.05)' },
  { id: 'moody',     label: 'Moody',     css: 'brightness(0.85) contrast(1.3) saturate(0.6)' },
  { id: 'bright',    label: 'Bright',    css: 'brightness(1.3) saturate(1.1) contrast(0.95)' },
  { id: 'vintage',   label: 'Vintage',   css: 'sepia(0.4) saturate(0.8) brightness(1.05) hue-rotate(-10deg)' },
  { id: 'dreamy',    label: 'Dreamy',    css: 'brightness(1.1) saturate(0.7) contrast(0.9)' },
  { id: 'dramatic',  label: 'Dramatic',  css: 'contrast(1.5) saturate(0.5) brightness(0.85)' },
  { id: 'neon',      label: 'Neon',      css: 'saturate(2.5) brightness(1.2) contrast(1.3) hue-rotate(270deg)' },
]

const VIDEO_FILTERS = [
  { id: 'none',      label: 'None',      css: 'none' },
  { id: 'vivid',     label: 'Vivid',     css: 'saturate(1.8) contrast(1.1)' },
  { id: 'cool',      label: 'Cool',      css: 'hue-rotate(20deg) saturate(1.2)' },
  { id: 'noir',      label: 'Noir',      css: 'grayscale(1) contrast(1.3)' },
  { id: 'warm',      label: 'Warm',      css: 'sepia(0.3) saturate(1.4)' },
  { id: 'cinematic', label: 'Cinematic', css: 'contrast(1.2) saturate(0.7) brightness(0.9)' },
]

const CROP_PRESETS = [
  { label: 'Free',  ratio: null },
  { label: '1:1',   ratio: 1 },
  { label: '4:5',   ratio: 4 / 5 },
  { label: '16:9',  ratio: 16 / 9 },
  { label: '9:16',  ratio: 9 / 16 },
  { label: '4:3',   ratio: 4 / 3 },
]

const FONT_FAMILIES = ['Arial', 'Georgia', 'Impact', 'Courier New', 'Verdana']
const FONT_SIZES    = [14, 18, 24, 32, 48, 64]
const TEXT_COLORS   = ['#ffffff', '#000000', '#7c3aed', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']

const STICKER_CATEGORIES = [
  { id: 'smileys',      label: 'Smileys',       emoji: '😀', stickers: ['😀','😂','😍','🥰','😎','😢','😡','🤔','😴','🥳','😅','🤣'] },
  { id: 'hearts',       label: 'Hearts',         emoji: '❤️', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','🫶','💘'] },
  { id: 'celebrations', label: 'Celebrations',   emoji: '🎉', stickers: ['🎉','✨','🔥','💎','🚀','⚡','🌟','🏆','👑','🎊','🎯','💥'] },
  { id: 'nature',       label: 'Nature',         emoji: '🌈', stickers: ['🌈','🌸','🌿','🍀','🌊','⛅','🦋','🌺','🌙','⭐','🌻','🍂'] },
  { id: 'food',         label: 'Food',           emoji: '🍕', stickers: ['🍕','🍔','🍣','🍩','🎂','🍓','☕','🧁','🍫','🥑','🍾','🥂'] },
  { id: 'objects',      label: 'Objects',        emoji: '💻', stickers: ['💻','📱','🎵','🎬','📸','💡','🎮','🎨','📚','🔑','🪄','🎤'] },
]

const BG_COLORS = ['#000000','#ffffff','#1a1a2e','#16213e','#e63946','#457b9d','#2d6a4f','#f4a261']
const BG_GRADIENTS = [
  { label: 'Sunset',  css: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { label: 'Purple',  css: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: 'Ocean',   css: 'linear-gradient(135deg, #2196f3, #00bcd4)' },
  { label: 'Forest',  css: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { label: 'Fire',    css: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
  { label: 'Night',   css: 'linear-gradient(135deg, #0f0c29, #302b63)' },
]

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

function FilterThumb({ filter, src, active, onClick, isVideo = false }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
      <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
        active ? 'border-primary shadow-lg shadow-primary/30' : 'border-transparent'
      }`}>
        {isVideo ? (
          <div className="w-full h-full bg-white/10 flex items-center justify-center"
            style={{ filter: filter.css === 'none' ? undefined : filter.css }}>
            <Play className="w-5 h-5 text-white/50" />
          </div>
        ) : (
          <img src={src} alt={filter.label} className="w-full h-full object-cover"
            style={{ filter: filter.css || 'none' }} />
        )}
      </div>
      <span className={`text-[11px] ${active ? 'text-primary font-semibold' : 'text-white/50'}`}>{filter.label}</span>
    </button>
  )
}

// Draggable text/sticker item overlaid on the preview
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
    const up = () => { dragging.current = false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [item, onSelect, onMove])

  const textStyle = {
    left: item.x,
    top: item.y,
    color: item.color,
    fontSize: item.size,
    fontFamily: item.font,
    fontWeight: item.bold ? 'bold' : 'normal',
    fontStyle: item.italic ? 'italic' : 'normal',
    textShadow: item.outline
      ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 6px rgba(0,0,0,0.9)'
      : '0 1px 6px rgba(0,0,0,0.9)',
    lineHeight: 1.2,
    userSelect: 'none',
  }

  return (
    <div onMouseDown={onMouseDown}
      className={`absolute cursor-move select-none group ${selected ? 'outline outline-2 outline-primary outline-offset-2 rounded-sm' : ''}`}
      style={textStyle}>
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
    startState.current = {
      mx: e.clientX, my: e.clientY,
      box: { ...cropBox },
    }
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
      // Clamp
      nx = Math.max(0, nx); ny = Math.max(0, ny)
      nw = Math.min(100 - nx, Math.max(MIN, nw))
      nh = Math.min(100 - ny, Math.max(MIN, nh))
      onChange({ x: nx, y: ny, w: nw, h: nh })
    }
    const up = () => { dragging.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [cropBox, onChange, containerRef])

  const { x, y, w, h } = cropBox

  const handlePos = (handle) => {
    const hx = handle.includes('w') ? x : handle.includes('e') ? x + w : x + w / 2
    const hy = handle.includes('n') ? y : handle.includes('s') ? y + h : y + h / 2
    return { left: `${hx}%`, top: `${hy}%` }
  }

  const cursor = (h) => {
    const map = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' }
    return map[h]
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ pointerEvents: 'none' }}>
      {/* Dark overlays outside crop */}
      <div className="absolute inset-0 bg-black/50"
        style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${y}%, ${x}% ${y}%, ${x}% ${y+h}%, ${x+w}% ${y+h}%, ${x+w}% ${y}%, ${x}% ${y}%, 0% ${y}%)` }} />
      {/* Crop border */}
      <div className="absolute border-2 border-dashed border-white pointer-events-none"
        style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}>
        {/* Rule of thirds lines */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
        </div>
      </div>
      {/* Handles */}
      {handles.map(handle => (
        <div key={handle}
          onMouseDown={e => handleMouseDown(e, handle)}
          style={{ ...handlePos(handle), cursor: cursor(handle), pointerEvents: 'all', transform: 'translate(-50%, -50%)' }}
          className="absolute w-3 h-3 bg-white border-2 border-primary rounded-sm z-10 hover:scale-125 transition-transform" />
      ))}
    </div>
  )
}

// ─── Image Editor ─────────────────────────────────────────────────────────────

const ImageEditor = forwardRef(function ImageEditor({ src, onSave }, ref) {
  const [tool, setTool]           = useState('adjust')
  const [adj, setAdj]             = useState({
    brightness: 100, contrast: 100, saturation: 100, warmth: 0, blur: 0,
    sharpness: 0, highlights: 0, shadows: 0, vignette: 0,
  })
  const [activeFilter, setActiveFilter] = useState('original')
  const [cropBox, setCropBox]     = useState({ x: 0, y: 0, w: 100, h: 100 })
  const [cropRatio, setCropRatio] = useState(null)
  const [overlays, setOverlays]   = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [newText, setNewText]     = useState('')
  const [textFont, setTextFont]   = useState('Arial')
  const [textSize, setTextSize]   = useState(32)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textBold, setTextBold]   = useState(false)
  const [textItalic, setTextItalic] = useState(false)
  const [textOutline, setTextOutline] = useState(false)
  const [stickerCat, setStickerCat] = useState('smileys')
  const [drawColor, setDrawColor] = useState('#ff0000')
  const [drawSize, setDrawSize]   = useState(4)
  const [isEraser, setIsEraser]   = useState(false)
  const [bgMode, setBgMode]       = useState(null) // null | 'color' | 'gradient' | 'blur'
  const [bgColor, setBgColor]     = useState('#000000')
  const [bgGradient, setBgGradient] = useState(null)
  const [bgBlur, setBgBlur]       = useState(0)
  const [bgRemoveMsg, setBgRemoveMsg] = useState(false)
  const [saving, setSaving]       = useState(false)

  const canvasRef     = useRef()
  const drawCanvasRef = useRef()
  const imgRef        = useRef()
  const previewRef    = useRef()
  const imgWrapRef    = useRef()
  const isDrawing     = useRef(false)
  const lastPos       = useRef(null)

  // CSS filter from adjustments + preset
  const cssFilter = useMemo(() => {
    const preset = IMAGE_FILTERS.find(f => f.id === activeFilter)?.css ?? ''
    const v = adj
    const parts = [
      v.brightness !== 100 ? `brightness(${v.brightness / 100})` : '',
      v.contrast   !== 100 ? `contrast(${v.contrast / 100})`     : '',
      v.saturation !== 100 ? `saturate(${v.saturation / 100})`   : '',
      v.warmth     !== 0   ? `sepia(${Math.abs(v.warmth) / 200}) hue-rotate(${v.warmth > 0 ? -15 : 15}deg)` : '',
      v.blur       !== 0   ? `blur(${v.blur}px)`                 : '',
      v.sharpness  !== 0   ? `contrast(${1 + v.sharpness * 0.003})` : '',
    ].filter(Boolean).join(' ')
    return [preset, parts].filter(Boolean).join(' ') || 'none'
  }, [adj, activeFilter])

  // Vignette overlay opacity/gradient
  const vignetteStyle = useMemo(() => {
    const v = adj.vignette
    if (v === 0) return null
    return {
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `radial-gradient(ellipse at center, transparent ${100 - v}%, rgba(0,0,0,${v / 120}) 100%)`,
    }
  }, [adj.vignette])

  // Expose save() to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    isSaving: () => saving,
  }))

  const handleSave = useCallback(() => {
    return new Promise(resolve => {
      const img = imgRef.current
      if (!img?.complete) { resolve(null); return }
      setSaving(true)

      const canvas = canvasRef.current
      const W = img.naturalWidth, H = img.naturalHeight

      // Determine crop in natural pixels
      const isCropped = cropBox.x !== 0 || cropBox.y !== 0 || cropBox.w !== 100 || cropBox.h !== 100
      const srcX = isCropped ? (cropBox.x / 100) * W : 0
      const srcY = isCropped ? (cropBox.y / 100) * H : 0
      const srcW = isCropped ? (cropBox.w / 100) * W : W
      const srcH = isCropped ? (cropBox.h / 100) * H : H

      canvas.width  = srcW
      canvas.height = srcH

      const ctx = canvas.getContext('2d')
      ctx.filter = cssFilter !== 'none' ? cssFilter : ''
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
      ctx.filter = ''

      // Composite draw canvas on top
      const drawCanvas = drawCanvasRef.current
      if (drawCanvas && drawCanvas.width > 0) {
        ctx.drawImage(drawCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
      }

      // Scale overlays from preview coords → cropped natural image coords
      const pw = imgRef.current?.clientWidth  || W
      const ph = imgRef.current?.clientHeight || H
      const sx = W / pw, sy = H / ph

      for (const ov of overlays) {
        const ox = ov.x * sx - srcX
        const oy = ov.y * sy - srcY
        if (ox < 0 || oy < 0 || ox > srcW || oy > srcH) continue
        ctx.font         = `${ov.italic ? 'italic ' : ''}${ov.bold ? 'bold ' : ''}${ov.size * sx}px ${ov.font}`
        ctx.fillStyle    = ov.color === 'inherit' ? '#ffffff' : ov.color
        ctx.shadowColor  = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur   = 6
        if (ov.outline) {
          ctx.strokeStyle     = '#000'
          ctx.lineWidth       = 2
          ctx.strokeText(ov.text, ox, oy + ov.size * sx)
        }
        ctx.fillText(ov.text, ox, oy + ov.size * sx)
      }

      canvas.toBlob(blob => { setSaving(false); resolve(blob); if (blob) onSave(blob) }, 'image/jpeg', 0.92)
    })
  }, [cssFilter, cropBox, overlays, onSave])

  const addOverlay = (text, isSticker = false) => {
    if (!text.trim()) return
    setOverlays(prev => [...prev, {
      id: Date.now(), text,
      x: 60, y: 60,
      font: isSticker ? 'Arial' : textFont,
      size: isSticker ? 48 : textSize,
      color: isSticker ? 'inherit' : textColor,
      bold: isSticker ? false : textBold,
      italic: isSticker ? false : textItalic,
      outline: isSticker ? false : textOutline,
    }])
    if (!isSticker) setNewText('')
  }

  const moveOverlay   = (id, x, y) => setOverlays(p => p.map(o => o.id === id ? { ...o, x, y } : o))
  const deleteOverlay = id => { setOverlays(p => p.filter(o => o.id !== id)); setSelectedId(null) }

  const resetAll = () => {
    setAdj({ brightness: 100, contrast: 100, saturation: 100, warmth: 0, blur: 0, sharpness: 0, highlights: 0, shadows: 0, vignette: 0 })
    setActiveFilter('original')
    setOverlays([])
    setSelectedId(null)
    setCropBox({ x: 0, y: 0, w: 100, h: 100 })
    setBgMode(null)
    // Clear draw canvas
    const dc = drawCanvasRef.current
    if (dc) { const ctx = dc.getContext('2d'); ctx.clearRect(0, 0, dc.width, dc.height) }
  }

  // Draw canvas setup
  const initDrawCanvas = useCallback(() => {
    const img = imgRef.current
    const dc  = drawCanvasRef.current
    if (!img || !dc) return
    if (dc.width !== img.naturalWidth || dc.height !== img.naturalHeight) {
      dc.width  = img.naturalWidth  || 800
      dc.height = img.naturalHeight || 600
    }
  }, [])

  const getDrawPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = (imgRef.current?.naturalWidth  || canvas.width)  / rect.width
    const scaleY = (imgRef.current?.naturalHeight || canvas.height) / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }, [])

  const startDraw = useCallback(e => {
    if (tool !== 'draw') return
    initDrawCanvas()
    isDrawing.current = true
    const dc = drawCanvasRef.current
    if (!dc) return
    lastPos.current = getDrawPos(e, dc)
  }, [tool, initDrawCanvas, getDrawPos])

  const continueDraw = useCallback(e => {
    if (!isDrawing.current || tool !== 'draw') return
    const dc  = drawCanvasRef.current
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
    }
    ctx.lineWidth   = drawSize
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current = pos
  }, [tool, drawColor, drawSize, isEraser, getDrawPos])

  const endDraw = useCallback(() => { isDrawing.current = false }, [])

  const clearDrawCanvas = () => {
    const dc = drawCanvasRef.current
    if (!dc) return
    const ctx = dc.getContext('2d')
    ctx.clearRect(0, 0, dc.width, dc.height)
  }

  // Background style for the image wrap
  const bgWrapStyle = useMemo(() => {
    if (bgMode === 'color')    return { background: bgColor }
    if (bgMode === 'gradient' && bgGradient) return { background: bgGradient }
    if (bgMode === 'blur')     return { backdropFilter: `blur(${bgBlur}px)` }
    return {}
  }, [bgMode, bgColor, bgGradient, bgBlur])

  const TOOLS = [
    { id: 'adjust',     icon: Sliders,    label: 'Adjust' },
    { id: 'crop',       icon: Crop,       label: 'Crop' },
    { id: 'filters',    icon: Sparkles,   label: 'Filters' },
    { id: 'text',       icon: Type,       label: 'Text' },
    { id: 'stickers',   icon: Smile,      label: 'Stickers' },
    { id: 'draw',       icon: Pencil,     label: 'Draw' },
    { id: 'background', icon: ImageIcon,  label: 'BG' },
  ]

  return (
    <div className="flex h-full" ref={previewRef}>
      {/* Left: tool panel */}
      <div className="w-14 sm:w-20 bg-black/70 border-r border-white/10 flex flex-col items-center py-4 gap-1 flex-shrink-0 overflow-y-auto">
        {TOOLS.map(t => <ToolBtn key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />)}
        <div className="flex-1" />
        <button onClick={resetAll} className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
          <RotateCcw className="w-4 h-4" />
          <span className="text-[9px] sm:text-[10px]">Reset</span>
        </button>
      </div>

      {/* Center: image preview */}
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f] overflow-hidden relative"
        onClick={() => setSelectedId(null)}>
        <div className="relative inline-block" ref={imgWrapRef} style={bgWrapStyle}>
          <img ref={imgRef} src={src} alt="" draggable={false}
            onLoad={initDrawCanvas}
            className="max-w-full max-h-[calc(100vh-160px)] object-contain select-none block"
            style={{ filter: cssFilter, display: 'block' }} />

          {/* Vignette overlay */}
          {vignetteStyle && <div style={vignetteStyle} />}

          {/* Draw canvas overlay */}
          <canvas ref={drawCanvasRef}
            onMouseDown={startDraw}
            onMouseMove={continueDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            className="absolute inset-0 w-full h-full"
            style={{
              pointerEvents: tool === 'draw' ? 'all' : 'none',
              cursor: tool === 'draw' ? (isEraser ? 'cell' : 'crosshair') : 'default',
              objectFit: 'contain',
            }} />

          {/* Crop overlay */}
          {tool === 'crop' && (
            <CropOverlay cropBox={cropBox} onChange={setCropBox} containerRef={imgWrapRef} />
          )}

          {/* Text/sticker overlay layer */}
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

        {/* Hidden export canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {saving && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="hidden md:block w-64 bg-black/70 border-l border-white/10 overflow-y-auto p-4 space-y-5 flex-shrink-0">

        {/* ADJUST */}
        {tool === 'adjust' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Adjustments</p>
            <Slider label="Brightness" value={adj.brightness} min={50}  max={150} onChange={v => setAdj(a => ({ ...a, brightness: v }))} unit="%" />
            <Slider label="Contrast"   value={adj.contrast}   min={50}  max={150} onChange={v => setAdj(a => ({ ...a, contrast: v }))}   unit="%" />
            <Slider label="Saturation" value={adj.saturation} min={0}   max={200} onChange={v => setAdj(a => ({ ...a, saturation: v }))} unit="%" />
            <Slider label="Warmth"     value={adj.warmth}     min={-50} max={50}  onChange={v => setAdj(a => ({ ...a, warmth: v }))} />
            <Slider label="Blur"       value={adj.blur}       min={0}   max={10}  step={0.5} onChange={v => setAdj(a => ({ ...a, blur: v }))} unit="px" />
            <Slider label="Sharpness"  value={adj.sharpness}  min={0}   max={100} onChange={v => setAdj(a => ({ ...a, sharpness: v }))} />
            <Slider label="Highlights" value={adj.highlights} min={-50} max={50}  onChange={v => setAdj(a => ({ ...a, highlights: v }))} />
            <Slider label="Shadows"    value={adj.shadows}    min={-50} max={50}  onChange={v => setAdj(a => ({ ...a, shadows: v }))} />
            <Slider label="Vignette"   value={adj.vignette}   min={0}   max={100} onChange={v => setAdj(a => ({ ...a, vignette: v }))} unit="%" />
          </>
        )}

        {/* CROP */}
        {tool === 'crop' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Crop</p>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/50 space-y-1">
              <p>Drag the handles on the image to crop. Use presets below for fixed ratios.</p>
            </div>
            <p className="text-[11px] text-white/40">Aspect Ratio</p>
            <div className="grid grid-cols-3 gap-2">
              {CROP_PRESETS.map(p => (
                <button key={p.label} onClick={() => {
                  setCropRatio(p.ratio)
                  if (p.ratio !== null) {
                    // Apply ratio to current crop box keeping x,y
                    const newH = cropBox.w / p.ratio
                    if (newH <= 100 - cropBox.y) {
                      setCropBox(b => ({ ...b, h: Math.min(100 - b.y, b.w / p.ratio) }))
                    } else {
                      const newW = cropBox.h * p.ratio
                      setCropBox(b => ({ ...b, w: Math.min(100 - b.x, b.h * p.ratio) }))
                    }
                  }
                }}
                  className={`py-2 text-xs rounded-xl border transition-all ${cropRatio === p.ratio ? 'border-primary bg-primary/20 text-primary font-semibold' : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={() => setCropBox({ x: 0, y: 0, w: 100, h: 100 })}
              className="w-full py-2 border border-white/20 rounded-xl text-xs text-white/50 hover:text-white hover:border-white/40 transition-colors">
              Reset Crop
            </button>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/40 space-y-1">
              <div className="flex justify-between"><span>X</span><span className="text-white">{cropBox.x.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Y</span><span className="text-white">{cropBox.y.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Width</span><span className="text-white">{cropBox.w.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Height</span><span className="text-white">{cropBox.h.toFixed(1)}%</span></div>
            </div>
          </>
        )}

        {/* FILTERS */}
        {tool === 'filters' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Filters</p>
            <div className="grid grid-cols-3 gap-3">
              {IMAGE_FILTERS.map(f => (
                <FilterThumb key={f.id} filter={f} src={src}
                  active={activeFilter === f.id}
                  onClick={() => setActiveFilter(f.id)} />
              ))}
            </div>
          </>
        )}

        {/* TEXT */}
        {tool === 'text' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Add Text</p>
            <textarea value={newText} onChange={e => setNewText(e.target.value)}
              placeholder="Type your text…" rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary resize-none" />

            {/* Style toggles */}
            <div className="flex gap-2">
              <button onClick={() => setTextBold(b => !b)}
                className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${textBold ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>
                B
              </button>
              <button onClick={() => setTextItalic(b => !b)}
                className={`flex-1 py-2 rounded-xl border text-sm italic transition-all ${textItalic ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>
                I
              </button>
              <button onClick={() => setTextOutline(b => !b)}
                className={`flex-1 py-2 rounded-xl border text-xs transition-all ${textOutline ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>
                Outline
              </button>
            </div>

            <div>
              <p className="text-[11px] text-white/40 mb-2">Font</p>
              <div className="flex flex-wrap gap-1.5">
                {FONT_FAMILIES.map(f => (
                  <button key={f} onClick={() => setTextFont(f)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-all ${textFont === f ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}
                    style={{ fontFamily: f }}>{f.split(' ')[0]}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-white/40 mb-2">Size</p>
              <div className="flex gap-1.5 flex-wrap">
                {FONT_SIZES.map(s => (
                  <button key={s} onClick={() => setTextSize(s)}
                    className={`w-9 h-9 text-xs rounded-lg border transition-all ${textSize === s ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-white/20 text-white/50 hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
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
              Place Text
            </button>
            {overlays.filter(o => !o.size || o.size < 48).map(o => (
              <div key={o.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                <span className="text-xs text-white/70 truncate flex-1 mr-2">{o.text}</span>
                <button onClick={() => deleteOverlay(o.id)} className="text-white/40 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </>
        )}

        {/* STICKERS */}
        {tool === 'stickers' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Stickers</p>
            {/* Category tabs */}
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
            {overlays.filter(o => o.size >= 48).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-white/40">Placed</p>
                {overlays.filter(o => o.size >= 48).map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-1.5">
                    <span className="text-lg">{o.text}</span>
                    <button onClick={() => deleteOverlay(o.id)} className="text-white/40 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* DRAW */}
        {tool === 'draw' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Draw</p>
            <p className="text-[11px] text-white/40">Draw directly on the image. Use the canvas overlay.</p>
            <div>
              <p className="text-[11px] text-white/40 mb-2">Color</p>
              <div className="flex items-center gap-3">
                <input type="color" value={isEraser ? '#ffffff' : drawColor}
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
            <Slider label="Brush Size" value={drawSize} min={1} max={20} onChange={setDrawSize} unit="px" />
            <div className="flex gap-2">
              <button onClick={() => setIsEraser(e => !e)}
                className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${isEraser ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/50 hover:text-white'}`}>
                Eraser {isEraser ? 'ON' : 'OFF'}
              </button>
              <button onClick={clearDrawCanvas}
                className="flex-1 py-2 rounded-xl border border-red-500/40 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                Clear
              </button>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/40">
              Tip: Switch to other tools to place text/stickers on top of your drawing.
            </div>
          </>
        )}

        {/* BACKGROUND */}
        {tool === 'background' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Background</p>

            {/* Blur bg */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/60 font-medium">Blur Background</p>
                <button onClick={() => setBgMode(bgMode === 'blur' ? null : 'blur')}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${bgMode === 'blur' ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/40'}`}>
                  {bgMode === 'blur' ? 'On' : 'Off'}
                </button>
              </div>
              {bgMode === 'blur' && (
                <Slider label="Blur" value={bgBlur} min={0} max={20} onChange={v => { setBgBlur(v); setBgMode('blur') }} unit="px" />
              )}
            </div>

            {/* Solid color */}
            <div className="space-y-2">
              <p className="text-[11px] text-white/60 font-medium">Solid Color</p>
              <div className="grid grid-cols-8 gap-1">
                {BG_COLORS.map(c => (
                  <button key={c} onClick={() => { setBgColor(c); setBgMode('color') }}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${bgMode === 'color' && bgColor === c ? 'border-primary scale-110' : 'border-transparent hover:border-white/30'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <input type="color" value={bgColor}
                onChange={e => { setBgColor(e.target.value); setBgMode('color') }}
                className="w-full h-8 rounded-xl cursor-pointer border border-white/20 bg-transparent p-0.5" />
            </div>

            {/* Gradients */}
            <div className="space-y-2">
              <p className="text-[11px] text-white/60 font-medium">Gradient</p>
              <div className="grid grid-cols-3 gap-2">
                {BG_GRADIENTS.map(g => (
                  <button key={g.label} onClick={() => { setBgGradient(g.css); setBgMode('gradient') }}
                    className={`h-12 rounded-xl border-2 transition-all text-xs font-medium text-white/80 ${bgMode === 'gradient' && bgGradient === g.css ? 'border-primary shadow-lg shadow-primary/30' : 'border-transparent hover:border-white/30'}`}
                    style={{ background: g.css }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remove Background */}
            <div className="space-y-2">
              <p className="text-[11px] text-white/60 font-medium">Remove Background</p>
              <button onClick={() => setBgRemoveMsg(true)}
                className="w-full py-2.5 border border-white/20 rounded-xl text-sm text-white/70 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Remove Background
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">AI</span>
              </button>
              {bgRemoveMsg && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary/80 text-center">
                  Coming soon — AI background removal is in development.
                </div>
              )}
            </div>

            {bgMode && (
              <button onClick={() => { setBgMode(null); setBgGradient(null) }}
                className="w-full py-2 border border-white/20 rounded-xl text-xs text-white/50 hover:text-white hover:border-white/40 transition-colors">
                Remove Background Effect
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
})

// ─── Video Editor ─────────────────────────────────────────────────────────────

const VideoEditor = forwardRef(function VideoEditor({ src, onSave }, ref) {
  const [tool, setTool]             = useState('filters')
  const [activeFilter, setFilter]   = useState('none')
  const [speed, setSpeed]           = useState(1)
  const [volume, setVolume]         = useState(100)
  const [trimStart, setTrimStart]   = useState(0)
  const [trimEnd, setTrimEnd]       = useState(null)
  const [duration, setDuration]     = useState(0)
  const [playing, setPlaying]       = useState(false)
  const [currentTime, setCurrent]   = useState(0)

  // Text overlays
  const [videoTexts, setVideoTexts]       = useState([])
  const [vtText, setVtText]               = useState('')
  const [vtStart, setVtStart]             = useState(0)
  const [vtEnd, setVtEnd]                 = useState(5)
  const [vtColor, setVtColor]             = useState('#ffffff')
  const [vtSize, setVtSize]               = useState(24)

  // Music
  const [musicFile, setMusicFile]         = useState(null)
  const [musicVolume, setMusicVolume]     = useState(80)

  // Captions
  const [captions, setCaptions]           = useState([])
  const [captionsLoading, setCaptionsLoading] = useState(false)
  const [captionError, setCaptionError]   = useState('')

  const videoRef    = useRef()
  const musicRef    = useRef()
  const musicInputRef = useRef()

  const cssFilter = VIDEO_FILTERS.find(f => f.id === activeFilter)?.css ?? 'none'

  useImperativeHandle(ref, () => ({
    save: () => {
      const result = {
        url: src,
        filters: cssFilter,
        speed,
        volume: volume / 100,
        trim: { start: trimStart, end: trimEnd ?? duration },
        texts: videoTexts,
        captions,
        musicVolume: musicVolume / 100,
      }
      onSave(result)
      return Promise.resolve(result)
    },
  }))

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.playbackRate = speed
    vid.volume = Math.min(1, Math.max(0, volume / 100))
  }, [speed, volume])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const end = trimEnd ?? duration
    const onTime = () => {
      setCurrent(vid.currentTime)
      if (end > 0 && vid.currentTime >= end) { vid.pause(); setPlaying(false) }
      // Sync music
      if (musicRef.current && musicRef.current.paused !== vid.paused) {
        vid.paused ? musicRef.current.pause() : musicRef.current.play().catch(() => {})
      }
    }
    vid.addEventListener('timeupdate', onTime)
    return () => vid.removeEventListener('timeupdate', onTime)
  }, [trimEnd, duration])

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = Math.min(1, musicVolume / 100)
  }, [musicVolume])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (playing) {
      vid.pause()
      musicRef.current?.pause()
      setPlaying(false)
    } else {
      if (vid.currentTime < trimStart || vid.currentTime >= (trimEnd ?? duration)) vid.currentTime = trimStart
      vid.play()
      musicRef.current?.play().catch(() => {})
      setPlaying(true)
    }
  }

  const addVideoText = () => {
    if (!vtText.trim()) return
    setVideoTexts(prev => [...prev, { id: Date.now(), text: vtText, startTime: vtStart, endTime: vtEnd, x: 50, y: 80, color: vtColor, size: vtSize }])
    setVtText('')
  }

  const generateCaptions = async () => {
    if (!duration) return
    setCaptionsLoading(true)
    setCaptionError('')
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate realistic video captions/subtitles for a ${Math.round(duration)}-second video. Return ONLY a JSON array like: [{"text":"Hello world","start":0,"end":2.5}]`,
        }),
      })
      const data = await res.json()
      const parsed = JSON.parse(data.result)
      if (Array.isArray(parsed)) setCaptions(parsed)
      else setCaptionError('Unexpected format from AI.')
    } catch (e) {
      setCaptionError('Failed to generate captions. Please try again.')
    } finally {
      setCaptionsLoading(false)
    }
  }

  const SPEED_OPTIONS = [0.3, 0.5, 0.75, 1, 1.25, 1.5, 2, 3]

  const TOOLS = [
    { id: 'filters',     icon: Sparkles,  label: 'Filters' },
    { id: 'trim',        icon: Scissors,  label: 'Trim' },
    { id: 'speed',       icon: Gauge,     label: 'Speed' },
    { id: 'volume',      icon: Volume2,   label: 'Audio' },
    { id: 'text',        icon: Type,      label: 'Text' },
    { id: 'music',       icon: Music,     label: 'Music' },
    { id: 'captions',    icon: FileText,  label: 'Captions' },
    { id: 'transitions', icon: Zap,       label: 'Transitions' },
  ]

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const d = x => x > 0 ? `${x.toFixed(1)}s` : '0.0s'

  // Active text overlays at current time
  const activeTexts    = videoTexts.filter(t => currentTime >= t.startTime && currentTime <= t.endTime)
  const activeCaptions = captions.filter(c => currentTime >= c.start && currentTime <= c.end)

  return (
    <div className="flex h-full">
      {/* Left: tool panel */}
      <div className="w-14 sm:w-20 bg-black/70 border-r border-white/10 flex flex-col items-center py-4 gap-1 flex-shrink-0 overflow-y-auto">
        {TOOLS.map(t => <ToolBtn key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />)}
      </div>

      {/* Center: video + timeline */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black gap-4 overflow-hidden">
        <div className="relative flex items-center justify-center flex-1 w-full overflow-hidden px-4">
          <video ref={videoRef} src={src}
            onLoadedMetadata={e => { setDuration(e.target.duration); setTrimEnd(e.target.duration); setVtEnd(Math.min(5, e.target.duration)) }}
            className="max-w-full max-h-full object-contain cursor-pointer"
            style={{ filter: cssFilter === 'none' ? undefined : cssFilter }}
            onClick={togglePlay} />

          {/* Text overlays on video */}
          {activeTexts.map(t => (
            <div key={t.id}
              className="absolute pointer-events-none font-bold"
              style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)', color: t.color, fontSize: t.size, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
              {t.text}
            </div>
          ))}

          {/* Caption overlays */}
          {activeCaptions.map((c, i) => (
            <div key={i}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 px-4 py-1.5 rounded-lg text-white text-base font-medium text-center max-w-lg">
              {c.text}
            </div>
          ))}

          {/* Play/pause button hint */}
          {!playing && (
            <div className="absolute w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center pointer-events-none">
              <Play className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="w-full max-w-2xl px-6 pb-4 space-y-2">
          {/* Visual timeline bar */}
          <div className="relative h-10 bg-white/5 rounded-xl overflow-hidden cursor-pointer border border-white/10"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const p = (e.clientX - rect.left) / rect.width
              const t = p * duration
              if (videoRef.current) videoRef.current.currentTime = t
              setCurrent(t)
            }}>
            {/* Trim range highlight */}
            {duration > 0 && (
              <div className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary/50"
                style={{ left: `${(trimStart / duration) * 100}%`, width: `${((trimEnd ?? duration) - trimStart) / duration * 100}%` }} />
            )}
            {/* Progress fill */}
            <div className="absolute top-0 bottom-0 bg-primary/40 transition-none" style={{ width: `${pct}%` }} />
            {/* Current time indicator */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 transition-none" style={{ left: `${pct}%` }} />
            {/* Trim start/end markers */}
            {duration > 0 && <>
              <div className="absolute top-0 bottom-0 w-1 bg-primary rounded-l" style={{ left: `${(trimStart / duration) * 100}%` }} />
              <div className="absolute top-0 bottom-0 w-1 bg-primary rounded-r" style={{ left: `${((trimEnd ?? duration) / duration) * 100}%` }} />
            </>}
          </div>

          <div className="flex items-center justify-between text-xs text-white/40 px-1">
            <span>{d(trimStart)}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => { if (videoRef.current) { videoRef.current.currentTime = trimStart; setCurrent(trimStart) } }}>
                <SkipBack className="w-4 h-4 hover:text-white transition-colors" />
              </button>
              <button onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
              </button>
              <span className="font-mono text-white/60">{d(currentTime)}</span>
            </div>
            <span>{d(trimEnd ?? duration)}</span>
          </div>
        </div>

        {/* Hidden music audio element */}
        {musicFile && (
          <audio ref={musicRef} src={URL.createObjectURL(musicFile)} loop
            style={{ display: 'none' }} />
        )}
      </div>

      {/* Right: controls */}
      <div className="hidden md:block w-64 bg-black/70 border-l border-white/10 overflow-y-auto p-4 space-y-5 flex-shrink-0">

        {/* FILTERS */}
        {tool === 'filters' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Filters</p>
            <div className="grid grid-cols-2 gap-3">
              {VIDEO_FILTERS.map(f => (
                <FilterThumb key={f.id} filter={f} active={activeFilter === f.id}
                  onClick={() => setFilter(f.id)} isVideo />
              ))}
            </div>
          </>
        )}

        {/* TRIM */}
        {tool === 'trim' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Trim</p>
            <Slider label="Start" value={parseFloat(trimStart.toFixed(1))}
              min={0} max={parseFloat(((trimEnd ?? duration) - 0.1).toFixed(1))} step={0.1}
              onChange={v => { setTrimStart(v); if (videoRef.current) videoRef.current.currentTime = v }} unit="s" />
            <Slider label="End" value={parseFloat((trimEnd ?? duration).toFixed(1))}
              min={parseFloat((trimStart + 0.1).toFixed(1))} max={parseFloat(duration.toFixed(1))} step={0.1}
              onChange={v => setTrimEnd(v)} unit="s" />
            <div className="bg-white/5 rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between text-white/50"><span>Clip length</span><span className="text-white">{d((trimEnd ?? duration) - trimStart)}</span></div>
              <div className="flex justify-between text-white/50"><span>Original</span><span>{d(duration)}</span></div>
            </div>
          </>
        )}

        {/* SPEED */}
        {tool === 'speed' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Playback Speed</p>
            <div className="grid grid-cols-4 gap-2">
              {SPEED_OPTIONS.map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`py-2 text-xs rounded-xl border font-medium transition-all ${speed === s ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}>
                  {s}×
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30">Affects playback rate and final export duration.</p>
          </>
        )}

        {/* AUDIO */}
        {tool === 'volume' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Audio</p>
            <Slider label="Volume" value={volume} min={0} max={100} onChange={setVolume} unit="%" />
            <button onClick={() => setVolume(v => v > 0 ? 0 : 80)}
              className="w-full py-2 border border-white/20 rounded-xl text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors">
              {volume === 0 ? '🔊 Unmute' : '🔇 Mute audio'}
            </button>
          </>
        )}

        {/* TEXT OVERLAY */}
        {tool === 'text' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Text Overlay</p>
            <input value={vtText} onChange={e => setVtText(e.target.value)}
              placeholder="Enter text…"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary" />
            {duration > 0 && <>
              <Slider label="Start Time" value={parseFloat(vtStart.toFixed(1))} min={0} max={parseFloat((duration - 0.5).toFixed(1))} step={0.1} onChange={v => { setVtStart(v); if (vtEnd <= v) setVtEnd(Math.min(duration, v + 1)) }} unit="s" />
              <Slider label="End Time" value={parseFloat(vtEnd.toFixed(1))} min={parseFloat((vtStart + 0.1).toFixed(1))} max={parseFloat(duration.toFixed(1))} step={0.1} onChange={setVtEnd} unit="s" />
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
          </>
        )}

        {/* MUSIC */}
        {tool === 'music' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Music</p>
            <button onClick={() => musicInputRef.current?.click()}
              className="w-full py-2.5 border border-white/20 rounded-xl text-xs text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
              <Music className="w-4 h-4" />
              {musicFile ? 'Change Music File' : 'Choose Audio File'}
            </button>
            <input ref={musicInputRef} type="file" accept="audio/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) setMusicFile(e.target.files[0]) }} />
            {musicFile && (
              <div className="bg-white/5 rounded-xl p-3 text-xs space-y-1">
                <p className="text-white/80 font-medium truncate">{musicFile.name}</p>
                <p className="text-white/40">{(musicFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
            <Slider label="Music / Original Mix" value={musicVolume} min={0} max={100} onChange={setMusicVolume} unit="%" />
            {musicFile && (
              <button onClick={() => setMusicFile(null)}
                className="w-full py-2 border border-red-500/30 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                Remove Music
              </button>
            )}
          </>
        )}

        {/* CAPTIONS */}
        {tool === 'captions' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Captions</p>
            <button onClick={generateCaptions} disabled={captionsLoading || !duration}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              {captionsLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Zap className="w-4 h-4" /> Auto-Generate Captions</>}
            </button>
            {captionError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400">{captionError}</div>
            )}
            {captions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-white/40">{captions.length} captions</p>
                {captions.map((c, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 space-y-1.5">
                    <input value={c.text}
                      onChange={e => setCaptions(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                      className="w-full bg-transparent text-xs text-white border-b border-white/10 focus:outline-none focus:border-primary pb-1" />
                    <div className="flex gap-2 text-[10px] text-white/40">
                      <span>{c.start.toFixed(1)}s</span>
                      <span>–</span>
                      <span>{c.end.toFixed(1)}s</span>
                      <button onClick={() => setCaptions(prev => prev.filter((_, j) => j !== i))}
                        className="ml-auto text-red-400/60 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TRANSITIONS */}
        {tool === 'transitions' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Transitions</p>
            <p className="text-xs text-white/40">Apply transitions between clips.</p>
            <div className="grid grid-cols-2 gap-3">
              {['Fade','Slide','Zoom','Dissolve'].map(t => (
                <div key={t} className="relative">
                  <button disabled
                    className="w-full py-4 border border-white/10 rounded-xl text-xs text-white/30 font-medium bg-white/5 cursor-not-allowed">
                    {t}
                  </button>
                  <span className="absolute top-1 right-1 text-[9px] px-1 py-0.5 bg-primary/20 text-primary rounded-full">Soon</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
})

// ─── Main MediaEditor ──────────────────────────────────────────────────────────

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
    try {
      await editorRef.current.save()
    } finally {
      setSaving(false)
    }
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
