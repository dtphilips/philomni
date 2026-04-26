import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, GitFork, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RatingStars from '@/components/creative/RatingStars';

export default function TemplateMarketplace() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { data: projects = [] } = useQuery({
    queryKey: ['marketplace-projects'],
    queryFn: async () => {
      const results = await supabase.from('shared_projects').select('*') /* TODO filter: {
        marketplace_type: { $ne: 'none' }
      }, '-created_date', 100 */;
      // Load ratings for all projects
      const withRatings = await Promise.all(
        results.map(async (proj) => {
          const ratings = (await supabase.from('template_ratings').select('*').eq('project_id', proj.id)).data ?? [];
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;
          return { ...proj, avgRating, ratingCount: ratings.length };
        })
      );
      return withRatings;
    },
  });

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.marketplace_type === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.marketplace_description?.toLowerCase().includes(q) ||
        p.prompt?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'top-rated') {
      filtered = [...filtered].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sortBy === 'most-forked') {
      filtered = [...filtered].sort((a, b) => (b.fork_count || 0) - (a.fork_count || 0));
    } else if (sortBy === 'most-viewed') {
      filtered = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }

    return filtered;
  }, [projects, activeTab, searchQuery, sortBy]);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Template Marketplace</h1>
        <p className="text-muted-foreground">Discover templates and assets created by the community. Fork any to use as your starting point.</p>
      </div>

      {/* Search */}
      <div className="mb-8 relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search templates, assets, or prompts..."
          className="pl-10"
        />
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

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        {[
          { id: 'all', label: 'All', icon: '🎨' },
          { id: 'template', label: 'Templates', icon: '📋' },
          { id: 'asset', label: 'Assets', icon: '🔧' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            <span className="ml-2 text-xs opacity-60">
              ({filteredProjects.filter(p => tab.id === 'all' || p.marketplace_type === tab.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map(project => (
          <div key={project.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
            {/* Image */}
            <div
              className="aspect-square bg-muted overflow-hidden group-hover:opacity-90 transition-opacity"
              onClick={() => navigate(`/shared-project/${project.id}`)}
            >
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold line-clamp-2">{project.title}</h3>
                  {project.style_emoji && (
                    <span className="text-lg flex-shrink-0">{project.style_emoji}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{project.owner_name}</p>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">
                {project.marketplace_description || project.prompt}
              </p>

              {/* Badge */}
              <Badge className="capitalize w-fit">
                {project.marketplace_type === 'template' ? '📋 Template' : '🔧 Asset'}
              </Badge>

              {/* Rating */}
              <div className="pt-2 border-t border-border">
                <RatingStars rating={project.avgRating} count={project.ratingCount} size="sm" />
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{project.view_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>{project.fork_count || 0}</span>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={() => navigate(`/shared-project/${project.id}`)}
                size="sm"
                className="w-full gap-2"
              >
                <GitFork className="w-3.5 h-3.5" />
                View & Fork
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found matching your search</p>
        </div>
      )}
    </div>
  );
}