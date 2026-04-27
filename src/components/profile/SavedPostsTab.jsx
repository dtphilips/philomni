import React, { useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import PostCard from '@/components/feed/PostCard';
import { Bookmark } from 'lucide-react';

export default function SavedPostsTab({ userId, currentUser }) {
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['user-bookmarks', userId],
    queryFn: async () => { const { data } = await supabase.from('bookmarks').select('*').eq('user_id', userId); return data ?? []; },
    enabled: !!userId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['all-posts-for-saved'],
    queryFn: () => supabase.from('posts').select('*'),
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['user-likes', userId],
    queryFn: async () => { const { data } = await supabase.from('likes').select('*').eq('user_id', userId); return data ?? []; },
    enabled: !!userId,
  });

  const bookmarkedPostIds = useMemo(() => bookmarks.map((b) => b.post_id), [bookmarks]);
  const likedPostIds = useMemo(() => likes.map((l) => l.post_id), [likes]);

  const savedPosts = useMemo(
    () =>
      posts
        .filter((p) => bookmarkedPostIds.includes(p.id) && p.visibility === 'public')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    [posts, bookmarkedPostIds]
  );

  return (
    <div>
      {savedPosts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Bookmark className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No saved posts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Save posts from the feed to revisit them later
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            {savedPosts.length} saved post{savedPosts.length !== 1 ? 's' : ''}
          </p>
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={currentUser}
              userLikes={likedPostIds}
              userBookmarks={bookmarkedPostIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}