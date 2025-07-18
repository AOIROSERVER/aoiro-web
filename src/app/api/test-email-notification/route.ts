import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, lineId, lineName, status, details } = await request.json();

    console.log('📧 テストメール通知開始:', { email, lineName, status });

    if (!email || !lineId || !lineName || !status) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    // 実際のメール通知APIを呼び出し
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
        details: details || '',
        previousStatus: '平常運転',
        isAnonymous: true,
        notificationType: 'test_notification'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ テストメール送信エラー:', response.status, errorText);
      return NextResponse.json(
        { error: `テストメール送信に失敗しました: ${response.status}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ テストメール送信成功:', result);

    return NextResponse.json({
      success: true,
      message: 'テストメールを送信しました',
      result
    });

  } catch (error) {
    console.error('❌ テストメール通知エラー:', error);
    return NextResponse.json(
      { error: 'テストメール通知に失敗しました' },
      { status: 500 }
    );
  }
} 