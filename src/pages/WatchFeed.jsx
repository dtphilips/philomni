import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

function VideoCard({ video, onClick }) {
  const thumb = (video.thumbnail_url && !video.thumbnail_url.includes('undefined'))
    ? video.thumbnail_url
    : video.cloudflare_uid
      ? `https://videodelivery.net/${video.cloudflare_uid}/thumbnails/thumbnail.jpg?time=5s`
      : null

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', borderRadius: 12 }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#111', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
        {thumb
          ? <img src={thumb} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎬</div>
        }
        {video.duration_seconds > 0 && (
          <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 11, padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>
            {formatDuration(video.duration_seconds)}
          </span>
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
  const { user } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')

  useEffect(() => { fetchVideos() }, [category, user?.id])

  const fetchVideos = async () => {
    setLoading(true)

    // If filtering by category, just fetch that category
    if (category !== 'All') {
      const { data } = await supabase
        .from('videos')
        .select(`id, title, thumbnail_url, cloudflare_uid, cloudflare_thumbnail, duration_seconds, view_count, published_at, category, creator:users!creator_id(id, username, full_name, avatar_url)`)
        .eq('cloudflare_status', 'ready')
        .eq('visibility', 'public')
        .eq('category', category)
        .order('view_count', { ascending: false })
        .limit(40)
      setVideos(data ?? [])
      setLoading(false)
      return
    }

    // Fetch all ready public videos
    const { data: allVideos } = await supabase
      .from('videos')
      .select(`id, title, thumbnail_url, cloudflare_uid, cloudflare_thumbnail, duration_seconds, view_count, published_at, category, creator:users!creator_id(id, username, full_name, avatar_url)`)
      .eq('cloudflare_status', 'ready')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(60)

    if (!allVideos?.length) { setVideos([]); setLoading(false); return }

    // If logged in, personalize by watch history
    if (user?.id) {
      const { data: history } = await supabase
        .from('video_watches')
        .select('video_id, videos(category)')
        .eq('viewer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (history?.length) {
        // Count category frequency from watch history
        const catScore = {}
        history.forEach(h => {
          const cat = h.videos?.category
          if (cat) catScore[cat] = (catScore[cat] ?? 0) + 1
        })

        // Sort: preferred categories first, then by view_count within each group
        const sorted = [...allVideos].sort((a, b) => {
          const scoreA = catScore[a.category] ?? 0
          const scoreB = catScore[b.category] ?? 0
          if (scoreB !== scoreA) return scoreB - scoreA
          return (b.view_count ?? 0) - (a.view_count ?? 0)
        })
        setVideos(sorted.slice(0, 40))
        setLoading(false)
        return
      }
    }

    // Fallback: sort by view count (popular first)
    setVideos([...allVideos].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 40))
    setLoading(false)
  }

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Category chips */}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {videos.map(v => (
            <VideoCard
              key={v.id}
              video={v}
              onClick={() => navigate(`/watch/${v.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
