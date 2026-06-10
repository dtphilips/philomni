import React, { useState, useRef, useCallback } from 'react'
import {
  Upload, Wand2, Film, Layers, Image as ImageIcon, Video as VideoIcon,
  Download, Plus, X, Check,
} from 'lucide-react'
import MediaEditor from '@/components/editor/MediaEditor'
import VideoUpload from '../components/VideoUpload'

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'editor',    label: 'Editor',           icon: Wand2 },
  { id: 'templates', label: 'Templates',        icon: Layers },
  { id: 'reels',     label: 'Reels Maker',      icon: Film },
  { id: 'longform',  label: 'Long-Form Video',  icon: VideoIcon },
  { id: 'ai',        label: 'AI Tools',         icon: Wand2 },
]

const TEMPLATES = [
  { label: 'Social Post',  emoji: '📱', ratio: '1:1' },
  { label: 'Story',        emoji: '📖', ratio: '9:16' },
  { label: 'Thumbnail',    emoji: '🖼️', ratio: '16:9' },
  { label: 'Banner',       emoji: '🏷️', ratio: '3:1' },
  { label: 'Reel Cover',   emoji: '🎬', ratio: '9:16' },
  { label: 'Ad Creative',  emoji: '📣', ratio: '1:1' },
  { label: 'YouTube Cover',emoji: '▶️', ratio: '16:9' },
  { label: 'LinkedIn Post',emoji: '💼', ratio: '1.91:1' },
]

const AI_TOOLS = [
  { icon: '🎨', title: 'Auto Enhance',       desc: 'AI-powered one-click photo enhancement — brightness, contrast, sharpness all at once.' },
  { icon: '✂️', title: 'Background Remover', desc: 'Instantly remove backgrounds from any image in a single click.' },
  { icon: '🔠', title: 'Auto Captions',      desc: 'Generate accurate captions and subtitles from your video audio.' },
  { icon: '🌟', title: 'Style Transfer',      desc: 'Apply artistic painting styles to your photos and videos.' },
  { icon: '📐', title: 'Smart Crop',         desc: 'AI detects the subject and crops automatically for any format.' },
  { icon: '🔊', title: 'Noise Reduction',    desc: 'Reduce background noise and improve audio clarity in videos.' },
]

// ─── Dropzone ───────────────────────────────────────────────────────────────

function Dropzone({ onFile }) {
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all select-none
        ${dragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Upload className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-bold text-foreground text-lg">Drop media here or click to upload</p>
        <p className="text-muted-foreground text-sm mt-1">Supports images (JPG, PNG, WebP, GIF) and videos (MP4, MOV, WebM)</p>
      </div>
      <div className="flex gap-3">
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border text-sm text-muted-foreground">
          <ImageIcon className="w-4 h-4 text-emerald-500" /> Image
        </span>
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border text-sm text-muted-foreground">
          <VideoIcon className="w-4 h-4 text-blue-500" /> Video
        </span>
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => {
        const f = e.target.files?.[0]
        if (f) onFile(f)
        e.target.value = ''
      }} />
    </div>
  )
}

// ─── SavedBanner ────────────────────────────────────────────────────────────

function SavedBanner({ result, onReset }) {
  const blobUrl = result instanceof Blob ? URL.createObjectURL(result) : null

  return (
    <div className="mt-4 p-4 bg-card border border-green-500/30 bg-green-500/5 rounded-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Edit complete!</p>
          <p className="text-xs text-muted-foreground">
            {result instanceof Blob ? 'Image ready to download or post.' : 'Video settings saved.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {blobUrl && (
          <a href={blobUrl} download="philomni-edit.jpg"
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        )}
        <button onClick={onReset}
          className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Edit Another
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CreatorStudio() {
  const [activeTab, setActiveTab] = useState('editor')
  const [mediaFile, setMediaFile]     = useState(null)
  const [savedResult, setSavedResult] = useState(null)

  const handleFile = useCallback((file) => {
    setSavedResult(null)
    setMediaFile(file)
    setActiveTab('editor')
  }, [])

  const handleSave = useCallback((result) => {
    setSavedResult(result)
    // Don't immediately clear the file so the editor stays visible until "Edit Another"
  }, [])

  const handleClose = useCallback(() => {
    setMediaFile(null)
    setSavedResult(null)
  }, [])

  const handleReset = useCallback(() => {
    setMediaFile(null)
    setSavedResult(null)
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Creator Studio</h1>
        <p className="text-muted-foreground text-sm mt-1">Professional photo &amp; video editing, templates, and AI tools — all in one place.</p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-muted rounded-xl p-1 w-full max-w-md">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Editor Tab ──────────────────────────────────────────────── */}
      {activeTab === 'editor' && (
        <div>
          {!mediaFile ? (
            <Dropzone onFile={handleFile} />
          ) : (
            <>
              {/* Embedded editor — full-height container */}
              <div
                className="rounded-2xl overflow-hidden border border-border shadow-lg"
                style={{ height: 'calc(100vh - 260px)', minHeight: 560 }}
              >
                <MediaEditor
                  file={mediaFile}
                  onSave={handleSave}
                  onClose={handleClose}
                  embedded
                />
              </div>

              {savedResult && (
                <SavedBanner result={savedResult} onReset={handleReset} />
              )}
            </>
          )}
        </div>
      )}

      {/* ── Templates Tab ──────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose a template to start a new edit session.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {TEMPLATES.map(t => (
              <button key={t.label}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left">
                <div className="text-3xl">{t.emoji}</div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.ratio}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">Upload a photo or video to apply a template</p>
            <div className="flex justify-center mt-3">
              <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" /> Upload &amp; Apply Template
                <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                  e.target.value = ''
                }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Reels Maker Tab ────────────────────────────────────────── */}
      {activeTab === 'reels' && (
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Reels Maker</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Upload multiple video clips, add music, transitions, and captions to automatically
            create short-form reels ready to post.
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Upload Video Clips
            <input type="file" accept="video/*" multiple className="hidden" onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }} />
          </label>
          <p className="text-xs text-muted-foreground mt-4">Supports MP4, MOV, WebM — up to 10 clips</p>
        </div>
      )}

      {/* ── Long-Form Video Tab ────────────────────────────────────── */}
      {activeTab === 'longform' && (
        <div className="bg-card border border-border/60 rounded-3xl overflow-hidden" style={{ minHeight: 400, background: '#0a0a0a' }}>
          <VideoUpload />
        </div>
      )}

      {/* ── AI Tools Tab ───────────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Supercharge your content with one-click AI tools.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_TOOLS.map(tool => (
              <div key={tool.title}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="text-3xl mb-3">{tool.icon}</div>
                <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
                <div className="mt-4">
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer">
                    <Upload className="w-3 h-3" /> Try with your media
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleFile(f)
                      e.target.value = ''
                    }} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
