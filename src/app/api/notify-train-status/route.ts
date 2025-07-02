import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details } = await request.json();

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

    console.log('通知メッセージ:', notificationMessage);

    // メール通知設定を取得
    const { data: emailSettings, error: emailError } = await supabase
      .from('email_notification_settings')
      .select('*')
      .eq('line_id', lineId)
      .eq('enabled', true);

    if (emailError) {
      console.error('メール通知設定取得エラー:', emailError);
    } else if (emailSettings && emailSettings.length > 0) {
      // メール通知を送信
      const emailPromises = emailSettings.map(async (setting) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email-notify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lineId,
              lineName,
              status,
              details,
              userEmail: setting.email
            })
          });

          if (!response.ok) {
            throw new Error(`メール送信エラー: ${response.status}`);
          }

          const result = await response.json();
          
          // メール通知履歴を保存
          await supabase
            .from('email_notification_history')
            .insert({
              user_id: setting.user_id,
              email: setting.email,
              line_id: lineId,
              line_name: lineName,
              status: status,
              message: notificationMessage.body,
              mailgun_message_id: result.messageId
            });

          return { success: true, email: setting.email };
        } catch (error) {
          console.error('メール通知送信エラー:', error);
          return { success: false, email: setting.email, error };
        }
      });

      const emailResults = await Promise.all(emailPromises);
      const emailSuccessCount = emailResults.filter(r => r.success).length;
      const emailFailureCount = emailResults.filter(r => !r.success).length;

      console.log(`メール通知送信完了: 成功${emailSuccessCount}件, 失敗${emailFailureCount}件`);
    }

    // Supabase通知APIを呼び出し（既存のプッシュ通知）
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/supabase-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineId,
        lineName,
        status,
        details
      })
    });

    if (!response.ok) {
      throw new Error(`Supabase通知APIエラー: ${response.status}`);
    }

    const result = await response.json();
    console.log('通知送信結果:', result);

    return NextResponse.json({ 
      message: 'Notification sent successfully',
      result 
    });

  } catch (error) {
    console.error('通知送信エラー:', error);
    return NextResponse.json(
      { message: 'Error sending notification' },
      { status: 500 }
    );
  }
} 