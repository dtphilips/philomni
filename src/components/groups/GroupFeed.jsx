import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Pin, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function GroupFeed({ groupId, user, canModerate }) {
  const [newPostContent, setNewPostContent] = useState('');
  const queryClient = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: groupId }, '-created_date'),
  });

  const createPostMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.GroupPost.create({
        group_id: groupId,
        author_id: user.id,
        author_name: user.full_name,
        author_avatar: user.avatar_url || '',
        content: content.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      setNewPostContent('');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.GroupPost.delete(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts'] }),
  });

  const togglePinMutation = useMutation({
    mutationFn: (postId) => {
      const post = posts.find(p => p.id === postId);
      return base44.entities.GroupPost.update(postId, { is_pinned: !post.is_pinned });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts'] }),
  });

  const pinnedPosts = posts.filter(p => p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned);

  return (
    <div className="space-y-4">
      {/* New Post */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium">{user.full_name?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Textarea
              placeholder="Share your thoughts with the group..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              size="sm"
              onClick={() => createPostMutation.mutate(newPostContent)}
              disabled={!newPostContent.trim() || createPostMutation.isPending}
              className="mt-2"
            >
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </div>
      </div>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Pin className="w-4 h-4" /> Pinned Posts
          </h3>
          {pinnedPosts.map(post => (
            <div key={post.id} className="bg-primary/5 border-l-4 border-primary rounded-lg p-4">
              <PostItem post={post} user={user} canModerate={canModerate} onDelete={deletePostMutation.mutate} onTogglePin={togglePinMutation.mutate} />
            </div>
          ))}
        </div>
      )}

      {/* Regular Posts */}
      <div className="space-y-3">
        {regularPosts.length === 0 && !pinnedPosts.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          regularPosts.map(post => (
            <PostItem
              key={post.id}
              post={post}
              user={user}
              canModerate={canModerate}
              onDelete={deletePostMutation.mutate}
              onTogglePin={togglePinMutation.mutate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PostItem({ post, user, canModerate, onDelete, onTogglePin }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      {/* Author */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={post.author_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium">{post.author_name?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{post.author_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
            </p>
          </div>
        </div>
        {(canModerate || post.author_id === user.id) && (
          <div className="flex gap-1">
            {canModerate && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onTogglePin(post.id)}
              >
                <Pin className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div className="grid gap-2">
          {post.media_urls.map((url, i) => (
            <img key={i} src={url} alt="Post media" className="rounded-lg max-h-64 object-cover w-full" />
          ))}
        </div>
      )}

      {/* Engagement */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <Heart className="w-4 h-4" />
          <span>{post.like_count || 0}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comment_count || 0}</span>
        </button>
      </div>
    </div>
  );
}