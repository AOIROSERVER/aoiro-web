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
      message: 'テスト通知を送信しました' 
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
async function sendEmailNotifications(changedLines: any[], specificEmail?: string) {
  try {
    console.log('📧 テストメール通知送信開始');

    // 通知対象の路線IDを取得
    const targetLineIds = changedLines.map(line => line.line_id);
    console.log('📧 通知対象路線:', targetLineIds);

    if (specificEmail) {
      // 特定のメールアドレスにテスト通知を送信
      const changedLine = changedLines[0];
      await sendEmailNotification({
        email: specificEmail,
        lineId: changedLine.line_id,
        lineName: changedLine.name,
        status: changedLine.status,
        details: changedLine.detail,
        previousStatus: changedLine.previousStatus,
        isAnonymous: true
      });
    } else {
      // 全ての設定済みメールアドレスに通知を送信
      
      // ログインユーザー用のメール通知設定を取得
      const { data: userEmailSettings, error: userError } = await supabase
        .from('email_notification_settings')
        .select('*')
        .eq('enabled', true);

      if (userError) {
        console.error('ログインユーザー設定取得エラー:', userError);
      }

      // 匿名ユーザー用のメール通知設定を取得
      const { data: anonymousEmailSettings, error: anonymousError } = await supabase
        .from('anonymous_email_notification_settings')
        .select('*')
        .eq('enabled', true);

      if (anonymousError) {
        console.error('匿名ユーザー設定取得エラー:', anonymousError);
      }

      // ログインユーザーへの通知
      if (userEmailSettings) {
        const userTargetSettings = userEmailSettings.filter(setting => 
          targetLineIds.includes(setting.line_id)
        );

        for (const setting of userTargetSettings) {
          const changedLine = changedLines.find(line => line.line_id === setting.line_id);
          if (changedLine) {
            await sendEmailNotification({
              email: setting.email,
              lineId: changedLine.line_id,
              lineName: changedLine.name,
              status: changedLine.status,
              details: changedLine.detail,
              previousStatus: changedLine.previousStatus,
              isAnonymous: false
            });
          }
        }
      }

      // 匿名ユーザーへの通知
      if (anonymousEmailSettings) {
        const anonymousTargetSettings = anonymousEmailSettings.filter(setting => 
          targetLineIds.includes(setting.line_id)
        );

        for (const setting of anonymousTargetSettings) {
          const changedLine = changedLines.find(line => line.line_id === setting.line_id);
          if (changedLine) {
            await sendEmailNotification({
              email: setting.email,
              lineId: changedLine.line_id,
              lineName: changedLine.name,
              status: changedLine.status,
              details: changedLine.detail,
              previousStatus: changedLine.previousStatus,
              isAnonymous: true
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
  isAnonymous
}: {
  email: string;
  lineId: string;
  lineName: string;
  status: string;
  details: string;
  previousStatus: string;
  isAnonymous: boolean;
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
        isAnonymous
      }),
    });

    if (!response.ok) {
      throw new Error(`メール送信に失敗: ${response.status}`);
    }

    console.log(`📧 テストメール通知送信成功: ${email} (${lineName})`);
  } catch (error) {
    console.error(`❌ テストメール通知送信エラー (${email}):`, error);
  }
} 