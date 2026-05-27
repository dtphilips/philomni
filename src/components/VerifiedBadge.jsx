import React from 'react'

/**
 * VerifiedBadge — shows the correct tier badge inline next to a username.
 *
 * Props:
 *   type   'blue' | 'gold' | 'purple' | null
 *   size   'xs' | 'sm' | 'md' | 'lg'    (default 'sm')
 */
export default function VerifiedBadge({ type, size = 'sm' }) {
  if (!type) return null

  const dims = { xs: 12, sm: 15, md: 18, lg: 22 }[size] || 15

  const cfg = {
    blue:   { color: '#3b82f6', title: 'Identity Verified',  label: '✓' },
    gold:   { color: '#f59e0b', title: 'Pro Verified',       label: '✓' },
    purple: { color: '#a855f7', title: 'Business Verified',  label: '✓' },
  }[type]

  if (!cfg) return null

  return (
    <svg
      width={dims}
      height={dims}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      title={cfg.title}
      aria-label={cfg.title}
      className="inline-block flex-shrink-0 align-middle"
      style={{ verticalAlign: '-1px' }}
    >
      {/* Shield / badge shape */}
      <path
        d="M10 1.5L2.5 5v5c0 4.418 3.134 8.55 7.5 9.5 4.366-.95 7.5-5.082 7.5-9.5V5L10 1.5z"
        fill={cfg.color}
      />
      {/* Checkmark */}
      <path
        d="M6.5 10.5l2.5 2.5 4-4"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Inline variant — wraps name + badge in a flex span */
export function BadgedName({ name, badgeType, badgeSize = 'sm', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{name}</span>
      <VerifiedBadge type={badgeType} size={badgeSize} />
    </span>
  )
}
