import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  'All', 'Education', 'Entertainment', 'Music', 'Tech',
  'Business', 'Lifestyle', 'Health & Fitness', 'Food',
  'Travel', 'Fashion', 'Sports', 'Gaming', 'News', 'Comedy',
]

const formatDuration = (s) => {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const formatViews = (n) => {
  if (!n) return '0 views'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`
  return `${n} views`
}

const formatAge = (date) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

// Inline player shown above the grid when a card is clicked
function InlinePlayer({ video, onClose, onComments }) {
  const [muted, setMuted] = useState(true)
  const embedUrl = video.cloudflare_uid
    ? `https://iframe.videodelivery.net/${video.cloudflare_uid}?autoplay=true&muted=true&preload=auto`
    : null

  // Swap to unmuted src when user clicks unmute
  const [src, setSrc] = useState(embedUrl)
  const handleUnmute = () => {
    if (video.cloudflare_uid) {
      setSrc(`https://iframe.videodelivery.net/${video.cloudflare_uid}?autoplay=true&muted=false&preload=auto`)
    }
    setMuted(false)
  }

  const thumb = (video.thumbnail_url && !video.thumbnail_url.includes('undefined'))
    ? video.thumbnail_url
    : video.cloudflare_uid
      ? `https://videodelivery.net/${video.cloudflare_uid}/thumbnails/thumbnail.jpg`
      : null

  return (
    <div style={{
      background: '#0a0a14',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 32,
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Player */}
      <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#000' }}>
        {src ? (
          <>
            <iframe
              src={src}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
            {muted && (
              <button
                onClick={handleUnmute}
                style={{
                  position: 'absolute', bottom: 14, right: 14,
                  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                  color: '#fff', border: 'none', borderRadius: 20,
                  padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, zIndex: 5,
                }}
              >
                🔊 Unmute
              </button>
            )}
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {thumb && <img src={thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />}
            <p style={{ color: '#fff', position: 'relative', zIndex: 1 }}>⚙️ Processing…</p>
          </div>
        )}
      </div>

      {/* Info bar below player */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {video.creator?.avatar_url
          ? <img src={video.creator.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {(video.creator?.full_name || video.creator?.username || '?')[0].toUpperCase()}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
            {video.creator?.full_name ?? video.creator?.username} · {formatViews(video.view_count)} · {formatAge(video.published_at)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={onComments}
            style={{
              padding: '8px 16px', background: '#8b5cf6', border: 'none',
              borderRadius: 20, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            💬 Comments
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px', background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 20, color: '#fff', cursor: 'pointer', fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video, isActive, onClick }) {
  const thumb = (video.thumbnail_url && !video.thumbnail_url.includes('undefined'))
    ? video.thumbnail_url
    : video.cloudflare_uid
      ? `https://videodelivery.net/${video.cloudflare_uid}/thumbnails/thumbnail.jpg?time=5s`
      : null

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer', borderRadius: 12, overflow: 'hidden',
        outline: isActive ? '2px solid #8b5cf6' : 'none',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#111', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
        {thumb
          ? <img src={thumb} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎬</div>
        }
        {/* Play button overlay */}
        {!isActive && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0)', transition: 'background 0.15s',
          }}
            className="card-play-overlay"
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, opacity: 0, transition: 'opacity 0.15s',
            }} className="card-play-btn">▶</div>
          </div>
        )}
        {video.duration_seconds > 0 && (
          <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 11, padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>
            {formatDuration(video.duration_seconds)}
          </span>
        )}
        {isActive && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#8b5cf6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
            NOW PLAYING
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {video.creator?.avatar_url
          ? <img src={video.creator.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.4)', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {(video.creator?.full_name || video.creator?.username || '?')[0].toUpperCase()}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', margin: '0 0 3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
            {video.title}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: 0 }}>
            {video.creator?.full_name ?? video.creator?.username}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>
            {formatViews(video.view_count)} · {formatAge(video.published_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function WatchFeed() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [activeVideo, setActiveVideo] = useState(null)
  const playerRef = useRef(null)

  useEffect(() => { fetchVideos() }, [category])

  const fetchVideos = async () => {
    setLoading(true)
    let query = supabase
      .from('videos')
      .select(`
        id, title, thumbnail_url, cloudflare_uid, cloudflare_thumbnail,
        duration_seconds, view_count, published_at, category,
        creator:users!creator_id(id, username, full_name, avatar_url)
      `)
      .eq('cloudflare_status', 'ready')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(40)

    if (category !== 'All') query = query.eq('category', category)

    const { data } = await query
    setVideos(data ?? [])
    setLoading(false)
  }

  const handleCardClick = (video) => {
    setActiveVideo(prev => (prev?.id === video.id ? null : video))
    // Scroll to player
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{`
        .card-play-overlay:hover .card-play-btn { opacity: 1 !important; }
        .feed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        @media (max-width: 640px) {
          .feed-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 24, paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '6px 16px',
              background: category === cat ? '#fff' : 'rgba(255,255,255,0.1)',
              color: category === cat ? '#000' : '#fff',
              border: 'none', borderRadius: 20, cursor: 'pointer',
              fontSize: 13, fontWeight: category === cat ? 700 : 400,
              whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inline player — appears above grid when a card is clicked */}
      <div ref={playerRef}>
        {activeVideo && (
          <InlinePlayer
            key={activeVideo.id}
            video={activeVideo}
            onClose={() => setActiveVideo(null)}
            onComments={() => navigate(`/watch/${activeVideo.id}`)}
          />
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.5)' }}>Loading…</div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
          <h2 style={{ color: '#fff', marginBottom: 8, fontWeight: 700 }}>No videos yet</h2>
          <p style={{ fontSize: 14, margin: '0 0 24px' }}>
            {category === 'All' ? 'Be the first to upload a long-form video.' : `No ${category} videos yet — check back soon.`}
          </p>
          <button
            onClick={() => navigate('/creator-studio')}
            style={{ padding: '10px 24px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Upload a Video
          </button>
        </div>
      ) : (
        <div className="feed-grid">
          {videos.map(v => (
            <VideoCard
              key={v.id}
              video={v}
              isActive={activeVideo?.id === v.id}
              onClick={() => handleCardClick(v)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
