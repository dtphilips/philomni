import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Share2, Copy, MessageCircle, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ShareButton({ post, video }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const item = post || video;
  if (!item) return null;

  const shareUrl = post
    ? `${window.location.origin}/post/${item.id}`
    : `${window.location.origin}/shared-video/${item.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareToStatus = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const content = post?.content || video?.title || 'Check this out';
      const mediaUrl = video?.video_url || post?.media_urls?.[0];

      await base44.entities.Status.create({
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.avatar_url || '',
        caption: content,
        media_url: mediaUrl,
        content_type: video ? 'video' : 'image',
        media_type: video ? 'video' : 'image',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        hashtags: post?.hashtags || [],
        is_archived: false
      });

      toast.success('Shared to your status!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to share to status');
    }
    setLoading(false);
  };

  const handleShareDM = () => {
    // Navigate to messages with post context
    window.location.href = '/messages';
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || 'Check this out',
          text: item.content || item.description || '',
          url: shareUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Share failed');
        }
      }
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
            <DialogDescription>Choose how to share this</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              onClick={handleShareToStatus}
              disabled={loading}
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <Radio className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium text-sm">Share to Status</p>
                <p className="text-xs text-muted-foreground">Disappears in 24 hours</p>
              </div>
            </Button>

            <Button
              onClick={handleCopyLink}
              disabled={loading}
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <Copy className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium text-sm">Copy Link</p>
                <p className="text-xs text-muted-foreground">Share anywhere</p>
              </div>
            </Button>

            <Button
              onClick={handleShareDM}
              disabled={loading}
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <MessageCircle className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium text-sm">Send Message</p>
                <p className="text-xs text-muted-foreground">Share with followers</p>
              </div>
            </Button>

            {navigator.share && (
              <Button
                onClick={handleNativeShare}
                disabled={loading}
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <Share2 className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium text-sm">More Options</p>
                  <p className="text-xs text-muted-foreground">Native share menu</p>
                </div>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}