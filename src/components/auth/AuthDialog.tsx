import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { X } from 'lucide-react';

interface AuthDialogProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function AuthDialog({ onSuccess, onClose }: AuthDialogProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    // 이벤트 전파 중지
    e.stopPropagation();
    
    try {
      setError('');
      setIsLoading(true);

      // 새로운 provider 인스턴스 생성
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // 직접 로그인 시도
      const result = await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('로그인 창이 닫혔습니다. 다시 시도해주세요.');
      } else {
        setError(`로그인 오류: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90%]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">로그인</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            {isLoading ? '로그인 중...' : 'Google로 로그인'}
          </button>
          
          {/* 이메일 로그인 UI는 주석 처리 (나중에 필요하면 활성화) */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <form className="space-y-3">
            <div>
              <input
                type="email"
                placeholder="이메일"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="비밀번호"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              이메일로 로그인
            </button>
          </form> */}
        </div>
      </div>
    </div>
  );
} 