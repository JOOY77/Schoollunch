import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StarRating } from "./star-rating"

interface PopupProps {
    food: string
    position?: { top: number; left: number }
    onClose: () => void
    onRate: (rating: number) => void
    currentRating: number
    isAuthenticated: boolean
}

export function Popup({
    food,
    onClose,
    onRate,
    currentRating,
    isAuthenticated,
    position,
}: PopupProps) {
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

                {isAuthenticated ? (
                    <>
                        <div className="mb-3 sm:mb-4 md:mb-6">
                            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 sm:mb-3">이 메뉴는 어떠셨나요?</p>
                            <StarRating
                                initialRating={Number(currentRating)}
                                onRatingChange={onRate}
                                size={24}
                            />
                        </div>
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">
                            별점을 다시 클릭하면 평가가 취소됩니다.
                        </p>
                    </>
                ) : (
                    <div className="text-center">
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 sm:mb-3 md:mb-4">
                            급식을 평가하려면 로그인이 필요합니다.
                        </p>
                        <Button
                            onClick={onClose}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base"
                        >
                            확인
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
} 