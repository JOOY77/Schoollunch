"use client"

import React, { useRef, useState, type TouchEvent, type MouseEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Mouse, Search, Star, X, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { StarRating } from "./star-rating"
import { AuthDialog } from './auth/AuthDialog'
import { useMealContext } from '@/lib/contexts/MealContext'

// Popup 컴포넌트
const Popup = React.memo(function Popup({
    food,
    onClose,
    onRate,
    onToggleFavorite,
    currentRating,
    isAuthenticated,
    isFavorite,
}: {
    food: string
    onClose: () => void
    onRate: (rating: number) => void
    onToggleFavorite: () => void
    currentRating: number
    isAuthenticated: boolean
    isFavorite: boolean
}) {
    const [showRating, setShowRating] = useState(false)
    const [localRating, setLocalRating] = useState(currentRating)
    const [showAuth, setShowAuth] = useState(false)

    const handleGoogleSearch = (e: React.MouseEvent) => {
        e.stopPropagation()
        window.open(`https://www.google.com/search?hl=ko&tbm=isch&q=${encodeURIComponent(food)}`, "_blank")
    }

    const handleRate = (rating: number) => {
        setLocalRating(rating)
    }

    const handleSubmitRating = (e: React.MouseEvent) => {
        e.stopPropagation()
        onRate(localRating)
        onClose()
    }

    const handleShowRating = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isAuthenticated) {
            setShowRating(true)
        } else {
            setShowAuth(true)
        }
    }

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isAuthenticated) {
            await onToggleFavorite()
            onClose()
        } else {
            setShowAuth(true)
        }
    }

    const handleAuthSuccess = () => {
        setShowAuth(false)
        setShowRating(true)
    }

    const handlePopupClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handlePopupClick}>
            <div className="bg-white rounded-xl shadow-2xl p-5 w-80 max-w-[90%] border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">{food}</h4>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                {!showRating ? (
                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleSearch}
                            className="flex items-center w-full text-left px-4 py-3 text-base rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                            <div className="bg-blue-500 p-2 rounded-full mr-3">
                                <Search size={18} className="text-white" />
                            </div>
                            <span className="font-medium text-blue-700">구글 검색</span>
                        </button>
                        <button
                            onClick={handleShowRating}
                            className={`flex items-center w-full text-left px-4 py-3 text-base rounded-lg transition-colors ${
                                isAuthenticated 
                                    ? "bg-yellow-50 hover:bg-yellow-100" 
                                    : "bg-red-50 hover:bg-red-100"
                            }`}
                        >
                            <div className={`p-2 rounded-full mr-3 ${
                                isAuthenticated ? "bg-yellow-500" : "bg-red-500"
                            }`}>
                                <Star size={18} className="text-white" />
                            </div>
                            <span className={`font-medium ${
                                isAuthenticated ? "text-yellow-700" : "text-red-700"
                            }`}>
                                {isAuthenticated ? "별점 주기" : "로그인하여 별점 주기"}
                            </span>
                        </button>
                        <button
                            onClick={handleFavorite}
                            className={`flex items-center w-full text-left px-4 py-3 text-base rounded-lg transition-colors ${
                                isAuthenticated 
                                    ? isFavorite
                                        ? "bg-red-100 hover:bg-red-200"
                                        : "bg-red-50 hover:bg-red-100"
                                    : "bg-red-50 hover:bg-red-100"
                            }`}
                        >
                            <div className={`p-2 rounded-full mr-3 ${
                                isAuthenticated ? "bg-red-500" : "bg-red-500"
                            }`}>
                                <Heart size={18} className={`${isFavorite ? "fill-white" : ""} text-white`} />
                            </div>
                            <span className={`font-medium ${
                                isAuthenticated 
                                    ? isFavorite
                                        ? "text-red-800"
                                        : "text-red-700"
                                    : "text-red-700"
                            }`}>
                                {isAuthenticated 
                                    ? isFavorite 
                                        ? "즐겨찾기 해제" 
                                        : "즐겨찾기" 
                                    : "로그인하여 즐겨찾기"}
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-base text-gray-600 mb-2 text-center">별점을 선택해주세요</p>
                        <div className="flex justify-center">
                            <StarRating initialRating={localRating} onRatingChange={handleRate} size={28} />
                        </div>
                        <button
                            onClick={handleSubmitRating}
                            className="w-full text-center px-4 py-3 text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                            확인
                        </button>
                    </div>
                )}
            </div>
            {showAuth && (
                <AuthDialog
                    onSuccess={handleAuthSuccess}
                    onClose={() => setShowAuth(false)}
                />
            )}
        </div>
    )
})

// MealCard 컴포넌트
const MealCard = React.memo(function MealCard({ date, className }: { date: Date; className?: string }) {
    const {
        getMealDataForDate,
        userRatings,
        averageRatings,
        saveRating: saveRatingToContext,
        isAuthenticated,
        loading,
        calculateAverageRating,
        calculateMyAverageRating,
        getRatedFoodsCount,
        getMyRatedFoodsCount,
        favorites,
        toggleFavorite,
        ratingsCount
    } = useMealContext()

    const [selectedFood, setSelectedFood] = useState<string | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const mealData = getMealDataForDate(date)

    const handleFoodClick = (e: React.MouseEvent, food: string) => {
        e.stopPropagation()
        if (selectedFood === food) {
            setSelectedFood(null)
            return
        }
        if (cardRef.current) {
            setSelectedFood(food)
        }
    }

    const closePopup = () => {
        setSelectedFood(null)
    }

    const handleCardClick = () => {
        setSelectedFood(null)
    }

    const saveRatingToFirebase = async (food: string, rating: number) => {
        await saveRatingToContext(food, rating, date)
    }

    return (
        <Card
            className={cn("h-full shadow-lg rounded-lg lg:rounded-xl relative overflow-auto", className)}
            ref={cardRef}
            onClick={handleCardClick}
        >
            <CardContent className="p-2.5 lg:p-4">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 lg:h-7 lg:w-7 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {mealData.length > 0 ? (
                    <div className="space-y-2">
                        {mealData.map((item, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className={`flex items-center flex-1 cursor-pointer p-1 lg:p-1.5 rounded transition-colors ${
                                        favorites.includes(item)
                                            ? "bg-red-50 hover:bg-red-100 border border-red-200"
                                            : "hover:bg-gray-50"
                                    }`}
                                    onClick={(e) => handleFoodClick(e, item)}
                                >
                                    <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full mr-2 ${
                                        favorites.includes(item) ? "bg-red-500" : "bg-blue-500"
                                    }`}></div>
                                    <p className={`text-sm lg:text-base ${
                                        favorites.includes(item) ? "text-red-900 font-medium" : "text-gray-700"
                                    }`}>{item}
                                        {userRatings[item] > 0 && (
                                            <span className="flex items-center inline-flex ml-1">
                                                <Star size={14} className="ml-0.5 fill-yellow-400 text-yellow-400 w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                                <span className="ml-0.5">{userRatings[item]}</span>
                                            </span>
                                        )}
                                        {averageRatings[item] > 0 && (
                                            <span className="flex items-center inline-flex ml-1 text-gray-500 text-xs lg:text-sm">
                                                (평균
                                                <Star size={12} className="mx-0.5 fill-gray-400 text-gray-400 w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                                {averageRatings[item].toFixed(1)})
                                            </span>
                                        )}
                                    </p>
                                    {favorites.includes(item) && (
                                        <Heart size={14} className="ml-1.5 text-red-500 fill-red-500 w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm lg:text-base text-gray-500 text-center py-2">급식 정보가 없습니다</p>
                )}

                {mealData.length > 0 && (
                    <div className="mt-4 sm:mt-6 pt-2.5 sm:pt-3 border-t border-gray-200">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-2.5">오늘의 급식 평가</h4>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="bg-gray-50 p-2 sm:p-2.5 rounded-lg">
                                <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-1.5">나의 평균 별점</p>
                                <div className="flex items-center">
                                    <span className="text-base sm:text-lg font-bold text-gray-800">
                                        {calculateMyAverageRating(mealData)}
                                    </span>
                                    <Star size={16} className="ml-1 fill-yellow-400 text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    {getMyRatedFoodsCount(mealData)}개 평가
                                </p>
                            </div>
                            <div className="bg-gray-50 p-2 sm:p-2.5 rounded-lg">
                                <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-1.5">전체 평균 별점</p>
                                <div className="flex items-center">
                                    <span className="text-base sm:text-lg font-bold text-gray-800">
                                        {calculateAverageRating(mealData)}
                                    </span>
                                    <Star size={16} className="ml-1 fill-yellow-400 text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    {mealData.reduce((sum, food) => sum + (ratingsCount[food] || 0), 0)}개 평가
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {selectedFood && (
                    <Popup
                        food={selectedFood}
                        onClose={closePopup}
                        onRate={(rating) => saveRatingToFirebase(selectedFood, rating)}
                        onToggleFavorite={() => toggleFavorite(selectedFood)}
                        currentRating={userRatings[selectedFood] || 0}
                        isAuthenticated={isAuthenticated}
                        isFavorite={favorites.includes(selectedFood)}
                    />
                )}
            </CardContent>
        </Card>
    )
})

// CustomCalendar 컴포넌트
function CustomCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (date: Date) => void }) {
    const [displayMonth, setDisplayMonth] = useState(new Date(selectedDate))

    // 현재 달의 첫 날과 마지막 날
    const firstDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1)
    const lastDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0)

    // 이전 달의 마지막 날들 (첫 주를 채우기 위함)
    const daysFromPrevMonth = firstDayOfMonth.getDay() // 0: 일요일, 1: 월요일, ...

    // 다음 달의 첫 날들 (마지막 주를 채우기 위함)
    const daysFromNextMonth = 6 - lastDayOfMonth.getDay() // 마지막 날이 토요일이면 0, 금요일이면 1, ...

    // 달력에 표시할 모든 날짜 생성
    const calendarDays: Date[] = []

    // 이전 달의 날짜 추가
    for (let i = daysFromPrevMonth; i > 0; i--) {
        const day = new Date(firstDayOfMonth)
        day.setDate(day.getDate() - i)
        calendarDays.push(day)
    }

    // 현재 달의 날짜 추가
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const day = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), i)
        calendarDays.push(day)
    }

    // 다음 달의 날짜 추가
    for (let i = 1; i <= daysFromNextMonth; i++) {
        const day = new Date(lastDayOfMonth)
        day.setDate(day.getDate() + i)
        calendarDays.push(day)
    }

    // 요일 이름
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"]

    // 현재 달 이름
    const monthName = format(displayMonth, "yyyy년 MM월")

    // 이전 달, 다음 달 이동 - 선택된 날짜는 변경하지 않고 달력 표시 월만 변경
    const goToPrevMonth = () => {
        const prevMonth = new Date(displayMonth)
        prevMonth.setMonth(prevMonth.getMonth() - 1)
        setDisplayMonth(prevMonth)
    }

    const goToNextMonth = () => {
        const nextMonth = new Date(displayMonth)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        setDisplayMonth(nextMonth)
    }

    // 선택된 날짜가 변경되면 달력 표시 월도 업데이트
    React.useEffect(() => {
        setDisplayMonth(new Date(selectedDate))
    }, [selectedDate])

    return (
        <div className="bg-white rounded-lg p-3 shadow">
            {/* 달 이름과 네비게이션 */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={goToPrevMonth} className="p-1 text-blue-600">
                    <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-medium text-gray-900">{monthName}</h3>
                <button onClick={goToNextMonth} className="p-1 text-blue-600">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((day, index) => (
                    <div
                        key={index}
                        className={cn(
                            "text-center text-sm font-bold py-1",
                            index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-900",
                        )}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === displayMonth.getMonth()
                    const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                    const isSunday = day.getDay() === 0
                    const isSaturday = day.getDay() === 6

                    return (
                        <button
                            key={index}
                            onClick={() => onSelect(day)}
                            className={cn(
                                "text-center py-2 rounded-full text-sm hover:bg-blue-100 transition-colors",
                                isCurrentMonth && !isSunday && !isSaturday ? "text-gray-700 font-medium" : "",
                                isCurrentMonth && isSunday ? "text-red-600 font-medium" : "",
                                isCurrentMonth && isSaturday ? "text-blue-600 font-medium" : "",
                                !isCurrentMonth ? "text-gray-400" : "",
                                isToday ? "border-2 border-blue-500" : "",
                                isSelected ? "bg-blue-500 text-white hover:bg-blue-600" : "",
                            )}
                        >
                            {day.getDate()}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// MealApp 컴포넌트
export default function MealApp() {
    const {
        getMealDataForDate,
        userRatings,
        averageRatings,
        loading,
        dates,
        currentIndex,
        changeDate,
        setDates,
        setCurrentIndex,
        extendDates,
        showCalendar,
        setShowCalendar,
        isDragging,
        setIsDragging,
        dragOffset,
        setDragOffset,
        dragStartX,
        setDragStartX,
        handleCalendarSelect,
        user,
        showLogoutConfirm,
        setShowLogoutConfirm,
        handleLogout,
        ratingsCount
    } = useMealContext();

    const containerRef = useRef<HTMLDivElement>(null);
    const cardWidth = useRef(0);
    const cardGap = 20;

    // 화면 크기에 따라 카드 너비 계산
    React.useEffect(() => {
        if (containerRef.current) {
            cardWidth.current = containerRef.current.offsetWidth
        }

        const handleResize = () => {
            if (containerRef.current) {
                cardWidth.current = containerRef.current.offsetWidth
            }
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const schoolName = "우리 학교"

    // 현재 날짜 가져오기
    const getCurrentDate = () => {
        return dates[currentIndex] || new Date()
    }

    // 드래그 시작
    const handleDragStart = (clientX: number) => {
        if (showCalendar) return
        setIsDragging(true)
        setDragStartX(clientX)
        setDragOffset(0)
    }

    // 드래그 중
    const handleDragMove = (clientX: number) => {
        if (!isDragging || showCalendar) return
        
        const isMobile = window.innerWidth < 768
        const dragMultiplier = isMobile ? 1 : 1.5
        const newOffset = (clientX - dragStartX) * dragMultiplier
        
        setDragOffset(newOffset)
    }

    // 드래그 종료
    const handleDragEnd = () => {
        if (!isDragging || showCalendar) return

        const isMobile = window.innerWidth < 768
        const threshold = isMobile 
            ? cardWidth.current * 0.3
            : cardWidth.current * 0.15

        if (Math.abs(dragOffset) > threshold) {
            if (dragOffset > 0) {
                changeDate("prev")
            } else {
                changeDate("next")
            }
        }

        setIsDragging(false)
        setDragOffset(0)
    }

    // 이벤트 핸들러
    const handleTouchStart = (e: TouchEvent) => {
        handleDragStart(e.touches[0].clientX)
    }

    const handleTouchMove = (e: TouchEvent) => {
        handleDragMove(e.touches[0].clientX)
    }

    const handleMouseDown = (e: MouseEvent) => {
        handleDragStart(e.clientX)
    }

    const handleMouseMove = (e: MouseEvent) => {
        handleDragMove(e.clientX)
    }

    const handleMouseUp = () => {
        handleDragEnd()
    }

    const handleMouseLeave = () => {
        if (isDragging) {
            handleDragEnd()
        }
    }

    // 카드 렌더링
    const renderCards = () => {
        if (dates.length === 0) return null

        return [-1, 0, 1].map((offset) => {
            const index = currentIndex + offset
            if (index < 0 || index >= dates.length) return null

            const position = offset * (cardWidth.current + cardGap)
            const translateX = position + dragOffset

            return (
                <div
                    key={index}
                    className="absolute w-full h-full"
                    style={{
                        transform: `translateX(${translateX}px)`,
                        transition: isDragging ? "none" : "transform 0.3s ease-out",
                    }}
                >
                    <MealCard date={dates[index]} />
                </div>
            )
        })
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center p-4 lg:p-6 no-select">
            {/* 파란색 둥근 사각형 헤더 */}
            <div className="bg-blue-500 rounded-lg lg:rounded-xl p-3 lg:p-4 text-white shadow-lg w-[92%] lg:w-[600px]">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-lg lg:text-xl font-bold">{schoolName}</h1>
                    <div className="flex gap-2">
                        {user && (
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="text-sm lg:text-base bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
                            >
                                로그아웃
                            </button>
                        )}
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="text-sm lg:text-base bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
                        >
                            {showCalendar ? "닫기" : "달력"}
                        </button>
                    </div>
                </div>

                {/* 날짜 네비게이션 */}
                <div className="flex justify-between items-center">
                    <button onClick={() => changeDate("prev")} className="p-1.5 -ml-1.5" disabled={currentIndex <= 0}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-base lg:text-lg font-medium">
                        {dates[currentIndex] ? format(dates[currentIndex], "yyyy년 MM월 dd일 (EEEE)", { locale: ko }) : ""}
                    </h2>
                    <button onClick={() => changeDate("next")} className="p-1.5 -mr-1.5" disabled={currentIndex >= dates.length - 1}>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* 커스텀 달력 (토글) */}
                {showCalendar && (
                    <div className="mt-3">
                        <CustomCalendar selectedDate={getCurrentDate()} onSelect={handleCalendarSelect} />
                    </div>
                )}
            </div>

            {/* 드래그 가능한 카드 컨테이너 */}
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden w-[92%] lg:w-[600px] mt-4 lg:mt-5"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleDragEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {renderCards()}
            </div>

            {/* 사용 안내 */}
            <div className="w-full text-center mt-4 lg:mt-5 space-y-1">
                <div className="text-xs lg:text-sm text-gray-600 flex items-center justify-center gap-1">
                    <span>← 좌우로 스와이프하여 날짜 변경 →</span>
                </div>
                <div className="text-[10px] lg:text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Mouse className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                    <span>컴퓨터: 마우스로 좌우 드래그</span>
                </div>
            </div>

            {/* 로그아웃 확인 대화상자 */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl p-4 w-80 max-w-[90%] shadow-lg">
                        <h3 className="text-lg font-medium mb-3">로그아웃</h3>
                        <p className="text-gray-600 mb-4">정말 로그아웃 하시겠습니까?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
