"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { getMealData, type MealData } from '../mealApi';
import { saveRating as saveRatingToDb, getAverageRatings, getUserRatings } from '../ratingService';
import { auth } from '@/lib/firebase';
import { User, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CacheData {
  data: MealData;
  timestamp: number;
  expiresAt: number;
}

interface MealContextType {
  mealData: MealData;
  averageRatings: Record<string, number>;
  userRatings: Record<string, number>;
  favorites: string[];
  isAuthenticated: boolean;
  user: User | null;
  getMealDataForDate: (date: Date) => string[];
  calculateAverageRating: (meals: string[]) => string;
  calculateMyAverageRating: (meals: string[]) => string;
  getRatedFoodsCount: (meals: string[]) => number;
  getMyRatedFoodsCount: (meals: string[]) => number;
  saveRating: (food: string, rating: number, date: Date) => Promise<void>;
  toggleFavorite: (food: string) => Promise<void>;
  prefetchMealData: (date: Date, direction?: 'prev' | 'next') => Promise<void>;
  loading: boolean;
  error: string | null;
  dates: Date[];
  currentIndex: number;
  changeDate: (direction: 'prev' | 'next') => void;
  setDates: (dates: Date[]) => void;
  setCurrentIndex: (index: number) => void;
  extendDates: (direction: 'prev' | 'next') => void;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  handleCalendarSelect: (date: Date) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragOffset: number;
  setDragOffset: (offset: number) => void;
  dragStartX: number;
  setDragStartX: (x: number) => void;
}

const MealContext = createContext<MealContextType | null>(null);

export const useMealContext = () => {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error('useMealContext must be used within a MealProvider');
  }
  return context;
};

export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mealData, setMealData] = useState<MealData>({});
  const [averageRatings, setAverageRatings] = useState<Record<string, number>>({});
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cache] = useState<Map<string, CacheData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  
  const SCHOOL_CODE = 'H10';
  const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24시간으로 확장
  const IMMEDIATE_RANGE = 7; // ±1주로 확장
  const BACKGROUND_RANGE = 28; // ±4주로 확장
  const PRELOAD_RANGE = 14; // 방향별 추가 프리로드 범위

  // Initialize dates array
  useEffect(() => {
    const today = new Date();
    const initialDates: Date[] = [];
    
    // Add 3 days before today
    for (let i = 3; i > 0; i--) {
      initialDates.push(addDays(today, -i));
    }
    
    // Add today
    initialDates.push(today);
    
    // Add 3 days after today
    for (let i = 1; i <= 3; i++) {
      initialDates.push(addDays(today, i));
    }
    
    setDates(initialDates);
    setCurrentIndex(3); // Set current index to today
  }, []);

  // 날짜가 설정되면 데이터를 가져오는 useEffect
  useEffect(() => {
    if (dates.length > 0 && currentIndex >= 0) {
      const currentDate = dates[currentIndex];
      setLoading(true);
      
      // 현재 날짜 기준으로 데이터 가져오기
      getImmediateData(currentDate)
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching meal data:', error);
          setLoading(false);
          setError('급식 데이터를 가져오는 중 오류가 발생했습니다.');
        });

      // 백그라운드에서 추가 데이터 프리페치
      prefetchBackgroundData(currentDate);
    }
  }, [dates, currentIndex]);

  // Firebase 인증 상태 감시
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadUserRatings(user.uid);
        loadUserFavorites(user.uid);
      } else {
        setUserRatings({});
        setFavorites([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 사용자 별점 로드
  const loadUserRatings = useCallback(async (userId: string) => {
    try {
      const ratings = await getUserRatings(userId);
      setUserRatings(ratings);
    } catch (error) {
      console.error('Error loading user ratings:', error);
    }
  }, []);

  // 사용자 즐겨찾기 로드
  const loadUserFavorites = useCallback(async (userId: string) => {
    try {
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const userFavorites: string[] = [];
      querySnapshot.forEach((doc) => {
        userFavorites.push(doc.data().food);
      });
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading user favorites:', error);
    }
  }, []);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(async (food: string) => {
    if (!user) return;

    try {
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, 
        where('userId', '==', user.uid),
        where('food', '==', food)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // 즐겨찾기 추가
        await addDoc(favoritesRef, {
          userId: user.uid,
          food,
          createdAt: serverTimestamp()
        });
        setFavorites(prev => [...prev, food]);
      } else {
        // 즐겨찾기 제거
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(docToDelete.ref);
        setFavorites(prev => prev.filter(f => f !== food));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [user]);

  // 특정 날짜의 급식 데이터 반환
  const getMealDataForDate = useCallback((date: Date): string[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return mealData[dateKey] || [];
  }, [mealData]);

  // 평균 별점 계산
  const calculateAverageRating = useCallback((meals: string[]): string => {
    const foodsWithRatings = meals.filter(food => averageRatings[food] > 0);
    if (foodsWithRatings.length === 0) return "0.0";
    const sum = foodsWithRatings.reduce((acc, food) => acc + averageRatings[food], 0);
    return (sum / foodsWithRatings.length).toFixed(1);
  }, [averageRatings]);

  // 내 평균 별점 계산
  const calculateMyAverageRating = useCallback((meals: string[]): string => {
    const foodsWithMyRatings = meals.filter(food => userRatings[food] > 0);
    if (foodsWithMyRatings.length === 0) return "0.0";
    const sum = foodsWithMyRatings.reduce((acc, food) => acc + userRatings[food], 0);
    return (sum / foodsWithMyRatings.length).toFixed(1);
  }, [userRatings]);

  // 별점이 있는 음식 수 계산
  const getRatedFoodsCount = useCallback((meals: string[]): number => 
    meals.filter(food => averageRatings[food] > 0).length,
    [averageRatings]
  );

  // 내가 별점을 준 음식 수 계산
  const getMyRatedFoodsCount = useCallback((meals: string[]): number => 
    meals.filter(food => userRatings[food] > 0).length,
    [userRatings]
  );

  // 즉시 로딩 데이터 가져오기
  const getImmediateData = useCallback(async (date: Date, direction?: 'prev' | 'next') => {
    let start = subDays(date, IMMEDIATE_RANGE);
    let end = addDays(date, IMMEDIATE_RANGE);

    // 방향에 따른 추가 프리로드
    if (direction === 'prev') {
      start = subDays(start, PRELOAD_RANGE);
    } else if (direction === 'next') {
      end = addDays(end, PRELOAD_RANGE);
    }

    const data = await getMealData(start, end);
    setMealData(prev => ({ ...prev, ...data }));
    return data;
  }, []);

  // 백그라운드 데이터 프리페칭
  const prefetchBackgroundData = useCallback(async (date: Date, direction?: 'prev' | 'next') => {
    let start = subDays(date, BACKGROUND_RANGE);
    let end = addDays(date, BACKGROUND_RANGE);

    // 방향에 따른 추가 프리로드
    if (direction === 'prev') {
      start = subDays(start, PRELOAD_RANGE);
    } else if (direction === 'next') {
      end = addDays(end, PRELOAD_RANGE);
    }

    const monthKey = format(date, 'yyyy-MM');
    
    if (cache.has(monthKey)) {
      const cached = cache.get(monthKey)!;
      if (Date.now() < cached.expiresAt) {
        setMealData(prev => ({ ...prev, ...cached.data }));
        return;
      }
    }

    try {
      const data = await getMealData(start, end);
      cache.set(monthKey, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      });
      setMealData(prev => ({ ...prev, ...data }));

      // 모든 음식의 평균 별점 가져오기
      const allFoods = Object.values(data).flat();
      if (allFoods.length > 0) {
        const averages = await getAverageRatings(allFoods, SCHOOL_CODE);
        setAverageRatings(prev => ({ ...prev, ...averages }));
      }
    } catch (error) {
      console.error('Error prefetching data:', error);
    }
  }, [cache]);

  // 통합된 데이터 프리페칭
  const prefetchMealData = useCallback(async (date: Date, direction?: 'prev' | 'next') => {
    await getImmediateData(date, direction); // 즉시 로딩
    prefetchBackgroundData(date, direction); // 백그라운드 로딩
  }, [getImmediateData, prefetchBackgroundData]);

  // 별점 저장
  const saveRating = useCallback(async (food: string, rating: number, date: Date) => {
    if (!user) return;

    try {
      await saveRatingToDb({
        userId: user.uid,
        food,
        rating,
        schoolCode: SCHOOL_CODE,
        date: format(date, 'yyyy-MM-dd')
      });
      
      // 사용자 별점 업데이트
      setUserRatings(prev => ({
        ...prev,
        [food]: rating
      }));

      // 평균 별점 새로고침
      const allFoods = [food];
      const averages = await getAverageRatings(allFoods, SCHOOL_CODE);
      setAverageRatings(prev => ({
        ...prev,
        ...averages
      }));

      // 주변 날짜들의 데이터도 새로고침
      const prevDate = subDays(date, 1);
      const nextDate = addDays(date, 1);
      await Promise.all([
        getImmediateData(prevDate),
        getImmediateData(date),
        getImmediateData(nextDate)
      ]);

    } catch (error) {
      console.error('Error saving rating:', error);
      setError('별점을 저장하는 중 오류가 발생했습니다.');
    }
  }, [user, getImmediateData]);

  const extendDates = useCallback((direction: 'prev' | 'next') => {
    setDates(prevDates => {
      if (prevDates.length === 0) return prevDates;
      
      const newDates = [...prevDates];
      if (direction === 'prev') {
        const firstDate = prevDates[0];
        for (let i = 1; i <= 7; i++) {
          newDates.unshift(addDays(firstDate, -i));
        }
        setCurrentIndex(prev => prev + 7);
      } else {
        const lastDate = prevDates[prevDates.length - 1];
        for (let i = 1; i <= 7; i++) {
          newDates.push(addDays(lastDate, i));
        }
      }
      return newDates;
    });
  }, []);

  const changeDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentIndex(prev => {
      if (direction === 'prev') {
        if (prev <= 1) {
          extendDates('prev');
          return prev;
        }
        return prev - 1;
      } else {
        if (prev >= dates.length - 2) {
          extendDates('next');
        }
        return prev + 1;
      }
    });
  }, [dates.length, extendDates]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false);
      window.location.reload();
    } catch (error) {
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleCalendarSelect = (newDate: Date) => {
    const newDates: Date[] = [];
    
    // 선택한 날짜 기준으로 3일 전부터
    for (let i = 3; i > 0; i--) {
      const prevDate = new Date(newDate);
      prevDate.setDate(newDate.getDate() - i);
      newDates.push(prevDate);
    }
    
    // 선택한 날짜
    newDates.push(newDate);
    
    // 선택한 날짜 기준으로 3일 후까지
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date(newDate);
      nextDate.setDate(newDate.getDate() + i);
      newDates.push(nextDate);
    }
    
    setDates(newDates);
    setCurrentIndex(3); // 선택한 날짜는 항상 인덱스 3에 위치
    setShowCalendar(false);
  };

  return (
    <MealContext.Provider value={{
      mealData,
      averageRatings,
      userRatings,
      favorites,
      isAuthenticated: !!user,
      user,
      getMealDataForDate,
      calculateAverageRating,
      calculateMyAverageRating,
      getRatedFoodsCount,
      getMyRatedFoodsCount,
      saveRating,
      toggleFavorite,
      prefetchMealData,
      loading,
      error,
      dates,
      currentIndex,
      changeDate,
      setDates,
      setCurrentIndex,
      extendDates,
      showCalendar,
      setShowCalendar,
      showLogoutConfirm,
      setShowLogoutConfirm,
      handleLogout,
      handleCalendarSelect,
      isDragging,
      setIsDragging,
      dragOffset,
      setDragOffset,
      dragStartX,
      setDragStartX,
    }}>
      {children}
    </MealContext.Provider>
  );
}; 