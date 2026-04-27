import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`${sz} transition-colors ${star <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
        </button>
      ))}
    </div>
  );
}

export function UserRatingSummary({ userId }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: async () => { const { data } = await supabase.from('userReviews').select('*').eq('reviewee_id', userId); return data ?? []; },
    enabled: !!userId,
  });
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={Math.round(avg)} size="sm" />
      <span className="text-xs font-semibold text-amber-600">{avg.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
    </div>
  );
}

export default function UserReviewsSection({ profileUserId, currentUser, isOwnProfile, inTab = false }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [relationship, setRelationship] = useState('client');
  const [saving, setSaving] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['user-reviews', profileUserId],
    queryFn: async () => { const { data } = await supabase.from('userReviews').select('*').eq('reviewee_id', profileUserId).order('created_at', { ascending: false }).limit(20); return data ?? []; },
    enabled: !!profileUserId,
  });

  const canReview = currentUser && currentUser.id !== profileUserId &&
    !reviews.some(r => r.reviewer_id === currentUser.id);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    (await supabase.from('userReviews').insert({
      reviewer_id: currentUser.id,
      reviewer_name: currentUser.full_name,
      reviewer_avatar: currentUser.avatar_url || '',
      reviewee_id: profileUserId,
      job_title: '',
      rating,
      feedback: feedback.trim().select().single()).data || undefined,
      relationship,
    });
    queryClient.invalidateQueries({ queryKey: ['user-reviews', profileUserId] });
    setSaving(false);
    setShowForm(false);
    setRating(0);
    setFeedback('');
  };

  const handleDelete = async (id) => {
    await supabase.from('userReviews').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['user-reviews', profileUserId] });
  };

  if (!isLoading && reviews.length === 0 && !canReview && inTab) return (
    <div className="text-center py-12">
      <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">No reviews yet</p>
      <p className="text-xs text-muted-foreground mt-1">Reviews appear here after gig collaborations</p>
    </div>
  );

  if (!isLoading && reviews.length === 0 && !canReview) return null;

  return (
    <div className={inTab ? '' : 'mt-6 pt-5 border-t border-border'}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={Math.round(avg)} size="sm" />
              <span className="text-xs font-semibold text-amber-600">{avg.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>
        {canReview && !showForm && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowForm(true)}>
            <MessageSquare className="w-3.5 h-3.5 mr-1" /> Write a Review
          </Button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div className="mb-4 space-y-3 p-4 border border-border rounded-xl bg-muted/30">
          <h4 className="font-semibold text-sm">Leave a Review</h4>
          <div>
            <Label className="mb-1 block text-xs">Rating *</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <Label className="text-xs">Your relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="collaborator">Collaborator</SelectItem>
                <SelectItem value="colleague">Colleague</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Feedback <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Share your experience working with this person..." className="mt-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={saving || !rating} size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                {review.reviewer_avatar
                  ? <img src={review.reviewer_avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{review.reviewer_name?.[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold">{review.reviewer_name}</span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize">{review.relationship}</span>
                    {review.job_title && <span className="text-xs text-muted-foreground ml-2">· {review.job_title}</span>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StarRating value={review.rating} size="sm" />
                    {(isOwnProfile || currentUser?.id === review.reviewer_id) && (
                      <button onClick={() => handleDelete(review.id)} className="text-muted-foreground hover:text-destructive ml-1 transition-colors text-xs">✕</button>
                    )}
                  </div>
                </div>
                {review.feedback && <p className="text-sm text-muted-foreground mt-1">{review.feedback}</p>}
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