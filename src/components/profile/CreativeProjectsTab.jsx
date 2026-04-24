import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Eye, GitFork, Star } from 'lucide-react';
import RatingStars from '@/components/creative/RatingStars';

export default function CreativeProjectsTab({ userId }) {
  const navigate = useNavigate();

  const { data: sharedProjects = [] } = useQuery({
    queryKey: ['user-creative-projects', userId],
    queryFn: async () => {
      const projects = await base44.entities.SharedProject.filter(
        { owner_id: userId },
        '-created_date',
        50
      );

      // Load ratings for each project
      const withRatings = await Promise.all(
        projects.map(async (proj) => {
          const ratings = await base44.entities.TemplateRating.filter({
            project_id: proj.id,
          });
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
    queryKey: ['user-videos', userId],
    queryFn: async () => {
      const videos = await base44.entities.SharedVideo.filter(
        { owner_id: userId },
        '-created_date',
        50
      );

      const withRatings = await Promise.all(
        videos.map(async (vid) => {
          const ratings = await base44.entities.VideoRating.filter({
            video_id: vid.id,
          });
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

  const allProjects = [
    ...sharedProjects.map((p) => ({
      ...p,
      type: 'image',
      itemType: 'project',
    })),
    ...sharedVideos.map((v) => ({
      ...v,
      type: 'video',
      itemType: 'video',
    })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  if (allProjects.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground">No creative projects yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create images or videos in Creative Studio to share them
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allProjects.map((project) => (
        <button
          key={project.id}
          onClick={() =>
            navigate(
              project.itemType === 'video'
                ? `/shared-video/${project.id}`
                : `/shared-project/${project.id}`
            )
          }
          className="text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all group"
        >
          {/* Thumbnail */}
          <div className="aspect-square bg-muted relative overflow-hidden">
            {project.image_url || project.thumbnail_url ? (
              <img
                src={project.image_url || project.thumbnail_url}
                alt={project.title}
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
            <h3 className="font-semibold text-sm line-clamp-1">{project.title}</h3>

            {/* Rating */}
            <div className="pt-2 border-t border-border">
              <RatingStars
                rating={project.avgRating}
                count={project.ratingCount}
                size="sm"
              />
            </div>

            {/* Stats */}
            <div className="flex gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{project.view_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5" />
                <span>{project.fork_count || 0}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}