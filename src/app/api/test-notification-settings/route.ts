import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const lineId = searchParams.get('lineId');

    console.log('🔧 通知設定テスト開始:', { email, lineId });

    if (!email) {
      return NextResponse.json({ error: 'メールアドレスが必要です' }, { status: 400 });
    }

    // 指定されたメールアドレスの通知設定を取得
    let query = supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('email', email)
      .eq('enabled', true);

    if (lineId) {
      query = query.eq('line_id', lineId);
    }

    const { data: settings, error } = await query;

    if (error) {
      console.error('❌ 通知設定取得エラー:', error);
      return NextResponse.json({ error: '通知設定の取得に失敗しました' }, { status: 500 });
    }

    console.log('🔧 取得した通知設定:', settings);

    // 通知設定の詳細情報を取得
    const settingsWithDetails = settings?.map(setting => ({
      ...setting,
      hasDelayNotification: setting.delay_notification !== undefined ? setting.delay_notification : true,
      hasSuspensionNotification: setting.suspension_notification !== undefined ? setting.suspension_notification : true,
      hasRecoveryNotification: setting.recovery_notification !== undefined ? setting.recovery_notification : true,
      frequency: setting.notification_frequency || 'immediate'
    })) || [];

    return NextResponse.json({
      success: true,
      email,
      lineId,
      settings: settingsWithDetails,
      count: settingsWithDetails.length
    });

  } catch (error) {
    console.error('❌ 通知設定テストエラー:', error);
    return NextResponse.json({ error: 'テストに失敗しました' }, { status: 500 });
  }
} 