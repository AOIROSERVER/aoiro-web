import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details, notificationType } = await request.json();

    // 通知タイプの判定
    const getNotificationType = (status: string, details: string) => {
      if (status.includes('遅延') || status.includes('delay')) return 'delay_notification';
      if (status.includes('見合わせ') || status.includes('運転見合わせ') || status.includes('suspension')) return 'suspension_notification';
      if (status.includes('復旧') || status.includes('運転再開') || status.includes('recovery')) return 'recovery_notification';
      return 'delay_notification'; // デフォルト
    };

    const currentNotificationType = notificationType || getNotificationType(status, details);

    // 通知メッセージの作成
    const notificationMessage = {
      title: `${lineName}の運行情報`,
      body: `${status}${details ? `: ${details}` : ''}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `train-status-${lineId}-${currentNotificationType}`,
      data: {
        lineId,
        lineName,
        status,
        details: details || '',
        notificationType: currentNotificationType,
        timestamp: new Date().toISOString()
      }
    };

    console.log('通知メッセージ:', notificationMessage);

    // メール通知設定を取得（新しいフィールドに対応）
    const { data: emailSettings, error: emailError } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('line_id', lineId)
      .eq('enabled', true);

    // 通知タイプに応じてフィルタリング
    const filteredEmailSettings = emailSettings?.filter(setting => {
      switch (currentNotificationType) {
        case 'delay_notification':
          return setting.delay_notification;
        case 'suspension_notification':
          return setting.suspension_notification;
        case 'recovery_notification':
          return setting.recovery_notification;
        default:
          return true;
      }
    }) || [];

    if (emailError) {
      console.error('メール設定取得エラー:', emailError);
      return NextResponse.json(
        { error: 'Failed to fetch email notification settings' },
        { status: 500 }
      );
    }

    console.log(`メール通知設定: ${filteredEmailSettings.length}件`);

    // メール通知の送信
    if (filteredEmailSettings.length > 0) {
      for (const setting of filteredEmailSettings) {
        try {
          // 通知頻度のチェック
          const shouldSendImmediate = setting.notification_frequency === 'immediate';
          
          if (shouldSendImmediate) {
            // 即座に通知を送信
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email-notify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: setting.email,
                subject: `${lineName}の運行情報`,
                text: `${lineName}\n\n${status}${details ? `\n${details}` : ''}\n\nこのメールは自動送信されています。`,
                lineId,
                lineName,
                status,
                details: details || '',
                notificationType: currentNotificationType,
              }),
            });

            if (!emailResponse.ok) {
              console.error('メール送信エラー:', await emailResponse.text());
            } else {
              console.log(`メール通知送信完了: ${setting.email}`);
            }
          } else {
            // 日次/週次まとめの場合は通知履歴に保存
            await supabase
              .from('anonymous_email_notification_history')
              .insert({
                email: setting.email,
                line_id: lineId,
                line_name: lineName,
                status,
                message: `${status}${details ? `: ${details}` : ''}`,
                notification_type: currentNotificationType,
                frequency: setting.notification_frequency,
              });
          }
        } catch (error) {
          console.error(`メール通知送信エラー (${setting.email}):`, error);
        }
      }
    }

    // プッシュ通知の送信
    const { data: pushTokens, error: pushError } = await supabase
      .from('anonymous_notification_tokens')
      .select('*')
      .eq('is_active', true)
      .eq('device_type', 'web');

    if (pushError) {
      console.error('プッシュ通知トークン取得エラー:', pushError);
    } else if (pushTokens && pushTokens.length > 0) {
      try {
        const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/supabase-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lineId,
            lineName,
            status,
            details: details || '',
            notificationType: currentNotificationType,
            isAnonymous: true,
          }),
        });

        if (!pushResponse.ok) {
          console.error('プッシュ通知送信エラー:', await pushResponse.text());
        } else {
          console.log(`プッシュ通知送信完了: ${pushTokens.length}件`);
        }
      } catch (error) {
        console.error('プッシュ通知送信エラー:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '通知を送信しました',
      emailCount: filteredEmailSettings.length,
      pushCount: pushTokens?.length || 0,
      notificationType: currentNotificationType
    });

  } catch (error) {
    console.error('通知送信エラー:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
} 