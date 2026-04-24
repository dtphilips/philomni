import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CreatePost from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import FeedSearch from '@/components/feed/FeedSearch';
import StoryBar from '@/components/stories/StoryBar';
import TrendingSidebar from '@/components/feed/TrendingSidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Newspaper, Rss } from 'lucide-react';

// Skeleton card for loading state
function PostSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-muted rounded-full w-1/3" />
          <div className="h-2.5 bg-muted rounded-full w-1/4" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-muted rounded-full" />
        <div className="h-3 bg-muted rounded-full w-5/6" />
        <div className="h-3 bg-muted rounded-full w-4/6" />
      </div>
      <div className="h-48 bg-muted rounded-xl mb-4" />
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="flex-1 h-9 bg-muted rounded-lg" />)}
      </div>
    </div>
  );
}

export default function Feed() {
  const { user } = useOutletContext();
  const [tab, setTab] = useState('discover');
  const [filters, setFilters] = useState({ query: '', category: '', hashtag: '' });
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const pageSize = 10;

  const { data: posts = [], isLoading, isFetching } = useQuery({
    queryKey: ['posts', tab, page],
    queryFn: async () => {
      const newPosts = await base44.entities.Post.list('-created_date', pageSize, page * pageSize);
      if (page === 0) setAllPosts(newPosts);
      else setAllPosts(prev => [...prev, ...newPosts]);
      setHasMore(newPosts.length === pageSize);
      return newPosts;
    },
  });

  useEffect(() => {
    setPage(0);
    setAllPosts([]);
  }, [tab]);

  const { data: likes = [] } = useQuery({
    queryKey: ['likes', user?.id],
    queryFn: () => user ? base44.entities.Like.filter({ user_id: user.id }) : [],
    enabled: !!user,
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: () => user ? base44.entities.Bookmark.filter({ user_id: user.id }) : [],
    enabled: !!user,
  });

  const userLikePostIds = likes.map(l => l.post_id);
  const userBookmarkPostIds = bookmarks.map(b => b.post_id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && !isFetching && hasMore) setPage(p => p + 1); },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isFetching, hasMore]);

  const filteredPosts = useMemo(() => {
    const { query, category, hashtag } = filters;
    const source = allPosts.length > 0 ? allPosts : posts;
    if (!query && !category && !hashtag) return source.filter(p => p.visibility !== 'private');
    return source.filter(p => {
      if (p.visibility === 'private') return false;
      const q = query.toLowerCase().replace(/^#/, '');
      return (!query || p.content?.toLowerCase().includes(q) || p.hashtags?.some(h => h.toLowerCase().includes(q)) || p.author_name?.toLowerCase().includes(q))
        && (!category || p.hashtags?.some(h => h.toLowerCase() === category.toLowerCase()) || p.content?.toLowerCase().includes(category.toLowerCase()))
        && (!hashtag || p.hashtags?.some(h => h.toLowerCase() === hashtag.toLowerCase()));
    });
  }, [allPosts, posts, filters]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Main feed column */}
      <div className="lg:col-span-2 min-w-0 space-y-0">
        {/* Stories bar */}
        <div className="-mx-3 sm:-mx-4 md:-mx-5 lg:-mx-6 xl:-mx-8 mb-4">
          <StoryBar currentUser={user} />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary hidden sm:block" />
            <h1 className="font-display text-xl sm:text-2xl font-bold hidden sm:block">Feed</h1>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-muted h-9">
              <TabsTrigger value="discover" className="text-xs sm:text-sm gap-1.5">
                <Rss className="w-3.5 h-3.5" />Discover
              </TabsTrigger>
              <TabsTrigger value="following" className="text-xs sm:text-sm">Following</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Composer */}
        {user && <CreatePost user={user} />}

        {/* Search */}
        <FeedSearch onSearch={setFilters} />

        {/* Feed content */}
        {isLoading ? (
          <div className="space-y-4 mt-2">
            {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border mt-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {filters.query || filters.hashtag ? 'No posts match your search' : 'Nothing here yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {filters.query || filters.hashtag
                ? 'Try a different search term or clear the filters.'
                : 'Be the first to post! Your ideas inspire others.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                user={user}
                userLikes={userLikePostIds}
                userBookmarks={userBookmarkPostIds}
              />
            ))}

            <div ref={observerTarget} className="flex justify-center py-6">
              {isFetching && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
              {!hasMore && filteredPosts.length > 0 && (
                <p className="text-xs text-muted-foreground">You've seen everything · Check back later</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block sticky top-6 self-start">
        <TrendingSidebar />
      </aside>
    </div>
  );
}
