import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 값 검증
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error('Firebase API Key is not set in environment variables');
}
if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  throw new Error('Firebase Auth Domain is not set in environment variables');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage(); // 브라우저 언어 설정 사용
export const db = getFirestore(app);

// Google provider를 export
export const googleProvider = new GoogleAuthProvider();
// 추가 설정
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 구글 로그인 함수
export const signInWithGoogle = async () => {
  try {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // 모바일에서는 팝업 대신 리다이렉트 사용
      await signInWithRedirect(auth, googleProvider);
    } else {
      // 데스크톱에서는 팝업 사용
      return await signInWithPopup(auth, googleProvider);
    }
  } catch (error) {
    throw error;
  }
};

// 리다이렉트 결과 확인
export const getGoogleRedirectResult = async () => {
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    throw error;
  }
};

// 이메일 회원가입
export const signupWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// 이메일 로그인
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
}; 