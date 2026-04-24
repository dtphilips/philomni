import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import ReviewCard from './ReviewCard';
import RatingStars from './RatingStars';

export default function ReviewsList({
  userId,
  currentUserId,
  showAddButton = false,
  onAddReview,
  category = null,
}) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState(category);

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['member-reviews', userId],
    queryFn: () => base44.entities.MemberReview.filter(
      { reviewed_user_id: userId },
      '-created_date',
      100
    ),
  });

  const filteredReviews = selectedCategory
    ? reviews.filter(r => r.category === selectedCategory)
    : reviews;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
  }));

  const handleReviewDeleted = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['member-reviews', userId] });
  };

  const handleReviewAdded = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['member-reviews', userId] });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{averageRating}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>
          <RatingStars
            rating={parseFloat(averageRating)}
            interactive={false}
            showLabel={false}
            size="lg"
          />
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm font-medium w-8">{rating}★</span>
              <div className="flex-1 bg-background rounded-full h-2">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%',
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({reviews.length})
          </Button>
          {['collaboration', 'communication', 'quality', 'reliability', 'expertise'].map(cat => {
            const count = reviews.filter(r => r.category === cat).length;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat} ({count})
              </Button>
            );
          })}
        </div>

        {showAddButton && currentUserId !== userId && (
          <Button onClick={onAddReview}>
            Leave Review
          </Button>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {selectedCategory ? 'No reviews in this category' : 'No reviews yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onDelete={handleReviewDeleted}
              onHelpful={handleReviewAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}