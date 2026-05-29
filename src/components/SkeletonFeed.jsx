import React from 'react'

/**
 * SkeletonCard — single animated card placeholder.
 * Matches the visual size of a typical feed post.
 */
export function SkeletonCard({ showMedia = true }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 animate-pulse">
      {/* Avatar + name row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-muted flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded-full w-1/3" />
          <div className="h-2.5 bg-muted rounded-full w-1/4" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-muted rounded-full" />
        <div className="h-3 bg-muted rounded-full w-4/5" />
        <div className="h-3 bg-muted rounded-full w-3/5" />
      </div>
      {/* Media placeholder */}
      {showMedia && <div className="h-44 bg-muted rounded-xl" />}
    </div>
  )
}

/**
 * SkeletonFeed — renders N skeleton cards.
 * Use as the loading state for any feed or list.
 *
 * @param {number} count - Number of skeleton cards (default 3)
 * @param {boolean} showMedia - Whether to include a media placeholder
 */
export default function SkeletonFeed({ count = 3, showMedia = true }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} showMedia={showMedia} />
      ))}
    </div>
  )
}
