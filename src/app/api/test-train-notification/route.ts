import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details, email } = await request.json();

    if (!lineId || !lineName || !status) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    console.log('🧪 テスト通知開始:', { lineId, lineName, status, details, email });

    // 通知タイプを判定
    const getNotificationType = (status: string) => {
      if (status.includes('遅延')) return 'delay_notification';
      if (status.includes('運転見合わせ') || status.includes('見合わせ')) return 'suspension_notification';
      if (status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転')) return 'recovery_notification';
      return 'delay_notification'; // デフォルト
    };

    const notificationType = getNotificationType(status);

    // テスト用の運行情報変更データを作成
    const testChangeData = [{
      line_id: lineId,
      name: lineName,
      status: status,
      detail: details || '',
      previousStatus: '平常運転',
      previousDetail: ''
    }];

    // メール通知を送信
    await sendEmailNotifications(testChangeData, email);

    return NextResponse.json({ 
      success: true, 
      message: 'テスト通知を送信しました',
      notificationType
    });

  } catch (error) {
    console.error('❌ テスト通知エラー:', error);
    return NextResponse.json(
      { error: 'テスト通知の送信に失敗しました' },
      { status: 500 }
    );
  }
}

// メール通知を送信する関数
async function sendEmailNotifications(changedLines: any[], targetEmail?: string) {
  try {
    console.log('📧 テストメール通知送信開始');

    // 匿名ユーザー用のメール通知設定を取得
    const { data: anonymousEmailSettings, error: anonymousError } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('enabled', true);

    if (anonymousError) {
      console.error('匿名ユーザー設定取得エラー:', anonymousError);
    }

    // 通知対象の路線IDを取得
    const targetLineIds = changedLines.map(line => line.line_id);
    console.log('📧 テスト通知対象路線:', targetLineIds);

    // 通知タイプを判定する関数
    const getNotificationType = (status: string) => {
      if (status.includes('遅延')) return 'delay_notification';
      if (status.includes('運転見合わせ') || status.includes('見合わせ')) return 'suspension_notification';
      if (status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転')) return 'recovery_notification';
      return 'delay_notification'; // デフォルト
    };

    // 匿名ユーザーへの通知
    if (anonymousEmailSettings) {
      let anonymousTargetSettings = anonymousEmailSettings.filter(setting => 
        targetLineIds.includes(setting.line_id)
      );

      // 特定のメールアドレスが指定されている場合はフィルタリング
      if (targetEmail) {
        anonymousTargetSettings = anonymousTargetSettings.filter(setting => 
          setting.email === targetEmail
        );
      }

      for (const setting of anonymousTargetSettings) {
        const changedLine = changedLines.find(line => line.line_id === setting.line_id);
        if (changedLine) {
          const notificationType = getNotificationType(changedLine.status);
          
          // 通知タイプに応じてフィルタリング
          let shouldNotify = true;
          if (setting.delay_notification !== undefined || setting.suspension_notification !== undefined || setting.recovery_notification !== undefined) {
            switch (notificationType) {
              case 'delay_notification':
                shouldNotify = setting.delay_notification;
                break;
              case 'suspension_notification':
                shouldNotify = setting.suspension_notification;
                break;
              case 'recovery_notification':
                shouldNotify = setting.recovery_notification;
                break;
            }
          }

          if (shouldNotify) {
            await sendEmailNotification({
              email: setting.email,
              lineId: changedLine.line_id,
              lineName: changedLine.name,
              status: changedLine.status,
              details: changedLine.detail,
              previousStatus: changedLine.previousStatus,
              isAnonymous: true,
              notificationType
            });
          }
        }
      }
    }

    console.log('📧 テストメール通知送信完了');
  } catch (error) {
    console.error('❌ テストメール通知送信エラー:', error);
  }
}

// 個別のメール通知を送信する関数
async function sendEmailNotification({
  email,
  lineId,
  lineName,
  status,
  details,
  previousStatus,
  isAnonymous,
  notificationType
}: {
  email: string;
  lineId: string;
  lineName: string;
  status: string;
  details: string;
  previousStatus: string;
  isAnonymous: boolean;
  notificationType?: string;
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/email-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        lineId,
        lineName,
        status,
        details,
        previousStatus,
        isAnonymous,
        notificationType
      }),
    });

    if (!response.ok) {
      throw new Error(`メール送信に失敗: ${response.status}`);
    }

    console.log(`📧 テストメール通知送信成功: ${email} (${lineName}) - ${notificationType}`);
  } catch (error) {
    console.error(`❌ テストメール通知送信エラー (${email}):`, error);
  }
} 