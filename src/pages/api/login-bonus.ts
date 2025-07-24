import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: '認証が必要です' });

  const today = new Date().toISOString().slice(0, 10);

  // 既に今日のボーナスを受け取っているか確認
  const { data: bonus } = await supabase
    .from('login_bonus')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (bonus) {
    return res.status(200).json({ received: true });
  }

  // ボーナス付与
  await supabase.from('login_bonus').insert({
    user_id: user.id,
    date: today,
    received: true
  });

  // 現在のポイントを取得して+1
  const { data: profile } = await supabase.from('user_profiles').select('points').eq('id', user.id).single();
  const currentPoints = (profile && typeof profile.points === 'number') ? profile.points : 0;
  await supabase.from('user_profiles').update({ points: currentPoints + 1 }).eq('id', user.id);

  return res.status(200).json({ received: false, message: 'ログインボーナスを付与しました！' });
} 