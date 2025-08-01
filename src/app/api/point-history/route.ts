import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    console.log('📊 ポイント履歴API呼び出し');
    
    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ 認証エラー:', authError);
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    console.log('📊 ポイント履歴取得要求:', { userId: user.id, email: user.email });

    // URLパラメータから取得件数を指定（デフォルト50件）
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // bonus_statisticsから現在のポイント取得
    const { data: currentUser, error: userError } = await supabase
      .from('bonus_statistics')
      .select('email, points')
      .eq('email', user.email)
      .single();

    if (userError) {
      console.error('❌ ユーザー情報取得エラー:', userError);
    }

    // ログインボーナス履歴取得
    const { data: loginBonusHistory, error: bonusError } = await supabase
      .from('login_bonus')
      .select('date, received, created_at')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (bonusError) {
      console.warn('⚠️ ログインボーナス履歴取得エラー:', bonusError);
    }

    // 履歴データを統一形式に変換
    const history = [];

    // ログインボーナス履歴を追加
    if (loginBonusHistory) {
      loginBonusHistory.forEach(bonus => {
        history.push({
          id: `login_bonus_${bonus.date}`,
          type: 'login_bonus',
          typeName: 'ログインボーナス',
          points: 100,
          description: '毎日のログインボーナス',
          date: bonus.date,
          created_at: bonus.created_at || bonus.date,
          icon: '🎁'
        });
      });
    }

    // 日付順でソート
    history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 統計情報計算
    const totalLoginBonus = loginBonusHistory?.length || 0;
    const totalPoints = currentUser?.points || 0;
    const estimatedTotalEarned = totalLoginBonus * 100; // ログインボーナスのみの概算

    console.log('✅ ポイント履歴取得完了:', {
      totalRecords: history.length,
      totalLoginBonus,
      totalPoints,
      estimatedTotalEarned
    });

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        currentPoints: totalPoints
      },
      history: history.slice(0, limit),
      statistics: {
        totalLoginBonus,
        totalPoints,
        estimatedTotalEarned,
        averagePointsPerDay: totalLoginBonus > 0 ? Math.round(estimatedTotalEarned / totalLoginBonus) : 0
      },
      pagination: {
        limit,
        offset,
        hasMore: history.length > limit
      }
    });

  } catch (error) {
    console.error('❌ ポイント履歴API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}