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
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'url(/public/globe.svg) center/cover no-repeat', // 必要なら背景画像を差し替え
    }}>
      {/* 透過オーバーレイ＋ぼかし */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '20px', color: '#444', marginBottom: 32, fontWeight: 500 }}>
          認証処理中...
        </div>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(90deg, #4A90E2 0%, #50E3C2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '32px',
            padding: '14px 36px',
            fontSize: '18px',
            fontWeight: 600,
            boxShadow: '0 4px 24px rgba(80, 227, 194, 0.15)',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onClick={subscribeUserToPush}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(80, 227, 194, 0.25)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(80, 227, 194, 0.15)'; }}
        >
          <span style={{ fontSize: '22px', marginRight: 4 }}>🔔</span>
          通知を許可
        </button>
      </div>
    </div>
  );
}
