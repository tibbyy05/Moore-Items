import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  reviewCount?: number;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = false,
  reviewCount,
  className,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const filledColor = '#c8a45e';

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const displayRating = interactive && hoveredRating > 0 ? hoveredRating : rating;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= Math.floor(displayRating);
          const isPartial =
            starValue > Math.floor(displayRating) &&
            starValue <= Math.ceil(displayRating);

          return (
            <div
              key={i}
              className="relative"
              onMouseEnter={() => interactive && setHoveredRating(starValue)}
              onMouseLeave={() => interactive && setHoveredRating(0)}
              onClick={() => handleClick(starValue)}
            >
              <Star
                className={cn(sizeClasses[size], 'transition-colors', interactive && 'cursor-pointer')}
                style={
                  isFilled
                    ? { color: filledColor, fill: filledColor }
                    : { color: '#d7cfc2', fill: 'none' }
                }
              />
              {isPartial && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    width: `${(displayRating - Math.floor(displayRating)) * 100}%`,
                  }}
                >
                  <Star
                    className={sizeClasses[size]}
                    style={{ color: filledColor, fill: filledColor }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-warm-700">{rating.toFixed(1)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-warm-500">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
