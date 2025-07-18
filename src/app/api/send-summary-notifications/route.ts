import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { frequency = 'daily' } = await request.json();

    // 指定された頻度の通知設定を取得
    const { data: settings, error: settingsError } = await supabase
      .from('anonymous_email_notification_settings')
      .select('*')
      .eq('enabled', true)
      .eq('notification_frequency', frequency);

    if (settingsError) {
      console.error('通知設定取得エラー:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification settings' },
        { status: 500 }
      );
    }

    if (!settings || settings.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: '該当する通知設定がありません',
        count: 0 
      });
    }

    // 通知履歴からまとめを作成
    const emailGroups = new Map<string, any[]>();

    for (const setting of settings) {
      const { data: history, error: historyError } = await supabase
        .from('anonymous_email_notification_history')
        .select('*')
        .eq('email', setting.email)
        .eq('line_id', setting.line_id)
        .eq('frequency', frequency)
        .gte('sent_at', getDateRange(frequency))
        .order('sent_at', { ascending: false });

      if (historyError) {
        console.error('履歴取得エラー:', historyError);
        continue;
      }

      if (history && history.length > 0) {
        emailGroups.set(setting.email, history);
      }
    }

    // まとめメールを送信
    let sentCount = 0;
    for (const [email, history] of emailGroups) {
      try {
        const summary = createSummary(history, frequency);
        
        const emailResponse = await fetch(`http://localhost:3000/api/email-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            lineId: 'summary',
            lineName: 'まとめ通知',
            status: `${getFrequencyLabel(frequency)}運行情報まとめ`,
            details: summary,
            isAnonymous: true,
            notificationType: 'summary_notification',
            html: summary,
            summary: true,
            frequency,
          }),
        });

        if (emailResponse.ok) {
          sentCount++;
          console.log(`まとめメール送信完了: ${email}`);
        } else {
          console.error(`まとめメール送信エラー (${email}):`, await emailResponse.text());
        }
      } catch (error) {
        console.error(`まとめメール送信エラー (${email}):`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${getFrequencyLabel(frequency)}まとめ通知を送信しました`,
      count: sentCount,
      frequency 
    });

  } catch (error) {
    console.error('まとめ通知送信エラー:', error);
    return NextResponse.json(
      { error: 'Failed to send summary notifications' },
      { status: 500 }
    );
  }
}

function getDateRange(frequency: string): string {
  const now = new Date();
  const startDate = new Date();
  
  if (frequency === 'daily') {
    startDate.setDate(now.getDate() - 1);
  } else if (frequency === 'weekly') {
    startDate.setDate(now.getDate() - 7);
  }
  
  return startDate.toISOString();
}

function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'daily': return '日次';
    case 'weekly': return '週次';
    default: return frequency;
  }
}

function createSummary(history: any[], frequency: string): string {
  const lineGroups = new Map<string, any[]>();
  
  // 路線別にグループ化
  for (const item of history) {
    if (!lineGroups.has(item.line_name)) {
      lineGroups.set(item.line_name, []);
    }
    lineGroups.get(item.line_name)!.push(item);
  }

  let summary = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>運行情報まとめ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- ヘッダー -->
        <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e1e5e9;">
          <div style="display: flex; align-items: center;">
                          <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <img src="https://i.imgur.com/LpVQ7YZ.jpeg" style="width: 20px; height: 20px; border-radius: 4px;" alt="電車アイコン" />
              </div>
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">運行情報メールサービス</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${getFrequencyLabel(frequency)}運行情報まとめ</p>
            </div>
          </div>
        </div>

        <!-- メインコンテンツ -->
        <div style="padding: 32px 24px;">
          <!-- まとめ通知 -->
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 24px; height: 24px; background-color: #0369a1; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <span style="color: white; font-size: 14px;">📊</span>
              </div>
              <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: #0369a1;">${getFrequencyLabel(frequency)}運行情報まとめ</h2>
            </div>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
              過去${frequency === 'daily' ? '24時間' : '1週間'}の運行情報をお届けします。
            </p>
          </div>

          <!-- 路線別情報 -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">路線別運行情報</h3>
            <div style="display: grid; gap: 16px;">
  `;
  
  for (const [lineName, items] of lineGroups) {
    const latestItem = items[0];
    const statusStyle = getStatusStyle(latestItem.status);
    
    summary += `
              <div style="background-color: ${statusStyle.bgColor}; border: 1px solid ${statusStyle.borderColor}; border-radius: 6px; padding: 16px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 16px; height: 16px; background-color: ${statusStyle.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                    <span style="color: white; font-size: 10px;">${statusStyle.icon}</span>
                  </div>
                  <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: ${statusStyle.color};">${lineName}</h4>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151; font-weight: 500;">${latestItem.status}</p>
                ${latestItem.message ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${latestItem.message}</p>` : ''}
              </div>
    `;
  }
  
  summary += `
            </div>
          </div>

          <!-- 注意事項 -->
          <div style="background-color: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #d97706;">ご注意</h3>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                <span style="font-size: 14px; color: #374151; line-height: 1.5;">この情報は実際のダイヤの状況と差異がある場合があります。</span>
              </div>
              <div style="display: flex; align-items: flex-start;">
                <span style="width: 6px; height: 6px; background-color: #d97706; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                <span style="font-size: 14px; color: #374151; line-height: 1.5;">最新の運行情報は各鉄道会社の公式サイトでご確認ください。</span>
              </div>
            </div>
          </div>

          <!-- フッター -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
              このメールは自動送信されています
            </p>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              通知設定の変更はアプリ内の設定画面から行ってください
            </p>
          </div>
        </div>

        <!-- フッター -->
        <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
              <strong>運行情報メールサービス</strong>
            </p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
              鉄道運行情報の自動通知サービス
            </p>
            <p style="margin: 0 0 8px 0; font-size: 12px;">
              <a href="https://aoiroserver.site" style="color: #dc2626; text-decoration: none;">公式サイト</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              送信日時: ${new Date().toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return summary;
}

// 状況に応じた色とアイコンを決定する関数
function getStatusStyle(status: string) {
  if (status.includes('遅延') || status.includes('delay')) {
    return {
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      icon: '🚨',
      title: '遅延情報'
    };
  } else if (status.includes('見合わせ') || status.includes('運転見合わせ') || status.includes('suspension')) {
    return {
      color: '#ea580c',
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      icon: '⛔',
      title: '運転見合わせ'
    };
  } else if (status.includes('復旧') || status.includes('運転再開') || status.includes('平常運転')) {
    return {
      color: '#059669',
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      icon: '✅',
      title: '復旧情報'
    };
  } else {
    return {
      color: '#1f2937',
      bgColor: '#f9fafb',
      borderColor: '#e5e7eb',
      icon: 'ℹ️',
      title: '運行情報'
    };
  }
} 