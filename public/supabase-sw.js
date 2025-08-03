// Supabase対応のService Worker
const CACHE_NAME = 'aoiro-notification-v1';

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('Service Worker: インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: キャッシュを開きました');
        return cache.addAll([
          '/',
          '/logo192.png',
          '/manifest.json'
        ]);
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('Service Worker: アクティベート中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除中:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// プッシュ通知の受信処理
self.addEventListener('push', (event) => {
  console.log('Service Worker: プッシュ通知を受信しました');
  
  let notificationData = {
    title: '運行情報の更新',
    body: '新しい運行情報があります',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'train-status-update'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || {}
      };
    } catch (error) {
      console.error('プッシュデータの解析に失敗:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: '詳細を見る',
          icon: '/logo192.png'
        },
        {
          action: 'close',
          title: '閉じる',
          icon: '/logo192.png'
        }
      ]
    })
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: 通知がクリックされました');
  
  event.notification.close();

  if (event.action === 'view') {
    // 詳細ページを開く
    event.waitUntil(
      clients.openWindow('/train-status')
    );
  } else if (event.action === 'close') {
    // 何もしない（通知を閉じるだけ）
    return;
  } else {
    // デフォルトの動作：運行情報ページを開く
    event.waitUntil(
      clients.openWindow('/train-status')
    );
  }
});

// 通知を閉じた時の処理
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: 通知が閉じられました');
  
  // 必要に応じて通知履歴を更新
  if (event.notification.data && event.notification.data.notificationId) {
    // 通知履歴を更新する処理をここに追加
    console.log('通知履歴を更新:', event.notification.data.notificationId);
  }
});

// メッセージ受信時の処理（メインスレッドからの通信）
self.addEventListener('message', (event) => {
  console.log('Service Worker: メッセージを受信しました:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  // 通知関連のAPIリクエストはキャッシュしない
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあった場合はそれを返す
        if (response) {
          return response;
        }

        // キャッシュになければネットワークから取得
        return fetch(event.request)
          .then((response) => {
            // 成功したレスポンスのみキャッシュに保存
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
}); 