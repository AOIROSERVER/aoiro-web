"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { subscribeUserToPush } from '../lib/pushNotification';

export default function HomePage() {
  const router = useRouter();
  const { supabase } = useAuth();

  useEffect(() => {
    // フラグメントベースの認証を処理
    const handleFragmentAuth = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        try {
          // フラグメントからパラメータを抽出
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const expiresIn = params.get('expires_in');
          const tokenType = params.get('token_type');

          if (accessToken && refreshToken) {
            // Supabaseセッションを設定
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('セッション設定エラー:', error);
              router.push('/login?error=session_error');
              return;
            }

            // 認証成功後、フラグメントをクリアして運行状況ページにリダイレクト
            window.history.replaceState(null, '', window.location.pathname);
            router.push('/train-status');
            return;
          }
        } catch (error) {
          console.error('認証処理エラー:', error);
          router.push('/login?error=auth_error');
          return;
        }
      }

      // 通常のルーティング処理
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/train-status');
      } else {
        router.push('/login');
      }
    };

    handleFragmentAuth();
  }, [router, supabase]);

  // ローディング表示
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      認証処理中...
      <button
        style={{ marginTop: 24, padding: '8px 16px', fontSize: '16px', cursor: 'pointer' }}
        onClick={subscribeUserToPush}
      >
        通知を許可
      </button>
    </div>
  );
}
