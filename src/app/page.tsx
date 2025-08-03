"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { subscribeUserToPush } from '../lib/pushNotification';

export default function HomePage() {
  const router = useRouter();
  const { supabase } = useAuth();

  useEffect(() => {
    router.replace('/train-status');
  }, [router]);

  // ローディング表示
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666',
      background: '#fff',
    }}>
      <div className="spinner" />
      <div style={{ marginTop: 24 }}>認証処理中...</div>
      <style>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 6px solid #e0e0e0;
          border-top: 6px solid #4A90E2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 8px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  );
}
