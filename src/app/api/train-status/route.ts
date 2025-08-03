import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// フォールバックデータ
const fallbackData = [
  {
    "id": "CA",
    "name": "東海道新幹線",
    "status": "遅延",
    "color": "#0033cb",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "JK",
    "name": "京浜東北線",
    "status": "平常運転",
    "color": "#00b2e5",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "JY1",
    "name": "山手線（内回り）",
    "status": "平常運転",
    "color": "#8fd400",
    "updatedAt": "2025-06-15T00:09:11.469Z",
    "section": "浜松〜有楽町",
    "detail": "テストテキスト"
  },
  {
    "id": "JY2",
    "name": "山手線（外回り）",
    "status": "平常運転",
    "color": "#8fd400",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "JB",
    "name": "総武線",
    "status": "平常運転",
    "color": "#ffd400",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "JC",
    "name": "中央線",
    "status": "平常運転",
    "color": "#f15a22",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "JT",
    "name": "東海道線",
    "status": "平常運転",
    "color": "#f68b1e",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "JO",
    "name": "横須賀線",
    "status": "平常運転",
    "color": "#1069b4",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "M",
    "name": "丸の内線",
    "status": "平常運転",
    "color": "#f62e36",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "Z",
    "name": "半蔵門線",
    "status": "平常運転",
    "color": "#8f76d6",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "C",
    "name": "千代田線",
    "status": "平常運転",
    "color": "#00bb86",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "H",
    "name": "日比谷線",
    "status": "平常運転",
    "color": "#b5b5ac",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "G",
    "name": "銀座線",
    "status": "平常運転",
    "color": "#f39700",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "AK",
    "name": "あきが丘線",
    "status": "平常運転",
    "color": "#e37e40",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  },
  {
    "id": "AU",
    "name": "あおうみ線 (空港アクセス線)",
    "status": "平常運転",
    "color": "#15206b",
    "updatedAt": "2025-06-15T00:09:11.469Z"
  }
];

export async function GET() {
  try {
    console.log('🚂 Train status API called');
    console.log('🔧 Supabase client check:', !!supabase);
    
    // Supabaseの接続テスト
    const { data: testData, error: testError } = await supabase
      .from('train_status')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      console.log('🔄 Using fallback data due to database error');
      return NextResponse.json(fallbackData);
    }
    
    console.log('✅ Supabase connection test passed');
    
    const { data, error } = await supabase
      .from('train_status')
      .select('*')
      .order('line_id');

    if (error) {
      console.error('❌ Supabase query error:', error);
      console.log('🔄 Using fallback data due to query error');
      return NextResponse.json(fallbackData);
    }

    console.log('📊 Retrieved data count:', data?.length || 0);

    // データが空の場合はフォールバックデータを使用
    if (!data || data.length === 0) {
      console.log('🔄 No data found in database, using fallback data');
      return NextResponse.json(fallbackData);
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

    console.log('✅ Train status API response successful');
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('❌ Unexpected error in train status API:', error);
    console.log('🔄 Using fallback data due to unexpected error');
    return NextResponse.json({
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error),
      fallback: true,
      data: fallbackData
    });
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

    console.log('📧 取得した通知設定:', {
      userSettings: userEmailSettings?.length || 0,
      anonymousSettings: anonymousEmailSettings?.length || 0
    });

    // 通知対象の路線IDを取得
    const targetLineIds = changedLines.map(line => line.line_id);
    console.log('📧 通知対象路線:', targetLineIds);

    // 通知タイプを判定する関数
    const getNotificationType = (status: string) => {
      if (status.includes('遅延')) return 'delay_notification';
      if (status.includes('運転見合わせ') || status.includes('見合わせ')) return 'suspension_notification';
      if (status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転')) return 'recovery_notification';
      return 'delay_notification'; // デフォルト
    };

    // ログインユーザーへの通知
    if (userEmailSettings) {
      const userTargetSettings = userEmailSettings.filter(setting => 
        targetLineIds.includes(setting.line_id)
      );

      console.log('📧 ログインユーザー通知対象:', userTargetSettings.length, '件');

      for (const setting of userTargetSettings) {
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

          console.log(`📧 ログインユーザー通知判定: ${setting.email} (${changedLine.name}) - ${notificationType}: ${shouldNotify}`);

          if (shouldNotify) {
          await sendEmailNotification({
            email: setting.email,
            lineId: changedLine.line_id,
            lineName: changedLine.name,
            status: changedLine.status,
            details: changedLine.detail,
            previousStatus: changedLine.previousStatus,
              isAnonymous: false,
              notificationType
          });
          }
        }
      }
    }

    // 匿名ユーザーへの通知
    if (anonymousEmailSettings) {
      const anonymousTargetSettings = anonymousEmailSettings.filter(setting => 
        targetLineIds.includes(setting.line_id)
      );

      console.log('📧 匿名ユーザー通知対象:', anonymousTargetSettings.length, '件');

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

          console.log(`📧 匿名ユーザー通知判定: ${setting.email} (${changedLine.name}) - ${notificationType}: ${shouldNotify}`);

          if (shouldNotify) {
            // 通知頻度のチェック
            const shouldSendImmediate = !setting.notification_frequency || setting.notification_frequency === 'immediate';
            
            console.log(`📧 通知頻度チェック: ${setting.email} - ${setting.notification_frequency} -> ${shouldSendImmediate ? '即座送信' : 'まとめ保存'}`);
            
            if (shouldSendImmediate) {
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
            } else {
              // 日次/週次まとめの場合は通知履歴に保存
              await supabase
                .from('anonymous_email_notification_history')
                .insert({
                  email: setting.email,
                  line_id: changedLine.line_id,
                  line_name: changedLine.name,
                  status: changedLine.status,
                  message: `${changedLine.status}${changedLine.detail ? `: ${changedLine.detail}` : ''}`,
                  notification_type: notificationType,
                  frequency: setting.notification_frequency,
                });
            }
          }
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
    const response = await fetch(`http://localhost:3000/api/email-notify`, {
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

    console.log(`📧 メール通知送信成功: ${email} (${lineName}) - ${notificationType}`);
  } catch (error) {
    console.error(`❌ メール通知送信エラー (${email}):`, error);
  }
} 