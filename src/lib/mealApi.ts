import { format } from 'date-fns';

const API_KEY = process.env.NEXT_PUBLIC_NEIS_API_KEY;
const BASE_URL = 'https://open.neis.go.kr/hub';

// 학교 정보
const ATPT_OFCDC_SC_CODE = 'H10';  // 서울특별시교육청
const SD_SCHUL_CODE = '7480075';    // 학교 코드

export interface MealData {
  [date: string]: string[];
}

export async function getMealData(startDate: Date, endDate: Date): Promise<MealData> {
  const formattedStartDate = format(startDate, 'yyyyMMdd');
  const formattedEndDate = format(endDate, 'yyyyMMdd');

  const url = `${BASE_URL}/mealServiceDietInfo` +
    `?KEY=${API_KEY}` +
    `&Type=json` +
    `&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}` +
    `&SD_SCHUL_CODE=${SD_SCHUL_CODE}` +
    `&MLSV_FROM_YMD=${formattedStartDate}` +
    `&MLSV_TO_YMD=${formattedEndDate}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    const result: MealData = {};

    // API 응답 구조 확인
    if (!data.mealServiceDietInfo) {
      return {};
    }

    // RESULT.CODE가 있는지 확인
    if (data.RESULT?.CODE === 'INFO-200') {
      return {};
    }

    // 급식 데이터가 있는지 확인
    if (data.mealServiceDietInfo?.[1]?.row) {
      data.mealServiceDietInfo[1].row.forEach((meal: any) => {
        const date = meal.MLSV_YMD; // YYYYMMDD 형식
        const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
        // 급식 메뉴를 배열로 변환 (불필요한 정보 제거)
        const menuList = meal.DDISH_NM.split('<br/>')
          .map((item: string) => item.trim())
          .map((item: string) => {
            // 알레르기 정보 제거 (예: 쌀밥(1.2.3) -> 쌀밥)
            return item.replace(/\([0-9.,]+\)/g, '').trim();
          })
          .filter((item: string) => item !== '');

        result[formattedDate] = menuList;
      });
    }

    return result;
  } catch (error) {
    console.error('급식 데이터 가져오기 실패:', error);
    return {};
  }
} 