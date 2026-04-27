import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Plus, ThumbsUp, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ROLE_LABELS } from '@/lib/categories';

const BOARDS = [
  { id: 'general', label: 'General', color: 'bg-slate-100 text-slate-700' },
  { id: 'careers', label: 'Careers', color: 'bg-blue-50 text-blue-700' },
  { id: 'investing', label: 'Investing', color: 'bg-green-50 text-green-700' },
  { id: 'creators', label: 'Creators', color: 'bg-purple-50 text-purple-700' },
  { id: 'tech', label: 'Tech', color: 'bg-orange-50 text-orange-700' },
  { id: 'events', label: 'Events', color: 'bg-pink-50 text-pink-700' },
];

export default function DiscussionBoard({ user }) {
  const queryClient = useQueryClient();
  const [activeBoard, setActiveBoard] = useState('general');
  const [activePost, setActivePost] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newBoard, setNewBoard] = useState('general');
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['discussion-posts', activeBoard],
    queryFn: async () => { const { data } = await supabase.from('discussionPosts').select('*').eq('board', activeBoard).order('created_at', { ascending: false }).limit(30); return data ?? []; },
  });

  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ['discussion-replies', activePost?.id],
    queryFn: async () => { const { data } = await supabase.from('discussionReplys').select('*').eq('post_id', activePost.id).order('created_at', { ascending: true }).limit(100); return data ?? []; },
    enabled: !!activePost,
  });

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    (await supabase.from('discussionPosts').insert({
      board: newBoard,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url || '',
      author_role: user.role || '',
      title: newTitle.trim().select().single()).data,
      content: newContent.trim(),
    });
    setNewTitle(''); setNewContent(''); setShowNew(false);
    queryClient.invalidateQueries({ queryKey: ['discussion-posts', newBoard] });
    if (newBoard !== activeBoard) setActiveBoard(newBoard);
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !activePost) return;
    setSubmitting(true);
    (await supabase.from('discussionReplys').insert({
      post_id: activePost.id,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url || '',
      author_role: user.role || '',
      content: replyContent.trim().select().single()).data,
    });
    (await supabase.from('discussionPosts').update({
      reply_count: (activePost.reply_count || 0).eq('id', activePost.id).select().single()).data + 1,
    });
    setReplyContent('');
    queryClient.invalidateQueries({ queryKey: ['discussion-replies', activePost.id] });
    queryClient.invalidateQueries({ queryKey: ['discussion-posts', activeBoard] });
    setSubmitting(false);
  };

  const boardMeta = BOARDS.find(b => b.id === activeBoard);

  if (activePost) {
    return (
      <div>
        <button onClick={() => setActivePost(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {boardMeta?.label}
        </button>
        <div className="bg-card rounded-xl border border-border p-5 mb-4">
          <Badge className={`text-xs mb-3 ${boardMeta?.color} border-0`}>{boardMeta?.label}</Badge>
          <h2 className="font-display text-xl font-bold mb-2">{activePost.title}</h2>
          <p className="text-sm leading-relaxed text-foreground mb-4">{activePost.content}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {activePost.author_avatar ? <img src={activePost.author_avatar} className="w-full h-full object-cover" alt="" /> : <span className="font-medium">{activePost.author_name?.[0]}</span>}
            </div>
            <span className="font-medium text-foreground">{activePost.author_name}</span>
            <span>·</span>
            <span className="capitalize">{ROLE_LABELS[activePost.author_role] || activePost.author_role}</span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(activePost.created_date), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {repliesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : replies.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No replies yet. Be the first!</p>
          ) : (
            replies.map(reply => (
              <div key={reply.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {reply.author_avatar ? <img src={reply.author_avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-xs font-medium">{reply.author_name?.[0]}</span>}
                  </div>
                  <span className="text-sm font-medium">{reply.author_name}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(reply.created_date), { addSuffix: true })}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write a reply..." rows={3} className="mb-3" />
          <Button onClick={handleReply} disabled={submitting || !replyContent.trim()} size="sm">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Post Reply
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {BOARDS.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveBoard(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeBoard === b.id ? 'bg-primary text-primary-foreground border-transparent' : 'border-border hover:bg-muted'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No posts in this board yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <button
              key={post.id}
              onClick={() => setActivePost(post)}
              className="w-full text-left bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-1 truncate">{post.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{post.author_name}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.reply_count || 0} replies</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Discussion Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Board</label>
              <Select value={newBoard} onValueChange={setNewBoard}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BOARDS.map(b => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="What's on your mind?" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Content</label>
              <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Share your thoughts..." rows={4} />
            </div>
            <Button onClick={handleCreatePost} disabled={submitting || !newTitle.trim() || !newContent.trim()} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post Discussion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}