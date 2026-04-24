import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Hash } from 'lucide-react';
import { CATEGORY_NAMES } from '@/lib/categories';

const POPULAR_HASHTAGS = ['tech', 'design', 'startup', 'marketing', 'finance', 'creator', 'investing', 'career'];

export default function FeedSearch({ onSearch }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeHashtag, setActiveHashtag] = useState('');

  const notify = (q, cat, tag) => {
    onSearch({ query: q, category: cat, hashtag: tag });
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    notify(e.target.value, activeCategory, activeHashtag);
  };

  const toggleCategory = (cat) => {
    const next = activeCategory === cat ? '' : cat;
    setActiveCategory(next);
    notify(query, next, activeHashtag);
  };

  const toggleHashtag = (tag) => {
    const next = activeHashtag === tag ? '' : tag;
    setActiveHashtag(next);
    notify(query, activeCategory, next);
  };

  const clearAll = () => {
    setQuery('');
    setActiveCategory('');
    setActiveHashtag('');
    notify('', '', '');
  };

  const hasFilters = query || activeCategory || activeHashtag;

  return (
    <div className="mb-5 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search posts by keyword or #hashtag..."
          value={query}
          onChange={handleQueryChange}
          className="pl-10 h-10 bg-muted/50"
        />
        {hasFilters && (
          <button onClick={clearAll} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hashtag chips */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        {POPULAR_HASHTAGS.map(tag => (
          <button
            key={tag}
            onClick={() => toggleHashtag(tag)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              activeHashtag === tag
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Category chips — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORY_NAMES.slice(0, 12).map(cat => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          Filtering by:{' '}
          {query && <span className="font-medium text-foreground">"{query}"</span>}
          {activeHashtag && <span className="font-medium text-foreground"> #{activeHashtag}</span>}
          {activeCategory && <span className="font-medium text-foreground"> · {activeCategory}</span>}
        </p>
      )}
    </div>
  );
}