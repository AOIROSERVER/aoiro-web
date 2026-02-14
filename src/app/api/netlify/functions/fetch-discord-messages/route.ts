import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🚂 fetch-discord-messages 開始');
  
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

  console.log('🔑 環境変数チェック:', {
    tokenExists: !!DISCORD_BOT_TOKEN,
    channelExists: !!CHANNEL_ID,
    tokenPrefix: DISCORD_BOT_TOKEN ? DISCORD_BOT_TOKEN.substring(0, 10) + '...' : 'なし'
  });

  // 開発環境でDiscord設定がない場合は、テスト用のモックデータを返す
  if (!DISCORD_BOT_TOKEN || !CHANNEL_ID) {
    console.warn('⚠️ Discord設定が不足。テスト用のモックデータを返します。');
    const mockMessages = [
      {
        content: '山手線/外回り/東京到着',
        timestamp: new Date().toISOString()
      },
      {
        content: '山手線/内回り/新宿到着',
        timestamp: new Date().toISOString()
      },
      {
        content: '京浜東北線/上り/浜松到着',
        timestamp: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({ 
      trainMessages: mockMessages,
      isMock: true,
      message: 'Discord設定がないため、テスト用のモックデータを返しています。'
    });
  }

  const url = `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=20`;

  try {
    console.log('🌐 Discord API呼び出し開始:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Discord API応答:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Discord API エラー:', errorData);
      return NextResponse.json(
        { 
          error: 'Discord API error', 
          status: response.status, 
          details: errorData 
        },
        { status: 500 }
      );
    }

    const messages = await response.json();
    console.log('📨 取得メッセージ数:', messages.length);

    // 列車位置情報だけ抽出
    const trainMessages = messages
      .filter((msg: any) => /^.+\/.+\/.+到着$/.test(msg.content))
      .map((msg: any) => ({
        content: msg.content,
        timestamp: msg.timestamp
      }));

    console.log('🚂 列車メッセージ数:', trainMessages.length);
    console.log('🚂 列車メッセージ一覧:', trainMessages.map((m: any) => m.content));

    return NextResponse.json({ trainMessages });
  } catch (e: any) {
    console.error('❌ 予期しないエラー:', e);
    return NextResponse.json(
      { 
        error: 'Discord fetch error', 
        details: e.toString(),
        stack: e.stack 
      },
      { status: 500 }
    );
  }
}
