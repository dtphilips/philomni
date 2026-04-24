import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MoreVertical, Trash2 } from 'lucide-react';
import RatingStars from './RatingStars';

export default function ReviewCard({
  review,
  currentUserId,
  onDelete,
  onHelpful,
}) {
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = currentUserId === review.reviewer_id || currentUserId === review.reviewed_user_id;

  const handleHelpful = async () => {
    setLiking(true);
    try {
      await base44.entities.MemberReview.update(review.id, {
        helpful_count: (review.helpful_count || 0) + 1,
      });
      onHelpful?.();
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this review?')) return;
    
    setDeleting(true);
    try {
      await base44.entities.MemberReview.delete(review.id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete review:', error);
    } finally {
      setDeleting(false);
    }
  };

  const categoryColors = {
    collaboration: 'bg-blue-50 text-blue-700',
    communication: 'bg-green-50 text-green-700',
    quality: 'bg-purple-50 text-purple-700',
    reliability: 'bg-orange-50 text-orange-700',
    expertise: 'bg-pink-50 text-pink-700',
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full flex-shrink-0 bg-muted flex items-center justify-center">
            {review.reviewer_avatar ? (
              <img src={review.reviewer_avatar} alt={review.reviewer_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {review.reviewer_name?.[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{review.reviewer_name}</p>
            <RatingStars
              rating={review.rating}
              interactive={false}
              showLabel={false}
              size="sm"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {review.created_date && formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
            </p>
          </div>
        </div>

        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {review.category && (
        <Badge className={`capitalize ${categoryColors[review.category] || ''}`}>
          {review.category}
        </Badge>
      )}

      {review.is_verified_collaboration && (
        <Badge variant="outline" className="text-xs">
          ✓ Verified collaboration
        </Badge>
      )}

      <p className="text-sm text-foreground">{review.feedback}</p>

      <Button
        variant="outline"
        size="sm"
        onClick={handleHelpful}
        disabled={liking}
        className="mt-2"
      >
        <ThumbsUp className="w-3 h-3 mr-1.5" />
        Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
      </Button>
    </div>
  );
}