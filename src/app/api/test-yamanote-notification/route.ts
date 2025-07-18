import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    console.log('🧪 山手線通知テスト開始');

    // 山手線の通知設定を取得
    const { data: jy1Settings, error: jy1Error } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('line_id', 'JY1')
      .eq('enabled', true);

    const { data: jy2Settings, error: jy2Error } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('line_id', 'JY2')
      .eq('enabled', true);

    if (jy1Error || jy2Error) {
      console.error('❌ 通知設定取得エラー:', { jy1Error, jy2Error });
      return NextResponse.json(
        { error: 'Failed to fetch notification settings' },
        { status: 500 }
      );
    }

    const allSettings = [...(jy1Settings || []), ...(jy2Settings || [])];
    console.log(`📧 山手線通知設定: ${allSettings.length}件`);

    if (allSettings.length === 0) {
      return NextResponse.json({
        success: false,
        message: '山手線の通知設定が見つかりません'
      });
    }

    // テスト通知を送信
    let sentCount = 0;
    for (const setting of allSettings) {
      try {
        const response = await fetch(`http://localhost:3000/api/email-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: setting.email,
            lineId: setting.line_id,
            lineName: setting.line_id === 'JY1' ? '山手線（内回り）' : '山手線（外回り）',
            status: '運転見合わせ',
            details: 'テスト通知です',
            previousStatus: '平常運転',
            isAnonymous: true,
            notificationType: 'suspension_notification'
          }),
        });

        if (response.ok) {
          sentCount++;
          console.log(`✅ テスト通知送信成功: ${setting.email} (${setting.line_id})`);
        } else {
          console.error(`❌ テスト通知送信失敗: ${setting.email} (${setting.line_id})`);
        }
      } catch (error) {
        console.error(`❌ テスト通知送信エラー: ${setting.email}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `山手線テスト通知を${sentCount}件送信しました`,
      totalSettings: allSettings.length,
      sentCount
    });

  } catch (error) {
    console.error('❌ 山手線通知テストエラー:', error);
    return NextResponse.json(
      { error: '山手線通知テストに失敗しました' },
      { status: 500 }
    );
  }
} 