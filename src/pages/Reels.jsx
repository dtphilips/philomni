import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Heart, MessageCircle, Share2, Music, Plus, Volume2, VolumeX,
  Play, Pause, Bookmark, MoreHorizontal, X, Upload,
} from 'lucide-react'

// ─── Sample reels shown when DB has no video posts ───────────────────────────
const SAMPLE_REELS = [
  {
    id: 'sample-1',
    content: 'Welcome to Philomni Reels! 🎬',
    media_urls: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'],
    media_type: 'video',
    author_name: 'Philomni',
    author_avatar: null,
    likes_count: 1240,
    comments_count: 89,
    shares_count: 45,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    content: 'Create and share your reels here ✨',
    media_urls: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'],
    media_type: 'video',
    author_name: 'Philomni Team',
    author_avatar: null,
    likes_count: 892,
    comments_count: 34,
    shares_count: 28,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    content: 'Your content. Your community. 💜',
    media_urls: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
    media_type: 'video',
    author_name: 'Creator',
    author_avatar: null,
    likes_count: 567,
    comments_count: 23,
    shares_count: 12,
    created_at: new Date().toISOString(),
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function parseMediaUrls(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return typeof raw === 'string' ? [raw] : []
  }
}

function getVideoUrl(reel) {
  const urls = parseMediaUrls(reel.media_urls)
  return urls[0] ?? reel.video_url ?? null
}

// ─── Comments Drawer ──────────────────────────────────────────────────────────
function CommentsDrawer({ reel, onClose }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    if (!reel?.id || reel.id.startsWith('sample')) return
    supabase
      .from('comments')
      .select('*, users(full_name, avatar_url)')
      .eq('post_id', reel.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setComments(data) })
  }, [reel?.id])

  const handlePost = async () => {
    if (!text.trim() || !user || reel.id.startsWith('sample')) return
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: reel.id, content: text.trim(), user_id: user.id })
      .select('*, users(full_name, avatar_url)')
      .single()
    if (data) setComments(c => [data, ...c])
    setText('')
  }

  return (
    <div className="absolute inset-0 z-30 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-zinc-900 rounded-t-2xl max-h-[65%] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-white font-semibold">Comments</span>
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {comments.length === 0 && (
            <p className="text-white/40 text-sm text-center py-6">Be the first to comment</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                {c.users?.full_name?.[0] ?? '?'}
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold">{c.users?.full_name ?? 'User'}</p>
                <p className="text-white text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3 border-t border-white/10">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePost()}
            placeholder="Add a comment…"
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-full px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={handlePost}
            className="bg-purple-600 text-white text-sm px-4 py-2 rounded-full hover:bg-purple-700 transition"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const { user } = useAuth()

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f || !f.type.startsWith('video/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file || !user) return
    setUploading(true)
    try {
      const path = `reels/${user.id}/${Date.now()}-${file.name}`
      const { data: up, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(up.path)
      await supabase.from('posts').insert({
        content:      caption,
        media_type:   'video',
        feed_type:    'reel',
        media_urls:   [publicUrl],
        created_by:   user.id,
        author_id:    user.id,
        author_name:  user.full_name ?? user.email ?? 'Creator',
        author_avatar: user.avatar_url ?? null,
        created_at:   new Date().toISOString(),
      })
      onUploaded()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-zinc-900 rounded-t-2xl p-4 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-lg">Upload Reel</span>
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
        </div>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
        {preview ? (
          <div className="relative aspect-[9/16] max-h-48 mx-auto rounded-xl overflow-hidden bg-black">
            <video src={preview} className="w-full h-full object-cover" />
            <button
              onClick={() => { setFile(null); setPreview(null) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-white/40 hover:border-purple-500 hover:text-purple-400 transition"
          >
            <Upload className="w-8 h-8" />
            <p className="text-sm">Tap to select a video</p>
          </button>
        )}
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption…"
          className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm resize-none h-20 outline-none"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Share Reel'}
        </button>
      </div>
    </div>
  )
}

// ─── Single Reel Slide ────────────────────────────────────────────────────────
function ReelSlide({ reel, index, isMuted, onMuteToggle, videoRefsCallback, onActivate }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayIcon, setShowPlayIcon] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(reel.likes_count ?? 0)
  const [saved, setSaved] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const videoRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  // Register ref in parent array
  useEffect(() => {
    videoRefsCallback(index, videoRef)
  }, [index, videoRefsCallback])

  const handleVideoClick = () => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play().catch(() => {})
      setIsPlaying(true)
    } else {
      vid.pause()
      setIsPlaying(false)
    }
    setShowPlayIcon(true)
    setTimeout(() => setShowPlayIcon(false), 800)
  }

  const handleLike = () => {
    setLiked(l => !l)
    setLikeCount(c => liked ? c - 1 : c + 1)
    if (!reel.id.startsWith('sample') && user) {
      supabase.from('likes').insert({ post_id: reel.id, user_id: user.id }).then(() => {})
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`).catch(() => {})
  }

  const videoSrc   = getVideoUrl(reel)
  const authorName  = reel.author_name  ?? reel.users?.full_name  ?? 'Creator'
  const authorAvatar = reel.author_avatar ?? reel.users?.avatar_url ?? null

  return (
    <div
      className="relative h-screen w-full snap-start bg-black flex items-center justify-center flex-shrink-0"
      data-index={index}
    >
      {/* Video */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="h-full w-full object-cover"
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
          data-index={index}
          onClick={handleVideoClick}
          onError={e => console.warn('[Reels] video error', videoSrc, e)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          className="w-full h-full bg-gradient-to-br from-purple-900/60 to-black flex items-center justify-center p-8"
          onClick={handleVideoClick}
        >
          <p className="text-white text-xl font-bold text-center">{reel.content}</p>
        </div>
      )}

      {/* Play/pause flash icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-5">
            {isPlaying
              ? <Pause className="w-12 h-12 text-white" />
              : <Play className="w-12 h-12 text-white" />}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <h2 className="text-white font-semibold text-lg">Reels</h2>
          <div className="flex gap-3">
            <button onClick={onMuteToggle} className="text-white">
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <button onClick={() => setShowUpload(true)} className="text-white">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom author + caption */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 mb-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden border-2 border-white flex-shrink-0">
            {authorAvatar
              ? <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-sm font-bold">{authorName[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{authorName}</p>
            <p className="text-white/60 text-xs">{new Date(reel.created_at).toLocaleDateString()}</p>
          </div>
          <button className="border border-white/70 text-white text-xs px-3 py-1 rounded-full hover:bg-white hover:text-black transition">
            Follow
          </button>
        </div>

        {reel.content && (
          <p className="text-white text-sm mb-2 line-clamp-2 pointer-events-auto">
            {reel.content.replace(/<[^>]*>/g, '')}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Music className="w-3 h-3 text-white" />
          <p className="text-white text-xs">Original Audio</p>
        </div>
      </div>

      {/* Right action buttons */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center ${liked ? 'text-red-500' : 'text-white'}`}>
            <Heart className="w-6 h-6" fill={liked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-white text-xs">{formatCount(likeCount)}</span>
        </button>

        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-white text-xs">{formatCount(reel.comments_count ?? 0)}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-white text-xs">{formatCount(reel.shares_count ?? 0)}</span>
        </button>

        <button onClick={() => setSaved(s => !s)} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center ${saved ? 'text-yellow-400' : 'text-white'}`}>
            <Bookmark className="w-6 h-6" fill={saved ? 'currentColor' : 'none'} />
          </div>
          <span className="text-white text-xs">Save</span>
        </button>

        <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Comments drawer */}
      {showComments && (
        <CommentsDrawer reel={reel} onClose={() => setShowComments(false)} />
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => {}} />
      )}
    </div>
  )
}

// ─── Main Reels Page ──────────────────────────────────────────────────────────
export default function Reels() {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const containerRef = useRef(null)
  const videoRefsMap = useRef({})
  const observerRef = useRef(null)

  // Register video ref from child
  const videoRefsCallback = useCallback((index, ref) => {
    videoRefsMap.current[index] = ref
  }, [])

  useEffect(() => {
    setLoading(true)
    supabase.from('posts')
      .select('*')
      .eq('media_type', 'video')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setReels(data?.length ? data : SAMPLE_REELS); setLoading(false) })
      .catch(() => { setReels(SAMPLE_REELS); setLoading(false) })
    const t = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(t)
  }, [])

  // Intersection Observer — play the visible video, pause others
  useEffect(() => {
    if (loading || reels.length === 0) return

    // Give the DOM a tick to render the slides
    const timer = setTimeout(() => {
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const idx = parseInt(entry.target.dataset.index, 10)
            const vidRef = videoRefsMap.current[idx]
            const video = vidRef?.current

            if (entry.isIntersecting) {
              setCurrentIndex(idx)
              if (video) {
                video.currentTime = 0
                video.play().catch(() => {})
              }
            } else {
              if (video) {
                video.pause()
                video.currentTime = 0
              }
            }
          })
        },
        { threshold: 0.7 },
      )

      // Observe every slide element
      const container = containerRef.current
      if (!container) return
      container.querySelectorAll('[data-index]').forEach(el => {
        observerRef.current.observe(el)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      observerRef.current?.disconnect()
    }
  }, [loading, reels])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = e => {
      const container = containerRef.current
      if (!container) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const dir = e.key === 'ArrowDown' ? 1 : -1
        container.scrollBy({ top: dir * window.innerHeight, behavior: 'smooth' })
      }
      if (e.key === ' ') {
        e.preventDefault()
        const vid = videoRefsMap.current[currentIndex]?.current
        if (!vid) return
        vid.paused ? vid.play().catch(() => {}) : vid.pause()
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted(m => !m)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex])

  // Sync mute state to all video elements whenever it changes
  useEffect(() => {
    Object.values(videoRefsMap.current).forEach(ref => {
      if (ref?.current) ref.current.muted = isMuted
    })
  }, [isMuted])

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading reels…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {reels.map((reel, index) => (
        <ReelSlide
          key={reel.id}
          reel={reel}
          index={index}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(m => !m)}
          videoRefsCallback={videoRefsCallback}
          onActivate={setCurrentIndex}
        />
      ))}
    </div>
  )
}
