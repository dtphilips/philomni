import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import SchedulePublicationModal from '@/components/profile/SchedulePublicationModal';

export default function ScheduledPublicationsTab({ userId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: scheduled = [] } = useQuery({
    queryKey: ['scheduled-publications', userId],
    queryFn: () =>
      base44.entities.ScheduledPublication.filter({ user_id: userId }, '-scheduled_publish_date'),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPublication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-publications', userId] });
    },
  });

  const scheduled_items = scheduled.filter((s) => s.status === 'scheduled');
  const published_items = scheduled.filter((s) => s.status === 'published');

  const getStatusIcon = (status) => {
    if (status === 'published')
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'scheduled')
      return <AlertCircle className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const renderItem = (item) => (
    <div
      key={item.id}
      className="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
          {item.item_thumbnail ? (
            <img
              src={item.item_thumbnail}
              alt={item.item_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm line-clamp-1">{item.item_title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {item.marketplace_description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(item.status)}
              <Badge variant="outline" className="text-xs capitalize">
                {item.marketplace_type}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(item.scheduled_publish_date), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(item.scheduled_publish_date), 'h:mm a')}
            </div>
            {item.status === 'published' && (
              <span className="text-green-600">
                Published {format(new Date(item.published_at), 'MMM d')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {item.status === 'scheduled' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => deleteMutation.mutate(item.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Manage Publications</h3>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="text-sm"
        >
          Schedule New
        </Button>
      </div>

      {/* Scheduled Items */}
      {scheduled_items.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3 text-muted-foreground">
            Upcoming ({scheduled_items.length})
          </h4>
          <div className="space-y-3">
            {scheduled_items.map(renderItem)}
          </div>
        </div>
      )}

      {/* Published Items */}
      {published_items.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3 text-muted-foreground">
            Published ({published_items.length})
          </h4>
          <div className="space-y-3">
            {published_items.map(renderItem)}
          </div>
        </div>
      )}

      {scheduled.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-muted-foreground">No scheduled publications yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Schedule your projects to be published at specific dates and times
          </p>
        </div>
      )}

      <SchedulePublicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userId={userId} />
    </div>
  );
}