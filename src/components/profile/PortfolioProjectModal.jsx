import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { X, Loader2, Upload } from 'lucide-react';

export default function PortfolioProjectModal({ project, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-design',
    tags: [],
    image_urls: [],
    thumbnail_url: '',
    project_url: '',
    completed_at: '',
    client_name: '',
    open_to_collaborate: false,
    collaboration_types: [],
  });

  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (project) {
      setFormData(project);
    }
    loadUser();
  }, [project, isOpen]);

  const loadUser = async () => {
    try {
      const me = user /* useAuth() */;
      setUser(me);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const res = await (async () => { const _uPath = `uploads/${Date.now()}-${file.name}`; const { data: _uData, error: _uErr } = await supabase.storage.from('uploads').upload(_uPath, file, { upsert: true }); if (_uErr) throw _uErr; const { data: { publicUrl: _uUrl } } = supabase.storage.from('uploads').getPublicUrl(_uData.path); return { file_url: _uUrl }; })();
        setFormData(prev => ({
          ...prev,
          image_urls: [...prev.image_urls, res.file_url],
          thumbnail_url: prev.thumbnail_url || res.file_url,
        }));
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => {
    setFormData(prev => {
      const newUrls = prev.image_urls.filter(u => u !== url);
      return {
        ...prev,
        image_urls: newUrls,
        thumbnail_url: prev.thumbnail_url === url ? newUrls[0] || '' : prev.thumbnail_url,
      };
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const toggleCollaborationType = (type) => {
    setFormData(prev => ({
      ...prev,
      collaboration_types: prev.collaboration_types.includes(type)
        ? prev.collaboration_types.filter(t => t !== type)
        : [...prev.collaboration_types, type],
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !user) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        owner_id: user.id,
        owner_name: user.full_name,
        owner_avatar: user.avatar_url,
        status: 'published',
      };

      if (project?.id) {
        (await supabase.from('portfolio_projects').update(data).eq('id', project.id).select().single()).data;
      } else {
        (await supabase.from('portfolio_projects').insert(data).select().single()).data;
      }

      onSave();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setSaving(false);
    }
  };

  const categories = {
    'web-design': 'Web Design',
    'mobile-app': 'Mobile App',
    'graphic-design': 'Graphic Design',
    'video-production': 'Video Production',
    'writing': 'Writing',
    'photography': 'Photography',
    'audio-production': 'Audio Production',
    '3d-modeling': '3D Modeling',
    'illustration': 'Illustration',
    'other': 'Other',
  };

  const collaborationOptions = [
    { id: 'feedback', label: 'Feedback' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'partnership', label: 'Partnership' },
    { id: 'mentoring', label: 'Mentoring' },
    { id: 'learning', label: 'Learning' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Add Portfolio Project'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Project Title *</label>
            <Input
              placeholder="e.g., E-commerce Website Redesign"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Description</label>
            <Textarea
              placeholder="Tell the story of your project..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-24"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag, e.g., React, UI/UX"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button onClick={addTag} variant="outline" type="button">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-2">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Project Images</label>
            <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload or drag images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>

            {formData.image_urls.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {formData.image_urls.map(url => (
                  <div key={url} className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => removeImage(url)}
                        className="p-2 rounded-full bg-destructive/80 hover:bg-destructive text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project URL */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Project URL (Live Link)</label>
            <Input
              placeholder="https://example.com"
              value={formData.project_url}
              onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Completed Date</label>
              <Input
                type="date"
                value={formData.completed_at}
                onChange={(e) => setFormData({ ...formData, completed_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Client Name</label>
              <Input
                placeholder="e.g., Acme Corp"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>
          </div>

          {/* Collaboration */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold">Open to Collaborate</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Let others know you're interested in collaborating on this project
                </p>
              </div>
              <Switch
                checked={formData.open_to_collaborate}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, open_to_collaborate: checked })
                }
              />
            </div>

            {formData.open_to_collaborate && (
              <div className="space-y-2">
                <label className="text-xs font-semibold">Collaboration Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {collaborationOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => toggleCollaborationType(option.id)}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        formData.collaboration_types.includes(option.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.title.trim() || saving || uploading}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}