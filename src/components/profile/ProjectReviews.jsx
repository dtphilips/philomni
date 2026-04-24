import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function StarRating({ value, onChange, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${sz} transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function AverageStars({ projectId }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', projectId],
    queryFn: () => base44.entities.Review.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  if (!reviews.length) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={Math.round(avg)} size="sm" />
      <span className="text-xs font-medium text-amber-600">{avg.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({reviews.length})</span>
    </div>
  );
}

function ReviewForm({ project, currentUser, onClose, onAdded }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [relationship, setRelationship] = useState('client');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    await base44.entities.Review.create({
      project_id: project.id,
      project_owner_id: project.owner_id,
      reviewer_id: currentUser.id,
      reviewer_name: currentUser.full_name,
      reviewer_avatar: currentUser.avatar_url || '',
      rating,
      feedback: feedback.trim() || undefined,
      relationship,
    });
    setSaving(false);
    onAdded();
    onClose();
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-xl bg-muted/30">
      <h4 className="font-semibold text-sm">Leave a Review</h4>
      <div>
        <Label className="mb-1 block">Your Rating *</Label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div>
        <Label>Your relationship to this project</Label>
        <Select value={relationship} onValueChange={setRelationship}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="collaborator">Collaborator</SelectItem>
            <SelectItem value="colleague">Colleague</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Feedback <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Share your experience working on this project..." className="mt-1" />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={saving || !rating} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export default function ProjectReviews({ project, currentUser, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', project.id],
    queryFn: () => base44.entities.Review.filter({ project_id: project.id }, '-created_date'),
    enabled: !!project.id,
  });

  const handleDelete = async (id) => {
    await base44.entities.Review.delete(id);
    queryClient.invalidateQueries({ queryKey: ['reviews', project.id] });
  };

  const handleAdded = () => queryClient.invalidateQueries({ queryKey: ['reviews', project.id] });

  const alreadyReviewed = reviews.some(r => r.reviewer_id === currentUser?.id);
  const canReview = currentUser && !isOwner && !alreadyReviewed;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="px-4 pb-4 border-t border-border mt-2 pt-3">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <StarRating value={Math.round(avg)} size="sm" />
          <span className="text-sm font-semibold text-amber-600">{avg.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">· {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Leave review button */}
      {canReview && !showForm && (
        <Button variant="outline" size="sm" className="mb-3 h-8 text-xs" onClick={() => setShowForm(true)}>
          <MessageSquare className="w-3.5 h-3.5 mr-1" /> Write a Review
        </Button>
      )}

      {showForm && (
        <div className="mb-3">
          <ReviewForm project={project} currentUser={currentUser} onClose={() => setShowForm(false)} onAdded={handleAdded} />
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                {review.reviewer_avatar
                  ? <img src={review.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{review.reviewer_name?.[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{review.reviewer_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{review.relationship}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating value={review.rating} size="sm" />
                    {(isOwner || currentUser?.id === review.reviewer_id) && (
                      <button onClick={() => handleDelete(review.id)} className="text-muted-foreground hover:text-destructive ml-1 transition-colors">
                        <span className="text-xs">✕</span>
                      </button>
                    )}
                  </div>
                </div>
                {review.feedback && <p className="text-xs text-muted-foreground mt-0.5">{review.feedback}</p>}
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {review.created_date && formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}