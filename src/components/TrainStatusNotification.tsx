"use client";
import { useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const TrainStatusNotification = () => {
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY'
          });
          console.log('Notification token:', token);
          // トークンをサーバーに送信する処理をここに追加
        }
      } catch (error) {
        console.error('Notification permission error:', error);
      }
    };

    requestNotificationPermission();

    // フォアグラウンドでのメッセージ受信
    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      new Notification(title || '運行情報', {
        body: body || '運行情報が更新されました',
        icon: '/logo192.png'
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}; 