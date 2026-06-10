import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Upload, Video, CheckCircle, Loader2 } from 'lucide-react'

const CATEGORIES = [
  'Education', 'Entertainment', 'Music', 'Tech',
  'Business', 'Lifestyle', 'Health & Fitness',
  'Food', 'Travel', 'Fashion', 'Sports',
  'Gaming', 'News', 'Comedy', 'Other',
]

const s = {
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  btn: {
    padding: '14px 24px',
    background: '#8b5cf6',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnGhost: {
    padding: '14px 24px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 15,
  },
}

const getVideoDuration = (file) =>
  new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(video.duration) }
    video.onerror = () => resolve(0)
  })

export default function VideoUpload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const frameVideoRef = useRef(null)
  const frameCanvasRef = useRef(null)

  const [step, setStep] = useState('select')
  const [file, setFile] = useState(null)
  const [videoDuration, setVideoDuration] = useState(null)
  const [videoObjectUrl, setVideoObjectUrl] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailMode, setThumbnailMode] = useState('frame')
  const [framePickerTime, setFramePickerTime] = useState(0)
  const [visibility, setVisibility] = useState('public')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoId, setVideoId] = useState(null)

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => { if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl) }
  }, [videoObjectUrl])

  const handleFileSelect = async (f) => {
    if (!f) return
    if (!f.type.startsWith('video/')) {
      toast.error('Please select a video file')
      return
    }

    const duration = await getVideoDuration(f)
    const MIN_DURATION = 180

    if (duration < MIN_DURATION) {
      const mins = Math.floor(duration / 60)
      const secs = Math.round(duration % 60)
      toast.error(
        `Video is ${mins}m ${secs}s — minimum 3 minutes for Watch. Upload short videos to Reels instead.`,
        { duration: 5000 },
      )
      return
    }

    const objectUrl = URL.createObjectURL(f)
    setFile(f)
    setVideoDuration(Math.round(duration))
    setVideoObjectUrl(objectUrl)
    setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    setThumbnailUrl('')
    setFramePickerTime(0)
    setThumbnailMode('frame')
    setStep('details')
  }

  const handleThumbnailUpload = async (f) => {
    if (!f) return
    const ext = f.name.split('.').pop() || 'jpg'
    const path = `video-thumbnails/${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('uploads').upload(path, f, { upsert: true })
    if (error) { toast.error('Thumbnail upload failed'); return }
    const { data } = supabase.storage.from('uploads').getPublicUrl(path)
    setThumbnailUrl(data.publicUrl)
    toast.success('Thumbnail uploaded!')
  }

  // Upload the thumbnail (data URL or remote URL) and return a public URL for storage
  const getThumbnailForUpload = async () => {
    if (!thumbnailUrl) return null

    if (thumbnailUrl.startsWith('data:')) {
      // Frame picker produced a data URL — upload it to storage
      const res = await fetch(thumbnailUrl)
      const blob = await res.blob()
      const path = `video-thumbnails/${user.id}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('uploads')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (error) return thumbnailUrl // fall back to data URL if storage fails
      const { data } = supabase.storage.from('uploads').getPublicUrl(path)
      return data.publicUrl
    }

    // Already a remote URL (uploaded via file picker)
    return thumbnailUrl
  }

  const handleUpload = async () => {
    if (!title.trim()) { toast.error('Enter a title'); return }
    if (!user) { toast.error('Not logged in'); return }
    setStep('uploading')
    setUploadProgress(0)

    try {
      const finalThumb = await getThumbnailForUpload()

      // 1. Get TUS upload URL
      const { data: ud, error: ue } = await supabase.functions.invoke('cloudflare-upload', {
        body: { fileName: file.name, fileSize: file.size },
      })
      if (ue || !ud?.uploadUrl) throw new Error(ue?.message || 'Failed to get upload URL')

      // 2. Create DB record
      const { data: video, error: dbe } = await supabase.from('videos').insert({
        creator_id: user.id,
        cloudflare_uid: ud.streamMediaId,
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        visibility,
        thumbnail_url: finalThumb || null,
        cloudflare_status: 'uploading',
      }).select().single()
      if (dbe) throw dbe
      setVideoId(video.id)

      // 3. TUS chunked upload
      const CHUNK = 50 * 1024 * 1024
      let offset = 0
      while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK)
        const res = await fetch(ud.uploadUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/offset+octet-stream',
            'Upload-Offset': offset.toString(),
            'Tus-Resumable': '1.0.0',
          },
          body: chunk,
        })
        if (!res.ok) throw new Error(`Upload chunk failed at offset ${offset}`)
        offset += chunk.size
        setUploadProgress(Math.round((offset / file.size) * 100))
      }

      // 4. Mark processing
      await supabase.from('videos').update({ cloudflare_status: 'processing' }).eq('id', video.id)
      setStep('processing')
      pollStatus(ud.streamMediaId, video.id, finalThumb)

    } catch (err) {
      toast.error('Upload failed: ' + err.message)
      setStep('details')
    }
  }

  const pollStatus = (uid, dbId, finalThumb) => {
    const check = async () => {
      const { data } = await supabase.functions.invoke('cloudflare-status', {
        body: { cloudflareUid: uid },
      })
      if (data?.status === 'ready') {
        await supabase.from('videos').update({
          cloudflare_status: 'ready',
          cloudflare_url: data.playbackUrl,
          cloudflare_thumbnail: data.thumbnail,
          thumbnail_url: finalThumb || data.thumbnail || null,
          duration_seconds: Math.round(data.duration ?? 0),
          published_at: new Date().toISOString(),
        }).eq('id', dbId)

        // Notify the creator
        if (user?.id) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'video_ready',
            content: `Your video "${title}" is ready to watch!`,
            reference_id: dbId,
            created_by: user.id,
          }).then(() => {})
        }

        setStep('done')
        toast.success('Video published!')
      } else if (data?.status === 'error') {
        toast.error('Video processing failed — please try uploading again')
        setStep('details')
      } else {
        setTimeout(check, 5000)
      }
    }
    check()
  }

  // ── Step: Select ─────────────────────────────────────────────────────────────
  if (step === 'select') return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]) }}
      style={{
        border: '2px dashed rgba(139,92,246,0.4)', borderRadius: 16,
        padding: '80px 40px', textAlign: 'center', cursor: 'pointer',
        margin: '0 auto', maxWidth: 560, transition: 'border-color 0.2s',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
      <h2 style={{ color: '#fff', marginBottom: 8, fontSize: 22, fontWeight: 700 }}>
        Upload Long-Form Video
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 24px' }}>
        MP4, MOV, WebM · Up to 10 GB · Minimum 3 minutes
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#8b5cf6', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
        <Upload size={16} /> Choose File
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={e => handleFileSelect(e.target.files?.[0])}
      />
    </div>
  )

  // ── Step: Details ─────────────────────────────────────────────────────────────
  if (step === 'details') return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 40px' }}>
      <h2 style={{ color: '#fff', marginBottom: 24, fontSize: 20, fontWeight: 700 }}>Video Details</h2>

      {/* File info */}
      <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Video size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, flexShrink: 0 }}>
          {(file?.size / 1024 / 1024).toFixed(1)} MB
          {videoDuration ? ` · ${Math.floor(videoDuration / 60)}m ${videoDuration % 60}s` : ''}
        </span>
      </div>

      <label style={s.label}>Title *</label>
      <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your video a title" />

      <label style={s.label}>Description</label>
      <textarea style={{ ...s.input, resize: 'vertical', minHeight: 90 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell viewers about your video…" />

      <label style={s.label}>Category</label>
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        style={{
          width: '100%', padding: '12px 16px',
          background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: '#fff', fontSize: 14,
          marginBottom: 16, boxSizing: 'border-box',
          cursor: 'pointer', colorScheme: 'dark',
        }}
      >
        <option value="" style={{ background: '#1a1a2e', color: '#fff' }}>Select category…</option>
        {CATEGORIES.map(c => (
          <option key={c} value={c} style={{ background: '#1a1a2e', color: '#fff' }}>{c}</option>
        ))}
      </select>

      {/* Thumbnail */}
      <label style={s.label}>Thumbnail</label>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setThumbnailMode('frame')}
          style={{ padding: '6px 16px', background: thumbnailMode === 'frame' ? '#8b5cf6' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer', fontSize: 13 }}
        >
          📹 Pick from video
        </button>
        <button
          onClick={() => setThumbnailMode('upload')}
          style={{ padding: '6px 16px', background: thumbnailMode === 'upload' ? '#8b5cf6' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer', fontSize: 13 }}
        >
          🖼️ Upload image
        </button>
      </div>

      {thumbnailMode === 'frame' && videoObjectUrl ? (
        <div style={{ marginBottom: 16 }}>
          {/* Hidden video + canvas for frame extraction */}
          <video
            ref={frameVideoRef}
            src={videoObjectUrl}
            style={{ display: 'none' }}
            onLoadedMetadata={() => {
              if (frameVideoRef.current) {
                const t = frameVideoRef.current.duration * 0.1
                setFramePickerTime(Math.round(t))
                frameVideoRef.current.currentTime = t
              }
            }}
            onSeeked={() => {
              const video = frameVideoRef.current
              const canvas = frameCanvasRef.current
              if (!video || !canvas) return
              canvas.width = video.videoWidth || 1280
              canvas.height = video.videoHeight || 720
              canvas.getContext('2d').drawImage(video, 0, 0)
              setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.85))
            }}
          />
          <canvas ref={frameCanvasRef} style={{ display: 'none' }} />

          {/* Frame preview */}
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="thumbnail preview"
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
            />
          )}

          {/* Scrubber */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Drag to select frame</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                {Math.floor(framePickerTime / 60)}:{(framePickerTime % 60).toString().padStart(2, '0')}
                {videoDuration ? ` / ${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toString().padStart(2, '0')}` : ''}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={videoDuration ?? 100}
              step={1}
              value={framePickerTime}
              onChange={e => {
                const t = parseInt(e.target.value, 10)
                setFramePickerTime(t)
                if (frameVideoRef.current) frameVideoRef.current.currentTime = t
              }}
              style={{ width: '100%', accentColor: '#8b5cf6' }}
            />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            This frame will be used as your thumbnail
          </p>
        </div>
      ) : thumbnailMode === 'upload' ? (
        <div
          onClick={() => document.getElementById('thumb-inp').click()}
          style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 16, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="thumbnail" style={{ height: 120, objectFit: 'cover', borderRadius: 4 }} />
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 13 }}>
              Click to upload thumbnail image<br />
              <span style={{ fontSize: 11 }}>JPG or PNG recommended</span>
            </p>
          )}
          <input
            id="thumb-inp"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleThumbnailUpload(e.target.files?.[0])}
          />
        </div>
      ) : null}

      <label style={s.label}>Visibility</label>
      <select
        value={visibility}
        onChange={e => setVisibility(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', cursor: 'pointer', colorScheme: 'dark' }}
      >
        <option value="public" style={{ background: '#1a1a2e', color: '#fff' }}>Public</option>
        <option value="unlisted" style={{ background: '#1a1a2e', color: '#fff' }}>Unlisted</option>
        <option value="private" style={{ background: '#1a1a2e', color: '#fff' }}>Private</option>
      </select>

      <div style={{ display: 'flex', gap: 12 }}>
        <button style={s.btnGhost} onClick={() => { setStep('select'); setVideoObjectUrl(null) }}>Back</button>
        <button style={{ ...s.btn, flex: 1 }} onClick={handleUpload}>Upload Video →</button>
      </div>
    </div>
  )

  // ── Step: Uploading ───────────────────────────────────────────────────────────
  if (step === 'uploading') return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 24 }}>⬆️</div>
      <h2 style={{ color: '#fff', marginBottom: 8, fontSize: 22, fontWeight: 700 }}>
        Uploading… {uploadProgress}%
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 13 }}>Do not close this tab</p>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, maxWidth: 400, margin: '0 auto' }}>
        <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#8b5cf6', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 12 }}>
        {(file?.size / 1024 / 1024).toFixed(1)} MB · {file?.name}
      </p>
    </div>
  )

  // ── Step: Processing ──────────────────────────────────────────────────────────
  if (step === 'processing') return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <Loader2 size={48} style={{ color: '#8b5cf6', animation: 'spin 1s linear infinite' }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <h2 style={{ color: '#fff', marginBottom: 8, fontSize: 22, fontWeight: 700 }}>Processing Video…</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Your video is being prepared. This usually takes a few minutes.</p>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>You can close this page — we'll let you know when it's ready.</p>
    </div>
  )

  // ── Step: Done ────────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <CheckCircle size={64} style={{ color: '#10b981', marginBottom: 24 }} />
      <h2 style={{ color: '#fff', marginBottom: 8, fontSize: 22, fontWeight: 700 }}>Video Published!</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontSize: 13 }}>Your video is live and ready to watch.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button style={s.btn} onClick={() => navigate(`/watch/${videoId}`)}>View Video</button>
        <button style={s.btnGhost} onClick={() => {
          setStep('select'); setFile(null); setTitle(''); setDescription('')
          setCategory(''); setThumbnailUrl(''); setUploadProgress(0); setVideoId(null)
          setVideoDuration(null); setVideoObjectUrl(null); setFramePickerTime(0)
        }}>
          Upload Another
        </button>
      </div>
    </div>
  )

  return null
}
