"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const SupabaseNotification = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // ブラウザが通知をサポートしているかチェック
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      console.log('このブラウザは通知をサポートしていません');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await registerServiceWorker();
        await saveToken();
      }
    } catch (error) {
      console.error('通知の許可を取得できませんでした:', error);
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/supabase-sw.js');
        console.log('Service Worker登録成功:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker登録失敗:', error);
      }
    }
  };

  const saveToken = async () => {
    try {
      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('ユーザーがログインしていません');
        return;
      }

      // デバイス情報を生成（簡易版）
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      };

      // トークンとしてデバイス情報のハッシュを使用
      const token = btoa(JSON.stringify(deviceInfo));

      // トークンをSupabaseに保存
      const { error } = await supabase
        .from('notification_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          device_type: 'web',
          is_active: true
        }, {
          onConflict: 'token'
        });

      if (error) {
        console.error('トークンの保存に失敗:', error);
      } else {
        console.log('通知トークンを保存しました');
      }
    } catch (error) {
      console.error('トークン保存エラー:', error);
    }
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      console.log('通知の許可が必要です');
      return;
    }

    try {
      const notification = new Notification('テスト通知', {
        body: 'Supabase通知システムが正常に動作しています',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'test-notification'
      });

      // 通知履歴を保存
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notification_history')
          .insert({
            user_id: user.id,
            line_id: 'TEST',
            line_name: 'テスト路線',
            status: 'テスト',
            message: 'テスト通知が送信されました'
          });
      }
    } catch (error) {
      console.error('テスト通知の送信に失敗:', error);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', margin: '10px 0' }}>
      <h3>通知設定</h3>
      <p>通知の許可状態: {permission}</p>
      
      {permission === 'default' && (
        <button 
          onClick={requestPermission}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          通知を許可する
        </button>
      )}
      
      {permission === 'granted' && (
        <div>
          <p>✅ 通知が許可されています</p>
          <button 
            onClick={sendTestNotification}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            テスト通知を送信
          </button>
        </div>
      )}
      
      {permission === 'denied' && (
        <p style={{ color: 'red' }}>
          ❌ 通知が拒否されています。ブラウザの設定で通知を許可してください。
        </p>
      )}
    </div>
  );
}; 