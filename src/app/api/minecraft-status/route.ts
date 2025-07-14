import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const host = process.env.MINECRAFT_SERVER_HOST;
    const port = process.env.MINECRAFT_SERVER_PORT;
    
    if (!host || !port) {
      throw new Error('Minecraftサーバー設定が環境変数に設定されていません');
    }
    
    const response = await fetch(`https://api.mcsrvstat.us/bedrock/3/${host}:${port}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // タイムアウトを10秒に設定
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('MinecraftサーバーAPIエラー:', error);
    return NextResponse.json(
      { 
        online: false, 
        error: 'サーバーに接続できませんでした',
        players: { online: 0, max: 0 },
        version: null,
        motd: null,
        gamemode: null,
        map: null
      },
      { status: 500 }
    );
  }
} 