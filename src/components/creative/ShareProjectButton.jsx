import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Share2, Loader2, Copy, Check } from 'lucide-react';

export default function ShareProjectButton({
  user,
  prompt,
  enhancedPrompt,
  styleId,
  styleLabel,
  styleEmoji,
  imageUrl,
  animationId,
  animationLabel,
}) {
  const [open, setOpen] = useState(false);
  const [marketplaceType, setMarketplaceType] = useState('none');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const sharedProject = (await supabase.from('shared_projects').insert({
        owner_id: user.id,
        owner_name: user.full_name || 'Anonymous',
        owner_avatar: user.avatar_url || '',
        title: title || 'Untitled Project',
        prompt,
        enhanced_prompt: enhancedPrompt,
        style_id: styleId,
        style_label: styleLabel,
        style_emoji: styleEmoji,
        image_url: imageUrl,
        animation_id: animationId,
        animation_label: animationLabel,
        marketplace_type: marketplaceType,
        marketplace_description: description,
      }).select().single()).data;

      const link = `${window.location.origin}/shared-project/${sharedProject.id}`;
      setShareLink(link);
    } catch (error) {
      console.error('Failed to share project:', error);
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {!shareLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Share Your Project</DialogTitle>
              <DialogDescription>Make it public or add it to the marketplace for others to discover</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Title</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Neon Cityscape"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Marketplace Type</label>
                <Select value={marketplaceType} onValueChange={setMarketplaceType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Listed (Private Share)</SelectItem>
                    <SelectItem value="template">📋 Template (Full setup to reuse)</SelectItem>
                    <SelectItem value="asset">🔧 Asset (Component or style guide)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {marketplaceType !== 'none' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what this template/asset is for and how to use it..."
                    rows={3}
                    className="resize-none mt-1 text-sm"
                  />
                </div>
              )}

              <Button
                onClick={handleShare}
                disabled={loading || !title.trim()}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating share link...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Project Shared!</DialogTitle>
              <DialogDescription>Your project is now live and ready to share</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Share Link</p>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {marketplaceType !== 'none' && (
                <div className="bg-accent/20 rounded-lg p-3 border border-accent">
                  <p className="text-xs font-medium text-accent-foreground">
                    ✓ Listed in marketplace as {marketplaceType === 'template' ? 'a Template' : 'an Asset'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Users can discover and fork your project</p>
                </div>
              )}

              <Button
                onClick={() => {
                  setOpen(false);
                  setShareLink('');
                  setTitle('');
                  setDescription('');
                  setMarketplaceType('none');
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}