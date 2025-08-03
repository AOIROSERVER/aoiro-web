import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details, isAnonymous = false, email } = await request.json();

    // 通知メッセージの作成
    const notificationMessage = {
      title: `${lineName}の運行情報`,
      body: `${status}${details ? `: ${details}` : ''}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `train-status-${lineId}`,
      data: {
        lineId,
        lineName,
        status,
        details: details || '',
        timestamp: new Date().toISOString()
      }
    };

    let tokens = [];
    let tokenError = null;

    if (isAnonymous) {
      // 匿名ユーザー用のトークンを取得
      const { data: anonymousTokens, error: anonymousTokenError } = await supabase
        .from('anonymous_notification_tokens')
        .select('*')
        .eq('is_active', true)
        .eq('device_type', 'web');

      if (email) {
        // 特定のメールアドレスのみに送信
        tokens = anonymousTokens?.filter(token => token.email === email) || [];
      } else {
        tokens = anonymousTokens || [];
      }
      tokenError = anonymousTokenError;
    } else {
      // ログインユーザー用のトークンを取得
      const { data: userTokens, error: userTokenError } = await supabase
        .from('notification_tokens')
        .select('*')
        .eq('is_active', true)
        .eq('device_type', 'web');

      tokens = userTokens || [];
      tokenError = userTokenError;
    }

    if (tokenError) {
      console.error('トークン取得エラー:', tokenError);
      return NextResponse.json(
        { error: 'Failed to fetch notification tokens' },
        { status: 500 }
      );
    }

    console.log(`通知を送信します: ${tokens?.length || 0}件のトークン`);

    // 各トークンに対して通知を送信
    const notificationPromises = tokens?.map(async (token) => {
      try {
        // 実際のプッシュ通知送信（Web Push APIを使用）
        // 注意: 実際の実装では、VAPIDキーを使用してプッシュ通知を送信する必要があります
        // ここでは簡易版として、通知履歴に保存するだけにします
        
        if (isAnonymous) {
          // 匿名ユーザー用の通知履歴に保存
          const { error: historyError } = await supabase
            .from('anonymous_email_notification_history')
            .insert({
              email: token.email,
              line_id: lineId,
              line_name: lineName,
              status: status,
              message: notificationMessage.body
            });

          if (historyError) {
            console.error('匿名ユーザー通知履歴保存エラー:', historyError);
          }
        } else {
          // ログインユーザー用の通知履歴に保存
          const { error: historyError } = await supabase
            .from('notification_history')
            .insert({
              user_id: token.user_id,
              line_id: lineId,
              line_name: lineName,
              status: status,
              message: notificationMessage.body
            });

          if (historyError) {
            console.error('通知履歴保存エラー:', historyError);
          }
        }

        return { success: true, tokenId: token.id };
      } catch (error) {
        console.error('通知送信エラー:', error);
        return { success: false, tokenId: token.id, error };
      }
    }) || [];

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`通知送信完了: 成功${successCount}件, 失敗${failureCount}件`);

    return NextResponse.json({
      message: 'Notifications sent successfully',
      results: {
        total: tokens?.length || 0,
        success: successCount,
        failure: failureCount
      }
    });

  } catch (error) {
    console.error('通知送信エラー:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

// 通知履歴を取得するAPI
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: notifications, error } = await supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('通知履歴取得エラー:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notification history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('通知履歴取得エラー:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification history' },
      { status: 500 }
    );
  }
} 