"use client";
import { useEffect } from 'react';

export const TrainStatusNotification = () => {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Firebaseのimportと初期化をクライアント側でのみ実行
    import('firebase/app').then(({ initializeApp }) => {
      import('firebase/messaging').then(({ getMessaging, getToken, onMessage }) => {
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        };
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
              .then(token => {
                // トークンをサーバーに送信する処理
                console.log('Notification token:', token);
              })
              .catch(console.error);
          }
        });

        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          new Notification(title || '運行情報', {
            body: body || '運行情報が更新されました',
            icon: '/logo192.png'
          });
        });
      });
    });
  }, []);

  return null;
}; 