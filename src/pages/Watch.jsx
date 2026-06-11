import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AdOverlay from '../components/AdOverlay'
import { getInVideoCampaigns, selectAdForVideo } from '../utils/adMatcher'
import { toast } from 'sonner'

const formatDuration = (s) => {
  if (!s) return '0:00'
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

const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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

export default function Watch() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [video, setVideo] = useState(null)
  const [creator, setCreator] = useState(null)
  const [comments, setComments] = useState([])
  const [relatedVideos, setRelatedVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [following, setFollowing] = useState(false)
  const [muted, setMuted] = useState(true)

  const [campaigns, setCampaigns] = useState([])
  const [showAd, setShowAd] = useState(false)
  const [currentAd, setCurrentAd] = useState(null)
  const [adSlot, setAdSlot] = useState(null)
  const [preRollShown, setPreRollShown] = useState(false)
  const [endRollShown, setEndRollShown] = useState(false)

  const watchStartRef = useRef(Date.now())

  useEffect(() => {
    watchStartRef.current = Date.now()
    fetchVideo()
    fetchComments()
    fetchRelated()
    getInVideoCampaigns().then(setCampaigns)
    return () => {
      const watchSeconds = Math.round((Date.now() - watchStartRef.current) / 1000)
      if (watchSeconds > 5) {
        supabase.from('video_watches').insert({
          video_id: videoId,
          viewer_id: user?.id ?? null,
          watch_seconds: watchSeconds,
        }).then(() => {})
      }
    }
  }, [videoId])

  const fetchVideo = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('videos')
      .select(`*, creator:users!creator_id(id, username, full_name, avatar_url, is_monetized, monetization_enabled)`)
      .eq('id', videoId)
      .single()

    if (data) {
      setVideo(data)
      setCreator(data.creator)
      await supabase.rpc('increment_video_views', { p_video_id: videoId })
    }
    if (error) console.error('[Watch] fetch error:', error.message)
    setLoading(false)
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from('video_comments')
      .select(`*, user:users!user_id(id, username, full_name, avatar_url)`)
      .eq('video_id', videoId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50)
    setComments(data ?? [])
  }

  const fetchRelated = async () => {
    const { data } = await supabase
      .from('videos')
      .select(`id, title, thumbnail_url, cloudflare_uid, cloudflare_thumbnail, duration_seconds, view_count, published_at, creator:users!creator_id(username, full_name, avatar_url)`)
      .eq('cloudflare_status', 'ready')
      .eq('visibility', 'public')
      .neq('id', videoId)
      .order('view_count', { ascending: false })
      .limit(12)
    setRelatedVideos(data ?? [])
  }

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    const newLiked = !liked
    setLiked(newLiked)
    setVideo(v => ({ ...v, like_count: (v.like_count ?? 0) + (newLiked ? 1 : -1) }))
  }

  const handleComment = async () => {
    if (!user) { navigate('/login'); return }
    if (!newComment.trim()) return
    setSubmittingComment(true)
    const { data, error } = await supabase
      .from('video_comments')
      .insert({ video_id: videoId, user_id: user.id, content: newComment.trim() })
      .select(`*, user:users!user_id(id, username, full_name, avatar_url)`)
      .single()
    if (!error && data) {
      setComments(prev => [data, ...prev])
      setNewComment('')
      setVideo(v => ({ ...v, comment_count: (v.comment_count ?? 0) + 1 }))
    }
    setSubmittingComment(false)
  }

  useEffect(() => {
    if (!video?.duration_seconds || !video?.is_monetized || !campaigns.length) return
    const duration = video.duration_seconds
    const preRollTimer = setTimeout(() => {
      if (!preRollShown) {
        const ad = selectAdForVideo(campaigns, { id: videoId })
        if (ad) { setCurrentAd(ad); setAdSlot('pre_roll'); setShowAd(true); setPreRollShown(true) }
      }
    }, 2000)
    const endDelay = Math.max(0, (duration - 30) * 1000)
    const endRollTimer = setTimeout(() => {
      if (!endRollShown && duration > 60) {
        const ad = selectAdForVideo(campaigns, { id: videoId })
        if (ad) { setCurrentAd(ad); setAdSlot('end_roll'); setShowAd(true); setEndRollShown(true) }
      }
    }, endDelay)
    return () => { clearTimeout(preRollTimer); clearTimeout(endRollTimer) }
  }, [video?.duration_seconds, campaigns, videoId])

  const relatedThumb = (v) =>
    (v.thumbnail_url && !v.thumbnail_url.includes('undefined'))
      ? v.thumbnail_url
      : v.cloudflare_uid
        ? `https://videodelivery.net/${v.cloudflare_uid}/thumbnails/thumbnail.jpg?time=5s`
        : ''

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#fff' }}>Loading…</div>
  )

  if (!video) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#fff' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
      <h2 style={{ marginBottom: 8 }}>Video not available</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontSize: 14 }}>This video may have been removed or is unavailable.</p>
      <button onClick={() => navigate('/watch')} style={{ padding: '10px 24px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Browse Videos</button>
    </div>
  )

  if (video.cloudflare_status !== 'ready') {
    const procThumb = video.thumbnail_url ?? video.cloudflare_thumbnail ?? null
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px', textAlign: 'center', color: '#fff' }}>
        <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#111', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          {procThumb && <img src={procThumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, border: '3px solid rgba(139,92,246,0.4)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>Getting your video ready…</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>This usually takes a few minutes.</p>
          </div>
        </div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>{video.title}</h1>
      </div>
    )
  }

  const embedUrl = video.cloudflare_uid
    ? `https://iframe.videodelivery.net/${video.cloudflare_uid}?autoplay=true&muted=${muted}&preload=auto`
    : null

  const thumbUrl = (video.thumbnail_url && !video.thumbnail_url.includes('undefined'))
    ? video.thumbnail_url
    : video.cloudflare_uid
      ? `https://videodelivery.net/${video.cloudflare_uid}/thumbnails/thumbnail.jpg`
      : null

  return (
    <>
      <style>{`
        .yt-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          color: #fff;
        }
        .yt-main {
          flex: 1;
          min-width: 0;
        }
        .yt-sidebar {
          width: 360px;
          flex-shrink: 0;
        }
        @media (max-width: 1024px) {
          .yt-sidebar { width: 300px; }
        }
        @media (max-width: 768px) {
          .yt-layout { flex-direction: column; }
          .yt-sidebar { width: 100%; }
        }
      `}</style>

      <div className="yt-layout">

        {/* ── LEFT COLUMN: player + info + comments ── */}
        <div className="yt-main">

          {/* Player */}
          <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
            {showAd && currentAd && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                <AdOverlay campaign={currentAd} slot={adSlot} postId={videoId} creatorId={creator?.id}
                  onComplete={() => { setShowAd(false); setCurrentAd(null) }}
                  onSkip={() => { setShowAd(false); setCurrentAd(null) }} />
              </div>
            )}
            {embedUrl ? (
              <>
                <iframe
                  src={embedUrl}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                />
                {muted && (
                  <button
                    onClick={() => setMuted(false)}
                    style={{
                      position: 'absolute', bottom: 14, right: 14,
                      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
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
                {thumbUrl && <img src={thumbUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />}
                <p style={{ position: 'relative', color: '#fff', zIndex: 1 }}>⚙️ Processing…</p>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.35 }}>{video.title}</h1>

          {/* Stats + action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {formatViews(video.view_count)} · {formatTime(video.published_at)}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleLike}
                style={{
                  padding: '7px 16px', background: liked ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                  border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer',
                  fontSize: 13, fontWeight: liked ? 700 : 400,
                }}
              >
                👍 {video.like_count ?? 0}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
                style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer', fontSize: 13 }}
              >
                Share
              </button>
            </div>
          </div>

          {/* Creator card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
            <img
              src={creator?.avatar_url ?? '/default-avatar.png'}
              alt={creator?.full_name}
              onClick={() => navigate(`/profile/${creator?.id}`)}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
              onError={e => { e.target.style.display = 'none' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0, cursor: 'pointer', color: '#fff', fontSize: 14 }} onClick={() => navigate(`/profile/${creator?.id}`)}>
                {creator?.full_name ?? creator?.username}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>@{creator?.username}</p>
            </div>
            {user?.id !== creator?.id && (
              <button
                onClick={() => setFollowing(!following)}
                style={{
                  padding: '7px 18px',
                  background: following ? 'transparent' : '#8b5cf6',
                  border: following ? '1px solid rgba(255,255,255,0.25)' : 'none',
                  borderRadius: 20, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                }}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 24, border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap', overflow: 'hidden', maxHeight: descExpanded ? 'none' : 72, lineHeight: 1.6 }}>
                {video.description}
              </p>
              {video.description.length > 200 && (
                <button onClick={() => setDescExpanded(!descExpanded)} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: 13, marginTop: 6, padding: 0, fontWeight: 600 }}>
                  {descExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Comments */}
          <div style={{ marginBottom: 60 }}>
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600, color: '#fff' }}>{video.comment_count ?? 0} Comments</h3>

            {user ? (
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{(profile?.full_name || user?.email || 'U')[0].toUpperCase()}</div>
                }
                <div style={{ flex: 1 }}>
                  <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                    placeholder="Add a comment…"
                    style={{ width: '100%', padding: '9px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {newComment && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                      <button onClick={() => setNewComment('')} style={{ padding: '6px 14px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                      <button onClick={handleComment} disabled={submittingComment} style={{ padding: '6px 14px', background: '#8b5cf6', border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        {submittingComment ? '…' : 'Comment'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 13 }}>
                <span onClick={() => navigate('/login')} style={{ color: '#8b5cf6', cursor: 'pointer' }}>Sign in</span> to comment
              </p>
            )}

            {comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                {comment.user?.avatar_url
                  ? <img src={comment.user.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(139,92,246,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{(comment.user?.full_name || comment.user?.username || '?')[0].toUpperCase()}</div>
                }
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{comment.user?.full_name ?? comment.user?.username}</span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{formatTime(comment.created_at)}</span>
                  </div>
                  <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.5 }}>{comment.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '32px 0', fontSize: 13 }}>No comments yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: related videos ── */}
        <div className="yt-sidebar">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Up Next</p>
          {relatedVideos.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No other videos yet.</p>
          )}
          {relatedVideos.map(v => (
            <div
              key={v.id}
              onClick={() => navigate(`/watch/${v.id}`)}
              style={{ display: 'flex', gap: 8, marginBottom: 10, cursor: 'pointer', borderRadius: 8, padding: 6, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* Thumbnail */}
              <div style={{ width: 160, height: 90, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#111', position: 'relative' }}>
                <img
                  src={relatedThumb(v)}
                  alt={v.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
                {v.duration_seconds > 0 && (
                  <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.82)', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>
                    {formatDuration(v.duration_seconds)}
                  </span>
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 3px', color: '#fff', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.35 }}>
                  {v.title}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{v.creator?.full_name ?? v.creator?.username}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{formatViews(v.view_count)} · {formatAge(v.published_at)}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}
