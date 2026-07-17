import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Upload, X, Play, Loader2, Mic, Music2, Film, Clock,
  ChevronRight, ChevronDown, Check, AlertCircle, Sparkles,
  FileVideo, RefreshCw, Volume2, Edit3,
} from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const OUTPUT_FORMATS = [
  { id: 'reel',        label: '60-sec Reel',         duration: '~60s',  desc: 'Instagram / TikTok',        icon: '📱' },
  { id: 'highlight',   label: '3-min Highlight',      duration: '~3min', desc: 'Family & friends share',    icon: '🎬' },
  { id: 'documentary', label: '5-min Documentary',    duration: '~5min', desc: 'Full story with narration', icon: '🎞️' },
]

const VOICES = [
  'Rachel — Warm & Clear',
  'Antoni — Calm & Deep',
  'Bella — Soft & Intimate',
  'Josh — Documentary',
  'Adam — Grounded',
  'Elli — Gentle & Bright',
]

const STEPS = ['Upload', 'Describe', 'Plan', 'Narration', 'Done']

// ── Upload a clip to Supabase Storage, return public URL ─────────────────────
async function uploadClipToStorage(file, userId) {
  const ext  = file.name.split('.').pop()
  const path = `memory-studio/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('videos')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  const { data } = supabase.storage.from('videos').getPublicUrl(path)
  return data.publicUrl
}

// ── Single clip row ───────────────────────────────────────────────────────────
function ClipRow({ clip, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
      <FileVideo className="w-5 h-5 text-purple-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{clip.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(clip.file.size / (1024 * 1024)).toFixed(1)} MB
          {clip.url && <span className="text-green-500 ml-2">✓ Uploaded</span>}
          {clip.uploading && <span className="text-purple-400 ml-2">Uploading…</span>}
          {clip.error && <span className="text-red-400 ml-2">{clip.error}</span>}
        </p>
      </div>
      <button onClick={() => onRemove(clip.id)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Segment card in the edit plan ─────────────────────────────────────────────
function SegmentCard({ segment, onEditNarration }) {
  const [expanded, setExpanded] = useState(false)

  const pacingColor = {
    slow:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    fast:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }[segment.pacing] || 'bg-muted text-muted-foreground border-border'

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground w-6">{segment.id}</span>
          <div>
            <p className="font-semibold text-foreground text-sm">{segment.name}</p>
            <p className="text-xs text-muted-foreground">
              {segment.startTime}s – {segment.endTime}s
              · {segment.clips?.length || 0} clip{segment.clips?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {segment.narrate && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              🎙 Narrated
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${pacingColor}`}>
            {segment.pacing}
          </span>
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {segment.clips?.map((c, i) => (
            <div key={i} className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
              <span className="font-semibold text-foreground">Clip {c.clipIndex}</span>
              {' '}· {c.inPoint} → {c.outPoint}
              {' '}· hold {c.holdSeconds}s
              {c.notes && <p className="mt-1 italic">{c.notes}</p>}
            </div>
          ))}

          {segment.narrate && segment.narrationLine && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-400 mb-1">🎙 Narration</p>
                  <p className="text-sm text-foreground italic">"{segment.narrationLine}"</p>
                </div>
                <button
                  onClick={() => onEditNarration(segment.id, segment.narrationLine)}
                  className="p-1.5 rounded-lg hover:bg-purple-500/10 text-muted-foreground hover:text-purple-400 flex-shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              {segment.audioNote && (
                <p className="text-xs text-muted-foreground mt-1.5">🎵 {segment.audioNote}</p>
              )}
            </div>
          )}

          {!segment.narrate && (
            <p className="text-xs text-muted-foreground italic">
              🎵 Music only — no narration for this segment
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MemoryStudio() {
  const { user } = useAuth()
  const fileInputRef = useRef()

  const [step,          setStep]          = useState(0) // 0–4
  const [clips,         setClips]         = useState([]) // { id, file, url, uploading, error }
  const [prompt,        setPrompt]        = useState('')
  const [outputFormat,  setOutputFormat]  = useState('highlight')
  const [voice,         setVoice]         = useState(VOICES[0])
  const [analyzing,     setAnalyzing]     = useState(false)
  const [editPlan,      setEditPlan]      = useState(null)
  const [inventory,     setInventory]     = useState('')
  const [error,         setError]         = useState('')
  const [narrations,    setNarrations]    = useState({}) // segmentId → { text, audioBase64, audioUrl }
  const [generating,    setGenerating]    = useState(false)
  const [editingLine,   setEditingLine]   = useState(null) // { id, text }

  // ── Add clips ───────────────────────────────────────────────────────────────
  const addFiles = useCallback(async (files) => {
    const newClips = Array.from(files)
      .filter(f => f.type.startsWith('video/'))
      .map(f => ({ id: crypto.randomUUID(), file: f, url: null, uploading: true, error: null }))

    if (!newClips.length) return
    setClips(prev => [...prev, ...newClips])

    for (const clip of newClips) {
      try {
        const url = await uploadClipToStorage(clip.file, user.id)
        setClips(prev => prev.map(c => c.id === clip.id ? { ...c, url, uploading: false } : c))
      } catch (err) {
        setClips(prev => prev.map(c => c.id === clip.id
          ? { ...c, uploading: false, error: err.message }
          : c))
      }
    }
  }, [user?.id])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  // ── Analyze ─────────────────────────────────────────────────────────────────
  const analyze = async () => {
    const readyClips = clips.filter(c => c.url)
    if (!readyClips.length) { setError('Please wait for clips to finish uploading.'); return }
    if (!prompt.trim())     { setError('Please describe what you want the video to feel like.'); return }

    setAnalyzing(true)
    setError('')

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/memory-studio-analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            videoUrls:    readyClips.map(c => c.url),
            prompt:       prompt.trim(),
            outputFormat,
            voiceName:    voice,
          }),
        },
      )
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Analysis failed')

      setInventory(data.inventory || '')
      setEditPlan(data.editPlan)

      // Pre-populate narrations from the plan
      if (data.editPlan?.segments) {
        const initial = {}
        for (const seg of data.editPlan.segments) {
          if (seg.narrate && seg.narrationLine) {
            initial[seg.id] = { text: seg.narrationLine, audioBase64: null, audioUrl: null }
          }
        }
        setNarrations(initial)
      }

      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Generate narration audio ─────────────────────────────────────────────────
  const generateNarration = async () => {
    const lines = Object.entries(narrations)
      .filter(([, v]) => v.text)
      .map(([id, v]) => ({ id, text: v.text }))

    if (!lines.length) { setStep(4); return }

    setGenerating(true)
    setError('')

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/memory-studio-narrate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ lines, voiceName: voice }),
        },
      )
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Narration generation failed')

      const updated = { ...narrations }
      for (const n of data.narrations) {
        if (updated[n.id]) {
          const blob    = new Blob([Uint8Array.from(atob(n.audioBase64), c => c.charCodeAt(0))], { type: 'audio/mpeg' })
          const audioUrl = URL.createObjectURL(blob)
          updated[n.id] = { ...updated[n.id], audioBase64: n.audioBase64, audioUrl }
        }
      }
      setNarrations(updated)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // ── Edit a narration line ────────────────────────────────────────────────────
  const saveEditedLine = () => {
    if (!editingLine) return
    setNarrations(prev => ({
      ...prev,
      [editingLine.id]: { ...prev[editingLine.id], text: editingLine.text, audioBase64: null, audioUrl: null },
    }))
    setEditingLine(null)
  }

  const narratedSegments = editPlan?.segments?.filter(s => s.narrate && narrations[s.id]) || []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎬</span>
          <h1 className="text-2xl font-black text-foreground">Memory Studio</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Upload your raw clips. Describe the feeling. Get a narrated video edit plan powered by AI.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              i === step
                ? 'bg-purple-600 text-white'
                : i < step
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : null}
              {s}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-green-500/40' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── STEP 0: Upload ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-purple-500/50 rounded-2xl p-10 text-center cursor-pointer transition-colors group"
          >
            <Upload className="w-10 h-10 text-muted-foreground group-hover:text-purple-400 mx-auto mb-3 transition-colors" />
            <p className="font-semibold text-foreground mb-1">Drop your video clips here</p>
            <p className="text-sm text-muted-foreground">Or click to browse · Multiple clips supported · MP4, MOV, AVI</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />
          </div>

          {clips.length > 0 && (
            <div className="space-y-2">
              {clips.map(c => (
                <ClipRow key={c.id} clip={c} onRemove={id => setClips(p => p.filter(c => c.id !== id))} />
              ))}
            </div>
          )}

          {clips.length > 0 && (
            <button
              onClick={() => setStep(1)}
              disabled={clips.some(c => c.uploading)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {clips.some(c => c.uploading)
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading clips…</>
                : <>Continue <ChevronRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      )}

      {/* ── STEP 1: Describe ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              What should this video feel like?
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. A warm family day out in Guelph — show the amazing places we visited and the fun we had. Make it feel like an invitation for others to go there too. Not a hype reel — something real and beautiful."
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Output format</label>
            <div className="grid grid-cols-3 gap-3">
              {OUTPUT_FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setOutputFormat(f.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    outputFormat === f.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="font-semibold text-foreground text-sm">{f.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                  <div className="text-xs text-purple-400 mt-1">{f.duration}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Narrator voice</label>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map(v => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                    voice === v
                      ? 'border-purple-500 bg-purple-500/10 text-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="px-5 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={analyze}
              disabled={analyzing || !prompt.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {analyzing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing footage + building edit plan…</>
                : <><Sparkles className="w-4 h-4" /> Analyze & Generate Plan</>}
            </button>
          </div>

          {analyzing && (
            <div className="bg-muted/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
              <p>🎬 Gemini is watching your footage…</p>
              <p>🧠 Claude is building the edit plan and narration…</p>
              <p>⏱ This takes 30–90 seconds depending on clip length</p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Edit Plan ── */}
      {step === 2 && editPlan && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
            <h2 className="font-bold text-foreground text-lg">{editPlan.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{editPlan.musicDirection}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span><Clock className="w-3.5 h-3.5 inline mr-1" />{editPlan.totalDuration}s</span>
              <span><Film className="w-3.5 h-3.5 inline mr-1" />{editPlan.segments?.length} segments</span>
              <span><Mic className="w-3.5 h-3.5 inline mr-1" />{narratedSegments.length} narrated</span>
            </div>
          </div>

          <div className="space-y-3">
            {editPlan.segments?.map(seg => (
              <SegmentCard
                key={seg.id}
                segment={seg}
                onEditNarration={(id, text) => setEditingLine({ id, text })}
              />
            ))}
          </div>

          {editPlan.closingNote && (
            <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground italic">
              🎯 {editPlan.closingNote}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setEditPlan(null) }}
              className="px-5 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Re-generate
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" /> Review & Generate Narration
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Narration review ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-bold text-foreground text-lg mb-1">Review narration script</h2>
            <p className="text-sm text-muted-foreground">
              These lines will be spoken by <strong className="text-foreground">{voice}</strong>.
              Edit any line before generating audio.
            </p>
          </div>

          {Object.keys(narrations).length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No narration segments in this plan. The video will be music and visuals only.
            </p>
          )}

          <div className="space-y-3">
            {editPlan?.segments?.filter(s => s.narrate && narrations[s.id]).map(seg => (
              <div key={seg.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Segment {seg.id} · {seg.name}
                  </p>
                  <span className="text-xs text-muted-foreground">{seg.startTime}s – {seg.endTime}s</span>
                </div>
                <textarea
                  value={narrations[seg.id]?.text || ''}
                  onChange={e => setNarrations(prev => ({
                    ...prev,
                    [seg.id]: { ...prev[seg.id], text: e.target.value, audioBase64: null, audioUrl: null },
                  }))}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                />
                {narrations[seg.id]?.audioUrl && (
                  <audio controls src={narrations[seg.id].audioUrl} className="w-full h-8 mt-1" />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={generateNarration}
              disabled={generating}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating voice audio…</>
                : <><Volume2 className="w-4 h-4" /> Generate Voice Audio</>}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Done ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-2xl font-black text-foreground mb-2">Your edit plan is ready</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Edit plan and narration audio are generated. Your video render is being prepared.
            </p>
          </div>

          {/* Narration audio previews */}
          {Object.entries(narrations).filter(([, v]) => v.audioUrl).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Narration audio previews</h3>
              {editPlan?.segments?.filter(s => narrations[s.id]?.audioUrl).map(seg => (
                <div key={seg.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-2">{seg.name}</p>
                  <p className="text-sm text-foreground italic mb-2">"{narrations[seg.id].text}"</p>
                  <audio controls src={narrations[seg.id].audioUrl} className="w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Edit plan summary */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Edit plan summary</h3>
            {editPlan?.segments?.map(seg => (
              <div key={seg.id} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="w-4 text-right text-foreground/40">{seg.id}.</span>
                <span className="font-medium text-foreground">{seg.name}</span>
                <span>·</span>
                <span>{seg.startTime}s–{seg.endTime}s</span>
                <span>·</span>
                <span className="capitalize">{seg.pacing}</span>
                {seg.narrate && <span className="text-purple-400">· 🎙</span>}
              </div>
            ))}
          </div>

          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">🚀 Video render</p>
            <p>
              The final video render (combining your clips with music and narration) is
              the next feature being added to Memory Studio. Your plan and audio are saved.
            </p>
          </div>

          <button
            onClick={() => {
              setStep(0); setClips([]); setPrompt(''); setEditPlan(null)
              setNarrations({}); setInventory(''); setError('')
            }}
            className="w-full py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Start a new video
          </button>
        </div>
      )}

      {/* Edit narration line modal */}
      {editingLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingLine(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-foreground mb-3">Edit narration line</h3>
            <textarea
              value={editingLine.text}
              onChange={e => setEditingLine(l => ({ ...l, text: e.target.value }))}
              rows={4}
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingLine(null)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50">Cancel</button>
              <button onClick={saveEditedLine} className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
