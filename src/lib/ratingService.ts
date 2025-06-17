import { db } from './firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';

interface RatingData {
  userId: string;
  food: string;
  rating: number;
  date: string;
  schoolCode: string;
}

// Firebase 문서 ID에 사용할 수 있도록 문자열 인코딩
function encodeForDocId(str: string): string {
  return str.replace(/[/\\?%*:|"<>()]/g, '_');
}

export async function saveRating(data: RatingData) {
  const { userId, food, rating, schoolCode } = data;
  const encodedFood = encodeForDocId(food);
  
  try {
    const ratingRef = doc(db, 'ratings', `${userId}_${encodedFood}`);
    
    // 0점인 경우 기존 평점 삭제
    if (rating === 0) {
      await deleteDoc(ratingRef);
      // 평균 재계산
      await recalculateAverageRating(food, schoolCode);
      return true;
    }

    // 개별 평점 저장
    await setDoc(ratingRef, {
      userId,
      food,
      rating,
      schoolCode,
      timestamp: new Date().toISOString()
    });

    // 평균 재계산
    await recalculateAverageRating(food, schoolCode);

    return true;
  } catch (error) {
    console.error('Error saving rating:', error);
    throw error;
  }
}

// 평균 평점 재계산 함수
async function recalculateAverageRating(food: string, schoolCode: string) {
  const encodedFood = encodeForDocId(food);
  const averageRef = doc(db, 'averageRatings', `${encodedFood}_${schoolCode}`);
  
  try {
    // 해당 음식의 모든 평점 가져오기
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, 
      where('food', '==', food),
      where('schoolCode', '==', schoolCode)
    );
    
    const querySnapshot = await getDocs(q);
    const ratings = querySnapshot.docs.map(doc => doc.data().rating);
    
    // 평점이 없는 경우
    if (ratings.length === 0) {
      await deleteDoc(averageRef);
      return;
    }
    
    // 0점을 제외한 평점들의 평균 계산
    const validRatings = ratings.filter(r => r > 0);
    const totalScore = validRatings.reduce((sum, r) => sum + r, 0);
    const averageRating = totalScore / validRatings.length;
    
    // 평균 평점 저장
    await setDoc(averageRef, {
      food,
      schoolCode,
      totalRatings: validRatings.length,
      totalScore,
      averageRating
    });
  } catch (error) {
    console.error('Error recalculating average:', error);
    throw error;
  }
}

export async function getUserRatings(userId: string) {
  try {
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const ratings: Record<string, number> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating > 0) {  // 0점은 제외
        ratings[data.food] = data.rating;
      }
    });
    
    return ratings;
  } catch (error) {
    console.error('Error getting user ratings:', error);
    return {};
  }
}

export async function getAverageRatings(foods: string[], schoolCode: string) {
  try {
    const averages: Record<string, { averageRating: number, totalRatings: number }> = {};
    await Promise.all(foods.map(async (food) => {
      const encodedFood = encodeForDocId(food);
      const averageRef = doc(db, 'averageRatings', `${encodedFood}_${schoolCode}`);
      const averageDoc = await getDoc(averageRef);
      if (averageDoc.exists()) {
        const data = averageDoc.data();
        averages[food] = {
          averageRating: data.totalRatings > 0 ? data.averageRating : 0,
          totalRatings: data.totalRatings || 0
        };
      } else {
        averages[food] = { averageRating: 0, totalRatings: 0 };
      }
    }));
    return averages;
  } catch (error) {
    console.error('Error getting average ratings:', error);
    return {};
  }
} 