/**
 * MediaEditor — full-screen overlay for image & video editing.
 *
 * Props:
 *   file?    — File object (image or video from upload)
 *   url?     — existing URL string (for editing already-uploaded media)
 *   onSave   — callback(blob) for images | callback({url,filters,trim}) for video
 *   onClose  — callback to dismiss the editor
 */
import React, {
  useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle,
} from 'react'
import {
  ChevronLeft, Sliders, Crop, Sparkles, Type, Smile,
  Play, Pause, SkipBack, Gauge, Volume2, Scissors,
  RotateCcw, Loader2, X, Check,
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
const STICKERS      = ['😀','😍','🔥','💜','🎉','✨','👍','❤️','🚀','💎','🎵','🌟','😂','🥳','💪','🤩','🌈','⚡']

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
      className={`flex flex-col items-center gap-1 w-16 py-3 rounded-xl transition-all ${
        active ? 'bg-primary text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
      }`}>
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
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

  return (
    <div onMouseDown={onMouseDown}
      className={`absolute cursor-move select-none group ${selected ? 'outline outline-2 outline-primary outline-offset-2 rounded-sm' : ''}`}
      style={{ left: item.x, top: item.y, color: item.color, fontSize: item.size, fontFamily: item.font, fontWeight: 'bold', textShadow: '0 1px 6px rgba(0,0,0,0.9)', lineHeight: 1.2, userSelect: 'none' }}>
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

// ─── Image Editor (forwardRef so parent can call .save()) ──────────────────────

const ImageEditor = forwardRef(function ImageEditor({ src, onSave }, ref) {
  const [tool, setTool] = useState('adjust')
  const [adj, setAdj] = useState({ brightness: 100, contrast: 100, saturation: 100, warmth: 0, blur: 0 })
  const [activeFilter, setActiveFilter] = useState('original')
  const [cropRatio, setCropRatio] = useState(null)
  const [overlays, setOverlays] = useState([])        // text + stickers
  const [selectedId, setSelectedId] = useState(null)
  const [newText, setNewText] = useState('')
  const [textFont, setTextFont] = useState('Arial')
  const [textSize, setTextSize] = useState(32)
  const [textColor, setTextColor] = useState('#ffffff')
  const [saving, setSaving] = useState(false)

  const canvasRef  = useRef()
  const imgRef     = useRef()
  const previewRef = useRef()

  const cssFilter = useMemo(() => {
    const preset = IMAGE_FILTERS.find(f => f.id === activeFilter)?.css ?? ''
    const parts = [
      adj.brightness !== 100 ? `brightness(${adj.brightness / 100})` : '',
      adj.contrast   !== 100 ? `contrast(${adj.contrast / 100})`     : '',
      adj.saturation !== 100 ? `saturate(${adj.saturation / 100})`   : '',
      adj.warmth     !== 0   ? `sepia(${Math.abs(adj.warmth) / 200}) hue-rotate(${adj.warmth > 0 ? -15 : 15}deg)` : '',
      adj.blur       !== 0   ? `blur(${adj.blur}px)`                 : '',
    ].filter(Boolean).join(' ')
    return [preset, parts].filter(Boolean).join(' ') || 'none'
  }, [adj, activeFilter])

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
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      ctx.filter = cssFilter !== 'none' ? cssFilter : ''
      ctx.drawImage(img, 0, 0, W, H)
      ctx.filter = ''

      // Scale overlays from preview coords → natural image coords
      const pw = previewRef.current?.querySelector('img')?.clientWidth  || W
      const ph = previewRef.current?.querySelector('img')?.clientHeight || H
      const sx = W / pw, sy = H / ph

      for (const ov of overlays) {
        ctx.font         = `bold ${ov.size * sx}px ${ov.font}`
        ctx.fillStyle    = ov.color === 'inherit' ? '#ffffff' : ov.color
        ctx.shadowColor  = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur   = 6
        ctx.fillText(ov.text, ov.x * sx, ov.y * sy + ov.size * sx)
      }

      canvas.toBlob(blob => { setSaving(false); resolve(blob); if (blob) onSave(blob) }, 'image/jpeg', 0.92)
    })
  }, [cssFilter, overlays, onSave])

  const addOverlay = (text, isSticker = false) => {
    if (!text.trim()) return
    setOverlays(prev => [...prev, {
      id: Date.now(), text,
      x: 60, y: 60,
      font: isSticker ? 'Arial' : textFont,
      size: isSticker ? 48 : textSize,
      color: isSticker ? 'inherit' : textColor,
    }])
    if (!isSticker) setNewText('')
  }

  const moveOverlay  = (id, x, y) => setOverlays(p => p.map(o => o.id === id ? { ...o, x, y } : o))
  const deleteOverlay = id => { setOverlays(p => p.filter(o => o.id !== id)); setSelectedId(null) }
  const resetAll = () => {
    setAdj({ brightness: 100, contrast: 100, saturation: 100, warmth: 0, blur: 0 })
    setActiveFilter('original')
    setOverlays([])
    setSelectedId(null)
  }

  const TOOLS = [
    { id: 'adjust',   icon: Sliders,  label: 'Adjust' },
    { id: 'crop',     icon: Crop,     label: 'Crop' },
    { id: 'filters',  icon: Sparkles, label: 'Filters' },
    { id: 'text',     icon: Type,     label: 'Text' },
    { id: 'stickers', icon: Smile,    label: 'Stickers' },
  ]

  return (
    <div className="flex h-full" ref={previewRef}>
      {/* Left: tool panel */}
      <div className="w-20 bg-black/70 border-r border-white/10 flex flex-col items-center py-4 gap-1 flex-shrink-0">
        {TOOLS.map(t => <ToolBtn key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />)}
        <div className="flex-1" />
        <button onClick={resetAll} className="flex flex-col items-center gap-1 w-16 py-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all">
          <RotateCcw className="w-4 h-4" />
          <span className="text-[10px]">Reset</span>
        </button>
      </div>

      {/* Center: image preview */}
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f] overflow-hidden relative"
        onClick={() => setSelectedId(null)}>
        <div className="relative inline-block">
          <img ref={imgRef} src={src} alt="" draggable={false}
            className="max-w-full max-h-[calc(100vh-160px)] object-contain select-none block"
            style={{ filter: cssFilter }} />
          {/* Overlay layer */}
          <div className="absolute inset-0" style={{ pointerEvents: 'all' }}>
            {overlays.map(ov => (
              <OverlayItem key={ov.id} item={ov} selected={selectedId === ov.id}
                onSelect={() => setSelectedId(ov.id)}
                onMove={(x, y) => moveOverlay(ov.id, x, y)}
                onDelete={() => deleteOverlay(ov.id)} />
            ))}
          </div>
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
      <div className="w-64 bg-black/70 border-l border-white/10 overflow-y-auto p-4 space-y-5 flex-shrink-0">
        {tool === 'adjust' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Adjustments</p>
            <Slider label="Brightness" value={adj.brightness} min={50} max={150} onChange={v => setAdj(a => ({ ...a, brightness: v }))} unit="%" />
            <Slider label="Contrast"   value={adj.contrast}   min={50} max={150} onChange={v => setAdj(a => ({ ...a, contrast: v }))}   unit="%" />
            <Slider label="Saturation" value={adj.saturation} min={0}  max={200} onChange={v => setAdj(a => ({ ...a, saturation: v }))} unit="%" />
            <Slider label="Warmth"     value={adj.warmth}     min={-50} max={50} onChange={v => setAdj(a => ({ ...a, warmth: v }))} />
            <Slider label="Blur"       value={adj.blur}       min={0}  max={10}  step={0.5} onChange={v => setAdj(a => ({ ...a, blur: v }))} unit="px" />
          </>
        )}

        {tool === 'crop' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Aspect Ratio</p>
            <div className="grid grid-cols-3 gap-2">
              {CROP_PRESETS.map(p => (
                <button key={p.label} onClick={() => setCropRatio(p.ratio)}
                  className={`py-2 text-xs rounded-xl border transition-all ${cropRatio === p.ratio ? 'border-primary bg-primary/20 text-primary font-semibold' : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-xs text-white/40">
              Selected: <span className="text-white">{CROP_PRESETS.find(p => p.ratio === cropRatio)?.label ?? 'Free'}</span>
              <br />Crop is applied on export.
            </div>
          </>
        )}

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

        {tool === 'text' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Add Text</p>
            <textarea value={newText} onChange={e => setNewText(e.target.value)}
              placeholder="Type your text…" rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary resize-none" />
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
            {overlays.filter(o => o.size < 48).map(o => (
              <div key={o.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                <span className="text-xs text-white/70 truncate flex-1 mr-2">{o.text}</span>
                <button onClick={() => deleteOverlay(o.id)} className="text-white/40 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </>
        )}

        {tool === 'stickers' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Stickers</p>
            <div className="grid grid-cols-6 gap-1">
              {STICKERS.map(s => (
                <button key={s} onClick={() => addOverlay(s, true)}
                  className="text-2xl p-2 rounded-xl hover:bg-white/10 transition-colors aspect-square flex items-center justify-center">
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
      </div>
    </div>
  )
})

// ─── Video Editor (forwardRef) ─────────────────────────────────────────────────

const VideoEditor = forwardRef(function VideoEditor({ src, onSave }, ref) {
  const [tool, setTool]           = useState('filters')
  const [activeFilter, setFilter] = useState('none')
  const [speed, setSpeed]         = useState(1)
  const [volume, setVolume]       = useState(100)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd]     = useState(null)
  const [duration, setDuration]   = useState(0)
  const [playing, setPlaying]     = useState(false)
  const [currentTime, setCurrent] = useState(0)
  const videoRef = useRef()

  const cssFilter = VIDEO_FILTERS.find(f => f.id === activeFilter)?.css ?? 'none'

  useImperativeHandle(ref, () => ({
    save: () => {
      const result = {
        url: src,
        filters: cssFilter,
        speed,
        volume: volume / 100,
        trim: { start: trimStart, end: trimEnd ?? duration },
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
    }
    vid.addEventListener('timeupdate', onTime)
    return () => vid.removeEventListener('timeupdate', onTime)
  }, [trimEnd, duration])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (playing) { vid.pause(); setPlaying(false) }
    else {
      if (vid.currentTime < trimStart || vid.currentTime >= (trimEnd ?? duration)) vid.currentTime = trimStart
      vid.play(); setPlaying(true)
    }
  }

  const TOOLS = [
    { id: 'filters', icon: Sparkles, label: 'Filters' },
    { id: 'trim',    icon: Scissors, label: 'Trim' },
    { id: 'speed',   icon: Gauge,    label: 'Speed' },
    { id: 'volume',  icon: Volume2,  label: 'Audio' },
  ]

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const d = x => x > 0 ? `${x.toFixed(1)}s` : '0.0s'

  return (
    <div className="flex h-full">
      {/* Left */}
      <div className="w-20 bg-black/70 border-r border-white/10 flex flex-col items-center py-4 gap-1 flex-shrink-0">
        {TOOLS.map(t => <ToolBtn key={t.id} {...t} active={tool === t.id} onClick={() => setTool(t.id)} />)}
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black gap-4 overflow-hidden">
        <div className="relative flex items-center justify-center flex-1 w-full overflow-hidden px-4">
          <video ref={videoRef} src={src}
            onLoadedMetadata={e => { setDuration(e.target.duration); setTrimEnd(e.target.duration) }}
            className="max-w-full max-h-full object-contain cursor-pointer"
            style={{ filter: cssFilter === 'none' ? undefined : cssFilter }}
            onClick={togglePlay} />
          <button onClick={togglePlay}
            className="absolute w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none" style={{ pointerEvents: 'none' }}>
            {playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Timeline */}
        <div className="w-full max-w-2xl px-6 pb-4 space-y-2">
          <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              const t = pct * duration
              if (videoRef.current) videoRef.current.currentTime = t
              setCurrent(t)
            }}>
            {duration > 0 && (
              <div className="absolute top-0 h-full bg-white/20"
                style={{ left: `${(trimStart / duration) * 100}%`, width: `${((trimEnd ?? duration) - trimStart) / duration * 100}%` }} />
            )}
            <div className="absolute top-0 h-full bg-primary/80 transition-none" style={{ width: `${pct}%` }} />
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
            </div>
            <span>{d(trimEnd ?? duration)}</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="w-64 bg-black/70 border-l border-white/10 overflow-y-auto p-4 space-y-5 flex-shrink-0">
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
        {tool === 'speed' && (
          <>
            <p className="text-xs font-bold text-white uppercase tracking-wide">Playback Speed</p>
            <div className="grid grid-cols-3 gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`py-2.5 text-sm rounded-xl border font-medium transition-all ${speed === s ? 'border-primary bg-primary/20 text-primary' : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}>
                  {s}×
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30">Affects playback rate and final export duration</p>
          </>
        )}
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
    <div className={`${embedded ? 'w-full h-full' : 'fixed inset-0 z-[100]'} bg-[#0a0a0f] flex flex-col`} style={{ fontFamily: 'system-ui, sans-serif' }}>
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

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {mediaType === 'image'
          ? <ImageEditor ref={editorRef} src={mediaSrc} onSave={onSave} />
          : <VideoEditor ref={editorRef} src={mediaSrc} onSave={onSave} />}
      </div>
    </div>
  )
}
