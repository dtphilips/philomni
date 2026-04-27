import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Share2, Loader2 } from 'lucide-react';

export default function ShareVideoButton({ user, videoUrl, prompt, videoType }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [marketplaceType, setMarketplaceType] = useState('none');
  const [marketplaceDesc, setMarketplaceDesc] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!title.trim() || !user) return;
    setSharing(true);

    try {
      // First, generate a thumbnail (use a placeholder or first frame)
      const thumbnailUrl = videoUrl; // In production, extract actual frame

      const { data: sharedVideo } = await supabase.from('shared_videos').insert({
        owner_id: user.id,
        owner_name: user.full_name || 'Anonymous',
        owner_avatar: user.avatar_url || '',
        title: title.trim(),
        description: description.trim(),
        prompt: prompt,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        video_type: videoType,
        marketplace_type: marketplaceType,
        marketplace_description: marketplaceDesc,
      });

      setTitle('');
      setDescription('');
      setMarketplaceType('none');
      setMarketplaceDesc('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to share video:', error);
    }

    setSharing(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2 flex-1">
        <Share2 className="w-4 h-4" /> Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Video</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Video Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Peaceful Forest Scene"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's special about this video?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Marketplace Type</label>
              <Select value={marketplaceType} onValueChange={setMarketplaceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't list (Private)</SelectItem>
                  <SelectItem value="template">Template (Full setup)</SelectItem>
                  <SelectItem value="asset">Asset (Component/piece)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {marketplaceType !== 'none' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Marketplace Description</label>
                <Textarea
                  value={marketplaceDesc}
                  onChange={(e) => setMarketplaceDesc(e.target.value)}
                  placeholder="Brief description for marketplace listing"
                  rows={2}
                />
              </div>
            )}

            <Button
              onClick={handleShare}
              disabled={sharing || !title.trim()}
              className="w-full gap-2"
            >
              {sharing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sharing...</>
              ) : (
                <><Share2 className="w-4 h-4" /> Share Video</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}