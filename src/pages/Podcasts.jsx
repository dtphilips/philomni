import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Mic, Play, Pause, Star, Headphones, Search, TrendingUp,
  Clock, Users, BookOpen, Heart, Share2, ChevronRight,
  Sparkles, Radio, Zap, Music2
} from 'lucide-react';
import { usePodcastPlayer } from '@/lib/PodcastPlayerContext';
import { toast } from 'sonner';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Business', value: 'Business', icon: '💼' },
  { label: 'Technology', value: 'Technology', icon: '⚡' },
  { label: 'Comedy', value: 'Comedy', icon: '😂' },
  { label: 'Education', value: 'Education', icon: '📚' },
  { label: 'Health', value: 'Health & Fitness', icon: '💪' },
  { label: 'Arts', value: 'Arts', icon: '🎨' },
  { label: 'True Crime', value: 'True Crime', icon: '🔍' },
  { label: 'News', value: 'News', icon: '📰' },
  { label: 'Sports', value: 'Sports', icon: '🏆' },
  { label: 'Science', value: 'Science', icon: '🔬' },
];

const MOCK_PODCASTS = [
  {
    id: 'mock-1', title: 'Creator Economy Weekly', category: 'Business',
    cover_image_url: null, description: 'Insights on building your creator business, monetization strategies, and growing your audience.',
    subscriber_count: 12400, average_rating: 4.8, total_episodes: 87,
    creator_name: 'Alex Rivera', is_featured: true,
    episodes: [
      { id: 'ep1', title: 'How to 10x Your Newsletter Revenue', duration_seconds: 2820, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 3200 },
      { id: 'ep2', title: 'The Brand Deal Playbook', duration_seconds: 3540, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 2900 },
      { id: 'ep3', title: 'Building a $1M Creator Business', duration_seconds: 4200, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 5100 },
    ]
  },
  {
    id: 'mock-2', title: 'Deep Tech Talks', category: 'Technology',
    cover_image_url: null, description: 'Conversations with AI researchers, founders, and engineers shaping the future of technology.',
    subscriber_count: 8700, average_rating: 4.6, total_episodes: 134,
    creator_name: 'Sam Chen', is_featured: true,
    episodes: [
      { id: 'ep4', title: 'The Future of Generative AI in 2025', duration_seconds: 3600, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 7800 },
      { id: 'ep5', title: 'Building with Claude and GPT-4', duration_seconds: 2700, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 4200 },
    ]
  },
  {
    id: 'mock-3', title: 'The Wellness Revolution', category: 'Health & Fitness',
    cover_image_url: null, description: 'Science-backed wellness, mental health, and biohacking for high performers.',
    subscriber_count: 21000, average_rating: 4.9, total_episodes: 210,
    creator_name: 'Dr. Maya Patel',
    episodes: [
      { id: 'ep6', title: 'Sleep Optimization for Creators', duration_seconds: 2400, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 9400 },
    ]
  },
  {
    id: 'mock-4', title: 'Laugh Out Loud', category: 'Comedy',
    cover_image_url: null, description: 'Weekly comedy conversations, improv stories, and the funniest takes on modern life.',
    subscriber_count: 34000, average_rating: 4.7, total_episodes: 312,
    creator_name: 'Kai & Jordan',
    episodes: [
      { id: 'ep7', title: 'Live from NYC — Crowd Work Edition', duration_seconds: 4800, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 18200 },
    ]
  },
  {
    id: 'mock-5', title: 'Art & Soul', category: 'Arts',
    cover_image_url: null, description: 'Conversations with visual artists, musicians, writers, and creative visionaries.',
    subscriber_count: 6200, average_rating: 4.5, total_episodes: 56,
    creator_name: 'Priya Sharma',
    episodes: [
      { id: 'ep8', title: 'Finding Your Creative Voice', duration_seconds: 3000, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 2100 },
    ]
  },
  {
    id: 'mock-6', title: 'Learning Lab', category: 'Education',
    cover_image_url: null, description: 'Practical skills, study science, and expert knowledge from top educators worldwide.',
    subscriber_count: 15600, average_rating: 4.8, total_episodes: 178,
    creator_name: 'Prof. David Kim',
    episodes: [
      { id: 'ep9', title: 'The Science of Habit Formation', duration_seconds: 3300, audio_url: 'https://archive.org/download/testmp3testfile/testmp3testfile_64kb.mp3', play_count: 6700 },
    ]
  },
];

const COLORS = [
  'from-violet-600 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
];

function PodcastCover({ podcast, size = 'md' }) {
  const color = COLORS[parseInt(podcast.id?.slice(-1) || '0', 16) % COLORS.length];
  const sz = size === 'lg' ? 'w-full aspect-square' : size === 'sm' ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20';
  if (podcast.cover_image_url) {
    return <img src={podcast.cover_image_url} className={`${sz} rounded-xl object-cover`} alt={podcast.title} />;
  }
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
      <Mic className={size === 'lg' ? 'w-12 h-12 text-white/80' : 'w-5 h-5 text-white/80'} />
    </div>
  );
}

function EpisodeRow({ episode, podcast, isPlaying, onPlay }) {
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <button
      onClick={() => onPlay(episode, podcast)}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
        ${isPlaying ? 'bg-primary text-white' : 'bg-muted group-hover:bg-primary/10'}`}>
        {isPlaying
          ? <Pause className="w-3.5 h-3.5" />
          : <Play className="w-3.5 h-3.5 text-primary ml-0.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isPlaying ? 'text-primary' : ''}`}>{episode.title}</p>
        <p className="text-xs text-muted-foreground">
          {fmt(episode.duration_seconds)} ·{' '}
          {(episode.play_count || 0).toLocaleString()} plays
        </p>
      </div>
    </button>
  );
}

function PodcastCard({ podcast, variant = 'grid' }) {
  const { play, pause, episode: currentEpisode, isPlaying } = usePodcastPlayer();
  const [expanded, setExpanded] = useState(false);

  const handlePlayEpisode = (ep, pod) => {
    const epWithMeta = {
      ...ep,
      podcast_name: pod.title,
      cover_image_url: pod.cover_image_url,
    };
    if (currentEpisode?.id === ep.id && isPlaying) {
      pause();
    } else {
      play(epWithMeta);
    }
  };

  const handleSubscribe = () => {
    toast.success(`Subscribed to "${podcast.title}"!`);
  };

  if (variant === 'featured') {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-900/40" />
        <div className="relative z-20 p-5 flex flex-col h-full min-h-[220px]">
          <div className="flex items-start gap-4 mb-auto">
            <PodcastCover podcast={podcast} size="md" />
            <div className="flex-1 min-w-0">
              <Badge className="mb-1.5 text-xs bg-primary/20 text-primary border-primary/30">{podcast.category}</Badge>
              <h3 className="font-bold text-lg text-white leading-tight">{podcast.title}</h3>
              <p className="text-sm text-white/60 mt-0.5">by {podcast.creator_name}</p>
            </div>
          </div>
          <p className="text-sm text-white/70 line-clamp-2 mb-4">{podcast.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(podcast.subscriber_count || 0).toLocaleString()}</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{podcast.average_rating?.toFixed(1)}</span>
              <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{podcast.total_episodes} eps</span>
            </div>
            <Button size="sm" onClick={handleSubscribe} className="text-xs h-8 px-3 bg-white text-black hover:bg-white/90">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <PodcastCover podcast={podcast} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight truncate">{podcast.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{podcast.creator_name}</p>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0">{podcast.category}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{podcast.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {podcast.average_rating > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" />{podcast.average_rating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{podcast.total_episodes} eps</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(podcast.subscriber_count || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={handleSubscribe}>
            <Heart className="w-3 h-3 mr-1.5" /> Subscribe
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs px-2" onClick={() => {
            toast.success('Link copied!');
          }}>
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs px-2" onClick={() => setExpanded(v => !v)}>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </div>

      {expanded && podcast.episodes && podcast.episodes.length > 0 && (
        <div className="border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Episodes</p>
          {podcast.episodes.map(ep => (
            <EpisodeRow
              key={ep.id}
              episode={ep}
              podcast={podcast}
              isPlaying={currentEpisode?.id === ep.id && isPlaying}
              onPlay={handlePlayEpisode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card border border-border rounded-2xl p-4">
          <div className="flex gap-3">
            <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Podcasts() {
  const { user } = useOutletContext();
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');

  const { data: livePodcasts = [], isLoading } = useQuery({
    queryKey: ['podcasts-discover'],
    queryFn: () => base44.entities.Podcast.list('-created_date', 50),
    staleTime: 60_000,
  });

  // Merge live + mock, deduplicate by id
  const allPodcasts = [
    ...livePodcasts,
    ...MOCK_PODCASTS.filter(m => !livePodcasts.find(l => l.id === m.id)),
  ];

  const filtered = allPodcasts.filter(p => {
    const matchCat = !category || p.category === category;
    const matchQ = !query || p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.creator_name?.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  const featured = filtered.filter(p => p.is_featured || p.subscriber_count > 10000);
  const trending = [...filtered].sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0)).slice(0, 6);
  const recent = [...filtered].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 6);
  const showAll = filtered.filter(p => !p.is_featured);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #1e0a3c 0%, #2d1b69 50%, #1a0a2e 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #9333ea, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Radio className="w-4 h-4 text-primary" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Discover</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Podcasts</h1>
            <p className="text-white/60 text-sm sm:text-base max-w-md">
              Listen to creators, experts, and storytellers. Subscribe to shows you love.
            </p>
          </div>
          {user && (
            <Link to="/podcast-studio">
              <Button className="flex-shrink-0 gap-2 bg-white text-black hover:bg-white/90">
                <Mic className="w-4 h-4" />
                Your Studio
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-5 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search podcasts or creators..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              category === cat.value
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSkeleton />}

      {!isLoading && (
        <>
          {/* Featured */}
          {!query && !category && featured.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Featured</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featured.slice(0, 2).map(p => (
                  <PodcastCard key={p.id} podcast={p} variant="featured" />
                ))}
              </div>
            </section>
          )}

          {/* Trending */}
          {!query && trending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Trending Now</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trending.map(p => (
                  <PodcastCard key={p.id} podcast={p} />
                ))}
              </div>
            </section>
          )}

          {/* Search results */}
          {query && (
            <section>
              <h2 className="font-bold text-base mb-4">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
              </h2>
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Mic className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No podcasts found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(p => <PodcastCard key={p.id} podcast={p} />)}
                </div>
              )}
            </section>
          )}

          {/* All podcasts when filtering by category */}
          {!query && category && (
            <section>
              <h2 className="font-bold text-base mb-4">{category}</h2>
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Mic className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No podcasts in this category yet</p>
                  {user && (
                    <Link to="/podcast-studio">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Mic className="w-3.5 h-3.5" /> Start a Podcast
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(p => <PodcastCard key={p.id} podcast={p} />)}
                </div>
              )}
            </section>
          )}

          {/* New & Noteworthy */}
          {!query && !category && recent.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">New & Noteworthy</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {showAll.slice(0, 6).map(p => <PodcastCard key={p.id} podcast={p} />)}
              </div>
            </section>
          )}

          {/* CTA for non-logged-in users */}
          {!user && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <Mic className="w-10 h-10 mx-auto mb-3 text-primary" />
              <h3 className="font-bold text-lg mb-1">Start Your Own Podcast</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                Join Philomni to publish episodes, grow subscribers, and monetize your voice.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/signup">
                  <Button className="gap-2" style={{ background: 'linear-gradient(135deg,#6d28d9,#9333ea)' }}>
                    <Mic className="w-4 h-4" /> Create Free Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline">Sign in</Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
