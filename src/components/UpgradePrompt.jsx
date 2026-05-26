import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'

/**
 * Inline upgrade prompt — shown whenever a usage limit is hit.
 *
 * Props:
 *   reason    string  — the message from canUse().reason (required)
 *   compact   bool    — smaller variant for tight spaces (default false)
 *   className string  — extra Tailwind classes
 */
export default function UpgradePrompt({ reason, compact = false, className = '' }) {
  const navigate = useNavigate()
  if (!reason) return null

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20 ${className}`}>
        <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{reason}</p>
        <button
          onClick={() => navigate('/pricing')}
          className="text-xs font-semibold text-primary hover:text-primary/80 flex-shrink-0 transition-colors"
        >
          Upgrade →
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Zap className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground mb-0.5">Limit reached</p>
        <p className="text-sm text-muted-foreground leading-snug">{reason}</p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0 mt-0.5"
      >
        Upgrade
      </button>
    </div>
  )
}

/**
 * Pro badge chip — small indicator for locked features.
 * Usage: <ProBadge /> next to locked feature labels.
 */
export function ProBadge({ label = 'Pro', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 ${className}`}>
      <Zap className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}
