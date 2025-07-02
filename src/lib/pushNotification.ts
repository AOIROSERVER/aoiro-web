export async function subscribeUserToPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    // Service Workerの登録
    const registration = await navigator.serviceWorker.register('/pushcode_sw.js');
    // 通知許可のリクエスト
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('通知が許可されませんでした');
      return;
    }
    // サブスクリプションの取得
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BLmGiG4Nr-7a4MFMN0vUKeg0idRgYrjHYmzOta8sScqf9haFDSU5AHLmc732C5HwEdU4rZYlPysRvGsdgks6FKc' // ここを書き換えてください
    });
    // サーバーにsubscriptionを送信
    await fetch('/api/save-subscription', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
    alert('プッシュ通知の登録が完了しました');
  } else {
    alert('このブラウザはプッシュ通知に対応していません');
  }
} 