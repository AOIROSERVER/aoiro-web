import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  // 既に今日のボーナスを受け取っているか確認
  const { data: bonus } = await supabase
    .from('login_bonus')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (bonus) {
    return NextResponse.json({ received: true });
  }

  // ボーナス付与
  await supabase.from('login_bonus').insert({
    user_id: user.id,
    date: today,
    received: true
  });

  // ここでポイント加算やアイテム付与も可能
  return NextResponse.json({ received: false, message: 'ログインボーナスを付与しました！' });
} 