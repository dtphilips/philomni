import React, { useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge, Eye, GitFork } from 'lucide-react';
import RatingStars from '@/components/creative/RatingStars';

export default function SharedMarketplaceTab({ userId }) {
  const navigate = useNavigate();

  const { data: sharedProjects = [] } = useQuery({
    queryKey: ['user-marketplace-projects', userId],
    queryFn: async () => {
      const projects = await supabase.from('shared_projects').select('*') /* TODO filter: 
        { owner_id: userId, marketplace_type: { $ne: 'none' } },
        '-created_date',
        50
       */;

      const withRatings = await Promise.all(
        projects.map(async (proj) => {
          const ratings = (await supabase.from('template_ratings').select('*').eq('project_id', proj.id)).data ?? [];
          const avgRating =
            ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              : 0;
          return { ...proj, avgRating, ratingCount: ratings.length };
        })
      );
      return withRatings;
    },
    enabled: !!userId,
  });

  const { data: sharedVideos = [] } = useQuery({
    queryKey: ['user-marketplace-videos', userId],
    queryFn: async () => {
      const videos = await supabase.from('shared_videos').select('*') /* TODO filter: 
        { owner_id: userId, marketplace_type: { $ne: 'none' } },
        '-created_date',
        50
       */;

      const withRatings = await Promise.all(
        videos.map(async (vid) => {
          const ratings = (await supabase.from('video_ratings').select('*').eq('video_id', vid.id)).data ?? [];
          const avgRating =
            ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              : 0;
          return { ...vid, avgRating, ratingCount: ratings.length };
        })
      );
      return withRatings;
    },
    enabled: !!userId,
  });

  const templates = useMemo(
    () =>
      [
        ...sharedProjects.filter((p) => p.marketplace_type === 'template'),
        ...sharedVideos.filter((v) => v.marketplace_type === 'template'),
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    [sharedProjects, sharedVideos]
  );

  const assets = useMemo(
    () =>
      [
        ...sharedProjects.filter((p) => p.marketplace_type === 'asset'),
        ...sharedVideos.filter((v) => v.marketplace_type === 'asset'),
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    [sharedProjects, sharedVideos]
  );

  const renderItem = (item) => {
    const isVideo = 'video_url' in item;
    return (
      <button
        key={item.id}
        onClick={() =>
          navigate(isVideo ? `/shared-video/${item.id}` : `/shared-project/${item.id}`)
        }
        className="text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all group"
      >
        {/* Thumbnail */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {item.image_url || item.thumbnail_url ? (
            <img
              src={item.image_url || item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No thumbnail
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.marketplace_description}
            </p>
          </div>

          {/* Rating */}
          <div className="pt-2 border-t border-border">
            <RatingStars
              rating={item.avgRating}
              count={item.ratingCount}
              size="sm"
            />
          </div>

          {/* Stats */}
          <div className="flex gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{item.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              <span>{item.fork_count || 0}</span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  if (templates.length === 0 && assets.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground">No shared marketplace items yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Share projects to Creative Studio or Video Marketplace
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4">Templates ({templates.length})</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(renderItem)}
          </div>
        </div>
      )}

      {/* Assets */}
      {assets.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4">Assets ({assets.length})</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
}