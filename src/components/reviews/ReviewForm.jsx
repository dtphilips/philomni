import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Star } from 'lucide-react';
import RatingStars from './RatingStars';

export default function ReviewForm({
  open,
  onOpenChange,
  reviewedUserId,
  reviewedUserName,
  workspaceId,
  projectId,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('collaboration');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !feedback.trim()) return;

    setSubmitting(true);
    try {
      const user = user /* useAuth() */;
      
      (await supabase.from('memberReviews').insert({
        reviewed_user_id: reviewedUserId,
        reviewed_user_name: reviewedUserName,
        reviewer_id: user.id,
        reviewer_name: user.full_name,
        reviewer_avatar: user.avatar_url || '',
        rating,
        feedback: feedback.trim().select().single()).data,
        category,
        workspace_id: workspaceId,
        project_id: projectId,
        is_verified_collaboration: true,
      });

      onReviewSubmitted?.();
      setRating(0);
      setFeedback('');
      setCategory('collaboration');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Rating</label>
            <div className="mt-2">
              <RatingStars
                rating={rating}
                onRatingChange={setRating}
                size="lg"
                interactive
                showLabel
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collaboration">Collaboration</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="quality">Quality of Work</SelectItem>
                <SelectItem value="reliability">Reliability</SelectItem>
                <SelectItem value="expertise">Expertise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Your Review</label>
            <Textarea
              placeholder="Share your experience working with this person..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-1.5 resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {feedback.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !rating || !feedback.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}