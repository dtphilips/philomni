import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Video, Plus, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function CommunityEvents({ user }) {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'virtual', category: '',
    starts_at: '', location: '', meeting_url: '', is_free: true, price: '',
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ status: 'upcoming' }, 'starts_at', 50),
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.title || !form.starts_at) return;
    setSubmitting(true);
    await base44.entities.Event.create({
      ...form,
      price: form.price ? parseFloat(form.price) : 0,
      organizer_id: user.id,
      organizer_name: user.full_name,
      organizer_avatar: user.avatar_url || '',
    });
    setShowNew(false);
    setForm({ title: '', description: '', type: 'virtual', category: '', starts_at: '', location: '', meeting_url: '', is_free: true, price: '' });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    setSubmitting(false);
  };

  const handleRSVP = async (event) => {
    await base44.entities.Event.update(event.id, { attendee_count: (event.attendee_count || 0) + 1 });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{events.length} upcoming events</p>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-1" /> Create Event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No upcoming events. Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map(event => (
            <div key={event.id} className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all">
              {event.cover_url && <img src={event.cover_url} className="w-full h-32 object-cover" alt="" />}
              {!event.cover_url && (
                <div className="w-full h-28 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-primary/40" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm leading-tight">{event.title}</h3>
                  <Badge variant={event.is_free ? 'secondary' : 'default'} className="text-xs flex-shrink-0">
                    {event.is_free ? 'Free' : `$${event.price}`}
                  </Badge>
                </div>
                {event.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>}
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  {event.starts_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(event.starts_at), 'MMM d, yyyy • h:mm a')}</span>
                    </div>
                  )}
                  {event.type === 'virtual' ? (
                    <div className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /><span>Virtual Event</span></div>
                  ) : (
                    event.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /><span>{event.location}</span></div>
                  )}
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><span>{event.attendee_count || 0} attending</span></div>
                </div>
                <Button size="sm" className="w-full" onClick={() => handleRSVP(event)}>RSVP</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium mb-1.5 block">Title *</label>
              <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Event title" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Describe your event..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1.5 block">Type</label>
                <Select value={form.type} onValueChange={v => update('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium mb-1.5 block">Date & Time *</label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => update('starts_at', e.target.value)} /></div>
            </div>
            {form.type !== 'virtual' && (
              <div><label className="text-sm font-medium mb-1.5 block">Location</label>
                <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="City, venue..." /></div>
            )}
            {form.type !== 'in_person' && (
              <div><label className="text-sm font-medium mb-1.5 block">Meeting URL</label>
                <Input value={form.meeting_url} onChange={e => update('meeting_url', e.target.value)} placeholder="https://..." /></div>
            )}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_free" checked={form.is_free} onChange={e => update('is_free', e.target.checked)} className="rounded" />
              <label htmlFor="is_free" className="text-sm">Free Event</label>
              {!form.is_free && <Input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="Price ($)" className="ml-auto w-28" />}
            </div>
            <Button onClick={handleCreate} disabled={submitting || !form.title || !form.starts_at} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}