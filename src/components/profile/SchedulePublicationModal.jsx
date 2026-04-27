import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export default function SchedulePublicationModal({ isOpen, onClose, userId }) {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);
  const [marketplaceType, setMarketplaceType] = useState('template');
  const [description, setDescription] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Fetch unscheduled projects and videos
  const { data: unscheduledProjects = [] } = useQuery({
    queryKey: ['unscheduled-projects', userId],
    queryFn: async () => {
      const projects = (await supabase.from('shared_projects').select('*').eq('owner_id', userId)).data ?? [];
      return projects.filter((p) => !p.marketplace_type || p.marketplace_type === 'none');
    },
    enabled: isOpen && !!userId,
  });

  const { data: unscheduledVideos = [] } = useQuery({
    queryKey: ['unscheduled-videos', userId],
    queryFn: async () => {
      const videos = (await supabase.from('shared_videos').select('*').eq('owner_id', userId)).data ?? [];
      return videos.filter((v) => !v.marketplace_type || v.marketplace_type === 'none');
    },
    enabled: isOpen && !!userId,
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      (await supabase.from('scheduled_publications').insert({
        user_id: userId,
        item_id: selectedItem.id,
        item_type: selectedItem.type,
        item_title: selectedItem.title,
        item_thumbnail: selectedItem.image_url || selectedItem.thumbnail_url,
        marketplace_type: marketplaceType,
        marketplace_description: description,
        scheduled_publish_date: dateTime.toISOString().select().single()).data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-publications', userId] });
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedItem(null);
    setMarketplaceType('template');
    setDescription('');
    setScheduleDate('');
    setScheduleTime('');
    onClose();
  };

  const allItems = [
    ...unscheduledProjects.map((p) => ({ ...p, type: 'project' })),
    ...unscheduledVideos.map((v) => ({ ...v, type: 'video' })),
  ];

  const isFormValid = selectedItem && scheduleDate && scheduleTime && description;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Publication</DialogTitle>
          <DialogDescription>
            Schedule your template or asset to be published to the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Select Item</Label>
            <Select
              value={selectedItem?.id || ''}
              onValueChange={(itemId) => {
                const item = allItems.find((i) => i.id === itemId);
                setSelectedItem(item);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a project or video..." />
              </SelectTrigger>
              <SelectContent>
                {allItems.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No items available to schedule
                  </div>
                ) : (
                  allItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} ({item.type})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Marketplace Type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Publish As</Label>
            <Select value={marketplaceType} onValueChange={setMarketplaceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="desc" className="text-sm font-medium mb-2 block">
              Marketplace Description
            </Label>
            <Textarea
              id="desc"
              placeholder="Brief description for the marketplace listing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 text-sm"
            />
          </div>

          {/* Schedule Date */}
          <div>
            <Label htmlFor="date" className="text-sm font-medium mb-2 block flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Publish Date
            </Label>
            <Input
              id="date"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>

          {/* Schedule Time */}
          <div>
            <Label htmlFor="time" className="text-sm font-medium mb-2 block">
              Publish Time
            </Label>
            <Input
              id="time"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => scheduleMutation.mutate()}
            disabled={!isFormValid || scheduleMutation.isPending}
          >
            {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}