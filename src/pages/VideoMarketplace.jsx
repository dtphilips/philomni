import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, GitFork } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RatingStars from '@/components/creative/RatingStars';

export default function VideoMarketplace() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { data: videos = [] } = useQuery({
    queryKey: ['video-marketplace'],
    queryFn: async () => {
      const results = await supabase.from('shared_videos').select('*') /* TODO filter: {
        marketplace_type: { $ne: 'none' }
      }, '-created_date', 100 */;

      const withRatings = await Promise.all(
        results.map(async (vid) => {
          const ratings = (await supabase.from('video_ratings').select('*').eq('video_id', vid.id)).data ?? [];
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;
          return { ...vid, avgRating, ratingCount: ratings.length };
        })
      );
      return withRatings;
    },
  });

  const filteredVideos = useMemo(() => {
    let filtered = videos;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.prompt?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'top-rated') {
      filtered = [...filtered].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sortBy === 'most-forked') {
      filtered = [...filtered].sort((a, b) => (b.fork_count || 0) - (a.fork_count || 0));
    } else if (sortBy === 'most-viewed') {
      filtered = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }

    return filtered;
  }, [videos, searchQuery, sortBy]);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Video Marketplace</h1>
        <p className="text-sm text-muted-foreground">Discover and share AI-generated videos</p>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="mb-6 flex gap-2">
        <span className="text-sm text-muted-foreground pt-2">Sort:</span>
        {['newest', 'top-rated', 'most-forked', 'most-viewed'].map(sort => (
          <Button
            key={sort}
            variant={sortBy === sort ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(sort)}
            className="capitalize"
          >
            {sort === 'newest' && '📅 Newest'}
            {sort === 'top-rated' && '⭐ Top Rated'}
            {sort === 'most-forked' && '🔀 Most Forked'}
            {sort === 'most-viewed' && '👁 Most Viewed'}
          </Button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <button
            key={video.id}
            onClick={() => navigate(`/shared-video/${video.id}`)}
            className="text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all group"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-muted relative overflow-hidden">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">No thumbnail</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
              </div>

              {/* Rating */}
              <div className="pt-2 border-t border-border">
                <RatingStars rating={video.avgRating} count={video.ratingCount} size="sm" />
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{video.view_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>{video.fork_count || 0}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No videos found</p>
        </div>
      )}
    </div>
  );
}