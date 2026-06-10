import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Loader2, Eye, Clock, ArrowLeft } from 'lucide-react'

function formatDuration(secs) {
  if (!secs) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Watch() {
  const { videoId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [video, setVideo] = useState(null)
  const [creator, setCreator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }
      setVideo(data)

      // Load creator
      if (data.creator_id) {
        const { data: c } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url')
          .eq('id', data.creator_id)
          .single()
        setCreator(c)
      }

      // Increment view count
      await supabase.rpc('increment_video_views', { p_video_id: videoId })

      // Record watch session
      if (user?.id) {
        await supabase.from('video_watches').insert({
          video_id: videoId,
          viewer_id: user.id,
        })
      }

      setLoading(false)
    }
    if (videoId) load()
  }, [videoId, user?.id])

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (notFound || !video) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
      <div className="text-5xl">📹</div>
      <p className="text-foreground font-semibold">Video not found</p>
      <p className="text-muted-foreground text-sm">This video may still be processing or doesn't exist.</p>
      <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline">Go back</button>
    </div>
  )

  // Cloudflare Stream embed URL from cloudflare_uid
  const embedUrl = video.cloudflare_uid
    ? `https://customer-lrknbwoduz.cloudflarestream.com/${video.cloudflare_uid}/iframe`
    : null

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Player */}
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl mb-4">
        {video.cloudflare_status === 'ready' && embedUrl ? (
          <iframe
            src={embedUrl}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            title={video.title}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/50">
            {video.cloudflare_status === 'processing' || video.cloudflare_status === 'uploading'
              ? <>
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-sm">Video is still processing…</p>
                </>
              : video.thumbnail_url
                ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                : <>
                    <div className="text-5xl">📹</div>
                    <p className="text-sm">Video unavailable</p>
                  </>
            }
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 mb-4 shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-2 leading-snug">{video.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {(video.view_count || 0).toLocaleString()} views
          </span>
          {video.duration_seconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {formatDuration(video.duration_seconds)}
            </span>
          )}
          {video.category && (
            <span className="px-2 py-0.5 bg-muted rounded-full text-xs">{video.category}</span>
          )}
        </div>

        {/* Creator */}
        {creator && (
          <div
            className="flex items-center gap-3 mt-4 pt-4 border-t border-border/60 cursor-pointer"
            onClick={() => navigate(`/profile/${creator.id}`)}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center flex-shrink-0">
              {creator.avatar_url
                ? <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover" />
                : <span className="text-primary font-bold text-sm">{(creator.full_name || 'C')[0]}</span>
              }
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{creator.full_name}</p>
              {creator.username && <p className="text-muted-foreground text-xs">@{creator.username}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {video.description && (
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium mb-2">About this video</p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{video.description}</p>
        </div>
      )}
    </div>
  )
}
