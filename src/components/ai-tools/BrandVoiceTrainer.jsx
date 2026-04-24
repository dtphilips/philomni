import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BrandVoiceTrainer({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [keywords, setKeywords] = useState('');
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddExample = () => {
    setExamples([...examples, { title: '', content: '' }]);
  };

  const handleRemoveExample = (index) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index, field, value) => {
    const updated = [...examples];
    updated[index][field] = value;
    setExamples(updated);
  };

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      handleExampleChange(index, 'file_url', response.file_url);
      toast.success('File uploaded');
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error('Please fill in name and description');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);

      await base44.entities.BrandVoice.create({
        user_id: user.id,
        name,
        description,
        tone: tone || 'Not specified',
        brand_guidelines: guidelines,
        keywords: keywordList,
        examples: examples.filter(e => e.content || e.file_url)
      });

      toast.success('Brand voice trained successfully!');
      setName('');
      setDescription('');
      setTone('');
      setGuidelines('');
      setKeywords('');
      setExamples([]);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to save brand voice');
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Train Custom AI with Brand Voice</DialogTitle>
          <DialogDescription>Upload writing samples to create a custom AI instance that matches your brand voice</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Profile Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Tech Brand Voice"
                disabled={loading}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Tone/Style</Label>
              <Input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g., Professional, Casual, Witty"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your brand and voice..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Brand Guidelines</Label>
            <Textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="e.g., Always use inclusive language, avoid jargon, emphasize sustainability..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Key Terms & Phrases</Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Comma-separated: innovation, user-first, sustainable"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Writing Samples</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddExample}
                disabled={loading}
                className="gap-2"
              >
                <Plus className="w-3 h-3" />
                Add Example
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {examples.map((example, idx) => (
                <div key={idx} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={example.title}
                      onChange={(e) => handleExampleChange(idx, 'title', e.target.value)}
                      placeholder="Example title"
                      className="flex-1 mr-2"
                      disabled={loading}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveExample(idx)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Textarea
                    value={example.content}
                    onChange={(e) => handleExampleChange(idx, 'content', e.target.value)}
                    placeholder="Paste your writing sample here..."
                    rows={3}
                    disabled={loading}
                  />

                  <div className="relative">
                    <Input
                      type="file"
                      onChange={(e) => handleFileUpload(e, idx)}
                      accept=".txt,.doc,.docx,.pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      className="gap-2 relative"
                    >
                      <Upload className="w-3 h-3" />
                      Upload File
                    </Button>
                    {example.file_url && (
                      <Badge variant="secondary" className="ml-2">File uploaded</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Train Brand Voice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}