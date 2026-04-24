import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RatingStars({
  rating,
  onRatingChange,
  size = 'md',
  interactive = true,
  showLabel = true,
  className = '',
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const [hoverRating, setHoverRating] = React.useState(0);
  const displayRating = hoverRating || rating || 0;

  const getRatingLabel = () => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return labels[Math.round(displayRating)] || '';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizes[size],
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              )}
            />
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground ml-2">
          {displayRating > 0 && `${displayRating.toFixed(1)} - ${getRatingLabel()}`}
        </span>
      )}
    </div>
  );
}