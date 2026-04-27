import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { extractMentionedUsers } from '@/components/common/extractMentions';

export default function PostComments({ postId, user }) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => { const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false }).limit(50); return data ?? []; },
  });

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    // Extract mentioned users
    const allUsers = await supabase.from('users').select('*').limit(100).then(r => r.data ?? []);
    const mentionedUserIds = extractMentionedUsers(newComment, allUsers);

    const { data: comment } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url || '',
      content: newComment.trim(),
      mentioned_user_ids: mentionedUserIds,
    }).select().single();

    // Send mention notifications
    for (const userId of mentionedUserIds) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'mention',
        title: `${user.full_name} mentioned you in a comment`,
        message: newComment.substring(0, 100),
        related_id: comment.id,
        read: false,
      });
    }

    // Get post author and send comment notification
    const post = ((await supabase.from('posts').select('*').eq('id', postId)).data ?? [])[0];
    if (post && post.author_id !== user.id) {
      await supabase.from('posts').update({ comment_count: (post.comment_count || 0) + 1 }).eq('id', postId);
    }
    setNewComment('');
    setSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  return (
    <div className="border-t border-border px-4 py-3 space-y-3">
      {/* Comment input */}
      <div className="flex gap-2 items-center">
        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
              {user?.full_name?.[0] || 'U'}
            </div>
          )}
        </div>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="h-9 text-sm bg-muted/50 border-0"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button size="icon" variant="ghost" onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="h-9 w-9 flex-shrink-0">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                {comment.author_avatar ? (
                  <img src={comment.author_avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {comment.author_name?.[0]}
                  </div>
                )}
              </div>
              <div className="bg-muted/50 rounded-xl px-3 py-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{comment.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.created_date && formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}