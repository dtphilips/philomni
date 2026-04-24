/**
 * Section 10 Feature #1: Trending Topics Sidebar
 * Shows live trending hashtags, creator spotlight, and today's challenge.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { TrendingUp, Flame, Star, Hash, ChevronRight, Loader2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function useTopHashtags() {
  return useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const posts = await base44.entities.Post.list('-created_date', 100, 0);
      const counts = {};
      posts.forEach(p => {
        (p.hashtags || []).forEach(tag => {
          counts[tag] = (counts[tag] || 0) + (p.like_count || 0) + (p.comment_count || 0) + 1;
        });
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, score]) => ({ tag, score }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

function useTopCreators() {
  return useQuery({
    queryKey: ['top-creators'],
    queryFn: async () => {
      const { data } = await base44._supabase
        .from('users')
        .select('id, full_name, avatar_url, role, bio')
        .not('avatar_url', 'is', null)
        .limit(5);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

const DAILY_CHALLENGES = [
  '📸 Post a behind-the-scenes of your creative process',
  '🎯 Share your biggest win this week',
  '💡 Drop one piece of advice you wish you knew earlier',
  '🌍 Tell us what inspires you globally',
  '🎬 Show your workspace or studio setup',
  '🚀 Share a goal you\'re working toward this month',
  '🎵 Post a track or playlist fueling your work right now',
];

export default function TrendingSidebar() {
  const { data: hashtags = [], isLoading: loadingTags } = useTopHashtags();
  const { data: creators = [], isLoading: loadingCreators } = useTopCreators();

  // Deterministic daily challenge (changes daily)
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_CHALLENGES.length;
  const challenge = DAILY_CHALLENGES[dayIndex];

  return (
    <div className="space-y-4">
      {/* Today's Challenge */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Challenge</span>
        </div>
        <p className="text-sm font-medium leading-snug">{challenge}</p>
        <Button size="sm" className="mt-3 w-full text-xs h-8" variant="outline">
          Accept Challenge
        </Button>
      </div>

      {/* Trending Hashtags */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Trending Topics</h3>
        </div>
        {loadingTags ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : hashtags.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No trending topics yet</p>
        ) : (
          <div className="space-y-1">
            {hashtags.map((item, i) => (
              <div key={item.tag}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground/50 w-4">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">#{item.tag}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {i < 3 && <Flame className="w-3 h-3 text-orange-400" />}
                  <span className="text-xs text-muted-foreground">{item.score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creator Spotlight */}
      {!loadingCreators && creators.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold">Creators to Follow</h3>
          </div>
          <div className="space-y-3">
            {creators.map(creator => (
              <Link key={creator.id} to={`/user/${creator.id}`}
                className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0 overflow-hidden ring-2 ring-border">
                  {creator.avatar_url
                    ? <img src={creator.avatar_url} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {creator.full_name?.[0] || '?'}
                      </div>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{creator.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">{creator.role || 'Creator'}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              </Link>
            ))}
          </div>
          <Link to="/creators">
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-8 text-muted-foreground">
              View All Creators
            </Button>
          </Link>
        </div>
      )}

      {/* Philomni promo */}
      <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-4 text-primary-foreground">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <span className="font-bold text-sm font-display">P</span>
        </div>
        <h4 className="font-bold text-sm mb-1">Go Pro</h4>
        <p className="text-xs opacity-80 mb-3">Unlock AI tools, advanced analytics, priority in discovery, and more.</p>
        <Link to="/upgrade">
          <button className="w-full bg-white text-primary font-semibold text-xs py-2 rounded-lg hover:bg-white/90 transition-colors">
            Upgrade to Pro
          </button>
        </Link>
      </div>
    </div>
  );
}
