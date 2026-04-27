import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';

const CATEGORIES = ['tech', 'creative', 'business', 'lifestyle', 'education', 'entertainment', 'other'];

export default function CreateGroupModal({ user, open, onOpenChange }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState('other');
  const [rules, setRules] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: group } = await supabase.from('groups').insert({
        name: name.trim(),
        description: description.trim(),
        owner_id: user.id,
        owner_name: user.full_name,
        owner_avatar: user.avatar_url || '',
        is_private: isPrivate,
        category,
        rules: rules.trim(),
        tags,
        member_count: 1,
      });

      // Add owner as member
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        user_name: user.full_name,
        user_avatar: user.avatar_url || '',
        user_email: user.email,
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      reset();
      onOpenChange(false);
    },
  });

  const reset = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
    setCategory('other');
    setRules('');
    setTags([]);
    setTagInput('');
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Group Name</Label>
            <Input
              placeholder="e.g., React Developers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-3 w-full">
                <Label className="text-sm font-medium flex-1">Private Group</Label>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Rules & Guidelines</Label>
            <Textarea
              placeholder="Community guidelines and rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Tags</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer gap-1">
                    {tag}
                    <X
                      className="w-3 h-3"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || !description.trim() || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}