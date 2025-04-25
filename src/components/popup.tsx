import React, { useCallback, useMemo } from 'react';
import { X, Star, Image, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "./star-rating"
import { cn } from "@/lib/utils"

interface PopupProps {
    food: string
    position?: { x: number; y: number }
    onClose: () => void
    onRate: (rating: number) => void
    onToggleFavorite: () => void
    currentRating: number
    isAuthenticated: boolean
    isFavorite: boolean
}

export const Popup = React.memo(({
    food,
    position,
    onClose,
    onRate,
    onToggleFavorite,
    currentRating,
    isAuthenticated,
    isFavorite
}: PopupProps) => {
    // Google 검색 URL 메모이제이션
    const googleSearchUrl = useMemo(() => {
        const encodedFood = encodeURIComponent(`${food} 급식`);
        return `https://www.google.com/search?q=${encodedFood}&tbm=isch`;
    }, [food]);

    // 별점 클릭 핸들러 메모이제이션
    const handleStarClick = useCallback((rating: number) => {
        onRate(rating);
    }, [onRate]);

    // 즐겨찾기 토글 핸들러 메모이제이션
    const handleFavoriteToggle = useCallback(() => {
        onToggleFavorite();
    }, [onToggleFavorite]);

    // 인증 상태에 따른 별점 섹션 메모이제이션
    const ratingSection = useMemo(() => {
        if (!isAuthenticated) {
            return (
                <div className="text-sm text-gray-500 mt-4">
                    로그인하시면 별점을 남기실 수 있습니다.
                </div>
            );
        }

        return (
            <div className="flex items-center mt-4">
                <div className="text-sm mr-2">별점:</div>
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                            key={rating}
                            size={20}
                            className={cn(
                                "cursor-pointer transition-colors",
                                rating <= currentRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                            )}
                            onClick={() => handleStarClick(rating)}
                        />
                    ))}
                </div>
            </div>
        );
    }, [isAuthenticated, currentRating, handleStarClick]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 w-[85%] sm:w-[90%] md:w-auto min-w-[260px] sm:min-w-[280px] md:min-w-[320px] max-w-[95%] sm:max-w-md mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800">{food}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </button>
                </div>

                <div className="flex space-x-2 mt-2">
                    <a
                        href={googleSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                    >
                        <Image size={16} className="mr-1" />
                        이미지 검색
                    </a>
                    {isAuthenticated && (
                        <button
                            onClick={handleFavoriteToggle}
                            className="text-sm flex items-center"
                        >
                            <Heart
                                size={16}
                                className={cn(
                                    "mr-1",
                                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                                )}
                            />
                            {isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
                        </button>
                    )}
                </div>

                {ratingSection}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // 최적화된 비교 함수
    return (
        prevProps.food === nextProps.food &&
        prevProps.currentRating === nextProps.currentRating &&
        prevProps.isAuthenticated === nextProps.isAuthenticated &&
        prevProps.isFavorite === nextProps.isFavorite &&
        (!prevProps.position || !nextProps.position || (
            prevProps.position.x === nextProps.position.x &&
            prevProps.position.y === nextProps.position.y
        ))
    );
}); 