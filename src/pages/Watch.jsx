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
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
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

  // Ad state
  const [campaigns, setCampaigns] = useState([])
  const [showAd, setShowAd] = useState(false)
  const [currentAd, setCurrentAd] = useState(null)
  const [adSlot, setAdSlot] = useState(null)
  const [preRollShown, setPreRollShown] = useState(false)
  const [midRollsShown, setMidRollsShown] = useState([])
  const [endRollShown, setEndRollShown] = useState(false)

  const watchStartRef = useRef(Date.now())
  const iframeRef = useRef(null)

  useEffect(() => {
    watchStartRef.current = Date.now()
    fetchVideo()
    fetchComments()
    fetchRelated()
    getInVideoCampaigns().then(setCampaigns)

    return () => {
      const watchSeconds = Math.round((Date.now() - watchStartRef.current) / 1000)
      if (watchSeconds > 5) {
        // fire-and-forget — don't await inside cleanup
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
    console.log('[Watch] videoId param:', videoId)
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        creator:users!creator_id(
          id, username, full_name, avatar_url,
          followers_count, is_monetized, monetization_enabled
        )
      `)
      .eq('id', videoId)
      .single()

    console.log('[Watch] video data:', data)
    console.log('[Watch] cloudflare_uid:', data?.cloudflare_uid)
    console.log('[Watch] cloudflare_status:', data?.cloudflare_status)
    if (error) console.error('[Watch] fetch error:', error)

    if (data) {
      setVideo(data)
      setCreator(data.creator)
      await supabase.rpc('increment_video_views', { p_video_id: videoId })
    }
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
      .select(`
        id, title, thumbnail_url, cloudflare_thumbnail,
        duration_seconds, view_count, created_at,
        creator:users!creator_id(username, full_name, avatar_url)
      `)
      .eq('cloudflare_status', 'ready')
      .eq('visibility', 'public')
      .neq('id', videoId)
      .order('view_count', { ascending: false })
      .limit(15)
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

  // Timer-based ad injection
  useEffect(() => {
    if (!video?.duration_seconds || !video?.is_monetized) return
    if (campaigns.length === 0) return

    const duration = video.duration_seconds

    const preRollTimer = setTimeout(() => {
      if (!preRollShown) {
        const ad = selectAdForVideo(campaigns, { id: videoId })
        if (ad) { setCurrentAd(ad); setAdSlot('pre_roll'); setShowAd(true); setPreRollShown(true) }
      }
    }, 2000)

    const midRollTimers = []
    if (duration > 300) {
      let t = 300_000
      while (t < duration * 1000) {
        const snapshot = t
        midRollTimers.push(setTimeout(() => {
          setMidRollsShown(prev => {
            if (prev.includes(snapshot)) return prev
            const ad = selectAdForVideo(campaigns, { id: videoId })
            if (ad) { setCurrentAd(ad); setAdSlot('mid_roll'); setShowAd(true) }
            return [...prev, snapshot]
          })
        }, snapshot))
        t += 300_000
      }
    }

    const endDelay = Math.max(0, (duration - 30) * 1000)
    const endRollTimer = setTimeout(() => {
      if (!endRollShown && duration > 60) {
        const ad = selectAdForVideo(campaigns, { id: videoId })
        if (ad) { setCurrentAd(ad); setAdSlot('end_roll'); setShowAd(true); setEndRollShown(true) }
      }
    }, endDelay)

    return () => {
      clearTimeout(preRollTimer)
      clearTimeout(endRollTimer)
      midRollTimers.forEach(clearTimeout)
    }
  }, [video?.duration_seconds, campaigns, videoId])

  const handleAdComplete = () => { setShowAd(false); setCurrentAd(null) }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#fff' }}>
      Loading…
    </div>
  )

  if (!video) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#fff' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
      <h2 style={{ marginBottom: 8 }}>Video not available</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontSize: 14 }}>
        This video may have been removed or is unavailable.
      </p>
      <button
        onClick={() => navigate('/watch')}
        style={{ padding: '10px 24px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
      >
        Browse Videos
      </button>
    </div>
  )

  // Show processing state for non-ready videos
  if (video.cloudflare_status !== 'ready') {
    const thumbUrl = video.thumbnail_url ?? video.cloudflare_thumbnail ?? null
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px', textAlign: 'center', color: '#fff' }}>
        <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', background: '#111', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          {thumbUrl && (
            <img src={thumbUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, border: '3px solid rgba(139,92,246,0.4)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>Getting your video ready…</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>This usually takes a few minutes. Come back shortly.</p>
          </div>
        </div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>{video.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>by {video.creator?.full_name ?? video.creator?.username}</p>
      </div>
    )
  }

  const embedUrl = video.cloudflare_uid
    ? `https://customer-lrknbwoduz.cloudflarestream.com/${video.cloudflare_uid}/iframe?poster=${encodeURIComponent(video.thumbnail_url ?? video.cloudflare_thumbnail ?? '')}`
    : null

  const thumbUrl = video.thumbnail_url ?? video.cloudflare_thumbnail ?? null

  return (
    <>
      <style>{`
        .watch-layout { display: flex; gap: 24px; max-width: 1400px; margin: 0 auto; padding: 24px 16px; color: #fff; }
        .watch-main { flex: 1; min-width: 0; }
        .watch-sidebar { width: 380px; flex-shrink: 0; }
        @media (max-width: 1024px) { .watch-sidebar { display: none !important; } }
      `}</style>

      <div className="watch-layout">
        {/* ── Left: main content ── */}
        <div className="watch-main">

          {/* Player */}
          <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            {showAd && currentAd && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                <AdOverlay
                  campaign={currentAd}
                  slot={adSlot}
                  postId={videoId}
                  creatorId={creator?.id}
                  onComplete={handleAdComplete}
                  onSkip={handleAdComplete}
                />
              </div>
            )}
            {embedUrl ? (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {thumbUrl && (
                  <img src={thumbUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <p style={{ color: '#fff', fontSize: 18 }}>⚙️ Video is processing…</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Check back in a few minutes</p>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{video.title}</h1>

          {/* Stats + actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              {formatViews(video.view_count)} · {formatTime(video.published_at)}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleLike}
                style={{
                  padding: '8px 16px',
                  background: liked ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                  border: 'none', borderRadius: 20,
                  color: '#fff', cursor: 'pointer',
                  fontSize: 14, fontWeight: liked ? 700 : 400,
                }}
              >
                👍 {video.like_count ?? 0}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer', fontSize: 14 }}
              >
                Share
              </button>
            </div>
          </div>

          {/* Creator card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <img
              src={creator?.avatar_url ?? '/default-avatar.png'}
              alt={creator?.full_name}
              onClick={() => navigate(`/profile/${creator?.id}`)}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
              onError={e => { e.target.style.display = 'none' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0, cursor: 'pointer' }} onClick={() => navigate(`/profile/${creator?.id}`)}>
                {creator?.full_name ?? creator?.username}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                @{creator?.username} · {(creator?.followers_count ?? 0).toLocaleString()} followers
              </p>
            </div>
            {user?.id !== creator?.id && (
              <button
                onClick={() => setFollowing(!following)}
                style={{
                  padding: '8px 20px',
                  background: following ? 'transparent' : '#8b5cf6',
                  border: following ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  borderRadius: 20, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                }}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{
                color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0,
                whiteSpace: 'pre-wrap', overflow: 'hidden',
                maxHeight: descExpanded ? 'none' : 80,
              }}>
                {video.description}
              </p>
              {video.description.length > 200 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: 13, marginTop: 8, padding: 0 }}
                >
                  {descExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>{video.comment_count ?? 0} Comments</h3>

            {/* Comment input */}
            {user ? (
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{(profile?.full_name || user?.email || 'U')[0].toUpperCase()}</div>
                }
                <div style={{ flex: 1 }}>
                  <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                    placeholder="Add a comment…"
                    style={{
                      width: '100%', padding: '10px 0',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  {newComment && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                      <button onClick={() => setNewComment('')} style={{ padding: '6px 16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button
                        onClick={handleComment}
                        disabled={submittingComment}
                        style={{ padding: '6px 16px', background: '#8b5cf6', border: 'none', borderRadius: 20, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                      >
                        {submittingComment ? '…' : 'Comment'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
                <span onClick={() => navigate('/login')} style={{ color: '#8b5cf6', cursor: 'pointer' }}>Sign in</span> to comment
              </p>
            )}

            {/* Comment list */}
            {comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {comment.user?.avatar_url
                  ? <img src={comment.user.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{(comment.user?.full_name || comment.user?.username || '?')[0].toUpperCase()}</div>
                }
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{comment.user?.full_name ?? comment.user?.username}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{formatTime(comment.created_at)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5 }}>{comment.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>
                No comments yet. Be the first!
              </p>
            )}
          </div>
        </div>

        {/* ── Right sidebar: related videos ── */}
        <div className="watch-sidebar">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Up Next</h3>
          {relatedVideos.map(v => (
            <div
              key={v.id}
              onClick={() => navigate(`/watch/${v.id}`)}
              style={{ display: 'flex', gap: 8, marginBottom: 12, cursor: 'pointer', padding: 8, borderRadius: 8, transition: 'background 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 160, height: 90, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#111', position: 'relative' }}>
                <img
                  src={v.thumbnail_url ?? v.cloudflare_thumbnail ?? ''}
                  alt={v.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
                {v.duration_seconds > 0 && (
                  <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 11, padding: '1px 4px', borderRadius: 3 }}>
                    {formatDuration(v.duration_seconds)}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {v.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                  {v.creator?.full_name ?? v.creator?.username}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>
                  {formatViews(v.view_count)}
                </p>
              </div>
            </div>
          ))}
          {relatedVideos.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No other videos yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
