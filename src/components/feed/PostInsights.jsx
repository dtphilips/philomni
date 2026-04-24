/**
 * Section 10 Feature #3: Post Performance Insights
 * Inline analytics shown to the post author — estimated reach, engagement rate, best action.
 */
import React, { useState } from 'react';
import { BarChart2, Eye, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

function estimateReach(likeCount = 0, commentCount = 0, shareCount = 0) {
  // Rough organic-reach model: each interaction exposes post to ~15 people on avg
  return Math.max(1, (likeCount * 12 + commentCount * 18 + shareCount * 25));
}

function engagementRate(likeCount = 0, commentCount = 0, shareCount = 0, reach = 1) {
  const interactions = likeCount + commentCount + shareCount;
  return reach > 0 ? ((interactions / reach) * 100).toFixed(1) : '0.0';
}

const TIPS = [
  'Reply to comments to boost engagement.',
  'Add a question to drive more comments.',
  'Pin this post to your profile for more visibility.',
  'Share this to your story to reach followers.',
  'Add more hashtags next time for wider reach.',
];

export default function PostInsights({ post, isAuthor }) {
  const [open, setOpen] = useState(false);
  if (!isAuthor) return null;

  const reach = estimateReach(post.like_count, post.comment_count, post.share_count);
  const eng = engagementRate(post.like_count, post.comment_count, post.share_count, reach);
  const tip = TIPS[(post.id?.charCodeAt(0) || 0) % TIPS.length];

  return (
    <div className="border-t border-border/50">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5" />
          View post insights
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <Eye className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
              <p className="text-sm font-bold">{reach.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Est. Reach</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-500 mx-auto mb-1" />
              <p className="text-sm font-bold">{eng}%</p>
              <p className="text-[10px] text-muted-foreground">Engagement</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <BarChart2 className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
              <p className="text-sm font-bold">{(post.like_count || 0) + (post.comment_count || 0) + (post.share_count || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Interactions</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Tip: </span>{tip}
          </div>
        </div>
      )}
    </div>
  );
}
