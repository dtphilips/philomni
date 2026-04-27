import React, { useMemo } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PostCard from '@/components/feed/PostCard';

export default function LikedFavoritesTab({ userId, currentUser }) {
  const navigate = useNavigate();

  const { data: likes = [] } = useQuery({
    queryKey: ['user-likes', userId],
    queryFn: async () => { const { data } = await supabase.from('likes').select('*').eq('user_id', userId); return data ?? []; },
    enabled: !!userId,
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['user-bookmarks', userId],
    queryFn: async () => { const { data } = await supabase.from('bookmarks').select('*').eq('user_id', userId); return data ?? []; },
    enabled: !!userId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['all-posts-for-likes'],
    queryFn: () => supabase.from('posts').select('*'),
  });

  const likedPostIds = useMemo(() => likes.map((l) => l.post_id), [likes]);
  const bookmarkedPostIds = useMemo(() => bookmarks.map((b) => b.post_id), [bookmarks]);

  const likedPosts = useMemo(
    () =>
      posts
        .filter((p) => likedPostIds.includes(p.id) && p.visibility === 'public')
        .sort(
          (a, b) =>
            new Date(b.created_date) - new Date(a.created_date)
        ),
    [posts, likedPostIds]
  );

  const bookmarkedPosts = useMemo(
    () =>
      posts
        .filter((p) => bookmarkedPostIds.includes(p.id) && p.visibility === 'public')
        .sort(
          (a, b) =>
            new Date(b.created_date) - new Date(a.created_date)
        ),
    [posts, bookmarkedPostIds]
  );

  return (
    <div className="space-y-8">
      {/* Liked Posts */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Liked Posts ({likedPosts.length})</h3>
        {likedPosts.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No liked posts yet</p>
        ) : (
          <div className="space-y-4">
            {likedPosts.map((post) => (
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

      {/* Bookmarked Posts */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Bookmarked Posts ({bookmarkedPosts.length})</h3>
        {bookmarkedPosts.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No bookmarked posts yet</p>
        ) : (
          <div className="space-y-4">
            {bookmarkedPosts.map((post) => (
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
    </div>
  );
}