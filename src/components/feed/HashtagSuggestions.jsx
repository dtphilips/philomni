/**
 * Section 10 Feature #2: Smart Hashtag Suggestions
 * Analyzes post content via Claude and suggests relevant hashtags.
 * Used inside CreatePost — shows below the editor when content is present.
 */
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Hash, Loader2, X } from 'lucide-react';

function extractPlainText(html) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}

export default function HashtagSuggestions({ content, onAdd }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const timerRef = useRef(null);
  const lastContent = useRef('');

  useEffect(() => {
    const plain = extractPlainText(content).trim();
    if (plain.length < 20 || plain === lastContent.current) return;
    lastContent.current = plain;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this social media post and suggest 6-8 highly relevant hashtags that would maximize reach. Return ONLY a JSON array of strings without # symbol. Example: ["creativity","design","inspiration"]\n\nPost: "${plain.slice(0, 500)}"`,
        });
        const text = typeof res === 'string' ? res : (res?.result ?? '');
        const match = text.match(/\[[\s\S]*?\]/);
        if (match) {
          const tags = JSON.parse(match[0]).filter(t => typeof t === 'string' && t.length > 0);
          setSuggestions(tags.slice(0, 8));
          setDismissed([]);
        }
      } catch { /* silent — suggestions are optional */ }
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timerRef.current);
  }, [content]);

  const visible = suggestions.filter(t => !dismissed.includes(t));
  if (!visible.length && !loading) return null;

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Hash className="w-3 h-3" />}
          <span>{loading ? 'Suggesting hashtags…' : 'Suggested:'}</span>
        </div>
        {visible.map(tag => (
          <button key={tag}
            onClick={() => { onAdd?.(tag); setDismissed(prev => [...prev, tag]); }}
            className="inline-flex items-center gap-0.5 text-xs bg-primary/8 hover:bg-primary/15 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 transition-all font-medium group">
            #{tag}
            <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
              onClick={e => { e.stopPropagation(); setDismissed(prev => [...prev, tag]); }} />
          </button>
        ))}
      </div>
    </div>
  );
}
