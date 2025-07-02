import type { NextRequest } from 'next/server';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';

// VAPID鍵（発行したものをここに記載）
const VAPID_PUBLIC_KEY = 'BLmGiG4Nr-7a4MFMN0vUKeg0idRgYrjHYmzOta8sScqf9haFDSU5AHLmc732C5HwEdU4rZYlPysRvGsdgks6FKc';
const VAPID_PRIVATE_KEY = '<ここにVAPID秘密鍵>';

// save-subscriptionのメモリ配列をimport（同一プロセス内で共有）
import { subscriptions } from '../save-subscription/route';

webpush.setVapidDetails(
  'mailto:example@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();
    const payload = JSON.stringify({ title, body });
    const results = await Promise.all(
      (subscriptions as PushSubscription[]).map(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
          return { endpoint: sub.endpoint, success: true };
        } catch (err) {
          return { endpoint: sub.endpoint, success: false, error: String(err) };
        }
      })
    );
    return new Response(JSON.stringify({ success: true, results }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 400 });
  }
}

// subscriptions配列をexportしてsave-subscription/route.tsと共有
// export { subscriptions } from '../save-subscription/route'; 