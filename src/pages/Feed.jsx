import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CREATOR_REVENUE_SHARE, PLATFORM_REVENUE_SHARE, coinsToUSD } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMode } from '../context/ModeContext'
import { formatDistanceToNow } from 'date-fns'
import {
  Heart, MessageCircle, Share2, Image as ImageIcon, Video as VideoIcon,
  Send, Loader2, MoreHorizontal, Trash2, Bold, Italic, Smile, X, Plus,
  Bookmark, Repeat2, Eye, MapPin, Globe, Users, Lock, Flag,
  Copy, BookOpen, MessageSquare,
  UserPlus, Hash, Calendar, ChevronRight, Edit3, Film, Sparkles, ArrowRight,
  ExternalLink, Megaphone, ShoppingBag, Tag,
} from 'lucide-react'
import EmojiPickerButton, { insertAtCursor } from '../components/EmojiPickerButton'
import { useNavigate, Link } from 'react-router-dom'
import MediaEditor from '@/components/editor/MediaEditor'
import { useMusic } from '../context/MusicContext'
import SpotlightBanner from '../components/SpotlightBanner'
import SpotlightBadge from '../components/SpotlightBadge'
import SkeletonFeed from '../components/SkeletonFeed'
import { fetchWithCache } from '../lib/queryCache'
import LivesRow from '../components/LivesRow'
import GoLiveModal from '../components/GoLiveModal'
import CelebrationsRow from '../components/celebrations/CelebrationsRow'
import ErrorBoundary from '../components/ErrorBoundary'
import ProductTagPicker from '../components/shop/ProductTagPicker'
import TaggedProductsDrawer from '../components/shop/TaggedProductsDrawer'

// ── In-feed Sponsored Ad Card ─────────────────────────────────────────────────
function SponsoredCard({ ad, viewerId }) {
  const cardRef = useRef(null)
  const tracked = useRef(false)
  const [showWhy, setShowWhy] = useState(false)

  useEffect(() => {
    if (!ad?.adId || tracked.current) return
    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && !tracked.current) {
        tracked.current = true
        observer.disconnect()
        await supabase.from('ad_impressions').insert({
          ad_type: ad.adType,
          ad_id: ad.adId,
          viewer_id: viewerId || null,
        })
        const table = ad.adType === 'campaign' ? 'ad_campaigns' : 'boosted_posts'
        const idCol = ad.adType === 'campaign' ? 'id' : 'id'
        await supabase.from(table).update({
          impressions_served: (ad.impressions_served || 0) + 1,
        }).eq(idCol, ad.adType === 'campaign' ? ad.adId : ad.boostId || ad.adId)
      }
    }, { threshold: 0.6 })
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [ad?.adId, viewerId])

  const handleCTAClick = async () => {
    await supabase.from('ad_impressions')
      .update({ clicked: true })
      .eq('ad_id', ad.adId)
      .eq('viewer_id', viewerId || null)
    const table = ad.adType === 'campaign' ? 'ad_campaigns' : 'boosted_posts'
    const targetId = ad.adType === 'campaign' ? ad.adId : (ad.boostId || ad.adId)
    await supabase.from(table).update({ clicks: (ad.clicks || 0) + 1 }).eq('id', targetId)
    if (ad.cta_url) window.open(ad.cta_url, '_blank', 'noopener noreferrer')
  }

  const displayName = ad.author_name || ad.advertiser_name || 'Sponsored'
  const displayAvatar = ad.author_avatar || null
  const displayContent = ad.content ? ad.content.replace(/<[^>]+>/g, '') : (ad.description || '')
  const displayImage = ad.image_url || (Array.isArray(ad.media_urls) ? ad.media_urls[0] : null)

  return (
    <div ref={cardRef} className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {displayAvatar
              ? <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
              : <Megaphone className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">Sponsored</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowWhy(v => !v)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            Why am I seeing this?
          </button>
          {showWhy && (
            <div className="absolute right-0 top-5 z-20 w-52 bg-popover border border-border rounded-xl shadow-xl p-3 text-xs text-muted-foreground">
              This is a paid promotion on Philomni.
              <button onClick={() => setShowWhy(false)} className="ml-1 text-primary hover:underline">Dismiss</button>
            </div>
          )}
        </div>
      </div>

      {displayImage && (
        <img src={displayImage} alt={ad.title} className="w-full max-h-72 object-cover mt-2" />
      )}

      <div className="px-4 py-3">
        {ad.title && <p className="font-semibold text-foreground text-sm mb-1">{ad.title}</p>}
        {displayContent && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-3">{displayContent}</p>
        )}
        {ad.cta_url && (
          <button onClick={handleCTAClick}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            {ad.cta_text || 'Learn More'} <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

const EMOJIS = {
  Smileys: ['😀','😂','😍','🥰','😎','😢','😡','🤔','😴','🥳','😅','🤣','😇','🙄','😤','🫠','🥹','😌','🤩','😏'],
  Hearts:  ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💓','💗','💖','💝','💘','🫶','❤️‍🔥','💔','🩷','🩵'],
  Hands:   ['👏','🙌','👍','👎','🤝','🙏','👋','🤞','✌️','🤟','💪','🫶','👌','🤌','👀','🫡','🤙','🖖','✋','🤚'],
  Animals: ['🐶','🐱','🦊','🐼','🦁','🐯','🦋','🐝','🦄','🐸','🦆','🐧','🦅','🐬','🦓','🐺','🦝','🦋','🐙','🦈'],
  Food:    ['🍕','🍔','🌮','🍜','🍣','🍩','🎂','🍓','🥑','🍊','☕','🧃','🍷','🥂','🍾','🥐','🍦','🧁','🍫','🥗'],
  Travel:  ['✈️','🚀','🌍','🏖️','🗼','🎡','🏔️','🌅','🗺️','🧳','🚗','🛳️','🎭','🏟️','🌃','🗽','🏰','🌋','🏝️','🎪'],
  Objects: ['💻','📱','🎵','🎬','📸','💡','🔥','⚡','🎯','🏆','💎','🎁','📚','🔑','🪄','🎮','🎨','🎤','📡','🛸'],
}

const MAX_CHARS = 2000

const TEXT_STORY_GRADIENTS = [
  { label: 'Violet',  style: 'linear-gradient(135deg, #7c3aed, #4f46e5)' },
  { label: 'Sunset',  style: 'linear-gradient(135deg, #f97316, #db2777)' },
  { label: 'Ocean',   style: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
  { label: 'Emerald', style: 'linear-gradient(135deg, #10b981, #3b82f6)' },
  { label: 'Rose',    style: 'linear-gradient(135deg, #f43f5e, #f97316)' },
  { label: 'Dark',    style: 'linear-gradient(135deg, #1e293b, #334155)' },
]

const PLATFORMS = [
  { name: 'WhatsApp', icon: '💬', color: '#25D366', getUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent((text ? text + '\n' : '') + url)}` },
  { name: 'Twitter/X', icon: '🐦', color: '#1DA1F2', getUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}` },
  { name: 'Facebook', icon: '📘', color: '#1877F2', getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: 'Telegram', icon: '✈️', color: '#0088CC', getUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}` },
  { name: 'TikTok', icon: '🎵', color: '#000000', getUrl: (url) => `https://www.tiktok.com/` },
  { name: 'Instagram', icon: '📸', color: '#E1306C', getUrl: () => `https://www.instagram.com/` },
]

// ─── Gifts ───────────────────────────────────────────────────────────────────

const GIFTS = [
  { id: 'rose',     emoji: '🌹', name: 'Rose',     cost: 1    },
  { id: 'heart',    emoji: '❤️', name: 'Heart',    cost: 5    },
  { id: 'star',     emoji: '⭐', name: 'Star',     cost: 10   },
  { id: 'fire',     emoji: '🔥', name: 'Fire',     cost: 20   },
  { id: 'crown',    emoji: '👑', name: 'Crown',    cost: 50   },
  { id: 'diamond',  emoji: '💎', name: 'Diamond',  cost: 100  },
  { id: 'rocket',   emoji: '🚀', name: 'Rocket',   cost: 200  },
  { id: 'galaxy',   emoji: '🌌', name: 'Galaxy',   cost: 500  },
  { id: 'philomni', emoji: '✨', name: 'Philomni', cost: 1000 },
  { id: 'legend',   emoji: '🏆', name: 'Legend',   cost: 5000 },
]

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

async function uploadToStorage(file) {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const { data, error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(data.path)
  return publicUrl
}

function fmtCount(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none whitespace-nowrap">
      ✅ {message}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 10, className = '' }) {
  const sz = `w-${size} h-${size}`
  return (
    <div className={`${sz} rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary flex-shrink-0 overflow-hidden ${className}`}>
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (name?.[0]?.toUpperCase() ?? '?')}
    </div>
  )
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }) {
  const [cat, setCat] = useState('Smileys')
  const ref = useRef()
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  return (
    <div ref={ref} className="absolute bottom-10 left-0 z-50 bg-card border border-border rounded-2xl shadow-2xl w-80 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-border px-2 pt-2 gap-1 no-scrollbar">
        {Object.keys(EMOJIS).map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap flex-shrink-0 transition-all ${cat === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0 p-2 max-h-52 overflow-y-auto">
        {EMOJIS[cat].map(e => (
          <button key={e} onClick={() => onSelect(e)}
            className="text-xl p-1.5 hover:bg-muted rounded-lg transition-all aspect-square flex items-center justify-center">
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ post, currentUser, onClose }) {
  const [copied, setCopied] = useState(false)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [storyCaption, setStoryCaption] = useState('')
  const [storyLoading, setStoryLoading] = useState(false)
  const [toast, setToast] = useState('')
  const url = `${window.location.origin}/post/${post.id}`
  const text = post.content?.replace(/<[^>]+>/g, '').slice(0, 100) ?? ''
  const postImage = post.media_type !== 'video' ? post.media_urls?.[0] ?? null : null

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openPlatform = (platform) => {
    window.open(platform.getUrl(url, text), '_blank', 'noopener,noreferrer,width=600,height=400')
  }

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Check this out on Philomni', text, url }).catch(() => {})
    } else {
      copyLink()
    }
  }

  const handleAddToStory = async () => {
    if (!currentUser) return
    setStoryLoading(true)
    try {
      // Get the actual media URL (first item in array)
      const mediaUrl = post.media_urls?.[0] ?? null
      // Detect video by media_type field or by URL extension
      const isVideo = post.media_type === 'video' ||
        /\.(mp4|mov|webm|avi)(\?|$)/i.test(mediaUrl ?? '')
      const { error } = await supabase.from('statuses').insert({
        media_url:  mediaUrl,
        media_type: mediaUrl ? (isVideo ? 'video' : 'image') : null,
        caption:    storyCaption || text.slice(0, 200),
        created_by: currentUser.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      })
      if (error) console.error('Story share error:', error.message)
      setShowStoryModal(false)
      setToast('Added to your story!')
      setTimeout(() => { onClose() }, 2000)
    } catch (err) { console.error(err) }
    setStoryLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl pb-safe"
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-1 sm:hidden" />
        <div className="px-5 py-4">
          <h3 className="font-semibold text-foreground text-center mb-4">Share post</h3>

          {/* Primary actions */}
          <div className="space-y-1 mb-4">
            <button onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{copied ? '✓ Link copied!' : 'Copy link'}</p>
                <p className="text-xs text-muted-foreground">philomni.com/post/{post.id?.slice(0, 8)}</p>
              </div>
            </button>
            <button onClick={() => setShowStoryModal(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Share to Your Story</p>
                <p className="text-xs text-muted-foreground">Visible for 24 hours</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Send as Message</p>
                <p className="text-xs text-muted-foreground">Share privately with someone</p>
              </div>
            </button>
          </div>

          {/* Platform grid */}
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Share to</p>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {PLATFORMS.map(p => (
              <button key={p.name} onClick={() => openPlatform(p)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: p.color + '22' }}>
                  {p.icon}
                </div>
                <span className="text-xs text-muted-foreground truncate w-full text-center">{p.name.split('/')[0]}</span>
              </button>
            ))}
            <button onClick={nativeShare}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-2xl">
                <MoreHorizontal className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </button>
          </div>

          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
            Cancel
          </button>
        </div>
      </div>

      {/* Add to Story sub-modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowStoryModal(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 mx-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground text-center mb-4">Add to Your Story</h3>
            {/* Preview */}
            {(() => {
              const mediaUrl = post.media_urls?.[0] ?? null
              const isVideo  = post.media_type === 'video' ||
                /\.(mp4|mov|webm|avi)(\?|$)/i.test(mediaUrl ?? '')
              if (mediaUrl && isVideo) {
                return (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-black">
                    <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                  </div>
                )
              }
              if (mediaUrl) {
                return (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-black">
                    <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )
              }
              return (
                <div className="w-full h-24 rounded-xl mb-4 flex items-center justify-center text-white/90 text-sm font-medium text-center px-4"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  {text.slice(0, 80) || 'Story'}
                </div>
              )
            })()}
            <textarea
              value={storyCaption}
              onChange={e => setStoryCaption(e.target.value)}
              placeholder="Add a caption… (optional)"
              rows={2}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowStoryModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleAddToStory} disabled={storyLoading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {storyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Media Display ────────────────────────────────────────────────────────────

function MediaDisplay({ urls: rawUrls, type }) {
  const urls = parseMediaUrls(rawUrls)
  if (!urls?.length) return null
  const single = urls.length === 1

  if (type === 'video') {
    return (
      <div className="bg-black">
        <video src={urls[0]} controls className="w-full max-h-[500px] object-contain" />
      </div>
    )
  }

  return (
    <div className={`${!single ? 'grid grid-cols-2 gap-0.5' : ''} overflow-hidden bg-black`}>
      {urls.map((url, i) => (
        <div key={i} className={`relative overflow-hidden ${single ? 'max-h-[500px]' : 'h-52'}`}>
          <img src={url} alt="" className="w-full h-full object-cover object-top" />
        </div>
      ))}
    </div>
  )
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────

function StoryViewer({ storyList, startIndex = 0, onClose }) {
  const [current, setCurrent]   = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const story = storyList[current]

  // Auto-advance progress bar (5 seconds per story)
  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (current < storyList.length - 1) {
            setCurrent(c => c + 1)
            return 0
          }
          onClose()
          return 100
        }
        return p + 2 // 50 ticks × 100ms = 5 s
      })
    }, 100)
    return () => clearInterval(t)
  }, [current, storyList.length, onClose])

  // Reset progress whenever the story index changes
  useEffect(() => { setProgress(0) }, [current])

  if (!story) return null

  const goBack = () => {
    if (current > 0) { setCurrent(c => c - 1) } else { onClose() }
  }
  const goNext = () => {
    if (current < storyList.length - 1) { setCurrent(c => c + 1) } else { onClose() }
  }

  const name   = story._user?.full_name ?? 'User'
  const avatar = story._user?.avatar_url ?? null

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col select-none">
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-3 pb-1 flex-shrink-0">
        {storyList.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                transition: i === current ? 'none' : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center flex-shrink-0">
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-white text-sm font-bold">{name[0]}</span>}
        </div>
        <span className="text-white text-sm font-semibold">{name}</span>
        <span className="text-white/50 text-xs ml-auto">
          {story.created_at ? new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
        <button onClick={onClose} className="ml-2 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content + tap zones */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Tap left → prev */}
        <div className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goBack} />
        {/* Tap right → next */}
        <div className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer" onClick={goNext} />

        {story.media_url ? (
          story.media_type === 'video'
            ? <video src={story.media_url} autoPlay loop playsInline className="max-h-full max-w-full object-contain" />
            : <img src={story.media_url} alt="story" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-10"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
            <p className="text-white text-2xl font-bold text-center leading-snug drop-shadow-lg">
              {story.caption || ''}
            </p>
          </div>
        )}

        {/* Caption overlay (only when there is media too) */}
        {story.caption && story.media_url && (
          <div className="absolute bottom-8 left-4 right-4 z-20 pointer-events-none">
            <p className="text-white text-base font-medium text-center drop-shadow-lg bg-black/40 rounded-2xl px-4 py-3 backdrop-blur-sm">
              {story.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Story Options Modal ──────────────────────────────────────────────────────

function StoryOptionsModal({ onPickFile, onTextStory, onClose }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-xs bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl pb-safe mx-auto"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-1 sm:hidden" />
        <div className="px-5 py-5 space-y-3">
          <h3 className="font-bold text-foreground text-center mb-4">Create a Story</h3>
          <button
            onClick={onPickFile}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-muted transition-colors text-left border border-border">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl flex-shrink-0">📷</div>
            <div>
              <p className="text-sm font-semibold text-foreground">Photo or Video</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload from your device</p>
            </div>
          </button>
          <button
            onClick={onTextStory}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-muted transition-colors text-left border border-border">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl flex-shrink-0">✏️</div>
            <div>
              <p className="text-sm font-semibold text-foreground">Text Story</p>
              <p className="text-xs text-muted-foreground mt-0.5">Write something with a colourful background</p>
            </div>
          </button>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors mt-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Text Story Creator ───────────────────────────────────────────────────────

function TextStoryCreator({ currentUser, onDone, onClose }) {
  const [text, setText]           = useState('')
  const [gradientIdx, setGradientIdx] = useState(0)
  const [fontSize, setFontSize]   = useState(32)
  const [align, setAlign]         = useState('center') // left | center | right
  const [saving, setSaving]       = useState(false)

  const gradient = TEXT_STORY_GRADIENTS[gradientIdx]

  // Word-wrap helper for canvas
  const wrapText = (ctx, str, x, y, maxW, lineH) => {
    const words = str.split(' ')
    let line = ''
    let curY = y
    for (let i = 0; i < words.length; i++) {
      const test = line + (line ? ' ' : '') + words[i]
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, curY)
        line = words[i]
        curY += lineH
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, x, curY)
    return curY
  }

  const handlePost = async () => {
    if (!text.trim() || !currentUser) return
    setSaving(true)
    try {
      // Render onto a 1080×1920 canvas
      const W = 1080, H = 1920
      const canvas = document.createElement('canvas')
      canvas.width  = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      // Background gradient
      const grd = ctx.createLinearGradient(0, 0, W, H)
      // Parse the two-stop gradient from the style string
      const stops = gradient.style.match(/#[0-9a-fA-F]{3,8}/g) ?? ['#7c3aed', '#4f46e5']
      grd.addColorStop(0, stops[0])
      grd.addColorStop(1, stops[1] ?? stops[0])
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, W, H)

      // Text
      const scale = W / 390               // map phone-width px → canvas px
      const canvasFontSize = fontSize * scale
      ctx.font        = `bold ${canvasFontSize}px sans-serif`
      ctx.fillStyle   = '#ffffff'
      ctx.textAlign   = align
      ctx.textBaseline = 'middle'
      const padding = W * 0.08
      const textX = align === 'left' ? padding : align === 'right' ? W - padding : W / 2
      const maxWidth = W - padding * 2
      const lineH = canvasFontSize * 1.35
      // Start vertically centred
      const lines = text.split('\n')
      const totalH = lines.length * lineH
      let startY = (H - totalH) / 2

      for (const line of lines) {
        startY = wrapText(ctx, line, textX, startY, maxWidth, lineH) + lineH
      }

      // Convert to blob → File → upload
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
      const file = new File([blob], `text-story-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const url  = await uploadToStorage(file)

      const { data, error } = await supabase.from('statuses').insert({
        media_url:  url,
        media_type: 'image',
        caption:    text.slice(0, 200),
        created_by: currentUser.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }).select().single()

      if (error) { console.error('Text story error:', error.message); setSaving(false); return }
      onDone(data)
    } catch (err) { console.error(err); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[160] flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <p className="text-white text-sm font-semibold">Text Story</p>
        <button
          onClick={handlePost}
          disabled={!text.trim() || saving}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
        </button>
      </div>

      {/* Preview */}
      <div
        className="flex-1 flex items-center justify-center px-8 cursor-text"
        style={{ background: gradient.style }}
        onClick={() => document.getElementById('text-story-input')?.focus()}
      >
        <textarea
          id="text-story-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start typing…"
          className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none resize-none text-center leading-snug"
          style={{
            fontSize: `${fontSize}px`,
            textAlign: align,
            fontWeight: 700,
            border: 'none',
            caretColor: 'white',
          }}
          rows={8}
        />
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-black/80 px-4 py-4 space-y-3">
        {/* Gradient swatches */}
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs w-16">Background</span>
          <div className="flex gap-2">
            {TEXT_STORY_GRADIENTS.map((g, i) => (
              <button
                key={g.label}
                onClick={() => setGradientIdx(i)}
                className={`w-7 h-7 rounded-full transition-all ${gradientIdx === i ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-110' : ''}`}
                style={{ background: g.style }}
                title={g.label}
              />
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs w-16">Size</span>
          <input
            type="range" min={18} max={60} step={2}
            value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-white/60 text-xs w-6 text-right">{fontSize}</span>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs w-16">Align</span>
          {['left','center','right'].map(a => (
            <button
              key={a}
              onClick={() => setAlign(a)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${align === a ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Stories Bar ──────────────────────────────────────────────────────────────

function StoriesBar({ currentUser }) {
  const [allStories, setAllStories]     = useState([])
  const [viewerList,  setViewerList]    = useState(null)
  const [viewerStart, setViewerStart]   = useState(0)
  const [uploading,  setUploading]      = useState(false)
  const [toast,      setToast]          = useState('')
  const [showOptions,    setShowOptions]    = useState(false)
  const [showTextCreator, setShowTextCreator] = useState(false)
  const fileRef = useRef()

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchStories = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('statuses')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(60)
    if (!data?.length) { setAllStories([]); return }
    // Enrich with user profiles
    const ids = [...new Set(data.map(s => s.created_by).filter(Boolean))]
    const { data: users } = ids.length
      ? await supabase.from('users').select('id, full_name, avatar_url').in('id', ids)
      : { data: [] }
    const userMap = {}
    ;(users ?? []).forEach(u => { userMap[u.id] = u })
    setAllStories(data.map(s => ({ ...s, _user: userMap[s.created_by] ?? null })))
  }, [])

  useEffect(() => { fetchStories() }, [fetchStories])

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return
    setUploading(true)
    try {
      const url = await uploadToStorage(file)
      const payload = {
        media_url:  url,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        caption:    '',
        created_by: currentUser.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      const { data, error } = await supabase.from('statuses').insert(payload).select().single()
      if (error) console.error('Story insert error:', error.message)
      if (data) {
        const enriched = {
          ...data,
          _user: { id: currentUser.id, full_name: currentUser.full_name, avatar_url: currentUser.avatar_url },
        }
        setAllStories(prev => [enriched, ...prev])
        setToast('Story added!')
      }
    } catch (err) { console.error(err) }
    setUploading(false)
    e.target.value = ''
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const myStories    = allStories.filter(s => s.created_by === currentUser?.id)
  const hasMyStory   = myStories.length > 0
  const myAvatar     = currentUser?.avatar_url ?? null
  const myInitial    = currentUser?.full_name?.[0] ?? '+'

  // Group others by user, preserving first-seen order
  const otherGroups = useMemo(() => {
    const seen = new Map()
    allStories
      .filter(s => s.created_by !== currentUser?.id)
      .forEach(s => {
        if (!seen.has(s.created_by)) seen.set(s.created_by, [])
        seen.get(s.created_by).push(s)
      })
    return [...seen.values()]
  }, [allStories, currentUser?.id])

  // ── Open viewer helpers ────────────────────────────────────────────────────
  const openMyStories = () => {
    if (hasMyStory) { setViewerList(myStories); setViewerStart(0) }
    else setShowOptions(true)
  }

  const handlePickFile = () => {
    setShowOptions(false)
    fileRef.current?.click()
  }

  const handleOpenTextCreator = () => {
    setShowOptions(false)
    setShowTextCreator(true)
  }

  const handleTextStoryDone = (data) => {
    setShowTextCreator(false)
    if (data) {
      const enriched = {
        ...data,
        _user: { id: currentUser.id, full_name: currentUser.full_name, avatar_url: currentUser.avatar_url },
      }
      setAllStories(prev => [enriched, ...prev])
      setToast('Text story posted!')
    }
  }

  const openOtherGroup = (group) => {
    setViewerList(group)
    setViewerStart(0)
  }

  const getGroupAvatar = g => g[0]?._user?.avatar_url ?? null
  const getGroupName   = g => g[0]?._user?.full_name ?? 'User'

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {/* ── My story circle ── */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <button
              onClick={openMyStories}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                hasMyStory
                  ? 'p-0.5 bg-gradient-to-tr from-purple-600 to-pink-500'
                  : 'border-2 border-dashed border-border'
              }`}
            >
              <div className="w-full h-full rounded-full bg-muted overflow-hidden flex items-center justify-center border-2 border-background">
                {myAvatar
                  ? <img src={myAvatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xl font-bold text-primary">{myInitial}</span>}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
            </button>
            {/* "+" add button — always visible; shows options modal */}
            <button
              onClick={e => { e.stopPropagation(); setShowOptions(true) }}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center z-10 hover:bg-primary/80 transition-colors"
            >
              <Plus className="w-3 h-3 text-white" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground w-16 text-center truncate">Your story</span>
        </div>

        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

        {/* ── Other users' story circles ── */}
        {otherGroups.map((group, i) => (
          <button
            key={group[0]?.id ?? i}
            onClick={() => openOtherGroup(group)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 to-pink-500">
              <div className="w-full h-full rounded-full bg-muted overflow-hidden flex items-center justify-center border-2 border-background">
                {getGroupAvatar(group)
                  ? <img src={getGroupAvatar(group)} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-primary">{getGroupName(group)[0] ?? '?'}</span>}
              </div>
            </div>
            <span className="text-xs text-muted-foreground w-16 text-center truncate">
              {getGroupName(group).split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Story viewer ── */}
      {viewerList && (
        <StoryViewer
          storyList={viewerList}
          startIndex={viewerStart}
          onClose={() => { setViewerList(null); setViewerStart(0) }}
        />
      )}

      {/* ── Story options modal ── */}
      {showOptions && (
        <StoryOptionsModal
          onPickFile={handlePickFile}
          onTextStory={handleOpenTextCreator}
          onClose={() => setShowOptions(false)}
        />
      )}

      {/* ── Text story creator ── */}
      {showTextCreator && (
        <TextStoryCreator
          currentUser={currentUser}
          onDone={handleTextStoryDone}
          onClose={() => setShowTextCreator(false)}
        />
      )}
    </>
  )
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function CommentSection({ postId, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const commentInputRef = useRef(null)

  useEffect(() => {
    supabase.from('comments').select('*').eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setComments(data ?? []); setLoaded(true) })
  }, [postId])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() || !currentUser) return
    setSending(true)
    const { data } = await supabase.from('comments').insert({
      post_id: postId,
      content: text.trim(),
      author_id: currentUser.id,
      author_name: currentUser.full_name ?? currentUser.email,
      author_avatar: currentUser.avatar_url ?? null,
      created_at: new Date().toISOString(),
    }).select().single()
    if (data) { setComments(c => [...c, data]); onCommentAdded?.() }
    setText('')
    setSending(false)
  }

  return (
    <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/10">
      {!loaded ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No comments yet — be the first!</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar src={c.author_avatar} name={c.author_name} size={7} />
            <div className="flex-1 bg-card rounded-2xl px-3 py-2.5 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-foreground">{c.author_name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}
                </p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{c.content}</p>
            </div>
          </div>
        ))
      )}
      {currentUser && (
        <form onSubmit={submit} className="flex gap-2 pt-1">
          <Avatar src={currentUser?.avatar_url} name={currentUser?.full_name} size={7} />
          <div className="flex-1 flex gap-2">
            <div className="flex-1 flex items-center bg-card border border-border rounded-2xl px-3 min-w-0">
              <input
                ref={commentInputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write a comment…"
                className="flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0" />
              <EmojiPickerButton
                onEmojiSelect={(emoji) => insertAtCursor(text, setText, commentInputRef, emoji)}
                pickerSide="right"
              />
            </div>
            <button type="submit" disabled={sending || !text.trim()}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex-shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Gift Panel (post gift picker popup) ─────────────────────────────────────

function GiftPanel({ post, currentUser, onClose, onGiftSent, anchorRect }) {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(null)
  const [sending, setSending] = useState(null)
  const [error, setError] = useState('')
  const ref = useRef()

  useEffect(() => {
    if (!currentUser?.id) return
    supabase.from('users').select('coin_balance, coins_balance').eq('id', currentUser.id).single()
      .then(({ data }) => setBalance(data?.coins_balance ?? data?.coin_balance ?? 0))
  }, [currentUser?.id])

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  const PANEL_GIFTS = GIFTS.slice(0, 6)

  const handleSend = async (gift) => {
    if (!currentUser) return
    if (balance < gift.cost) {
      setError(`Need ${(gift.cost - balance).toLocaleString()} more coins`)
      return
    }
    setSending(gift.id)
    setError('')
    try {
      const creatorId       = post.created_by || post.author_id
      const creatorCoins    = Math.floor(gift.cost * CREATOR_REVENUE_SHARE)  // 70%
      const platformCoins   = gift.cost - creatorCoins                        // 30%
      const creatorEarnings = coinsToUSD(creatorCoins)                        // USD
      const platformUSD     = coinsToUSD(platformCoins)                       // USD

      // 1. Deduct coins from sender via SECURITY DEFINER RPC (bypasses RLS)
      const { data: deducted, error: deductErr } = await supabase
        .rpc('deduct_coins', { p_user_id: currentUser.id, p_coins: gift.cost })
      if (deductErr) throw new Error(`deduct_coins: ${deductErr.message}`)
      if (!deducted) {
        setError('Not enough coins')
        setSending(null)
        return
      }

      // 2. Insert gift record (gift_id is TEXT — store the slug)
      const { data: giftRow, error: giftErr } = await supabase.from('post_gifts').insert({
        post_id:          post.id,
        sender_id:        currentUser.id,
        creator_id:       creatorId,
        gift_id:          gift.id,
        gift_name:        gift.name,
        gift_emoji:       gift.emoji,
        coin_cost:        gift.cost,
        usd_value:        coinsToUSD(gift.cost),
        creator_earnings: creatorEarnings,
      }).select('id').single()
      if (giftErr) console.error('[GiftPanel] post_gifts insert error:', giftErr)

      // 3. Record platform 30% cut via SECURITY DEFINER RPC
      await supabase.rpc('record_platform_revenue', {
        p_source_type:   'gift',
        p_source_id:     giftRow?.id ?? null,
        p_gross_amount:  gift.cost,
        p_platform_cut:  platformCoins,
        p_sender_id:     currentUser.id,
        p_recipient_id:  creatorId ?? null,
      }).then(({ error: e }) => { if (e) console.error('[GiftPanel] platform_revenue error:', e) })

      // 4. Credit creator 70% via add_coins RPC + wallet earnings
      if (creatorId && creatorId !== currentUser.id) {
        await supabase.rpc('add_coins', { p_user_id: creatorId, p_coins: creatorCoins })
          .then(({ error: e }) => { if (e) console.error('[GiftPanel] add_coins creator error:', e) })

        // Increment creator available_balance_usd + total_earned_usd (SECURITY DEFINER)
        await supabase.rpc('increment_creator_balance', {
          p_user_id:    creatorId,
          p_amount_usd: creatorEarnings,
        }).then(({ error: e }) => { if (e) console.error('[GiftPanel] increment_creator_balance error:', e) })

        // Also update wallets table for legacy transaction history
        const { data: walletRow } = await supabase
          .from('wallets').select('balance, total_earned').eq('user_id', creatorId).single()
        if (walletRow) {
          await supabase.from('wallets')
            .update({
              balance:      (walletRow.balance     || 0) + creatorEarnings,
              total_earned: (walletRow.total_earned || 0) + creatorEarnings,
            })
            .eq('user_id', creatorId)
            .then(({ error: e }) => { if (e) console.error('[GiftPanel] wallet update error:', e) })
        }

        // 5. Notification — correct column names for notifications table
        await supabase.from('notifications').insert({
          user_id:      creatorId,
          type:         'gift',
          content:      `${currentUser.full_name || 'Someone'} sent you ${gift.emoji} ${gift.name} (+${creatorCoins} coins / $${creatorEarnings.toFixed(2)})`,
          reference_id: post.id,
          is_read:      false,
          created_by:   currentUser.id,
          created_at:   new Date().toISOString(),
        }).then(({ error: e }) => { if (e) console.error('[GiftPanel] notification error:', e) })
      }

      setBalance(b => b - gift.cost)
      onGiftSent(gift)
      onClose()
    } catch (err) {
      console.error('[GiftPanel] send error:', err)
      setError(err.message || 'Failed to send gift. Try again.')
    }
    setSending(null)
  }

  // Fixed positioning anchored to the gift button — escapes the post card's
  // overflow-hidden, which previously clipped the popup. Opens above the button,
  // clamped to stay on-screen horizontally.
  const PANEL_W = 288 // w-72
  const style = anchorRect
    ? {
        position: 'fixed',
        left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - PANEL_W - 8)),
        bottom: Math.max(8, window.innerHeight - anchorRect.top + 8),
      }
    : { position: 'fixed', left: 8, bottom: 8 }

  return (
    <div ref={ref} style={style}
      className="z-[60] bg-card border border-border rounded-2xl shadow-2xl w-72 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <p className="text-sm font-bold text-foreground">Send a Gift</p>
        <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
          🪙 {balance === null ? '…' : balance.toLocaleString()}
        </span>
      </div>

      {balance === 0 ? (
        <div className="px-4 py-5 text-center">
          <div className="text-3xl mb-2">🪙</div>
          <p className="text-sm font-semibold text-foreground mb-1">No coins yet</p>
          <p className="text-xs text-muted-foreground mb-3">Buy coins to show love to creators</p>
          <button
            onClick={() => navigate('/coins')}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            🪙 Buy Coins
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 p-3">
            {PANEL_GIFTS.map(gift => {
              const canAfford = balance === null || balance >= gift.cost
              return (
                <button
                  key={gift.id}
                  onClick={() => handleSend(gift)}
                  disabled={sending !== null || !canAfford}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                    !canAfford
                      ? 'opacity-40 cursor-not-allowed border-border/30 bg-muted/20'
                      : 'border-border/50 hover:border-primary/60 hover:bg-primary/5 active:scale-95'
                  }`}
                >
                  {sending === gift.id
                    ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    : <span className="text-xl">{gift.emoji}</span>
                  }
                  <span className="text-[10px] font-medium text-foreground leading-tight">{gift.name}</span>
                  <span className="text-[10px] font-bold text-amber-500">🪙 {gift.cost}</span>
                </button>
              )
            })}
          </div>

          {error && (
            <p className="px-4 pb-2 text-xs text-destructive text-center font-medium">{error}</p>
          )}

          <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border/30">
            <button
              onClick={() => navigate('/coins')}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Buy Coins
            </button>
            <button
              onClick={() => navigate('/coins')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              More Gifts →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Reactions ────────────────────────────────────────────────────────────────
const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like',  color: 'text-blue-500'   },
  { type: 'love', emoji: '❤️', label: 'Love',  color: 'text-red-500'    },
  { type: 'haha', emoji: '😂', label: 'Haha',  color: 'text-yellow-500' },
  { type: 'wow',  emoji: '😮', label: 'Wow',   color: 'text-yellow-500' },
  { type: 'sad',  emoji: '😢', label: 'Sad',   color: 'text-yellow-500' },
  { type: 'fire', emoji: '🔥', label: 'Fire',  color: 'text-orange-500' },
  { type: 'clap', emoji: '👏', label: 'Clap',  color: 'text-yellow-500' },
]
const reactionByType = (t) => REACTIONS.find(r => r.type === t) ?? REACTIONS[0]

// ─── Liker Row (who-liked modal) ──────────────────────────────────────────────
// A standalone component so its hooks aren't created inside a .map() callback.
function LikerRow({ liker, currentUser, navigate, onClose }) {
  const u = liker.users
  const reaction = reactionByType(liker.reaction_type)
  const [following, setFollowing] = useState(false)
  const isMe = u && u.id === currentUser?.id

  useEffect(() => {
    if (!u || isMe || !currentUser) return
    supabase.from('follows').select('id')
      .eq('follower_id', currentUser.id).eq('following_id', u.id).maybeSingle()
      .then(({ data }) => setFollowing(!!data))
  }, [u?.id, isMe, currentUser?.id])

  if (!u) return null

  const handleFollowFromLikes = async () => {
    if (!currentUser || isMe) return
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', u.id)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: u.id })
      setFollowing(true)
    }
  }

  const goProfile = () => { navigate(`/profile/${u.id}`); onClose() }

  return (
    <div className="flex items-center gap-3">
      <button onClick={goProfile}
        className="relative w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-visible flex-shrink-0">
        <span className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
          {u.avatar_url
            ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-primary font-semibold text-sm">{u.full_name?.[0] ?? '?'}</span>}
        </span>
        <span className="absolute -bottom-1 -right-1 text-sm leading-none" title={reaction.label}>{reaction.emoji}</span>
      </button>
      <button onClick={goProfile} className="flex-1 min-w-0 text-left">
        <p className="font-medium text-foreground text-sm truncate">{u.full_name ?? u.username ?? 'User'}</p>
        <p className="text-xs text-muted-foreground truncate">
          {u.plan === 'promax' ? '⭐ Pro Max' : u.plan === 'pro' ? 'Pro' : 'Creator'}
        </p>
      </button>
      {isMe ? (
        <span className="text-xs text-muted-foreground flex-shrink-0">You</span>
      ) : (
        <button onClick={handleFollowFromLikes}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all flex-shrink-0 ${
            following
              ? 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}>
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUser, onDelete, onRepost, onUpdate, spotlightWinnerId }) {
  const navigate = useNavigate()
  // Reactions (replaces the single like). userReaction = null | reaction type string.
  const [userReaction, setUserReaction] = useState(null)
  const [reactionCounts, setReactionCounts] = useState({})
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const longPressTimer = useRef(null)
  const longPressFired = useRef(false)
  const pickerJustOpened = useRef(false)
  const liked = !!userReaction
  const [likeChecked, setLikeChecked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count ?? post.like_count ?? 0)
  const [commentCount, setCommentCount] = useState(post.comments_count ?? post.comment_count ?? 0)
  const [repostCount, setRepostCount] = useState(post.reposts_count ?? post.repost_count ?? 0)
  // Who-liked modal
  const [showLikes, setShowLikes] = useState(false)
  const [likers, setLikers] = useState([])
  const [likersLoading, setLikersLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [reposting, setReposting] = useState(false)
  const [showGiftPanel, setShowGiftPanel] = useState(false)
  const giftBtnRef = useRef(null)
  const [giftRect, setGiftRect] = useState(null)
  const [giftAnimation, setGiftAnimation] = useState(null)
  const [giftCount, setGiftCount] = useState(0)
  const [giftSummary, setGiftSummary] = useState([])
  const [showShop, setShowShop] = useState(false) // tagged-products drawer
  const taggedProducts = Array.isArray(post.tagged_products) ? post.tagged_products : []
  // View counting
  const cardRef = useRef()
  const viewedRef = useRef(false)
  // Post insights
  const [showInsights, setShowInsights] = useState(false)
  // Edit post state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState(post.content?.replace(/<[^>]+>/g, '') ?? '')
  const [editMediaUrl, setEditMediaUrl] = useState(post.media_urls?.[0] ?? null)
  const [editMediaBlob, setEditMediaBlob] = useState(null)
  const [showEditMedia, setShowEditMedia] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const menuRef = useRef()
  const repostMenuRef = useRef()
  const isOwner = currentUser?.id === post.author_id
  const postAuthorId = post.author_id || post.created_by

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false)
  const [allowReposts, setAllowReposts] = useState(post.allow_reposts !== false)
  const [showRepostMenu, setShowRepostMenu] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteText, setQuoteText] = useState('')
  const [quoting, setQuoting] = useState(false)

  useEffect(() => {
    if (!currentUser || isOwner) return
    supabase.from('follows').select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', postAuthorId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
  }, [currentUser, postAuthorId, isOwner])

  useEffect(() => {
    const fn = e => { if (repostMenuRef.current && !repostMenuRef.current.contains(e.target)) setShowRepostMenu(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleFollow = async () => {
    if (!currentUser) { navigate('/login'); return }
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUser.id).eq('following_id', postAuthorId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: postAuthorId })
      setIsFollowing(true)
    }
  }

  // Load gift summary for this post
  useEffect(() => {
    supabase
      .from('post_gifts')
      .select('gift_emoji, gift_name, coin_cost')
      .eq('post_id', post.id)
      .then(({ data }) => {
        if (!data?.length) return
        setGiftCount(data.length)
        const agg = {}
        data.forEach(g => {
          const k = g.gift_name
          if (!agg[k]) agg[k] = { emoji: g.gift_emoji, name: g.gift_name, count: 0, total: 0 }
          agg[k].count++
          agg[k].total += g.coin_cost
        })
        setGiftSummary(
          Object.values(agg).sort((a, b) => b.total - a.total).slice(0, 3)
        )
      })
  }, [post.id])

  const handleGiftSent = (gift) => {
    setGiftAnimation({ emoji: gift.emoji, name: gift.name })
    setTimeout(() => setGiftAnimation(null), 2500)
    setGiftCount(c => c + 1)
    setGiftSummary(prev => {
      const found = prev.find(g => g.name === gift.name)
      if (found) {
        return prev.map(g => g.name === gift.name ? { ...g, count: g.count + 1, total: g.total + gift.cost } : g)
      }
      return [...prev, { emoji: gift.emoji, name: gift.name, count: 1, total: gift.cost }]
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
    })
  }

  useEffect(() => {
    const fn = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Check the current user's reaction + saved state
  useEffect(() => {
    if (!currentUser) { setLikeChecked(true); return }
    supabase.from('likes').select('reaction_type').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle()
      .then(({ data }) => { if (data) setUserReaction(data.reaction_type ?? 'like'); setLikeChecked(true) })
    supabase.from('bookmarks').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle()
      .then(({ data }) => setSaved(!!data))
  }, [post.id, currentUser])

  // Aggregate reaction counts for this post
  useEffect(() => {
    supabase.from('likes').select('reaction_type').eq('post_id', post.id)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        data.forEach(r => { const t = r.reaction_type ?? 'like'; counts[t] = (counts[t] ?? 0) + 1 })
        setReactionCounts(counts)
      })
  }, [post.id])

  // Close the reaction picker on any outside click. Skip the click that
  // immediately follows the long-press that opened it (same gesture's mouseup).
  useEffect(() => {
    if (!showReactionPicker) return
    const handler = () => {
      if (pickerJustOpened.current) { pickerJustOpened.current = false; return }
      setShowReactionPicker(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showReactionPicker])

  // Increment view count when post is visible for 2 seconds
  useEffect(() => {
    if (viewedRef.current) return
    const el = cardRef.current
    if (!el) return
    let timer = null
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        timer = setTimeout(async () => {
          if (!viewedRef.current) {
            viewedRef.current = true
            await supabase.rpc('increment_views', { post_id: post.id })
          }
        }, 2000)
      } else {
        if (timer) { clearTimeout(timer); timer = null }
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => { observer.disconnect(); if (timer) clearTimeout(timer) }
  }, [post.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReaction = async (reactionType) => {
    setShowReactionPicker(false)
    if (!currentUser) { navigate('/login'); return }

    if (userReaction === reactionType) {
      // Same reaction tapped again → remove it (unlike)
      setUserReaction(null)
      setReactionCounts(prev => ({ ...prev, [reactionType]: Math.max(0, (prev[reactionType] ?? 1) - 1) }))
      setLikeCount(c => Math.max(0, c - 1))
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id)
      await supabase.from('posts').update({ likes_count: Math.max(0, likeCount - 1) }).eq('id', post.id)
      return
    }

    const isNew = !userReaction
    const oldReaction = userReaction
    setUserReaction(reactionType)

    if (isNew) {
      setLikeCount(c => c + 1)
      setReactionCounts(prev => ({ ...prev, [reactionType]: (prev[reactionType] ?? 0) + 1 }))
      await supabase.from('likes').upsert(
        { post_id: post.id, user_id: currentUser.id, created_by: currentUser.id, reaction_type: reactionType },
        { onConflict: 'post_id,user_id' },
      )
      await supabase.from('posts').update({ likes_count: likeCount + 1 }).eq('id', post.id)
    } else {
      // Changing reaction type — total count stays the same
      setReactionCounts(prev => ({
        ...prev,
        [oldReaction]:   Math.max(0, (prev[oldReaction] ?? 1) - 1),
        [reactionType]:  (prev[reactionType] ?? 0) + 1,
      }))
      await supabase.from('likes').update({ reaction_type: reactionType })
        .eq('post_id', post.id).eq('user_id', currentUser.id)
    }
  }

  // Quick tap = like/unlike; long press = reaction picker
  const handleQuickLike = () => {
    if (longPressFired.current) { longPressFired.current = false; return }
    handleReaction('like')
  }
  const handleMouseDown = () => {
    longPressFired.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      pickerJustOpened.current = true
      setShowReactionPicker(true)
    }, 500)
  }
  const handleMouseUp = () => clearTimeout(longPressTimer.current)

  const fetchLikers = async () => {
    setLikersLoading(true)
    setShowLikes(true)
    const { data } = await supabase
      .from('likes')
      .select('user_id, created_at, reaction_type')
      .eq('post_id', post.id)
      .order('created_at', { ascending: false })
      .limit(100)
    const rows = data ?? []
    const userIds = [...new Set(rows.map(l => l.user_id).filter(Boolean))]
    let profiles = []
    if (userIds.length) {
      const { data: pData } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url, plan')
        .in('id', userIds)
      profiles = pData ?? []
    }
    setLikers(rows.map(l => ({ ...l, users: profiles.find(p => p.id === l.user_id) })))
    setLikersLoading(false)
  }

  const handleSave = async () => {
    if (!currentUser) return
    const next = !saved
    setSaved(next)
    if (next) {
      await supabase.from('bookmarks').insert({ post_id: post.id, user_id: currentUser.id })
    } else {
      await supabase.from('bookmarks').delete().eq('post_id', post.id).eq('user_id', currentUser.id)
    }
  }

  const doRepost = async (text = null) => {
    if (!currentUser || reposting) return
    setReposting(true)
    try {
      const payload = {
        author_id: currentUser.id,
        created_by: currentUser.id,
        author_name: currentUser.full_name ?? currentUser.email,
        author_avatar: currentUser.avatar_url ?? null,
        author_role: currentUser.role ?? null,
        is_repost: true,
        repost_of: post.id,
        original_user_id: postAuthorId,
        repost_text: text || null,
        reposted_by: currentUser.id,
        reposted_by_name: currentUser.full_name,
        // carry original content/media so the feed can render it
        content: post.content,
        media_urls: post.media_urls,
        media_type: post.media_type,
        likes_count: 0, comments_count: 0, reposts_count: 0,
        visibility: 'public',
        created_at: new Date().toISOString(),
      }
      const { data } = await supabase.from('posts').insert(payload).select().single()
      const newCount = repostCount + 1
      setRepostCount(newCount)
      await supabase.from('posts').update({ reposts_count: newCount }).eq('id', post.id)
      if (data) onRepost?.(data)
    } catch (err) { console.error(err) }
    setReposting(false)
  }

  const handleRepost = async () => {
    setShowRepostMenu(false)
    await doRepost(null)
  }

  const handleQuoteRepost = async () => {
    if (!quoteText.trim()) return
    setQuoting(true)
    await doRepost(quoteText.trim())
    setQuoting(false)
    setShowQuoteModal(false)
    setQuoteText('')
  }

  const handleDelete = async () => {
    setShowMenu(false)
    await supabase.from('posts').delete().eq('id', post.id)
    onDelete(post.id)
  }

  const handleEditSave = async () => {
    setEditSaving(true)
    try {
      let mediaUrls = post.media_urls
      if (editMediaBlob) {
        const file = new File([editMediaBlob], 'edited-media.jpg', { type: editMediaBlob.type })
        const uploadedUrl = await uploadToStorage(file)
        mediaUrls = [uploadedUrl]
      }
      const updates = { content: editContent, media_urls: mediaUrls }
      await supabase.from('posts').update(updates).eq('id', post.id)
      setShowEditModal(false)
      setEditMediaBlob(null)
      onUpdate?.({ ...post, ...updates })
    } catch (err) {
      console.error('Edit save failed:', err)
    }
    setEditSaving(false)
  }

  const openEditModal = () => {
    setEditContent(post.content?.replace(/<[^>]+>/g, '') ?? '')
    setEditMediaUrl(post.media_urls?.[0] ?? null)
    setEditMediaBlob(null)
    setShowMenu(false)
    setShowEditModal(true)
  }

  const timestamp = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : ''

  return (
    <>
      <article ref={cardRef} className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Repost indicator */}
        {post.reposted_by_name && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
            <Repeat2 className="w-3.5 h-3.5" />
            <button onClick={() => navigate(`/profile/${post.reposted_by}`)}
              className="hover:underline font-medium">
              {post.reposted_by_name}
            </button>
            <span>{post.repost_text ? 'quoted' : 'reposted'}</span>
          </div>
        )}
        {/* Quote repost text */}
        {post.repost_text && (
          <div className="mx-4 mt-2 px-3 py-2 bg-primary/5 border-l-2 border-primary/40 rounded-r-xl">
            <p className="text-sm text-foreground">{post.repost_text}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Clickable avatar */}
            <button onClick={() => navigate(`/profile/${postAuthorId}`)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity">
              <Avatar src={post.author?.avatar_url || post.author_avatar} name={post.author?.full_name || post.author_name} size={11} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Clickable name */}
                <button onClick={() => navigate(`/profile/${postAuthorId}`)}
                  className="text-sm font-bold text-foreground leading-tight hover:underline flex items-center gap-1.5">
                  {post.author?.full_name || post.author_name || 'Creator'}
                  {spotlightWinnerId && post.author_id === spotlightWinnerId && (
                    <SpotlightBadge size="sm" />
                  )}
                </button>
                {/* Follow button — only for other users' posts */}
                {!isOwner && currentUser && (
                  <button onClick={handleFollow}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-all flex-shrink-0 ${
                      isFollowing
                        ? 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              {(post.author_role || post.author_headline) && (
                <p className="text-xs text-primary/80 leading-tight mt-0.5">{post.author_role ?? post.author_headline}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                {timestamp}
                {post.visibility === 'public' && <Globe className="w-3 h-3" />}
                {post.visibility === 'friends' && <Users className="w-3 h-3" />}
                {post.visibility === 'only_me' && <Lock className="w-3 h-3" />}
              </p>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(v => !v)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 bg-popover border border-border rounded-2xl shadow-xl py-1.5 z-20 min-w-[160px]">
                {isOwner ? (
                  <>
                    <button onClick={openEditModal}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Edit3 className="w-4 h-4 text-muted-foreground" /> Edit post
                    </button>
                    <button onClick={async () => {
                        const next = !allowReposts
                        setAllowReposts(next)
                        setShowMenu(false)
                        await supabase.from('posts').update({ allow_reposts: next }).eq('id', post.id)
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Repeat2 className="w-4 h-4 text-muted-foreground" />
                      {allowReposts ? 'Turn off reposts' : 'Turn on reposts'}
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete post
                    </button>
                  </>
                ) : (
                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                    <Flag className="w-4 h-4" /> Report post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <div className="text-sm text-foreground leading-relaxed post-content whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        )}

        {/* Gift summary — gifts received on this post */}
        {giftSummary.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-4 pb-2">
            {giftSummary.map(g => (
              <span key={g.name} className="flex items-center gap-1 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                {g.emoji} {g.name} × {g.count}
              </span>
            ))}
            <span className="text-xs text-muted-foreground">
              🪙 {giftSummary.reduce((a, c) => a + c.total, 0).toLocaleString()} coins
            </span>
          </div>
        )}

        {/* Media */}
        <MediaDisplay urls={post.media_urls} type={post.media_type} />

        {/* Tagged products — Shop this post */}
        {taggedProducts.length > 0 && (
          <button
            onClick={() => setShowShop(true)}
            className="flex items-center gap-2 w-full px-4 py-2.5 bg-primary/8 border-t border-primary/15 hover:bg-primary/12 transition-colors text-left"
          >
            <ShoppingBag className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-primary">
              Shop this post · {taggedProducts.length} product{taggedProducts.length !== 1 ? 's' : ''}
            </span>
            <span className="ml-auto flex -space-x-2">
              {taggedProducts.slice(0, 3).map((t, i) => (
                <span key={i} className="w-6 h-6 rounded-full border border-card bg-muted overflow-hidden flex items-center justify-center text-[10px]">
                  {t.image ? <img src={t.image} className="w-full h-full object-cover" alt="" /> : '🛍️'}
                </span>
              ))}
            </span>
          </button>
        )}

        {/* Music credit bar */}
        {post.music_track_meta && (
          <a
            href="/music"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 px-4 py-2 bg-primary/8 border-t border-primary/15 hover:bg-primary/12 transition-colors group"
          >
            <span className="text-sm animate-pulse">🎵</span>
            <span className="text-xs text-primary font-medium truncate">
              {post.music_track_meta.title} — {post.music_track_meta.artist || 'Philomni Originals'}
            </span>
          </a>
        )}

        {/* View count */}
        {(post.views_count ?? post.view_count) > 0 && (
          <div className="flex items-center gap-1 px-4 pt-2 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{fmtCount(post.views_count ?? post.view_count)} views</span>
          </div>
        )}

        {/* Like / comment summary */}
        {(likeCount > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t border-border/40 mt-1">
            {likeCount > 0 && (() => {
              const top = Object.entries(reactionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
                .map(([t]) => reactionByType(t).emoji)
              const emojis = top.length ? top : ['👍']
              return (
                <button onClick={fetchLikers} className="flex items-center gap-1 hover:underline">
                  <span className="flex -space-x-0.5">
                    {emojis.map((e, i) => <span key={i} className="text-base">{e}</span>)}
                  </span>
                  <span className="ml-0.5">{fmtCount(likeCount)}</span>
                </button>
              )
            })()}
            {commentCount > 0 && (
              <button onClick={() => setShowComments(v => !v)} className="hover:underline ml-auto">
                {fmtCount(commentCount)} comment{commentCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Engagement bar */}
        <div className="flex items-center border-t border-border/60 px-1">
          <div className="relative flex-1">
            {showReactionPicker && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-card border border-border rounded-full shadow-xl flex items-center gap-1 px-3 py-2"
                onClick={e => e.stopPropagation()}>
                {REACTIONS.map(r => (
                  <button key={r.type} onClick={() => handleReaction(r.type)}
                    className="text-2xl hover:scale-125 transition-transform" title={r.label}>
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
            <button
              onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown} onTouchEnd={handleMouseUp}
              onClick={handleQuickLike} disabled={!likeChecked}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all disabled:opacity-60 ${userReaction ? 'text-[#7c3aed]' : 'text-muted-foreground hover:text-[#7c3aed] hover:bg-primary/5'}`}>
              <span className="text-base">{userReaction ? reactionByType(userReaction).emoji : '👍'}</span>
              <span>{userReaction ? reactionByType(userReaction).label : 'Like'}</span>
              {likeCount > 0 && <span className="text-xs opacity-70">{fmtCount(likeCount)}</span>}
            </button>
          </div>
          <button onClick={() => setShowComments(v => !v)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${showComments ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <span className="text-base">💬</span>
            <span>Comment</span>
            {commentCount > 0 && <span className="text-xs opacity-70">{fmtCount(commentCount)}</span>}
          </button>
          <div className="relative flex-1" ref={repostMenuRef}>
            {!allowReposts ? (
              <div className="relative group flex-1 flex items-center justify-center">
                <button disabled
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-muted-foreground/40 cursor-not-allowed rounded-xl">
                  <span className="text-base">🔁</span>
                  <span>Repost</span>
                  {repostCount > 0 && <span className="text-xs opacity-70">{fmtCount(repostCount)}</span>}
                </button>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Reposts turned off
                </span>
              </div>
            ) : (
              <>
                <button onClick={() => setShowRepostMenu(v => !v)} disabled={reposting}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    showRepostMenu ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5'
                  }`}>
                  {reposting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-base">🔁</span>}
                  <span>Repost</span>
                  {repostCount > 0 && <span className="text-xs opacity-70">{fmtCount(repostCount)}</span>}
                </button>
                {showRepostMenu && (
                  <div className="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-2xl shadow-xl py-1.5 z-30 min-w-[160px]">
                    <button onClick={handleRepost}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Repeat2 className="w-4 h-4 text-emerald-500" /> Repost
                    </button>
                    <button onClick={() => { setShowRepostMenu(false); setShowQuoteModal(true) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Edit3 className="w-4 h-4 text-primary" /> Quote Repost
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <button onClick={() => setShowShare(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-blue-400 hover:bg-blue-500/5 rounded-xl transition-all">
            <span className="text-base">↗️</span>
            <span>Share</span>
          </button>
          {/* Gift button */}
          <div className="relative flex-1">
            <button
              ref={giftBtnRef}
              onClick={() => {
                if (giftBtnRef.current) {
                  const r = giftBtnRef.current.getBoundingClientRect()
                  setGiftRect({ left: r.left, top: r.top })
                }
                setShowGiftPanel(v => !v)
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                showGiftPanel
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/5'
              }`}
            >
              <span className="text-base">🎁</span>
              <span>Gift</span>
              {giftCount > 0 && <span className="text-xs opacity-70">{fmtCount(giftCount)}</span>}
            </button>
            {showGiftPanel && currentUser && (
              <GiftPanel
                post={post}
                currentUser={currentUser}
                anchorRect={giftRect}
                onClose={() => setShowGiftPanel(false)}
                onGiftSent={handleGiftSent}
              />
            )}
          </div>
          <button onClick={handleSave}
            className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${saved ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-400/5'}`}>
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Insights bar */}
        <div className="border-t border-border/40 px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">👁 {fmtCount(post.views_count ?? post.view_count ?? 0)} views</span>
          <span className="text-xs text-muted-foreground/30">·</span>
          <span className="text-xs text-muted-foreground">❤️ {fmtCount(likeCount)}</span>
          <span className="text-xs text-muted-foreground/30">·</span>
          <span className="text-xs text-muted-foreground">💬 {fmtCount(commentCount)}</span>
          <span className="text-xs text-muted-foreground/30">·</span>
          <span className="text-xs text-muted-foreground">🔁 {fmtCount(repostCount)}</span>
          <span className="text-xs text-muted-foreground/30">·</span>
          <span className="text-xs text-muted-foreground">🔖 {fmtCount(post.saves_count ?? post.save_count ?? 0)}</span>
          {isOwner && (
            <div className="ml-auto flex items-center gap-3 flex-shrink-0">
              <button onClick={() => navigate(`/advertise?tab=boost&postId=${post.id}`)}
                className="text-xs text-amber-500 font-semibold hover:underline flex items-center gap-1">
                🚀 Boost
              </button>
              <button onClick={() => setShowInsights(true)}
                className="text-xs text-primary font-semibold hover:underline">
                See Insights →
              </button>
            </div>
          )}
        </div>

        {/* Comments */}
        {showComments && (
          <CommentSection postId={post.id} currentUser={currentUser} onCommentAdded={() => setCommentCount(c => c + 1)} />
        )}
      </article>

      {/* Insights Modal */}
      {showInsights && (() => {
        const views    = post.views_count ?? post.view_count ?? 0
        const likes    = likeCount
        const comments = commentCount
        const reposts  = repostCount
        const saves    = post.saves_count ?? post.save_count ?? 0
        const engTotal = likes + comments + reposts + saves
        const rate     = views > 0 ? ((engTotal / views) * 100).toFixed(1) : '0.0'
        const peak     = Math.max(views, likes, comments, reposts, saves, 1)
        const metrics  = [
          { label: 'Reach (views)', value: views, icon: '👁', bar: 'bg-blue-500' },
          { label: 'Likes',         value: likes, icon: '❤️', bar: 'bg-pink-500' },
          { label: 'Comments',      value: comments, icon: '💬', bar: 'bg-emerald-500' },
          { label: 'Reposts',       value: reposts, icon: '🔁', bar: 'bg-amber-500' },
          { label: 'Saves',         value: saves, icon: '🔖', bar: 'bg-violet-500' },
        ]
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowInsights(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 mx-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-foreground">Post Insights</h3>
                <button onClick={() => setShowInsights(false)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">How your post is performing</p>

              <div className="bg-primary/10 rounded-2xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold text-primary">{rate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total engagements</p>
                  <p className="text-xl font-bold text-foreground">{fmtCount(engTotal)}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {metrics.map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span>{m.icon}</span>{m.label}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{fmtCount(m.value)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${m.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(2, (m.value / peak) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {showShare && <ShareModal post={post} currentUser={currentUser} onClose={() => setShowShare(false)} />}

      {/* Who-liked modal */}
      {showLikes && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
          onClick={() => setShowLikes(false)}>
          <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {fmtCount(likeCount)} {likeCount === 1 ? 'Like' : 'Likes'}
              </h3>
              <button onClick={() => setShowLikes(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {likersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : likers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No likes yet</p>
              ) : (
                likers.map(liker => (
                  <LikerRow key={liker.user_id} liker={liker} currentUser={currentUser}
                    navigate={navigate} onClose={() => setShowLikes(false)} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote Repost Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowQuoteModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 mx-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-4">Quote Repost</h3>
            {/* Original post preview */}
            <div className="border border-border rounded-xl p-3 mb-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Avatar src={post.author?.avatar_url || post.author_avatar} name={post.author?.full_name || post.author_name} size={7} />
                <p className="text-xs font-semibold text-foreground">{post.author?.full_name || post.author_name}</p>
              </div>
              {post.content && (
                <p className="text-xs text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: post.content }} />
              )}
              {Array.isArray(post.media_urls) && post.media_urls[0] && (
                <img src={post.media_urls[0]} alt="" className="mt-2 w-full max-h-32 object-cover rounded-lg" />
              )}
            </div>
            <textarea
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              placeholder="Add your thoughts…"
              rows={3}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowQuoteModal(false); setQuoteText('') }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleQuoteRepost} disabled={quoting || !quoteText.trim()}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors">
                {quoting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Quote Repost
              </button>
            </div>
          </div>
        </div>
      )}}

      {/* Tagged products drawer — Buy Now flow */}
      {showShop && <TaggedProductsDrawer tags={taggedProducts} onClose={() => setShowShop(false)} />}

      {/* Gift animation — floats up from the post */}
      {giftAnimation && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center gap-2 pointer-events-none"
          style={{ animation: 'giftFloat 2.5s ease-out forwards' }}
        >
          <span className="text-6xl drop-shadow-2xl">{giftAnimation.emoji}</span>
          <span className="text-sm font-bold text-white bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl">
            You sent a {giftAnimation.name}! 🎉
          </span>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowEditModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 mx-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-base">Edit Post</h3>
              <button onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={5}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-4"
              placeholder="What's on your mind?"
            />
            {(editMediaUrl || post.media_urls?.length > 0) && (
              <div className="relative rounded-xl overflow-hidden bg-black mb-4 group cursor-pointer"
                onClick={() => setShowEditMedia(true)}>
                {post.media_type === 'video'
                  ? <video src={editMediaUrl ?? post.media_urls?.[0]} className="max-h-48 w-full object-contain" />
                  : <img src={editMediaUrl ?? post.media_urls?.[0]} alt="" className="max-h-48 w-full object-cover" />}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="flex items-center gap-2 text-white font-semibold text-sm bg-black/60 px-4 py-2 rounded-xl">
                    <Edit3 className="w-4 h-4" /> Edit Media
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors">
                {editSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MediaEditor for existing post media */}
      {showEditMedia && (
        <MediaEditor
          url={post.media_urls?.[0]}
          onSave={(result) => {
            if (result instanceof Blob) {
              setEditMediaBlob(result)
              setEditMediaUrl(URL.createObjectURL(result))
            } else {
              setEditMediaUrl(result.url ?? result)
            }
            setShowEditMedia(false)
          }}
          onClose={() => setShowEditMedia(false)}
        />
      )}
    </>
  )
}

// ─── Post Composer ────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, desc: 'Everyone' },
  { value: 'friends', label: 'Friends', icon: Users, desc: 'Your connections' },
  { value: 'only_me', label: 'Only me', icon: Lock, desc: 'Just you' },
]

function PostComposer({ user, onCreated }) {
  const { profile } = useAuth()
  const { mode } = useMode()
  const { selectedTrack, clearSelectedTrack } = useMusic()
  const editorRef = useRef()
  const imgInputRef = useRef()
  const vidInputRef = useRef()
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaEditorIdx, setMediaEditorIdx] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAudience, setShowAudience] = useState(false)
  const [audience, setAudience] = useState('public')
  const [feedType, setFeedType] = useState(mode === 'pro' ? 'pro' : 'creator')
  const [showFeedPicker, setShowFeedPicker] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [taggedProducts, setTaggedProducts] = useState([]) // shop product tags
  const [showProductPicker, setShowProductPicker] = useState(false)
  const audienceRef = useRef()
  const feedPickerRef = useRef()
  // Autocomplete state
  const [hashtagSuggestions, setHashtagSuggestions] = useState([])
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)

  // Auto-expand when a track is pre-selected
  useEffect(() => { if (selectedTrack) setExpanded(true) }, [selectedTrack])

  // Keep feedType in sync if mode changes externally
  useEffect(() => { setFeedType(mode === 'pro' ? 'pro' : 'creator') }, [mode])

  useEffect(() => {
    const fn = e => { if (feedPickerRef.current && !feedPickerRef.current.contains(e.target)) setShowFeedPicker(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    const fn = e => { if (audienceRef.current && !audienceRef.current.contains(e.target)) setShowAudience(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Don't render composer if user is not logged in
  if (!user) return null

  const execCmd = (cmd) => { editorRef.current?.focus(); document.execCommand(cmd, false, null) }

  const insertEmoji = useCallback((emoji) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(emoji))
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    setCharCount(el.innerText?.length ?? 0)
    setShowEmoji(false)
  }, [])

  const handleEditorInput = useCallback(async () => {
    const el = editorRef.current
    if (!el) return
    const text = el.innerText ?? ''
    setCharCount(text.length)

    // Hashtag autocomplete
    const hashtagMatch = text.match(/#(\w+)$/)
    if (hashtagMatch && hashtagMatch[1].length >= 2) {
      const query = hashtagMatch[1]
      const { data } = await supabase.from('posts').select('hashtags').not('hashtags', 'is', null).limit(50)
      if (data) {
        const all = data.flatMap(p => p.hashtags ?? [])
        const unique = [...new Set(all)]
        const matches = unique.filter(h => h.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
        setHashtagSuggestions(matches)
        setShowHashtagSuggestions(matches.length > 0)
      }
      setShowMentionSuggestions(false)
      return
    }
    setShowHashtagSuggestions(false)

    // Mention autocomplete
    const mentionMatch = text.match(/@(\w+)$/)
    if (mentionMatch && mentionMatch[1].length >= 2) {
      const query = mentionMatch[1]
      const { data } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(5)
      setMentionSuggestions(data ?? [])
      setShowMentionSuggestions((data?.length ?? 0) > 0)
      return
    }
    setShowMentionSuggestions(false)
  }, [])

  const selectHashtag = useCallback((hashtag) => {
    const el = editorRef.current
    if (!el) return
    el.innerText = el.innerText.replace(/#\w+$/, `#${hashtag} `)
    // Move cursor to end
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
    el.focus()
    setCharCount(el.innerText.length)
    setShowHashtagSuggestions(false)
  }, [])

  const selectMention = useCallback((mentionUser) => {
    const el = editorRef.current
    if (!el) return
    const name = mentionUser.username ?? mentionUser.full_name?.replace(/\s+/g, '')
    el.innerText = el.innerText.replace(/@\w+$/, `@${name} `)
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
    el.focus()
    setCharCount(el.innerText.length)
    setShowMentionSuggestions(false)
  }, [])

  const handleFile = (e, mediaType) => {
    Array.from(e.target.files ?? []).forEach(file => {
      setMediaFiles(prev => [...prev, { file, preview: URL.createObjectURL(file), type: mediaType }])
    })
    setExpanded(true)
    e.target.value = ''
  }

  const removeMedia = (i) => {
    setMediaFiles(prev => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const handleMediaEdited = useCallback((blob) => {
    if (mediaEditorIdx === null) return
    const prev = mediaFiles[mediaEditorIdx]
    const newFile = new File([blob], prev?.file?.name ?? 'edited.jpg', { type: blob.type })
    const newPreview = URL.createObjectURL(blob)
    setMediaFiles(files => files.map((m, i) => {
      if (i !== mediaEditorIdx) return m
      URL.revokeObjectURL(m.preview)
      return { file: newFile, preview: newPreview, type: m.type }
    }))
    setMediaEditorIdx(null)
  }, [mediaEditorIdx, mediaFiles])

  const reset = () => {
    if (editorRef.current) editorRef.current.innerHTML = ''
    setMediaFiles([])
    setCharCount(0)
    setExpanded(false)
    setError('')
    setShowEmoji(false)
    setTaggedProducts([])
    clearSelectedTrack()
  }

  const handlePost = async () => {
    const html = editorRef.current?.innerHTML?.trim() ?? ''
    const text = editorRef.current?.innerText?.trim() ?? ''
    if (!text && mediaFiles.length === 0) return
    if (text.length > MAX_CHARS) { setError(`Max ${MAX_CHARS} characters`); return }
    setPosting(true)
    setError('')
    try {
      const mediaUrls = []
      for (const { file } of mediaFiles) mediaUrls.push(await uploadToStorage(file))
      const mediaType    = mediaFiles[0]?.type ?? 'none'
      const isVideoPost  = mediaType === 'video'
      const { data, error: err } = await supabase.from('posts').insert({
        content: html,
        created_by:   user.id,
        author_id:    user.id,
        author_name:  profile?.full_name ?? user.email,
        author_avatar: profile?.avatar_url ?? null,
        author_role:   profile?.plan ?? null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaType,
        likes_count: 0, comments_count: 0, reposts_count: 0, views_count: 0, saves_count: 0,
        visibility: audience,
        feed_type: isVideoPost ? 'reel' : feedType,
        created_at: new Date().toISOString(),
        music_track_id: selectedTrack?.id || null,
        music_track_meta: selectedTrack
          ? { title: selectedTrack.title, artist: selectedTrack.artist || 'Philomni Originals' }
          : null,
        tagged_products: taggedProducts.length > 0 ? taggedProducts : null,
      }).select().single()
      if (err) { setError(err.message); return }
      // Record music usage
      if (selectedTrack?.id && data?.id && !String(selectedTrack.id).startsWith('demo_')) {
        supabase.from('music_usage').insert({
          track_id: selectedTrack.id,
          user_id: user.id,
          post_id: data.id,
          platform: 'philomni',
        }).then(() => {})
      }
      clearSelectedTrack()
      reset()
      onCreated(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  const hasContent = charCount > 0 || mediaFiles.length > 0
  const AudienceIcon = AUDIENCE_OPTIONS.find(a => a.value === audience)?.icon ?? Globe

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-visible shadow-sm mb-4">
      <div className="p-4 flex gap-3">
        <Avatar src={profile?.avatar_url} name={profile?.full_name || user?.email} size={11} />
        <div className="flex-1 min-w-0">
          {!expanded ? (
            <div onClick={() => { setExpanded(true); setTimeout(() => editorRef.current?.focus(), 50) }}
              className="min-h-[44px] bg-muted hover:bg-muted/80 rounded-2xl px-4 py-3 text-sm text-muted-foreground cursor-text select-none flex items-center transition-colors">
              What's on your mind, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}?
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 mb-2">
                <button onClick={() => execCmd('bold')} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Bold className="w-3.5 h-3.5" /></button>
                <button onClick={() => execCmd('italic')} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Italic className="w-3.5 h-3.5" /></button>
                <EmojiPickerButton
                  onEmojiSelect={insertEmoji}
                  pickerSide="left"
                />
                {/* Feed type selector */}
                <div className="relative" ref={feedPickerRef}>
                  <button
                    onClick={() => setShowFeedPicker(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
                  >
                    {feedType === 'creator' ? '🎨' : feedType === 'pro' ? '💼' : '🌐'}
                    {feedType === 'creator' ? 'Creator' : feedType === 'pro' ? 'Pro' : 'Both'}
                  </button>
                  {showFeedPicker && (
                    <div className="absolute left-0 top-8 bg-popover border border-border rounded-2xl shadow-xl py-1.5 z-30 min-w-[160px]">
                      {[
                        { value: 'creator', emoji: '🎨', label: 'Creator Feed' },
                        { value: 'pro',     emoji: '💼', label: 'Professional Feed' },
                        { value: 'both',    emoji: '🌐', label: 'Both Feeds' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => { setFeedType(opt.value); setShowFeedPicker(false) }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${feedType === opt.value ? 'text-primary font-medium' : 'text-foreground'}`}>
                          <span>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Audience selector */}
                <div className="relative ml-auto" ref={audienceRef}>
                  <button onClick={() => setShowAudience(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors">
                    <AudienceIcon className="w-3.5 h-3.5" />
                    {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
                  </button>
                  {showAudience && (
                    <div className="absolute right-0 top-8 bg-popover border border-border rounded-2xl shadow-xl py-1.5 z-30 min-w-[170px]">
                      {AUDIENCE_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setAudience(opt.value); setShowAudience(false) }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${audience === opt.value ? 'text-primary' : 'text-foreground'}`}>
                          <opt.icon className="w-4 h-4 flex-shrink-0" />
                          <div className="text-left">
                            <p className="font-medium">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                {/* Hashtag suggestions */}
                {showHashtagSuggestions && (
                  <div className="absolute bottom-full left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 mb-1">
                    {hashtagSuggestions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); selectHashtag(tag) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors text-sm flex items-center gap-2"
                      >
                        <span className="text-primary font-medium">#{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Mention suggestions */}
                {showMentionSuggestions && (
                  <div className="absolute bottom-full left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 mb-1">
                    {mentionSuggestions.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); selectMention(u) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold overflow-hidden flex-shrink-0">
                          {u.avatar_url
                            ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                            : u.full_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.full_name}</p>
                          {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div ref={editorRef} contentEditable suppressContentEditableWarning
                  data-placeholder="Share an idea, update, or insight…"
                  onInput={handleEditorInput}
                  className="composer-editor min-h-[90px] bg-muted/60 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  style={{ wordBreak: 'break-word' }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media previews */}
      {mediaFiles.length > 0 && (
        <div className={`px-4 pb-3 ${mediaFiles.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
          {mediaFiles.map(({ preview, type }, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden bg-black group">
              {type === 'video'
                ? <video src={preview} className="max-h-52 w-full object-contain" />
                : <img src={preview} alt="" className="max-h-52 w-full object-cover" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setMediaEditorIdx(i)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 text-white text-xs font-semibold hover:bg-black/90 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => removeMedia(i)}
                  className="p-1.5 rounded-full bg-black/75 text-white hover:bg-black/90 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Music track attachment */}
      {selectedTrack && (
        <div className="mx-4 mb-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/8 border border-primary/20">
          <span className="text-base">🎵</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary truncate">{selectedTrack.title}</p>
            <p className="text-[10px] text-muted-foreground">{selectedTrack.artist || 'Philomni Originals'}</p>
          </div>
          <button
            onClick={clearSelectedTrack}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Tagged product chips */}
      {expanded && taggedProducts.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
          {taggedProducts.map(t => (
            <span key={t.product_id} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <span className="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px]">
                {t.image ? <img src={t.image} className="w-full h-full object-cover" alt="" /> : '🛍️'}
              </span>
              <span className="max-w-[120px] truncate">{t.title}</span>
              <button onClick={() => setTaggedProducts(prev => prev.filter(p => p.product_id !== t.product_id))}
                className="hover:text-foreground"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      {expanded && (
        <div className="px-4 py-2.5 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap bg-muted/10">
          <div className="flex items-center gap-1">
            <div className="relative group">
              <label className="cursor-pointer p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-emerald-500 flex items-center">
                <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFile(e, 'image')} />
                <ImageIcon className="w-4 h-4" />
              </label>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Add Photo</span>
            </div>
            <div className="relative group">
              <label className="cursor-pointer p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-blue-500 flex items-center">
                <input ref={vidInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFile(e, 'video')} />
                <VideoIcon className="w-4 h-4" />
              </label>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Add Video</span>
            </div>
            <div className="relative group">
              <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-pink-500">
                <Film className="w-4 h-4" />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Add GIF</span>
            </div>
            <div className="relative group">
              <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-orange-500">
                <MapPin className="w-4 h-4" />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Add Location</span>
            </div>
            <div className="relative group">
              <Link to="/music" className={`p-2 rounded-xl hover:bg-muted transition-colors flex items-center ${selectedTrack ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}>
                🎵
              </Link>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Add Music</span>
            </div>
            <div className="relative group">
              <button onClick={() => setShowProductPicker(true)}
                className={`p-2 rounded-xl hover:bg-muted transition-colors flex items-center ${taggedProducts.length > 0 ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}>
                <ShoppingBag className="w-4 h-4" />
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">Tag Products</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {charCount > 0 && (
              <span className={`text-xs ${charCount > MAX_CHARS ? 'text-destructive font-semibold' : charCount > MAX_CHARS * 0.8 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handlePost} disabled={posting || !hasContent || charCount > MAX_CHARS}
              className="px-5 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all">
              {posting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}

      {/* MediaEditor overlay for composer */}
      {mediaEditorIdx !== null && mediaFiles[mediaEditorIdx] && (
        <MediaEditor
          file={mediaFiles[mediaEditorIdx].file}
          onSave={handleMediaEdited}
          onClose={() => setMediaEditorIdx(null)}
        />
      )}

      {/* Product tag picker */}
      {showProductPicker && (
        <ProductTagPicker
          initial={taggedProducts}
          onClose={() => setShowProductPicker(false)}
          onConfirm={(tags) => { setTaggedProducts(tags); setShowProductPicker(false) }}
        />
      )}
    </div>
  )
}

// ─── Right Sidebar ─────────────────────────────────────────────────────────────

function RightSidebar() {
  const [suggested, setSuggested] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    supabase.from('users').select('id, full_name, avatar_url, role, bio').limit(5)
      .then(({ data }) => setSuggested(data ?? []))
    supabase.from('events').select('*').gte('starts_at', new Date().toISOString()).limit(3)
      .then(({ data }) => setEvents(data ?? []))
  }, [])

  const trending = ['#creators', '#AItools', '#philomni', '#videoediting', '#contentcreators', '#growthhacking']

  return (
    <div className="space-y-4">
      {/* Who to follow */}
      <div className="bg-card border border-border/60 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Who to follow</h3>
        <div className="space-y-3">
          {suggested.length === 0 ? (
            [1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : suggested.map(u => (
            <div key={u.id} className="flex items-center gap-3">
              <Avatar src={u.avatar_url} name={u.full_name} size={9} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{u.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.role ?? 'Creator'}</p>
              </div>
              <button className="flex-shrink-0 flex items-center gap-1 text-xs text-primary font-semibold hover:bg-primary/10 px-2.5 py-1.5 rounded-xl transition-colors">
                <UserPlus className="w-3 h-3" /> Follow
              </button>
            </div>
          ))}
        </div>
        <button className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1">
          See more <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Trending */}
      <div className="bg-card border border-border/60 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Trending topics</h3>
        <div className="space-y-2">
          {trending.map((tag, i) => (
            <button key={tag} className="w-full flex items-center gap-2.5 hover:bg-muted rounded-xl px-2 py-2 transition-colors group text-left">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Hash className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{tag}</p>
                <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 900 + 100)} posts</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      {events.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Upcoming events</h3>
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.starts_at ? new Date(ev.starts_at).toLocaleDateString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SmartMatch CTA */}
      <SmartMatchCTA />

      <p className="text-xs text-muted-foreground/50 text-center pb-4">© 2026 Philomni</p>
    </div>
  )
}

// ─── SmartMatch CTA (sidebar widget) ─────────────────────────────────────────

function SmartMatchCTA() {
  const navigate = useNavigate()
  return (
    <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">SmartMatch</span>
        <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">NEW</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Find your perfect collaborator, investor, or creative partner — powered by AI matching.
      </p>
      <button
        onClick={() => navigate('/match')}
        className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition"
      >
        Get Matched <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Connection Story Card (in-feed) ─────────────────────────────────────────

const STORY_CARDS = [
  { from: 'A creator in Lagos', to: 'a brand in Toronto', result: 'landed a $15K UGC deal', emoji: '🎬' },
  { from: 'A startup founder in Accra', to: 'their co-founder', result: 'launched and hit 1K users in 30 days', emoji: '🚀' },
  { from: 'An angel investor in London', to: 'a Nigerian fintech', result: 'made their first African investment', emoji: '💰' },
  { from: 'A music producer in Abuja', to: 'an LA-based artist', result: 'released a charting single together', emoji: '🎵' },
]
let storyIdx = 0

function ConnectionStoryCard() {
  const navigate = useNavigate()
  const card = STORY_CARDS[storyIdx++ % STORY_CARDS.length]
  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4 items-center">
      <div className="text-3xl flex-shrink-0">{card.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-bold text-primary">Philomni Connection</span>
        </div>
        <p className="text-sm text-foreground">
          <span className="font-medium">{card.from}</span> connected with <span className="font-medium">{card.to}</span> and {card.result}.
        </p>
      </div>
      <button
        onClick={() => navigate('/match')}
        className="flex-shrink-0 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
      >
        Find yours →
      </button>
    </div>
  )
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

// Module-level cache of the last loaded feed. Survives component remounts, so
// if Feed is torn down and recreated (e.g. on a tab-return remount) it shows the
// previous posts INSTANTLY instead of a skeleton — and never appears "stuck"
// even if a background refetch is slow.
let _feedPostsCache = []

// Deterministic engagement score plus a per-post seeded jitter. The seed is
// passed in (generated fresh inside fetchPosts on every call) so the order
// changes on each refresh — module-level constants can be cached by the bundler
// and never re-evaluate, which is why the seed must NOT live at module scope.
function scorePost(post, index, seed) {
  const views    = post.views_count    ?? post.view_count    ?? 0
  const likes    = post.likes_count    ?? post.like_count    ?? 0
  const comments = post.comments_count ?? post.comment_count ?? 0
  const reposts  = post.reposts_count  ?? post.repost_count  ?? 0
  const saves    = post.saves_count    ?? post.save_count    ?? 0
  const hoursAgo = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60)
  const recencyBonus = hoursAgo < 24 ? 15 : hoursAgo < 48 ? 8 : hoursAgo < 168 ? 3 : 0
  // Well-distributed seeded jitter (0–8). Scale the seed down before sin() — at
  // ~1e12 sin() loses precision, and a raw `% 1000` barely changes order between
  // nearby seeds. This hash reorders near-ties differently on every fetch.
  const h = Math.sin(seed * 1e-6 + index * 12.9898) * 43758.5453
  const seededRandom = (h - Math.floor(h)) * 8
  return (views * 1) + (likes * 3) + (comments * 5) + (reposts * 4) + (saves * 3) + recencyBonus + seededRandom
}

// Rank posts by seeded score. Scores are computed ONCE (with index + seed) and
// the array is sorted on those precomputed numbers — never a randomizing comparator.
function rankPosts(posts, seed) {
  return posts
    .map((post, index) => ({ post, score: scorePost(post, index, seed) }))
    .sort((a, b) => b.score - a.score)
    .map(({ post }) => post)
}

export default function Feed() {
  const { user, profile } = useAuth()
  const { mode } = useMode()
  const [posts, setPosts] = useState(_feedPostsCache)
  const [loading, setLoading] = useState(_feedPostsCache.length === 0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [feedError, setFeedError] = useState(null)
  const [spotlightWinnerId, setSpotlightWinnerId] = useState(null)
  const [showGoLive, setShowGoLive] = useState(false)
  const sentinelRef = useRef()
  const pageRef = useRef(0)
  const loadingRef = useRef(_feedPostsCache.length === 0) // mirrors `loading` for callbacks

  // (ad fetching is now handled inside fetchPosts)

  // Fetch current spotlight winner's user_id — cached 5 min, fetched once per session
  useEffect(() => {
    fetchWithCache(`spotlight-winner`, async () => {
      const { data } = await supabase
        .from('spotlight_winners')
        .select('*')
        .eq('is_active', true)
        .limit(1)
      return data?.[0]?.user_id || null
    }, 300_000).then(uid => { if (uid) setSpotlightWinnerId(uid) })
  }, [])

  const FEED_LIMIT = 50

  const fetchPosts = async () => {
    loadingRef.current = true
    setLoading(true)

    const withTimeout = (p, ms = 12_000) =>
      Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

    // Fresh seed on every fetch — keeps the order varying across refreshes.
    const sessionSeed = Date.now() + Math.random() * 10000

    try {
      // ── Layer 1: Following posts (60% of feed) ──────────────────────────────
      let followedIds = []
      if (user?.id) {
        const { data: fData } = await withTimeout(
          supabase.from('follows').select('following_id').eq('follower_id', user.id)
        )
        followedIds = (fData || []).map(f => f.following_id).filter(Boolean)
      }

      let followingPosts = []
      if (followedIds.length > 0) {
        const { data } = await withTimeout(
          supabase.from('posts').select('*')
            .in('author_id', followedIds)
            .order('created_at', { ascending: false })
            .limit(30)
        )
        followingPosts = rankPosts(data || [], sessionSeed)
      }

      // ── Layer 2: Discovery posts (25% of feed) ──────────────────────────────
      let discoveryQuery = supabase.from('posts').select('*')
        .order('created_at', { ascending: false })
        .limit(40)
      if (followedIds.length > 0) {
        discoveryQuery = discoveryQuery.not('author_id', 'in', `(${followedIds.join(',')})`)
      }
      const { data: discData, error } = await withTimeout(discoveryQuery)
      if (error) throw error
      const discoveryPosts = rankPosts(discData || [], sessionSeed)

      // ── Build combined post pool ──────────────────────────────────────────────
      const followingTarget = Math.ceil(FEED_LIMIT * 0.6)
      const discoveryTarget = Math.ceil(FEED_LIMIT * 0.35)
      const allPosts = followedIds.length > 0
        ? [...followingPosts.slice(0, followingTarget), ...discoveryPosts.slice(0, discoveryTarget)]
        : discoveryPosts.slice(0, FEED_LIMIT)

      // Enrich with author profiles
      let enriched = allPosts
      const userIds = [...new Set(allPosts.map(p => p.created_by || p.author_id).filter(Boolean))]
      if (userIds.length > 0) {
        const { data: profiles } = await withTimeout(
          supabase.from('users').select('id, full_name, avatar_url, plan').in('id', userIds)
        )
        if (profiles?.length) {
          enriched = allPosts.map(post => ({
            ...post,
            author: profiles.find(p => p.id === (post.created_by || post.author_id)) ?? null,
          }))
        }
      }

      // ── Layer 3: Fetch active ads for injection ────────────────────────────
      const now = new Date().toISOString()
      const [{ data: campAds }, { data: boostAds }] = await Promise.all([
        supabase.from('ad_campaigns').select('*').eq('status', 'active').gt('ends_at', now).limit(10),
        supabase.from('boosted_posts').select('*, posts(*)').eq('status', 'active').gt('ends_at', now).limit(10),
      ])

      const adsPool = []
      if (campAds?.length) {
        const pick = campAds[Math.floor(Math.random() * campAds.length)]
        adsPool.push({ ...pick, isAd: true, adType: 'campaign', adId: pick.id })
      }
      if (boostAds?.length) {
        const pick = boostAds[Math.floor(Math.random() * boostAds.length)]
        if (pick.posts) {
          adsPool.push({ ...pick.posts, isAd: true, adType: 'boost', adId: pick.id, boostId: pick.id,
            impressions_served: pick.impressions_served, clicks: pick.clicks, cta_url: null })
        }
      }
      // Duplicate the pool to cover all injection slots
      const fullAdsPool = [...adsPool, ...adsPool, ...adsPool, ...adsPool]

      // ── Interleave ads every 5th post ──────────────────────────────────────
      const feedPosts = []
      let adIndex = 0
      for (let i = 0; i < enriched.length; i++) {
        feedPosts.push(enriched[i])
        if ((i + 1) % 5 === 0 && fullAdsPool[adIndex]) {
          feedPosts.push({ ...fullAdsPool[adIndex], _feedAdKey: `ad-${i}-${adIndex}` })
          adIndex++
        }
      }

      _feedPostsCache = feedPosts
      setPosts(feedPosts)
      setFeedError(null)
      if (enriched.length < FEED_LIMIT) setHasMore(false)

    } catch (err) {
      console.error('[Feed] fetchPosts error:', err.message)
      if (posts.length === 0) setFeedError(err.message)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll — re-creates only when hasMore changes; reads loading via ref to avoid loop
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingRef.current) {
        pageRef.current += 1
        fetchPosts()
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore]) // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time new posts
  useEffect(() => {
    const channel = supabase.channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        setPosts(prev => {
          if (prev.find(p => p.id === payload.new.id)) return prev
          return [payload.new, ...prev]
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleCreated = (post) => setPosts(prev => [post, ...prev.filter(p => p.id !== post.id)])
  const handleDelete = (id) => setPosts(prev => prev.filter(p => p.id !== id))
  const handleRepost = (post) => setPosts(prev => [post, ...prev])
  const handleUpdate = (updated) => setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))

  return (
    <div className="flex gap-6 max-w-5xl mx-auto">
      {/* Center: feed */}
      <div className="flex-1 min-w-0 max-w-[600px] mx-auto lg:mx-0">
        {/* Spotlight Banner */}
        <SpotlightBanner />

        {/* Live streams row — only shown when lives exist */}
        <LivesRow />

        {/* Celebrations row — only shown when celebrations exist */}
        <CelebrationsRow />

        {/* Stories */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 mb-4 shadow-sm">
          <StoriesBar currentUser={user} />
        </div>

        {/* Go Live button */}
        <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 mb-4 shadow-sm flex items-center gap-3">
          <button
            onClick={() => setShowGoLive(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            🔴 Go Live
          </button>
          <p className="text-xs text-muted-foreground">Share your moment live with your audience</p>
        </div>

        {/* Composer — wrapped in ErrorBoundary so a crash here never blanks the feed */}
        {user && (
          <ErrorBoundary fallback={null}>
            <PostComposer user={user} onCreated={handleCreated} />
          </ErrorBoundary>
        )}

        {/* Go Live Modal */}
        {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} />}

        {/* Posts */}
        {feedError && (
          <div style={{ color: 'red', padding: '10px', background: '#fee', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
            Feed error: {feedError}
          </div>
        )}
        {loading && posts.length === 0 ? (
          <SkeletonFeed count={3} />
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border/60 rounded-2xl">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-lg font-bold text-foreground mb-1">Your feed is empty</p>
            <p className="text-sm text-muted-foreground">Follow creators or share your first post!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post, i) => (
                <React.Fragment key={post._feedAdKey || post.id || `feed-${i}`}>
                  <ErrorBoundary fallback={null}>
                    {post.isAd
                      ? <SponsoredCard ad={post} viewerId={user?.id} />
                      : <PostCard post={post} currentUser={user} onDelete={handleDelete} onRepost={handleRepost} onUpdate={handleUpdate} spotlightWinnerId={spotlightWinnerId} />
                    }
                  </ErrorBoundary>
                  {!post.isAd && (i + 1) % 4 === 0 && i < posts.length - 1 && <ConnectionStoryCard />}
                </React.Fragment>
              ))}
            </div>
            <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-2">
              {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              {!hasMore && posts.length >= PAGE_SIZE && (
                <p className="text-xs text-muted-foreground">You're all caught up ✓</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right sidebar — desktop only */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-20">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
