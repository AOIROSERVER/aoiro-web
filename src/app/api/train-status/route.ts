import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('train_status')
      .select('*')
      .order('line_id');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch train status' },
        { status: 500 }
      );
    }

    // Supabaseのデータ形式をアプリケーションの形式に変換
    const formattedData = data.map(item => ({
      id: item.line_id,
      name: item.name,
      status: item.status,
      section: item.section,
      detail: item.detail,
      color: item.color,
      updatedAt: item.updated_at
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching train status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch train status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // データの検証
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // 既存の運行情報を取得して変更を検知
    const { data: existingData, error: fetchError } = await supabase
      .from('train_status')
      .select('*');

    if (fetchError) {
      console.error('Error fetching existing train status:', fetchError);
    }

    const existingStatusMap = new Map();
    if (existingData) {
      existingData.forEach(item => {
        existingStatusMap.set(item.line_id, item);
      });
    }

    // 変更された路線を特定
    const changedLines = [];
    const allLines = [];

    for (const item of data) {
      const existing = existingStatusMap.get(item.id);
      const newStatus = {
        line_id: item.id,
        name: item.name,
        status: item.status,
        section: item.section || '',
        detail: item.detail || '',
        color: item.color || '#000000',
        updated_at: new Date().toISOString()
      };

      allLines.push(newStatus);

      // ステータスが変更された場合
      if (!existing || existing.status !== item.status || existing.detail !== (item.detail || '')) {
        changedLines.push({
          ...newStatus,
          previousStatus: existing?.status || '不明',
          previousDetail: existing?.detail || ''
        });
      }
    }

    // 各データをSupabaseに保存
    for (const item of data) {
      const { error } = await supabase
        .from('train_status')
        .upsert({
          line_id: item.id,
          name: item.name,
          status: item.status,
          section: item.section || '',
          detail: item.detail || '',
          color: item.color || '#000000',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'line_id'
        });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: 'Failed to save train status' },
          { status: 500 }
        );
      }
    }

    // 変更があった場合のみ通知を送信
    if (changedLines.length > 0) {
      console.log('🚨 運行情報変更を検知:', changedLines);

      // プッシュ通知
      const notifyTitle = '運行情報更新';
      const notifyBody = changedLines.map(item => 
        `${item.name}：${item.previousStatus} → ${item.status}${item.detail ? '（' + item.detail + '）' : ''}`
      ).join('\n');

      // プッシュ通知を送信
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notify-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: notifyTitle, body: notifyBody })
      });

      // メール通知を送信
      await sendEmailNotifications(changedLines);
    }

    return NextResponse.json({ 
      success: true, 
      changedLines: changedLines.length 
    });
  } catch (error) {
    console.error('Error saving train status:', error);
    return NextResponse.json(
      { error: 'Failed to save train status' },
      { status: 500 }
    );
  }
}

// メール通知を送信する関数
async function sendEmailNotifications(changedLines: any[]) {
  try {
    console.log('📧 メール通知送信開始');

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

    // 通知対象の路線IDを取得
    const targetLineIds = changedLines.map(line => line.line_id);
    console.log('📧 通知対象路線:', targetLineIds);

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

    console.log('📧 メール通知送信完了');
  } catch (error) {
    console.error('❌ メール通知送信エラー:', error);
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

    console.log(`📧 メール通知送信成功: ${email} (${lineName})`);
  } catch (error) {
    console.error(`❌ メール通知送信エラー (${email}):`, error);
  }
} 