"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
    initialRating?: number;
    onRatingChange?: (rating: number) => void;
    size?: number;
    readOnly?: boolean;
}

const StarButton = React.memo(({ 
    star, 
    size, 
    isActive, 
    isHovered,
    isClearing,
    readOnly,
    onStarClick,
    onMouseEnter,
    onMouseLeave 
}: { 
    star: number;
    size: number;
    isActive: boolean;
    isHovered: boolean;
    isClearing: boolean;
    readOnly: boolean;
    onStarClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) => (
    <button
        type="button"
        onClick={onStarClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn(
            "focus:outline-none transition-transform",
            readOnly ? "cursor-default" : "hover:scale-110"
        )}
        disabled={readOnly}
        aria-label={`${star} 점`}
    >
        <Star
            size={size}
            className={cn(
                "transition-colors duration-200",
                (isHovered || (!isHovered && isActive)) && !isClearing
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 fill-transparent"
            )}
        />
    </button>
));

StarButton.displayName = 'StarButton';

export const StarRating = React.memo(({ initialRating = 0, onRatingChange, size = 20, readOnly = false }: StarRatingProps) => {
    const [rating, setRating] = useState(initialRating)
    const [hoverRating, setHoverRating] = useState(0)
    const [isClearing, setIsClearing] = useState(false)

    useEffect(() => {
        if (!isClearing) {
            setRating(initialRating)
        }
    }, [initialRating, isClearing])

    const handleStarClick = useCallback((selectedRating: number) => {
        if (readOnly) return

        if (rating === selectedRating) {
            setIsClearing(true)
            setRating(0)
            setHoverRating(0)
            if (onRatingChange) {
                onRatingChange(0)
            }
        } else {
            setIsClearing(false)
            setRating(selectedRating)
            if (onRatingChange) {
                onRatingChange(selectedRating)
            }
        }
    }, [rating, readOnly, onRatingChange])

    const handleMouseEnter = useCallback((hoveredRating: number) => {
        if (readOnly) return
        setHoverRating(hoveredRating)
    }, [readOnly])

    const handleMouseLeave = useCallback(() => {
        if (readOnly) return
        setHoverRating(0)
        setIsClearing(false)
    }, [readOnly])

    const stars = useMemo(() => [1, 2, 3, 4, 5], []);

    return (
        <div className="flex space-x-1">
            {stars.map((star) => (
                <StarButton
                    key={star}
                    star={star}
                    size={size}
                    isActive={rating >= star}
                    isHovered={hoverRating >= star}
                    isClearing={isClearing}
                    readOnly={readOnly}
                    onStarClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                />
            ))}
        </div>
    )
})

StarRating.displayName = 'StarRating';

export const StarDisplay = React.memo(({ rating, size = 14 }: { rating: number; size?: number }) => {
    if (rating <= 0) return null

    return (
        <div className="flex items-center">
            <span className="mr-1">{rating}</span>
            <Star size={size} className="fill-yellow-400 text-yellow-400" />
        </div>
    )
})

StarDisplay.displayName = 'StarDisplay';
