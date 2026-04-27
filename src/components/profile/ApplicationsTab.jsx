import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Briefcase, ExternalLink, User, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_STYLES = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS = { pending: 'Pending', reviewed: 'Reviewed', accepted: 'Accepted', rejected: 'Rejected' };

function ApplicantCard({ app, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (status) => {
    setUpdating(true);
    await onStatusChange(app.id, status);
    setUpdating(false);
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {app.applicant_avatar
              ? <img src={app.applicant_avatar} alt="" className="w-full h-full object-cover" />
              : <User className="w-4 h-4 text-muted-foreground m-auto mt-2.5" />
            }
          </div>
          <div>
            <p className="font-semibold text-sm">{app.applicant_name}</p>
            {app.applicant_headline && <p className="text-xs text-muted-foreground">{app.applicant_headline}</p>}
          </div>
        </div>
        <Badge className={`text-xs border ${STATUS_STYLES[app.status]}`}>{STATUS_LABELS[app.status]}</Badge>
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-medium mb-0.5">For: {app.job_title}</p>
        {app.cover_message && (
          <p className="text-sm text-muted-foreground line-clamp-3">{app.cover_message}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {app.resume_url && (
            <a href={app.resume_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" /> Resume
              </Button>
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {app.created_date && formatDistanceToNow(new Date(app.created_date), { addSuffix: true })}
          </span>
          {updating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Select value={app.status} onValueChange={handleStatus}>
              <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}>
          <Star className={`w-5 h-5 transition-colors ${s <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewDialog({ open, onClose, app, currentUser, revieweeId, revieweeName, queryClient }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    (await supabase.from('userReviews').insert({
      reviewer_id: currentUser.id,
      reviewer_name: currentUser.full_name,
      reviewer_avatar: currentUser.avatar_url || '',
      reviewee_id: revieweeId,
      application_id: app.id,
      job_title: app.job_title,
      rating,
      feedback: feedback.trim().select().single()).data || undefined,
      relationship: 'client',
    });
    queryClient.invalidateQueries({ queryKey: ['user-reviews', revieweeId] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review for <span className="text-primary">{revieweeName}</span></DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">Gig: {app.job_title}</p>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs mb-1.5 block">Your Rating *</Label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <Label className="text-xs">Feedback <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
              placeholder="Describe your experience working with this person..." className="mt-1 text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving || !rating}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MyApplicationCard({ app, currentUser, queryClient }) {
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: existingReviews = [] } = useQuery({
    queryKey: ['user-reviews-by-app', app.id, currentUser?.id],
    queryFn: async () => { const { data } = await supabase.from('userReviews').select('*').eq('application_id', app.id).eq('reviewer_id', currentUser?.id); return data ?? []; },
    enabled: !!currentUser && app.status === 'accepted',
  });

  const alreadyReviewed = existingReviews.length > 0;

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-sm">{app.job_title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">by {app.poster_name}</p>
        </div>
        <Badge className={`text-xs border flex-shrink-0 ${STATUS_STYLES[app.status]}`}>{STATUS_LABELS[app.status]}</Badge>
      </div>
      {app.cover_message && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{app.cover_message}</p>
      )}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {app.resume_url && (
            <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Resume attached
            </a>
          )}
          {app.status === 'accepted' && (
            alreadyReviewed ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Reviewed
              </span>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setReviewOpen(true)}>
                <Star className="w-3 h-3 mr-1" /> Leave a Review
              </Button>
            )
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {app.created_date && formatDistanceToNow(new Date(app.created_date), { addSuffix: true })}
        </span>
      </div>

      {reviewOpen && (
        <ReviewDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          app={app}
          currentUser={currentUser}
          revieweeId={app.poster_id}
          revieweeName={app.poster_name}
          queryClient={queryClient}
        />
      )}
    </div>
  );
}

export default function ApplicationsTab({ user, isOwnProfile, currentUser }) {
  const queryClient = useQueryClient();

  // My submitted applications (creator/professional view)
  const { data: myApps = [], isLoading: loadingMine } = useQuery({
    queryKey: ['my-applications', user?.id],
    queryFn: async () => { const { data } = await supabase.from('applications').select('*').eq('applicant_id', user.id).order('created_at', { ascending: false }).limit(50); return data ?? []; },
    enabled: !!user && isOwnProfile,
  });

  // Applications received on my posted jobs (employer view)
  const { data: receivedApps = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['received-applications', user?.id],
    queryFn: async () => { const { data } = await supabase.from('applications').select('*').eq('poster_id', user.id).order('created_at', { ascending: false }).limit(100); return data ?? []; },
    enabled: !!user && isOwnProfile,
  });

  const handleStatusChange = async (appId, status) => {
    (await supabase.from('applications').update({ status }).eq('id', appId).select().single()).data;
    queryClient.invalidateQueries({ queryKey: ['received-applications', user?.id] });
  };

  const isLoading = loadingMine || loadingReceived;

  if (!isOwnProfile) return (
    <div className="text-center py-12">
      <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Applications are private</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
  );

  return (
    <div className="space-y-8">
      {/* My Submissions */}
      {myApps.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">My Submissions ({myApps.length})</h3>
          <div className="space-y-3">
            {myApps.map(app => <MyApplicationCard key={app.id} app={app} currentUser={currentUser || user} queryClient={queryClient} />)}
          </div>
        </div>
      )}

      {/* Received Applications */}
      {receivedApps.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Incoming Applications ({receivedApps.length})</h3>
          <div className="space-y-3">
            {receivedApps.map(app => (
              <ApplicantCard key={app.id} app={app} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {myApps.length === 0 && receivedApps.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No applications yet</p>
          <p className="text-xs text-muted-foreground mt-1">Apply to jobs in the Marketplace to see them here</p>
        </div>
      )}
    </div>
  );
}