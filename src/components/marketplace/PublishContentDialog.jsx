import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const CONTENT_TYPES = [
  { id: 'template', label: 'Template' },
  { id: 'script', label: 'Script' },
  { id: 'blog_post', label: 'Blog Post' },
  { id: 'social_pack', label: 'Social Media Pack' },
  { id: 'video', label: 'Video' },
  { id: 'asset', label: 'Asset' }
];

export default function PublishContentDialog({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('template');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e, isThumbnail = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      if (isThumbnail) {
        setThumbnailUrl(response.file_url);
        toast.success('Thumbnail uploaded');
      } else {
        setFileUrl(response.file_url);
        toast.success('File uploaded');
      }
    } catch (error) {
      toast.error('Upload failed');
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !price || !fileUrl) {
      toast.error('Please fill required fields and upload a file');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const tagList = tags.split(',').map(t => t.trim()).filter(t => t);

      await base44.entities.CreatorContent.create({
        creator_id: user.id,
        creator_name: user.full_name,
        creator_avatar: user.avatar_url || '',
        title,
        description,
        content_type: contentType,
        category: category || 'general',
        price: parseFloat(price),
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        tags: tagList,
        status: 'published'
      });

      toast.success('Content published to marketplace!');
      setTitle('');
      setDescription('');
      setCategory('');
      setPrice('');
      setTags('');
      setFileUrl('');
      setThumbnailUrl('');
      onClose();
    } catch (error) {
      toast.error('Failed to publish content');
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Content to Marketplace</DialogTitle>
          <DialogDescription>Sell or share your top-performing content</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Viral Blog Post Template"
                disabled={loading}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Content Type *</Label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                disabled={loading}
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's included in this content..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Marketing, Tech, Finance"
                disabled={loading}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Price (USD) *</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.99"
                step="0.01"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Tags</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated: viral, marketing, template"
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Content File *</Label>
            <div className="relative">
              <Input
                type="file"
                onChange={(e) => handleFileUpload(e, false)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={loading}
              />
              <Button variant="outline" disabled={loading} className="w-full gap-2">
                <Upload className="w-4 h-4" />
                {fileUrl ? '✓ File Uploaded' : 'Upload File'}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Thumbnail (Optional)</Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, true)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={loading}
              />
              <Button variant="outline" disabled={loading} className="w-full gap-2">
                <Upload className="w-4 h-4" />
                {thumbnailUrl ? '✓ Thumbnail Uploaded' : 'Upload Thumbnail'}
              </Button>
            </div>
            {thumbnailUrl && (
              <img src={thumbnailUrl} alt="Thumbnail" className="mt-2 w-full rounded-lg max-h-32 object-cover" />
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Publish to Marketplace
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}