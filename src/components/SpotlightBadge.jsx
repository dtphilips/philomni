import React from 'react'

/**
 * SpotlightBadge — animated gold star shown next to the active spotlight winner's name.
 * Usage: <SpotlightBadge size="sm" /> or <SpotlightBadge size="lg" />
 */
export default function SpotlightBadge({ size = 'sm', className = '' }) {
  const dim = size === 'lg' ? 'w-5 h-5 text-base' : 'w-4 h-4 text-[11px]'

  return (
    <>
      <style>{`
        @keyframes spotlight-pulse {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 3px #f59e0b); }
          50%       { transform: scale(1.15); filter: drop-shadow(0 0 7px #f59e0b); }
        }
      `}</style>
      <span
        title="Philomni Spotlight Winner"
        className={`inline-flex items-center justify-center flex-shrink-0 ${dim} ${className}`}
        style={{ animation: 'spotlight-pulse 1.8s ease-in-out infinite' }}
      >
        ⭐
      </span>
    </>
  )
}
