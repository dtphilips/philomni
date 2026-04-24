import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart, MessageCircle, Bookmark, MoreHorizontal,
  BadgeCheck, BookmarkCheck, Edit, Share2
} from 'lucide-react';
import PostInsights from '@/components/feed/PostInsights';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import PostComments from './PostComments';
import ShareMenu from '@/components/common/ShareMenu';
import { useLightbox } from '@/components/common/Lightbox';

export default function PostCard({ post, user, userLikes = [], userBookmarks = [] }) {
  const [showComments, setShowComments] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count || 0);
  const [isLiked, setIsLiked] = useState(userLikes.includes(post.id));
  const [isBookmarked, setIsBookmarked] = useState(userBookmarks.includes(post.id));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editHashtags, setEditHashtags] = useState((post.hashtags || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = React.useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { openLightbox } = useLightbox();

  const handleVideoUnmute = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play().catch(() => {});
    }
  };

  const videoUrl = post.media_urls?.[0];
  const isVideoPost = post.media_type === 'video' && videoUrl;

  const handleLike = async () => {
    if (isLiked) {
      const likes = await base44.entities.Like.filter({ post_id: post.id, user_id: user.id });
      if (likes.length > 0) await base44.entities.Like.delete(likes[0].id);
      await base44.entities.Post.update(post.id, { like_count: Math.max(0, localLikeCount - 1) });
      setLocalLikeCount(prev => Math.max(0, prev - 1));
      setIsLiked(false);
    } else {
      await base44.entities.Like.create({ post_id: post.id, user_id: user.id, reaction_type: 'like' });
      await base44.entities.Post.update(post.id, { like_count: localLikeCount + 1 });
      setLocalLikeCount(prev => prev + 1);
      setIsLiked(true);
      // Send notification to post author
      if (post.author_id !== user.id) {
        await base44.functions.invoke('sendLikeNotification', {
          postAuthorId: post.author_id,
          likerName: user.full_name,
          likerAvatar: user.avatar_url || '',
          likerId: user.id,
          postId: post.id,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['likes'] });
  };

  const handleBookmark = async () => {
    if (isBookmarked) {
      const bookmarks = await base44.entities.Bookmark.filter({ post_id: post.id, user_id: user.id });
      if (bookmarks.length > 0) await base44.entities.Bookmark.delete(bookmarks[0].id);
      setIsBookmarked(false);
    } else {
      await base44.entities.Bookmark.create({ post_id: post.id, user_id: user.id });
      setIsBookmarked(true);
    }
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  };

  const handleComment = async () => {
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    try {
      await base44.entities.Post.update(post.id, { share_count: (post.share_count || 0) + 1 });
      
      const postUrl = `${window.location.origin}/?post=${post.id}`;
      const shareText = post.content?.slice(0, 100) || 'Check out this post';
      
      if (navigator.share) {
        await navigator.share({ 
          title: 'Philomni Post', 
          text: shareText,
          url: postUrl 
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        // Brief visual feedback
        const btn = event?.target;
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = originalText; }, 2000);
        }
      }
    } catch (error) {
      console.log('Share cancelled or not available');
    }
  };

  const handleEdit = async () => {
    setIsSaving(true);
    const hashtags = editHashtags.split(',').map(h => h.trim()).filter(h => h);
    await base44.entities.Post.update(post.id, {
      content: editContent,
      hashtags
    });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    setIsEditOpen(false);
    setIsSaving(false);
  };



  const handleDelete = async () => {
    await base44.entities.Post.delete(post.id);
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : '';

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <Link to={`/user/${post.author_id}`} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-muted flex-shrink-0 overflow-hidden">
              {post.author_avatar ? (
                <img src={post.author_avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium">
                  {post.author_name?.[0] || '?'}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {post.author_name}
                </span>
                {post.author_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {post.author_headline}
              </p>
              <p className="text-xs text-muted-foreground/70">{timeAgo}</p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Report</DropdownMenuItem>
              {post.author_id === user?.id && (
                <>
                  {isVideoPost && (
                    <DropdownMenuItem onClick={() => navigate(`/edit-video/${post.id}`)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Video
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">Delete</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal cursor-pointer hover:bg-primary/10">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div className={`${post.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
          {post.media_urls.map((url, i) => (
            <div key={i} className="bg-muted aspect-video overflow-hidden">
              {post.media_type === 'video' ? (
                <video 
                  ref={videoRef}
                  src={url} 
                  poster={post.thumbnail_url}
                  controls 
                  crossOrigin="anonymous" 
                  className="w-full h-full object-cover" 
                  preload="metadata" 
                  playsInline 
                  autoPlay 
                  muted
                  onVolumeChange={handleVideoUnmute}
                />
              ) : (
                <img src={url} className="w-full h-full object-cover cursor-zoom-in" alt="" loading="lazy" onClick={() => openLightbox(url)} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {(localLikeCount > 0 || post.comment_count > 0 || post.share_count > 0) && (
        <div className="px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          {localLikeCount > 0 && <span>{localLikeCount} like{localLikeCount !== 1 ? 's' : ''}</span>}
          {post.comment_count > 0 && (
            <button onClick={() => setShowComments(true)} className="hover:underline">
              {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
            </button>
          )}
          {post.share_count > 0 && <span>{post.share_count} share{post.share_count !== 1 ? 's' : ''}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="px-2 py-1 border-t border-border flex items-center">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
            isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-red-500' : ''}`} />
          <span className="text-xs sm:text-sm">Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="text-xs sm:text-sm">Comment</span>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <ShareMenu
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/?post=${post.id}`}
            text={post.content?.slice(0, 100) || 'Check out this post on Philomni'}
            trigger={
              <button
                className="flex items-center justify-center gap-1.5 min-h-[44px] w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => base44.entities.Post.update(post.id, { share_count: (post.share_count || 0) + 1 }).catch(() => {})}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span className="text-xs sm:text-sm">Share</span>
              </button>
            }
            align="end"
          />
        </div>
        <button
          onClick={handleBookmark}
          className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
            isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-[18px] h-[18px]" />
          ) : (
            <Bookmark className="w-[18px] h-[18px]" />
          )}
          <span className="text-xs sm:text-sm">Save</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && <PostComments postId={post.id} user={user} />}

      {/* Post insights (author only) */}
      <PostInsights post={post} isAuthor={post.author_id === user?.id} />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Update your post content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hashtags</label>
              <Input
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="Separate with commas"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}