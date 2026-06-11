import React, { useState, useRef, useEffect, useCallback } from 'react'
import EmojiPickerButton, { insertAtCursor } from '../components/EmojiPickerButton'
import AdOverlay from '../components/AdOverlay'
import { getInVideoCampaigns, selectAdForVideo } from '../utils/adMatcher'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toggleLike, toggleSave, checkLiked, checkSaved } from '../lib/postActions'
import { useAuth } from '../context/AuthContext'
import {
  Heart, MessageCircle, Share2, Music, Plus, Volume2, VolumeX,
  Play, Pause, Bookmark, MoreHorizontal, X, Upload,
  Edit3, Trash2, BarChart2, Rocket, Flag, EyeOff, Link2, User,
  MessageCircleOff,
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
    likes_count: 1240, comments_count: 89, shares_count: 45, views_count: 0, saves_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    content: 'Create and share your reels here ✨',
    media_urls: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'],
    media_type: 'video',
    author_name: 'Philomni Team',
    author_avatar: null,
    likes_count: 892, comments_count: 34, shares_count: 28, views_count: 0, saves_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    content: 'Your content. Your community. 💜',
    media_urls: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
    media_type: 'video',
    author_name: 'Creator',
    author_avatar: null,
    likes_count: 567, comments_count: 23, shares_count: 12, views_count: 0, saves_count: 0,
    created_at: new Date().toISOString(),
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCount(n) {
  if (!n) return '0'
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

// Deterministic engagement score + per-reel seeded jitter. The seed is passed in
// (generated fresh in the fetch effect) so order varies on each load — a
// module-level seed can be cached by the bundler and never re-evaluate.
// signals = { followedCreators: Set<id>, likedReelIds: Set<id> }
function scoreReel(reel, index, seed, signals = {}) {
  const views    = reel.views_count    ?? reel.view_count    ?? 0
  const likes    = reel.likes_count    ?? reel.like_count    ?? 0
  const comments = reel.comments_count ?? reel.comment_count ?? 0
  const saves    = reel.saves_count    ?? reel.save_count    ?? 0
  const hoursAgo = (Date.now() - new Date(reel.created_at)) / (1000 * 60 * 60)
  const recencyBonus = hoursAgo < 24 ? 15 : hoursAgo < 48 ? 8 : hoursAgo < 168 ? 3 : 0
  const h = Math.sin(seed * 1e-6 + index * 12.9898) * 43758.5453
  const seededRandom = (h - Math.floor(h)) * 8
  const base = (views * 1) + (likes * 3) + (comments * 5) + (saves * 3) + recencyBonus + seededRandom

  // Personalization: boost reels from creators user follows or has liked before
  const authorId = reel.created_by || reel.author_id
  const followBonus = signals.followedCreators?.has(authorId) ? 12 : 0
  const likedBonus = signals.likedReelIds?.has(reel.id) ? 6 : 0

  return base + followBonus + likedBonus
}

// Rank reels by seeded score — scores computed once (with index + seed), then sorted.
function shuffleReels(reels, seed, signals = {}) {
  return reels
    .map((reel, index) => ({ reel, score: scoreReel(reel, index, seed, signals) }))
    .sort((a, b) => b.score - a.score)
    .map(({ reel }) => reel)
}

// ─── Comments Drawer ──────────────────────────────────────────────────────────
function CommentsDrawer({ reel, onClose }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const { user } = useAuth()
  const commentInputRef = useRef(null)

  useEffect(() => {
    if (!reel?.id || reel.id.startsWith('sample')) return
    supabase.from('comments')
      .select('*, users(full_name, avatar_url)')
      .eq('post_id', reel.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setComments(data) })
  }, [reel?.id])

  const handlePost = async () => {
    if (!text.trim() || !user || reel.id.startsWith('sample')) return
    const { data } = await supabase.from('comments')
      .insert({ post_id: reel.id, content: text.trim(), user_id: user.id })
      .select('*, users(full_name, avatar_url)')
      .single()
    if (data) setComments(c => [data, ...c])
    setText('')
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end" onClick={onClose}>
      <div className="w-full bg-zinc-900 rounded-t-2xl max-h-[65%] flex flex-col"
        onClick={e => e.stopPropagation()}>
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
          <div className="flex-1 flex items-center bg-white/10 rounded-full px-4">
            <input
              ref={commentInputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
              placeholder="Add a comment…"
              className="flex-1 bg-transparent text-white placeholder-white/40 py-2 text-sm outline-none" />
            <EmojiPickerButton
              onEmojiSelect={(emoji) => insertAtCursor(text, setText, commentInputRef, emoji)}
              pickerSide="right"
            />
          </div>
          <button onClick={handlePost}
            className="bg-purple-600 text-white text-sm px-4 py-2 rounded-full hover:bg-purple-700 transition flex-shrink-0">
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
        content: caption,
        media_type: 'video',
        feed_type: 'reel',
        media_urls: [publicUrl],
        created_by: user.id,
        author_id: user.id,
        author_name: user.full_name ?? user.email ?? 'Creator',
        author_avatar: user.avatar_url ?? null,
        likes_count: 0, comments_count: 0, views_count: 0, shares_count: 0, saves_count: 0,
        visibility: 'public',
        created_at: new Date().toISOString(),
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
    <div className="fixed inset-0 z-40 bg-black/80 flex items-end" onClick={onClose}>
      <div className="w-full bg-zinc-900 rounded-t-2xl p-4 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-lg">Upload Reel</span>
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
        </div>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
        {preview ? (
          <div className="relative aspect-[9/16] max-h-48 mx-auto rounded-xl overflow-hidden bg-black">
            <video src={preview} className="w-full h-full object-cover" />
            <button onClick={() => { setFile(null); setPreview(null) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-white/40 hover:border-purple-500 hover:text-purple-400 transition">
            <Upload className="w-8 h-8" />
            <p className="text-sm">Tap to select a video</p>
          </button>
        )}
        <textarea value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption…"
          className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm resize-none h-20 outline-none" />
        <button onClick={handleUpload} disabled={!file || uploading}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50">
          {uploading ? 'Uploading…' : 'Share Reel'}
        </button>
      </div>
    </div>
  )
}

// ─── Edit Caption Modal ───────────────────────────────────────────────────────
function EditCaptionModal({ reel, onClose, onSaved }) {
  const [caption, setCaption] = useState(reel.content?.replace(/<[^>]*>/g, '') ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('posts').update({ content: caption }).eq('id', reel.id)
    onSaved(caption)
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={onClose}>
      <div className="w-full bg-zinc-900 rounded-t-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-lg">Edit Caption</span>
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
        </div>
        <textarea value={caption} onChange={e => setCaption(e.target.value)}
          rows={4} placeholder="Write a caption…"
          className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm resize-none outline-none" />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Insights Panel ───────────────────────────────────────────────────────────
function InsightsPanel({ reel, onClose }) {
  const [insights, setInsights] = useState(null)

  useEffect(() => {
    const load = async () => {
      // Pull fresh counts directly from posts table
      const { data: post } = await supabase
        .from('posts')
        .select('views_count, likes_count, comments_count, saves_count, shares_count, reposts_count')
        .eq('id', reel.id)
        .single()

      // Also pull watch_time from video_analytics (video_id col, no event_type)
      let completionRate = 0
      try {
        const { data: analytics } = await supabase
          .from('video_analytics')
          .select('views, watch_time')
          .eq('video_id', reel.id)
        const totalViews     = (post?.views_count ?? 0)
        const totalWatchTime = analytics?.reduce((a, r) => a + (r.watch_time || 0), 0) ?? 0
        completionRate = totalViews > 0 && totalWatchTime > 0
          ? Math.min(100, Math.round((totalWatchTime / (totalViews * 30)) * 100))
          : 0
      } catch { /* fail silently */ }

      setInsights({
        views:    post?.views_count    ?? reel.views_count    ?? 0,
        likes:    post?.likes_count    ?? reel.likes_count    ?? 0,
        comments: post?.comments_count ?? reel.comments_count ?? 0,
        saves:    post?.saves_count    ?? reel.saves_count    ?? 0,
        shares:   post?.shares_count   ?? reel.shares_count   ?? 0,
        reposts:  post?.reposts_count  ?? 0,
        completionRate,
      })
    }
    load()
  }, [reel.id])

  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">Reel Insights</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
        </div>
        {!insights ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Views',      value: formatCount(insights.views),      icon: '👁️' },
              { label: 'Likes',      value: formatCount(insights.likes),      icon: '❤️' },
              { label: 'Comments',   value: formatCount(insights.comments),   icon: '💬' },
              { label: 'Saves',      value: formatCount(insights.saves),      icon: '🔖' },
              { label: 'Shares',     value: formatCount(insights.shares),     icon: '🔄' },
              { label: 'Completion', value: insights.completionRate + '%',    icon: '✅' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-white font-bold text-lg">{stat.value}</div>
                <div className="text-white/50 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-white/30 text-xs text-center mt-4">Stats update every few minutes</p>
      </div>
    </div>
  )
}

// ─── Report Sheet ─────────────────────────────────────────────────────────────
function ReportSheet({ onClose }) {
  const [reported, setReported] = useState(false)
  const options = ["It's spam", 'Inappropriate content', 'Hate speech', 'Violence', 'False information', 'Other']

  if (reported) return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-2xl p-6 text-center mx-6">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-white font-semibold mb-1">Report submitted</p>
        <p className="text-white/50 text-sm mb-4">Thanks for helping keep Philomni safe.</p>
        <button onClick={onClose} className="px-6 py-2 bg-purple-600 text-white rounded-full text-sm">Done</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full bg-zinc-900 rounded-t-2xl p-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-semibold">Report</span>
          <button onClick={onClose}><X className="w-5 h-5 text-white/60" /></button>
        </div>
        <p className="text-white/50 text-sm mb-3">Why are you reporting this?</p>
        <div className="space-y-1">
          {options.map(opt => (
            <button key={opt} onClick={() => setReported(true)}
              className="w-full text-left px-4 py-3 text-white rounded-xl hover:bg-white/10 transition text-sm">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Single Reel Slide ────────────────────────────────────────────────────────
function ReelSlide({ reel: initialReel, index, isMuted, onMuteToggle, videoRefsCallback, onActivate, onHide, inVideoCampaigns = [] }) {
  const [reel, setReel] = useState(initialReel)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayIcon, setShowPlayIcon] = useState(false)

  // Like
  const [liked, setLiked] = useState(false)
  const [likeChecked, setLikeChecked] = useState(false)
  const [likeCount, setLikeCount] = useState(reel.likes_count ?? 0)

  // Save
  const [saved, setSaved] = useState(false)

  // Follow
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Overlays
  const [showComments, setShowComments] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditCaption, setShowEditCaption] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // ── In-video ad state ──────────────────────────────────────────────────
  const [currentAd,      setCurrentAd]      = useState(null)
  const [adSlot,         setAdSlot]         = useState(null)
  const [preRollShown,   setPreRollShown]   = useState(false)
  const [midRollShown,   setMidRollShown]   = useState(false)
  const [endRollShown,   setEndRollShown]   = useState(false)
  const [creatorMonetized, setCreatorMonetized] = useState(false)

  const videoRef = useRef(null)
  const viewTracked = useRef(false)
  const viewTimerRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const authorId = reel.author_id ?? reel.created_by
  const isOwnReel = !!user && !!authorId && user.id === authorId
  const isSample = reel.id.startsWith('sample')

  // Register video ref in parent map
  useEffect(() => { videoRefsCallback(index, videoRef) }, [index, videoRefsCallback])

  // Check liked status on mount (shared helper)
  useEffect(() => {
    if (!user || isSample) { setLikeChecked(true); return }
    checkLiked(reel.id, user.id).then(v => { setLiked(v); setLikeChecked(true) })
  }, [user, reel.id, isSample])

  // Check saved status on mount (shared helper)
  useEffect(() => {
    if (!user || isSample) return
    checkSaved(reel.id, user.id).then(setSaved)
  }, [user, reel.id, isSample])

  // Check follow status on mount
  useEffect(() => {
    if (!user || !authorId || isOwnReel || isSample) return
    supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', authorId).maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
  }, [user, authorId, isOwnReel, isSample])

  // Debug: log post structure to identify field names
  useEffect(() => {
    if (!reel) return
    console.log('[ReelSlide] post keys:', Object.keys(reel))
    console.log('[ReelSlide] authorId:', authorId)
    console.log('[ReelSlide] inVideoCampaigns count:', inVideoCampaigns?.length)
  }, [reel?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch creator monetization status for in-video ad eligibility
  useEffect(() => {
    if (!authorId || isSample) return
    supabase.from('users').select('monetization_enabled,is_monetized').eq('id', authorId).single()
      .then(({ data }) => {
        const monetized = data?.monetization_enabled === true || data?.is_monetized === true
        console.log('[ReelSlide] creator monetization fetch:', { authorId, monetized, data })
        setCreatorMonetized(monetized)
      })
  }, [authorId, isSample])

  // ── In-video ad helpers ───────────────────────────────────────────────
  const tryShowAd = (slot) => {
    console.log('[Reels] tryShowAd', slot, {
      creatorMonetized,
      campaigns: inVideoCampaigns?.length ?? 0,
      authorId,
    })
    if (!creatorMonetized) {
      console.log('[Reels] skipping ad — creator not monetized')
      return false
    }
    const ad = selectAdForVideo(inVideoCampaigns, reel)
    if (!ad) {
      console.log('[Reels] skipping ad — no eligible campaign')
      return false
    }
    console.log('[Reels] showing ad:', ad.name, 'slot:', slot)
    setCurrentAd(ad)
    setAdSlot(slot)
    videoRef.current?.pause()
    return true
  }

  const MIN_VIDEO_LENGTH_FOR_ADS = 30 // seconds — no ads on short videos

  const handleAdComplete = () => {
    setCurrentAd(null)
    setAdSlot(null)
    // Small delay ensures overlay unmounts before play() is called
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.log('[Reels] play after ad error:', err)
        })
      }
    }, 100)
  }

  const handleTimeUpdate = (e) => {
    const video = e.target
    if (!video.duration) return

    // Skip ads on short videos
    if (video.duration < MIN_VIDEO_LENGTH_FOR_ADS) return

    const dur = video.duration
    const pct = video.currentTime / dur
    const remaining = dur - video.currentTime

    // Mid-roll: videos ≥ 60 s, fires at 50%
    if (dur >= 60 && pct >= 0.5 && !midRollShown) {
      setMidRollShown(true)
      tryShowAd('mid_roll')
    }

    // End-roll: videos ≥ 45 s, fires at ≤ 5 s remaining
    if (dur >= 45 && remaining <= 5 && remaining > 0 && !endRollShown) {
      setEndRollShown(true)
      tryShowAd('end_roll')
    }
  }

  // Sync muted attribute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  // Handlers
  const handleVideoClick = () => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) { vid.play().catch(() => {}); setIsPlaying(true) }
    else { vid.pause(); setIsPlaying(false) }
    setShowPlayIcon(true)
    setTimeout(() => setShowPlayIcon(false), 800)
  }

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    if (isSample) { setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); return }
    // Optimistic, then reconcile via shared helper (writes canonical likes_count)
    setLiked(l => !l)
    setLikeCount(c => Math.max(0, c + (liked ? -1 : 1)))
    const res = await toggleLike(reel.id, user.id, liked, likeCount)
    setLiked(res.liked)
    setLikeCount(res.count)
  }

  const handleSave = async () => {
    if (!user) { navigate('/login'); return }
    if (isSample) { setSaved(s => !s); return }
    setSaved(s => !s)
    const res = await toggleSave(reel.id, user.id, saved)
    setSaved(res.saved)
    setReel(r => ({ ...r, saves_count: res.count }))
  }

  const handleFollow = async () => {
    if (!user) { navigate('/login'); return }
    if (!authorId || isSample) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', authorId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: authorId })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  const handleShare = async () => {
    navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`).then(() => {}, () => {})
    if (!isSample) {
      const newCount = (reel.shares_count ?? 0) + 1
      await supabase.from('posts').update({ shares_count: newCount }).eq('id', reel.id)
      setReel(r => ({ ...r, shares_count: newCount }))
    }
  }

  const handleDeleteReel = async () => {
    setShowMenu(false)
    if (!window.confirm('Delete this reel?')) return
    await supabase.from('posts').delete().eq('id', reel.id)
    onHide(reel.id)
  }

  const handleToggleComments = async () => {
    setShowMenu(false)
    const next = !reel.comments_disabled
    await supabase.from('posts').update({ comments_disabled: next }).eq('id', reel.id)
    setReel(r => ({ ...r, comments_disabled: next }))
  }

  // Own-reel menu items
  const ownerMenuItems = [
    { label: 'Edit Caption',       icon: Edit3,           action: () => { setShowMenu(false); setShowEditCaption(true) } },
    { label: 'See Insights',       icon: BarChart2,        action: () => { setShowMenu(false); setShowInsights(true) } },
    { label: 'Boost Post',         icon: Rocket,           action: () => { setShowMenu(false); navigate(`/advertise?tab=boost&postId=${reel.id}`) } },
    { label: reel.comments_disabled ? 'Turn on comments' : 'Turn off comments',
                                   icon: MessageCircleOff, action: handleToggleComments },
    { label: 'Delete Reel',        icon: Trash2,           action: handleDeleteReel, danger: true },
  ]

  // Other-user menu items
  const otherMenuItems = [
    { label: 'Report',             icon: Flag,   action: () => { setShowMenu(false); setShowReport(true) } },
    { label: 'Not interested',     icon: EyeOff, action: () => { setShowMenu(false); onHide(reel.id) } },
    { label: 'Copy link',          icon: Link2,  action: () => { handleShare(); setShowMenu(false) } },
    { label: 'About this account', icon: User,   action: () => { setShowMenu(false); authorId && navigate(`/profile/${authorId}`) } },
  ]

  const menuItems = isOwnReel ? ownerMenuItems : otherMenuItems

  const videoSrc    = getVideoUrl(reel)
  const authorName  = reel.author_name  ?? reel.users?.full_name  ?? 'Creator'
  const authorAvatar = reel.author_avatar ?? reel.users?.avatar_url ?? null

  return (
    <div className="relative h-screen w-full snap-start bg-black flex items-center justify-center flex-shrink-0"
      data-index={index}>

      {/* ── In-video AdOverlay (pre/mid/end roll) ── */}
      {currentAd && (
        <AdOverlay
          campaign={currentAd}
          slot={adSlot}
          postId={reel.id}
          creatorId={authorId}
          onComplete={handleAdComplete}
          onSkip={handleAdComplete}
        />
      )}

      {/* Video */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="h-full w-full object-cover"
          loop playsInline muted={isMuted} preload="metadata"
          data-index={index}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onClick={handleVideoClick}
          onTimeUpdate={handleTimeUpdate}
          onError={e => console.warn('[Reels] video error', videoSrc, e)}
          onPlay={() => {
            setIsPlaying(true)
            // Pre-roll ad: trigger once on first play, only on videos ≥ 30 s
            if (!preRollShown) {
              setPreRollShown(true)
              const duration = videoRef.current?.duration
              if (duration && duration >= MIN_VIDEO_LENGTH_FOR_ADS) {
                tryShowAd('pre_roll')
              }
            }
            if (!viewTracked.current && !isSample) {
              const viewKey = `philomni_view_reel_${reel.id}`
              const lastViewed = localStorage.getItem(viewKey)
              const TWENTY_FOUR_H = 24 * 60 * 60 * 1000
              const alreadyCounted = lastViewed && Date.now() - parseInt(lastViewed) < TWENTY_FOUR_H
              if (!alreadyCounted) {
                viewTimerRef.current = setTimeout(async () => {
                  if (viewTracked.current) return
                  viewTracked.current = true
                  localStorage.setItem(viewKey, Date.now().toString())
                  await supabase.from('posts')
                    .update({ views_count: (reel.views_count ?? 0) + 1 })
                    .eq('id', reel.id)
                  try {
                    await supabase.from('video_analytics').insert({
                      video_id: reel.id, views: 1, watch_time: 3, created_by: user?.id ?? null,
                    })
                  } catch { /* fail silently */ }
                }, 5000)
              }
            }
          }}
          onPause={() => {
            setIsPlaying(false)
            clearTimeout(viewTimerRef.current)
          }}
          onEnded={async () => {
            if (!viewTracked.current || isSample) return
            try {
              await supabase.from('video_analytics').insert({
                video_id: reel.id,
                views: 0,
                watch_time: Math.round(videoRef.current?.duration ?? 0),
                created_by: user?.id ?? null,
              })
            } catch { /* fail silently */ }
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-black flex items-center justify-center p-8"
          onClick={handleVideoClick}>
          <p className="text-white text-xl font-bold text-center">{reel.content}</p>
        </div>
      )}

      {/* Play/pause flash icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-5">
            {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
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

      {/* Bottom: author + caption */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        {/* Clickable author row */}
        <div
          onClick={() => !isSample && authorId && navigate(`/profile/${authorId}`)}
          className={`flex items-center gap-3 mb-3 pointer-events-auto ${!isSample && authorId ? 'cursor-pointer' : ''}`}
        >
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden border-2 border-white flex-shrink-0">
            {authorAvatar
              ? <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-sm font-bold">{authorName[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate hover:underline">{authorName}</p>
            <p className="text-white/60 text-xs">{new Date(reel.created_at).toLocaleDateString()}</p>
          </div>
          {/* Follow button — only for other users */}
          {!isOwnReel && (
            <button
              onClick={e => { e.stopPropagation(); handleFollow() }}
              disabled={followLoading}
              className={`text-xs px-3 py-1 rounded-full border transition font-medium flex-shrink-0 ${
                isFollowing
                  ? 'border-white/40 text-white/60 bg-white/10'
                  : 'border-white text-white hover:bg-white hover:text-black'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
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
        <button onClick={handleLike} disabled={!likeChecked} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center transition-colors ${liked ? 'text-red-500' : 'text-white'} ${!likeChecked ? 'opacity-50' : ''}`}>
            <Heart className="w-6 h-6" fill={liked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-white text-xs">{formatCount(likeCount)}</span>
        </button>

        <button
          onClick={() => !reel.comments_disabled && setShowComments(true)}
          className="flex flex-col items-center gap-1"
          title={reel.comments_disabled ? 'Comments turned off' : undefined}
        >
          <div className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center ${reel.comments_disabled ? 'text-white/30' : 'text-white'}`}>
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

        <button onClick={handleSave} className="flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center ${saved ? 'text-yellow-400' : 'text-white'}`}>
            <Bookmark className="w-6 h-6" fill={saved ? 'currentColor' : 'none'} />
          </div>
          <span className="text-white text-xs">Save</span>
        </button>

        <button onClick={() => setShowMenu(true)}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* ── Three-dot menu (bottom sheet) ── */}
      {showMenu && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl p-4 space-y-1"
            onClick={e => e.stopPropagation()}>
            {menuItems.map(item => (
              <button key={item.label} onClick={item.action}
                className={`w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition flex items-center gap-3 ${
                  item.danger ? 'text-red-400' : 'text-white'
                }`}>
                <item.icon className={`w-5 h-5 ${item.danger ? 'text-red-400' : 'text-white/60'}`} />
                {item.label}
              </button>
            ))}
            <button onClick={() => setShowMenu(false)}
              className="w-full text-center px-4 py-3 text-white/40 text-sm mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments drawer */}
      {showComments && <CommentsDrawer reel={reel} onClose={() => setShowComments(false)} />}

      {/* Upload modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => {}} />}

      {/* Edit caption modal */}
      {showEditCaption && (
        <EditCaptionModal
          reel={reel}
          onClose={() => setShowEditCaption(false)}
          onSaved={(newCaption) => setReel(r => ({ ...r, content: newCaption }))}
        />
      )}

      {/* Insights panel */}
      {showInsights && <InsightsPanel reel={reel} onClose={() => setShowInsights(false)} />}

      {/* Report sheet */}
      {showReport && <ReportSheet onClose={() => setShowReport(false)} />}
    </div>
  )
}

// ─── Main Reels Page ──────────────────────────────────────────────────────────
export default function Reels() {
  const [allReels, setAllReels] = useState([])
  const [hiddenIds, setHiddenIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inVideoCampaigns, setInVideoCampaigns] = useState([])
  const containerRef = useRef(null)
  const videoRefsMap = useRef({})
  const observerRef = useRef(null)

  const reels = allReels.filter(r => !hiddenIds.has(r.id))

  const handleHide = useCallback((id) => {
    setHiddenIds(prev => new Set([...prev, id]))
  }, [])

  const videoRefsCallback = useCallback((index, ref) => {
    videoRefsMap.current[index] = ref
  }, [])

  // Fetch active in-video ad campaigns once on page load
  useEffect(() => {
    getInVideoCampaigns().then(setInVideoCampaigns).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const fetchReels = async () => {
      try {
        const { data } = await supabase.from('posts')
          .select('*')
          .eq('media_type', 'video')
          .order('created_at', { ascending: false })
          .limit(20)

        const seed = Date.now() + Math.random() * 10000

        // Build personalization signals if user is logged in
        let signals = {}
        if (user?.id) {
          const [{ data: follows }, { data: likedReels }] = await Promise.all([
            supabase.from('follows').select('following_id').eq('follower_id', user.id),
            supabase.from('likes').select('post_id').eq('user_id', user.id).limit(50),
          ])
          signals.followedCreators = new Set((follows || []).map(f => f.following_id))
          signals.likedReelIds = new Set((likedReels || []).map(l => l.post_id))
        }

        const randomized = data?.length ? shuffleReels(data, seed, signals) : SAMPLE_REELS
        setAllReels(randomized)
      } catch {
        setAllReels(SAMPLE_REELS)
      } finally {
        setLoading(false)
      }
    }
    fetchReels()
    const t = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(t)
  }, [user?.id])

  // IntersectionObserver — play visible video, pause others
  useEffect(() => {
    if (loading || reels.length === 0) return
    const timer = setTimeout(() => {
      observerRef.current?.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const idx = parseInt(entry.target.dataset.index, 10)
          const vidRef = videoRefsMap.current[idx]
          const video = vidRef?.current
          if (entry.isIntersecting) {
            setCurrentIndex(idx)
            if (video) { video.currentTime = 0; video.play().catch(() => {}) }
          } else {
            if (video) { video.pause(); video.currentTime = 0 }
          }
        })
      }, { threshold: 0.7 })
      containerRef.current?.querySelectorAll('[data-index]').forEach(el => {
        observerRef.current.observe(el)
      })
    }, 100)
    return () => { clearTimeout(timer); observerRef.current?.disconnect() }
  }, [loading, reels])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = e => {
      const container = containerRef.current
      if (!container) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        container.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * window.innerHeight, behavior: 'smooth' })
      }
      if (e.key === ' ') {
        e.preventDefault()
        const vid = videoRefsMap.current[currentIndex]?.current
        if (!vid) return
        vid.paused ? vid.play().catch(() => {}) : vid.pause()
      }
      if (e.key === 'm' || e.key === 'M') setIsMuted(m => !m)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex])

  // Sync mute to all videos
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
    <div ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {reels.map((reel, index) => (
        <ReelSlide
          key={reel.id}
          reel={reel}
          index={index}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(m => !m)}
          videoRefsCallback={videoRefsCallback}
          onActivate={setCurrentIndex}
          onHide={handleHide}
          inVideoCampaigns={inVideoCampaigns}
        />
      ))}
    </div>
  )
}
