import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { getTypeInfo, getTierInfo } from '../../lib/celebrations'

export default function CelebrationCard({ celebration, compact = false }) {
  const navigate  = useNavigate()
  const typeInfo  = getTypeInfo(celebration.celebration_type)
  const tierInfo  = getTierInfo(celebration.tier)
  const isGrand   = celebration.tier === 'grand' || celebration.tier === 'spotlight'
  const isFeatured = celebration.tier === 'featured'

  // Creator comes from the joined `creator` object batch-fetched by the parent
  const creator = celebration.creator
  const creatorName   = creator?.full_name  || 'Someone'
  const creatorAvatar = creator?.avatar_url || null
  const creatorPath   = creator?.id ? `/profile/${creator.id}` : null

  const timeLeft = celebration.expires_at
    ? (() => {
        const ms = new Date(celebration.expires_at) - new Date()
        if (ms <= 0) return 'Expired'
        const days = Math.floor(ms / 86400000)
        const hrs  = Math.floor((ms % 86400000) / 3600000)
        return days > 0 ? `${days}d left` : `${hrs}h left`
      })()
    : null

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/celebrations/${celebration.id}`)}
        className="flex-shrink-0 flex flex-col items-center gap-1 w-20 group"
      >
        <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${isGrand ? 'border-yellow-400' : isFeatured ? 'border-amber-400/70' : 'border-primary/40'}`}>
          {celebration.honoree_photo_url
            ? <img src={celebration.honoree_photo_url} alt={celebration.honoree_name} className="w-full h-full object-cover" />
            : <div className={`w-full h-full bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center text-white text-2xl`}>{typeInfo.emoji}</div>
          }
          <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">{typeInfo.emoji}</span>
        </div>
        <span className="text-[11px] text-foreground font-medium text-center leading-tight line-clamp-1 w-full">{celebration.honoree_name}</span>
        {tierInfo.badge && <span className="text-[10px] text-amber-400">{tierInfo.badge}</span>}
      </button>
    )
  }

  return (
    <div
      onClick={() => navigate(`/celebrations/${celebration.id}`)}
      className={`bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isGrand    ? 'border-yellow-400/60 grand-shimmer col-span-2' :
        isFeatured ? 'border-amber-400/40' :
                     'border-border/60'
      }`}
    >
      {/* Creator attribution header — two separate clickable spans, never nested <a> */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0 text-[11px] text-muted-foreground flex-wrap">
        <button
          onClick={e => { e.stopPropagation(); if (creatorPath) navigate(creatorPath) }}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
            {creatorAvatar
              ? <img src={creatorAvatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-primary text-[9px] font-bold">{creatorName[0]}</div>
            }
          </div>
          <span className="font-semibold text-foreground">{creatorName}</span>
        </button>
        <span>is celebrating</span>
        {celebration.honoree_user
          ? <button
              onClick={e => { e.stopPropagation(); navigate(`/profile/${celebration.honoree_user.id}`) }}
              className="font-semibold text-primary hover:underline"
            >
              {celebration.honoree_name}
            </button>
          : <span className="font-semibold text-foreground">{celebration.honoree_name}</span>
        }
      </div>

      {/* Grand: full-width hero */}
      {isGrand ? (
        <div className="relative h-48 overflow-hidden mt-2">
          {celebration.honoree_photo_url
            ? <img src={celebration.honoree_photo_url} alt={celebration.honoree_name} className="w-full h-full object-cover" />
            : <div className={`w-full h-full bg-gradient-to-br ${typeInfo.gradient}`} />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{typeInfo.emoji}</span>
              <span className="text-xs text-white/80 font-medium">{typeInfo.label}</span>
              <span className="ml-auto text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full font-bold border border-yellow-400/40">
                {tierInfo.badge} {tierInfo.label}
              </span>
            </div>
            <h3 className="text-white font-black text-lg leading-tight">{celebration.title}</h3>
          </div>
        </div>
      ) : (
        <div className="p-4 pt-2">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
              {celebration.honoree_photo_url
                ? <img src={celebration.honoree_photo_url} alt={celebration.honoree_name} className="w-full h-full object-cover" />
                : <div className={`w-full h-full bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center text-2xl`}>{typeInfo.emoji}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-base">{typeInfo.emoji}</span>
                <span className="text-xs text-muted-foreground">{typeInfo.label}</span>
                {tierInfo.badge && (
                  <span className={`text-xs font-bold ${tierInfo.color}`}>{tierInfo.badge} {tierInfo.label}</span>
                )}
              </div>
              <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2">{celebration.title}</h3>
            </div>
          </div>
        </div>
      )}

      <div className={`${isGrand ? '' : 'px-4'} pb-3`}>
        {!isGrand && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {celebration.message?.slice(0, 80)}{celebration.message?.length > 80 ? '…' : ''}
          </p>
        )}

        <div className={`flex items-center justify-between text-xs text-muted-foreground ${isGrand ? 'px-4 pt-2' : ''}`}>
          <div className="flex items-center gap-3">
            <span>❤️ {celebration.reaction_count || 0}</span>
            <span>💬 {celebration.wish_count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            {timeLeft && <span className="text-[10px] text-muted-foreground/70">{timeLeft}</span>}
            {celebration.is_sponsored && (
              <span className="text-[10px] text-emerald-500 font-medium">Sponsored</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
