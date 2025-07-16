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
        
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: `${getFrequencyLabel(frequency)}運行情報まとめ`,
            text: summary,
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

  let summary = `${getFrequencyLabel(frequency)}運行情報まとめ\n\n`;
  
  for (const [lineName, items] of lineGroups) {
    summary += `【${lineName}】\n`;
    
    // 最新の情報のみを表示
    const latestItem = items[0];
    summary += `${latestItem.status}\n`;
    if (latestItem.message) {
      summary += `${latestItem.message}\n`;
    }
    summary += `\n`;
  }
  
  summary += `\nこのメールは自動送信されています。`;
  
  return summary;
} 