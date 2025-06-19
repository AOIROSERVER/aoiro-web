console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30));
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details } = await request.json();

    // 通知メッセージの作成
    const message = {
      notification: {
        title: `${lineName}の運行情報`,
        body: `${status}${details ? `: ${details}` : ''}`,
      },
      data: {
        lineId,
        lineName,
        status,
        details: details || '',
      },
      topic: `train-status-${lineId}`, // トピックベースの通知
    };

    // 通知の送信（現在はログ出力のみ）
    console.log('Notification message:', message);

    // 将来的にプッシュ通知を実装する場合はここに追加

    return NextResponse.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { message: 'Error sending notification' },
      { status: 500 }
    );
  }
} 