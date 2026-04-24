import React from 'react';
import { computeMatchScore, getMatchLabel } from '@/lib/matchScore';
import { Zap } from 'lucide-react';

export default function MatchScoreBadge({ user, job }) {
  // Only show for roles that can be matched (creators, professionals)
  if (!user || !['creator', 'professional'].includes(user.role)) return null;

  const score = computeMatchScore(user, job);
  if (score === 0) return null;

  const { label, color, bg } = getMatchLabel(score);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${bg} ${color}`}>
      <Zap className="w-3 h-3" />
      <span>{score}% {label}</span>
    </div>
  );
}