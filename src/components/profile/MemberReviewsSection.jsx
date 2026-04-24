import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ReviewsList from '@/components/reviews/ReviewsList';
import ReviewForm from '@/components/reviews/ReviewForm';

export default function MemberReviewsSection({
  userId,
  currentUserId,
  isOwnProfile,
}) {
  const [reviewFormOpen, setReviewFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ReviewsList
        userId={userId}
        currentUserId={currentUserId}
        showAddButton={!isOwnProfile && currentUserId}
        onAddReview={() => setReviewFormOpen(true)}
      />

      <ReviewForm
        open={reviewFormOpen}
        onOpenChange={setReviewFormOpen}
        reviewedUserId={userId}
        onReviewSubmitted={() => {
          setReviewFormOpen(false);
        }}
      />
    </div>
  );
}