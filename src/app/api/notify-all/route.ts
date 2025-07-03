import type { NextRequest } from 'next/server';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import { supabase } from '../../../lib/supabase';

// VAPID鍵（発行したものをここに記載）
const VAPID_PUBLIC_KEY = 'BLmGiG4Nr-7a4MFMN0vUKeg0idRgYrjHYmzOta8sScqf9haFDSU5AHLmc732C5HwEdU4rZYlPysRvGsdgks6FKc';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  'mailto:example@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();
    const payload = JSON.stringify({ title, body });
    // Supabaseから全Web Pushトークンを取得
    const { data: tokens, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('is_active', true)
      .eq('device_type', 'web');
    if (error) {
      return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500 });
    }
    const results = await Promise.all(
      (tokens || []).map(async (token) => {
        const sub: PushSubscription = {
          endpoint: token.endpoint,
          keys: token.keys,
        };
        try {
          await webpush.sendNotification(sub, payload);
          return { endpoint: token.endpoint, success: true };
        } catch (err) {
          return { endpoint: token.endpoint, success: false, error: String(err) };
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