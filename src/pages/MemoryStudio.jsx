import React, { useState, useRef, useCallback } from 'react'
import {
  Upload, Check, Film, Loader2, Edit3, AlertCircle,
  Download, RefreshCw, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = ['Select', 'Describe', 'Plan', 'Narration', 'Render', 'Done']

const VOICES = [
  'Rachel — Warm & Clear',
  'Antoni — Calm & Deep',
  'Bella — Soft & Intimate',
  'Josh — Documentary',
  'Adam — Grounded',
  'Elli — Gentle & Bright',
]

const OUTPUT_FORMATS = [
  { id: 'reel',        label: '60s Reel',         desc: 'Perfect for social media' },
  { id: 'highlight',   label: '3min Highlight',    desc: 'The best moments' },
  { id: 'documentary', label: '5min Documentary',  desc: 'Full storytelling' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSize(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  return `${(bytes / 1e6).toFixed(0)} MB`
}
function fmtDur(secs) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
function parseTC(tc) {
  if (!tc) return 0
  const p = String(tc).split(':').map(Number)
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]
  if (p.length === 2) return p[0] * 60 + p[1]
  return 0
}

// ─── Frame extraction (Canvas API — works for any file size, no upload needed) ─
// iOS Safari can't always seek in large files — we use a timeout per seek and
// skip frames that fail rather than crashing the whole clip.
function seekWithTimeout(video, time, timeoutMs = 8000) {
  return new Promise(res => {
    let done = false
    const finish = () => { if (!done) { done = true; res() } }
    const h = () => { video.removeEventListener('seeked', h); finish() }
    video.addEventListener('seeked', h)
    video.currentTime = time
    setTimeout(finish, timeoutMs) // give up waiting after timeout, capture whatever frame is shown
  })
}

async function extractFrames(file, onProgress) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    const url = URL.createObjectURL(file)
    video.src = url

    // Timeout if metadata never loads (e.g. unsupported codec on iOS)
    const metaTimeout = setTimeout(() => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read "${file.name}" — try converting to MP4 (H.264).`))
    }, 15000)

    video.onloadedmetadata = async () => {
      clearTimeout(metaTimeout)
      let duration = video.duration

      // Some browsers report Infinity for streaming sources — fall back to 60s estimate
      if (!duration || duration === Infinity) duration = 60

      // For large files on iOS, limit seeks to the first portion of the video
      // to avoid Safari's seek-buffering limitations on local files > 500 MB
      const isLargeFile = file.size > 500 * 1024 * 1024
      const analysisWindow = isLargeFile ? Math.min(duration, 300) : duration // max 5 min for large files

      // 1 frame every 12s, max 40 frames total
      const interval = Math.max(12, analysisWindow / 40)
      const times = []
      for (let t = 2; t < analysisWindow - 1; t += interval) times.push(t)
      if (times.length === 0) times.push(Math.min(5, duration / 2))

      const canvas = document.createElement('canvas')
      const aspect = video.videoWidth / (video.videoHeight || 1)
      canvas.width = 320
      canvas.height = Math.round(320 / aspect) || 180
      const ctx = canvas.getContext('2d')

      const frames = []
      for (let i = 0; i < times.length; i++) {
        try {
          await seekWithTimeout(video, times[i], 8000)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1]
          if (data && data.length > 100) { // skip blank frames
            frames.push({ timestamp: times[i], data })
          }
        } catch (_) {
          // skip this frame silently and continue
        }
        onProgress?.(Math.round(((i + 1) / times.length) * 100))
      }

      URL.revokeObjectURL(url)

      // 0 frames = resolve gracefully so the pipeline continues with other clips
      resolve({ frames, duration, error: frames.length === 0 ? `"${file.name}" could not be previewed on this device — it will be skipped in the analysis.` : undefined })
    }

    // On iOS Safari, very large files may fire onerror instead of onloadedmetadata.
    // Resolve with empty frames so other clips in the batch still get processed.
    video.onerror = () => {
      clearTimeout(metaTimeout)
      URL.revokeObjectURL(url)
      resolve({ frames: [], duration: 0, error: `"${file.name}" could not be read on this device — it may be too large for mobile preview. The other clips will still be analyzed.` })
    }
  })
}

// ─── ffmpeg.wasm render (runs entirely in browser, no server needed) ──────────
async function renderVideo(clips, editPlan, narrations, onProgress, onLog) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

  const ff = new FFmpeg()
  ff.on('log', ({ message }) => onLog?.(message))
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)))

  onLog?.('Loading video engine (first time: ~30 MB download)…')
  const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  await ff.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  // Write original clip files to ffmpeg virtual filesystem
  for (let i = 0; i < clips.length; i++) {
    onLog?.(`Loading clip ${i + 1} of ${clips.length}…`)
    await ff.writeFile(`clip${i}.mp4`, await fetchFile(clips[i].file))
  }

  // Write narration MP3s
  for (const [segId, narr] of Object.entries(narrations)) {
    if (narr?.audioBase64) {
      const bin = atob(narr.audioBase64)
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      await ff.writeFile(`narr_${segId}.mp3`, arr)
    }
  }

  // Trim each segment
  const trimFiles = []
  for (const seg of editPlan.segments) {
    for (const clip of seg.clips) {
      const idx  = (clip.clipIndex || 1) - 1
      const inS  = parseTC(clip.inPoint)
      const outS = parseTC(clip.outPoint)
      const dur  = Math.max(0.5, outS - inS)
      const out  = `trim_${seg.id}_${clip.clipIndex}.mp4`
      onLog?.(`Trimming: "${seg.name}"…`)
      await ff.exec([
        '-ss', String(inS), '-i', `clip${idx}.mp4`,
        '-t', String(dur),
        '-c:v', 'copy', '-c:a', 'copy',
        '-avoid_negative_ts', '1', out,
      ])
      trimFiles.push({ file: out, seg })
    }
  }

  // Concatenate all trimmed clips
  onLog?.('Joining clips together…')
  const concatTxt = trimFiles.map(t => `file '${t.file}'`).join('\n')
  await ff.writeFile('concat.txt', new TextEncoder().encode(concatTxt))
  await ff.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'joined.mp4'])

  // Mix narration over video if available
  const narrFiles = Object.entries(narrations)
    .filter(([, n]) => n?.audioBase64)
    .map(([id]) => `narr_${id}.mp3`)

  let finalFile = 'joined.mp4'

  if (narrFiles.length > 0) {
    onLog?.('Mixing in narration audio…')
    if (narrFiles.length > 1) {
      await ff.exec([
        ...narrFiles.flatMap(f => ['-i', f]),
        '-filter_complex', `amix=inputs=${narrFiles.length}:duration=first`,
        'narr_combined.mp3',
      ])
    } else {
      await ff.exec(['-i', narrFiles[0], '-c', 'copy', 'narr_combined.mp3'])
    }
    await ff.exec([
      '-i', 'joined.mp4', '-i', 'narr_combined.mp3',
      '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:weights=0.3 1[aout]',
      '-map', '0:v', '-map', '[aout]',
      '-c:v', 'copy', '-c:a', 'aac', '-shortest', 'final.mp4',
    ])
    finalFile = 'final.mp4'
  }

  onLog?.('Packaging your video…')
  const data = await ff.readFile(finalFile)
  return new Blob([data.buffer], { type: 'video/mp4' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              i < step   ? 'bg-green-500/20 text-green-400' :
              i === step ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' :
                           'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`hidden sm:block text-[11px] font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-green-500/40' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function SegmentCard({ segment, onEditNarration }) {
  const [open, setOpen] = useState(false)
  const pColor = {
    slow:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    fast:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }[segment.pacing] || 'bg-muted text-muted-foreground border-border'

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 text-left transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {segment.id}
        </span>
        <span className="font-medium text-foreground text-sm flex-1 truncate">{segment.name}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border hidden sm:inline ${pColor}`}>
          {segment.pacing}
        </span>
        {segment.narrate && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 hidden sm:inline">
            🎙 narrated
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50">
          <div className="mt-3 space-y-1.5">
            {segment.clips?.map((clip, ci) => (
              <div key={ci} className="flex items-start gap-2 text-sm">
                <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground flex-shrink-0 mt-0.5">
                  Clip {clip.clipIndex} · {clip.inPoint}→{clip.outPoint}
                </span>
                <span className="text-muted-foreground text-xs">{clip.notes}</span>
              </div>
            ))}
          </div>
          {segment.narrate && segment.narrationLine && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-400 mb-1">🎙 Narration</p>
                <p className="text-sm text-foreground italic">"{segment.narrationLine}"</p>
              </div>
              <button
                onClick={() => onEditNarration?.(segment.id, segment.narrationLine)}
                className="p-1.5 rounded-lg hover:bg-purple-500/10 text-muted-foreground hover:text-purple-400 flex-shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {segment.audioNote && (
            <p className="text-xs text-muted-foreground">🎵 {segment.audioNote}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MemoryStudio() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [clips, setClips]   = useState([]) // files stay in browser memory
  const [step, setStep]     = useState(0)
  const [error, setError]   = useState('')

  const [prompt, setPrompt]             = useState('')
  const [outputFormat, setOutputFormat] = useState('highlight')
  const [voice, setVoice]               = useState(VOICES[0])

  const [analyzing, setAnalyzing]         = useState(false)
  const [analyzeLog, setAnalyzeLog]       = useState('')
  const [frameProgress, setFrameProgress] = useState({})
  const [editPlan, setEditPlan]           = useState(null)

  const [narrations, setNarrations] = useState({})
  const [generating, setGenerating] = useState(false)

  const [rendering, setRendering]         = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderLog, setRenderLog]         = useState('')
  const [videoBlob, setVideoBlob]         = useState(null)

  const [editingLine, setEditingLine] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({}) // clipId → 0-100

  // ── File selection ──────────────────────────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const videos = [...fileList].filter(f =>
      f.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(f.name)
    )
    if (!videos.length) return setError('Please select video files (MP4, MOV, AVI, MKV)')
    setError('')
    setClips(prev => {
      const existing = new Set(prev.map(c => c.file.name + c.file.size))
      const news = videos
        .filter(f => !existing.has(f.name + f.size))
        .map(f => ({ id: Math.random().toString(36).slice(2), file: f, duration: null }))
      return [...prev, ...news]
    })
    // Read durations in background
    videos.forEach(file => {
      const vid = document.createElement('video')
      vid.preload = 'metadata'
      const url = URL.createObjectURL(file)
      vid.src = url
      vid.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        setClips(prev => prev.map(c =>
          c.file.name === file.name && c.file.size === file.size
            ? { ...c, duration: vid.duration } : c
        ))
      }
      vid.onerror = () => URL.revokeObjectURL(url)
    })
  }, [])

  const onDrop = useCallback(e => { e.preventDefault(); addFiles(e.dataTransfer.files) }, [addFiles])
  const removeClip = id => setClips(prev => prev.filter(c => c.id !== id))

  // ── Analyze: extract frames (small) or upload to storage (large) → edge fn ──
  // Only use storage upload for truly large files — mobile browsers (Android Chrome)
  // fail fetch() with large request bodies, so keep the threshold above ~500MB.
  const LARGE_FILE_THRESHOLD = 1 * 1024 * 1024 * 1024 // 1 GB

  const analyze = async () => {
    if (!prompt.trim()) return setError('Please describe the feeling you want.')
    if (!clips.length)  return setError('Please add at least one video clip.')
    setError('')
    setAnalyzing(true)
    setUploadProgress({})

    try {
      const clipsPayload = []
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        const isLarge = clip.file.size > LARGE_FILE_THRESHOLD

        if (isLarge) {
          // ── Large file: upload to Supabase Storage, edge fn uses Gemini Files API
          setAnalyzeLog(`Uploading ${clip.file.name} to cloud… (${(clip.file.size / 1e9).toFixed(1)} GB)`)
          const uid = user?.id || 'anon'
          const storagePath = `memory-studio/${uid}/${Date.now()}_${clip.file.name}`

          // Cap at 1.9 GB so Gemini Files API can accept it (2 GB limit)
          const fileToUpload = clip.file.size > 1.9 * 1024 * 1024 * 1024
            ? clip.file.slice(0, Math.floor(1.9 * 1024 * 1024 * 1024))
            : clip.file

          let uploadedToStorage = false
          try {
            const { error: upErr } = await supabase.storage
              .from('uploads')
              .upload(storagePath, fileToUpload, {
                cacheControl: '3600',
                upsert: true,
                contentType: clip.file.type || 'video/mp4',
              })
            if (upErr) throw new Error(upErr.message)

            setUploadProgress(p => ({ ...p, [clip.id]: 100 }))
            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(storagePath)
            clipsPayload.push({
              name: clip.file.name,
              duration: clip.duration || null,
              size: fileToUpload.size,
              storageUrl: publicUrl,
            })
            uploadedToStorage = true
          } catch (upErr) {
            // Upload failed (network error, memory limit, etc.) — fall back to frame extraction
            setAnalyzeLog(`Upload failed, trying local frame extraction for ${clip.file.name}…`)
          }

          if (!uploadedToStorage) {
            // Fall back: try frame extraction even for large files
            const result = await extractFrames(
              clip.file,
              pct => setFrameProgress(p => ({ ...p, [clip.id]: pct }))
            )
            if (result.error) {
              setAnalyzeLog(`⚠️ ${result.error}`)
              await new Promise(r => setTimeout(r, 2000))
            }
            setClips(prev => prev.map(c => c.id === clip.id ? { ...c, duration: result.duration } : c))
            clipsPayload.push({ name: clip.file.name, duration: result.duration, frames: result.frames })
          }
        } else {
          // ── Small file: extract frames in browser
          setAnalyzeLog(`Reading clip ${i + 1} of ${clips.length}: ${clip.file.name}…`)
          const result = await extractFrames(
            clip.file,
            pct => setFrameProgress(p => ({ ...p, [clip.id]: pct }))
          )
          if (result.error) {
            setAnalyzeLog(`⚠️ ${result.error}`)
            await new Promise(r => setTimeout(r, 2500))
          }
          setClips(prev => prev.map(c => c.id === clip.id ? { ...c, duration: result.duration } : c))
          clipsPayload.push({ name: clip.file.name, duration: result.duration, frames: result.frames })
        }
      }

      // Guard: if every clip failed to produce any data, don't bother calling the edge function
      const usableClips = clipsPayload.filter(c => (c.frames?.length > 0) || c.storageUrl)
      if (usableClips.length === 0) {
        throw new Error(
          'None of your clips could be read on this device. ' +
          'Try using a desktop browser, or convert your videos to H.264 MP4 first.'
        )
      }

      setAnalyzeLog('AI director is watching your footage… (30–90 seconds)')

      const { data, error: fnErr } = await supabase.functions.invoke('memory-studio-analyze', {
        body: { clips: clipsPayload, prompt, outputFormat },
      })

      // Surface the real error from the function body, not the generic "non-2xx" message
      if (fnErr) {
        let detail = fnErr.message
        try { const body = await fnErr.context?.json?.(); detail = body?.error || detail } catch (_) {}
        throw new Error(detail)
      }
      if (!data?.success) throw new Error(data?.error || 'Analysis failed')

      setEditPlan(data.editPlan)

      if (data.editPlan?.segments) {
        const init = {}
        for (const seg of data.editPlan.segments) {
          if (seg.narrate && seg.narrationLine) {
            init[seg.id] = { text: seg.narrationLine, audioBase64: null, audioUrl: null }
          }
        }
        setNarrations(init)
      }

      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
      setAnalyzeLog('')
      setFrameProgress({})
      setUploadProgress({})
    }
  }

  // ── Narration ───────────────────────────────────────────────────────────────
  const generateNarration = async () => {
    const lines = Object.entries(narrations)
      .filter(([, v]) => v.text?.trim())
      .map(([id, v]) => ({ id, text: v.text }))
    if (!lines.length) return setStep(4)
    setError('')
    setGenerating(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('memory-studio-narrate', {
        body: { lines, voiceName: voice },
      })
      if (fnErr || !data?.success) throw new Error(fnErr?.message || data?.error || 'Narration failed')
      const updated = { ...narrations }
      for (const narr of data.narrations) {
        const blob = new Blob(
          [Uint8Array.from(atob(narr.audioBase64), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        )
        updated[narr.id] = { ...updated[narr.id], audioBase64: narr.audioBase64, audioUrl: URL.createObjectURL(blob) }
      }
      setNarrations(updated)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const render = async () => {
    if (!editPlan) return
    setError('')
    setRendering(true)
    setRenderProgress(0)
    try {
      const blob = await renderVideo(clips, editPlan, narrations,
        pct => setRenderProgress(pct),
        msg => setRenderLog(msg),
      )
      setVideoBlob(blob)
      setStep(5)
    } catch (err) {
      setError(`Render failed: ${err.message}`)
    } finally {
      setRendering(false)
    }
  }

  const downloadVideo = () => {
    if (!videoBlob) return
    const url = URL.createObjectURL(videoBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${editPlan?.title || 'memory-studio'}.mp4`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveEditedLine = () => {
    if (!editingLine) return
    setNarrations(prev => ({
      ...prev,
      [editingLine.segId]: { ...prev[editingLine.segId], text: editingLine.text, audioBase64: null, audioUrl: null },
    }))
    setEditPlan(prev => prev ? {
      ...prev,
      segments: prev.segments.map(s =>
        s.id === editingLine.segId ? { ...s, narrationLine: editingLine.text } : s
      ),
    } : prev)
    setEditingLine(null)
  }

  const reset = () => {
    setStep(0); setClips([]); setPrompt(''); setEditPlan(null)
    setNarrations({}); setError(''); setVideoBlob(null)
    setRenderLog(''); setRenderProgress(0)
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Memory Studio</h1>
          <p className="text-sm text-muted-foreground">Upload your clips · AI watches and edits · You download the finished video</p>
        </div>
      </div>

      <StepBar step={step} />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* STEP 0 — Select */}
      {step === 0 && (
        <div className="space-y-5">
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-purple-500/50 rounded-2xl p-10 text-center cursor-pointer transition-colors group"
          >
            <Upload className="w-10 h-10 text-muted-foreground group-hover:text-purple-400 mx-auto mb-3 transition-colors" />
            <p className="font-semibold text-foreground mb-1">Drop your video clips here</p>
            <p className="text-sm text-muted-foreground">Or click to browse · Any size · Multiple clips supported</p>
            <p className="text-xs text-muted-foreground/60 mt-1">MP4, MOV, AVI, MKV — including 3GB+ iPhone footage</p>
            <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden"
              onChange={e => addFiles(e.target.files)} />
          </div>

          {clips.length > 0 && (
            <div className="space-y-2">
              {clips.map(clip => (
                <div key={clip.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{clip.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtSize(clip.file.size)}{clip.duration ? ` · ${fmtDur(clip.duration)}` : ' · reading…'}
                    </p>
                  </div>
                  <button onClick={() => removeClip(clip.id)} className="text-muted-foreground hover:text-red-400 p-1 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => { setError(''); setStep(1) }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 1 — Describe */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Describe the feeling you want
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. A warm family day out in Guelph — the Basilica, Arboretum, kids playing at Riverside Park. Make it feel real and beautiful, not a hype reel."
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Output format</p>
            <div className="grid grid-cols-3 gap-3">
              {OUTPUT_FORMATS.map(f => (
                <button key={f.id} onClick={() => setOutputFormat(f.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${outputFormat === f.id ? 'border-purple-500 bg-purple-500/10' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
                  <p className="text-sm font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Narrator voice</p>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map(v => (
                <button key={v} onClick={() => setVoice(v)}
                  className={`px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${voice === v ? 'border-purple-500 bg-purple-500/10 text-foreground font-medium' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Frame / upload progress (shown during analysis) */}
          {analyzing && (Object.keys(frameProgress).length > 0 || Object.keys(uploadProgress).length > 0) && (
            <div className="space-y-2 p-4 rounded-xl border border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preparing clips</p>
              {clips.map(clip => {
                const isLarge = clip.file.size > 200 * 1024 * 1024
                const pct = isLarge ? (uploadProgress[clip.id] ?? 0) : (frameProgress[clip.id] ?? 0)
                const label = isLarge ? 'Uploading' : 'Reading frames'
                return (
                  <div key={clip.id}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="truncate">{clip.file.name}</span>
                      <span className="flex-shrink-0 ml-2">{label} {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 transition-all duration-200" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} disabled={analyzing}
              className="px-5 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 disabled:opacity-50 transition-colors">
              Back
            </button>
            <button onClick={analyze} disabled={analyzing || !prompt.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {analyzing
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="truncate">{analyzeLog || 'Analyzing…'}</span></>
                : '🎬 Analyze footage & build edit plan'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Edit Plan */}
      {step === 2 && editPlan && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
            <h2 className="font-bold text-foreground text-lg">{editPlan.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{editPlan.musicDirection}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span>⏱ {fmtDur(editPlan.totalDuration)}</span>
              <span>·</span>
              <span>{editPlan.segments?.length} segments</span>
            </div>
          </div>

          <div className="space-y-2">
            {editPlan.segments?.map(seg => (
              <SegmentCard key={seg.id} segment={seg}
                onEditNarration={(segId, text) => setEditingLine({ segId, text })} />
            ))}
          </div>

          {editPlan.closingNote && (
            <p className="text-xs text-muted-foreground italic px-1">💡 {editPlan.closingNote}</p>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setEditPlan(null) }}
              className="px-5 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Re-analyze
            </button>
            <button onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90">
              Review narration →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Narration */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-4">
            {editPlan?.segments?.filter(s => s.narrate).map(seg => (
              <div key={seg.id} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{seg.name}</p>
                  {narrations[seg.id]?.audioUrl && <span className="text-xs text-green-400">✓ Generated</span>}
                </div>
                <textarea
                  value={narrations[seg.id]?.text ?? seg.narrationLine ?? ''}
                  onChange={e => setNarrations(prev => ({
                    ...prev,
                    [seg.id]: { ...prev[seg.id], text: e.target.value, audioBase64: null, audioUrl: null },
                  }))}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                />
                {narrations[seg.id]?.audioUrl && (
                  <audio controls src={narrations[seg.id].audioUrl} className="w-full h-8" />
                )}
              </div>
            ))}
            {!editPlan?.segments?.some(s => s.narrate) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No narrated segments — this edit is music-only.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="px-5 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50">
              Back
            </button>
            <button onClick={generateNarration} disabled={generating}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating voice…</> : '🎙 Generate narration audio'}
            </button>
          </div>

          <button onClick={() => setStep(4)}
            className="w-full py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted/30 transition-colors">
            Skip — go straight to render →
          </button>
        </div>
      )}

      {/* STEP 4 — Render */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5 text-center">
            <div className="text-4xl mb-3">🎬</div>
            <h2 className="font-bold text-foreground text-lg mb-1">Ready to render</h2>
            <p className="text-sm text-muted-foreground">
              Your browser will cut the clips, join them, and mix in the narration — all locally. Nothing is uploaded.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            {[
              { ok: clips.length > 0, label: `${clips.length} clip${clips.length !== 1 ? 's' : ''} selected` },
              { ok: editPlan?.segments?.length > 0, label: `${editPlan?.segments?.length || 0} segments planned` },
              {
                ok: Object.values(narrations).some(n => n?.audioBase64),
                warn: true,
                label: Object.values(narrations).some(n => n?.audioBase64) ? 'Narration audio ready' : 'No narration (music-only render)',
              },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <span className={row.ok ? 'text-green-400' : row.warn ? 'text-yellow-400' : 'text-red-400'}>
                  {row.ok ? '✓' : '⚠'}
                </span>
                {row.label}
              </div>
            ))}
          </div>

          {rendering && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate">{renderLog}</span>
                <span className="font-semibold text-foreground flex-shrink-0 ml-2">{renderProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                  style={{ width: `${renderProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">⏳ Keep this tab open. Large files can take a few minutes.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} disabled={rendering}
              className="px-5 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 disabled:opacity-50">
              Back
            </button>
            <button onClick={render} disabled={rendering}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {rendering ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering…</> : '🎬 Render my video'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5 — Done */}
      {step === 5 && videoBlob && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="font-bold text-foreground text-xl mb-1">Your video is ready</h2>
            <p className="text-sm text-muted-foreground">{editPlan?.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(videoBlob.size / 1e6).toFixed(0)} MB · {fmtDur(editPlan?.totalDuration || 0)}
            </p>
          </div>

          <video controls className="w-full rounded-xl border border-border"
            src={URL.createObjectURL(videoBlob)} />

          <button onClick={downloadVideo}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Download className="w-5 h-5" />
            Download {editPlan?.title || 'video'}.mp4
          </button>

          <button onClick={reset}
            className="w-full py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50">
            Make another video
          </button>
        </div>
      )}

      {/* Edit narration modal */}
      {editingLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingLine(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-foreground mb-3">Edit narration line</h3>
            <textarea
              value={editingLine.text}
              onChange={e => setEditingLine(l => ({ ...l, text: e.target.value }))}
              rows={4} autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingLine(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50">
                Cancel
              </button>
              <button onClick={saveEditedLine}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
