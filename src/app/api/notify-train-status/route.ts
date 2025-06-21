console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30));
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details } = await request.json();

    // 通知メッセージの作成
    const notificationMessage = {
      title: `${lineName}の運行情報`,
      body: `${status}${details ? `: ${details}` : ''}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `train-status-${lineId}`,
      data: {
        lineId,
        lineName,
        status,
        details: details || '',
        timestamp: new Date().toISOString()
      }
    };

    console.log('通知メッセージ:', notificationMessage);

    // Supabase通知APIを呼び出し
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/supabase-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineId,
        lineName,
        status,
        details
      })
    });

    if (!response.ok) {
      throw new Error(`Supabase通知APIエラー: ${response.status}`);
    }

    const result = await response.json();
    console.log('通知送信結果:', result);

    return NextResponse.json({ 
      message: 'Notification sent successfully',
      result 
    });

  } catch (error) {
    console.error('通知送信エラー:', error);
    return NextResponse.json(
      { message: 'Error sending notification' },
      { status: 500 }
    );
  }
} 