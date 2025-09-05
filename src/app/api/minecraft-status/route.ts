import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const host = process.env.MINECRAFT_SERVER_HOST || '115.36.215.137';
    const port = process.env.MINECRAFT_SERVER_PORT || '19138';
    
    console.log('🔧 環境変数確認:');
    console.log(`  - MINECRAFT_SERVER_HOST: ${process.env.MINECRAFT_SERVER_HOST || '未設定（デフォルト値使用）'}`);
    console.log(`  - MINECRAFT_SERVER_PORT: ${process.env.MINECRAFT_SERVER_PORT || '未設定（デフォルト値使用）'}`);
    console.log(`  - 使用するホスト: ${host}`);
    console.log(`  - 使用するポート: ${port}`);
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`  - VERCEL_ENV: ${process.env.VERCEL_ENV}`);
    console.log(`  - NETLIFY: ${process.env.NETLIFY}`);
    
    const apiUrl = 'https://api.mcstatus.io/v2/status/bedrock/aoiroserver.com:19138';
    
    console.log(`Minecraftサーバー接続確認: aoiroserver.com:19138`);
    console.log(`API呼び出し時刻: ${new Date().toLocaleString('ja-JP')}`);
    console.log(`実際のAPI URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AOIRO-Status-Checker/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // タイムアウトを10秒に設定
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // デバッグ用：プリティプリントでレスポンスを出力
    console.log('MinecraftサーバーAPIレスポンス:');
    console.log(JSON.stringify(data, null, 2));
    
    // mcstatus.io APIのレスポンス形式に合わせて変換
    const convertedData = {
      online: data.online,
      players: {
        online: data.players?.online || 0,
        max: data.players?.max || 0
      },
      version: data.version?.name || null,
      motd: data.motd?.clean || null,
      gamemode: data.gamemode || null,
      map: null, // mcstatus.ioにはmap情報がない
      debug: {
        retrieved_at: data.retrieved_at,
        expires_at: data.expires_at,
        server_id: data.server_id,
        edition: data.edition
      }
    };
    
    console.log('🔍 プレイヤー数デバッグ:', {
      'data.players': data.players,
      'data.players?.online': data.players?.online,
      'data.players?.max': data.players?.max
    });
    
    console.log(`📊 最終結果: online=${convertedData.online}, players=${convertedData.players.online}/${convertedData.players.max}`);
    
    return NextResponse.json(convertedData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('MinecraftサーバーAPIエラー:', error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        online: false, 
        error: 'サーバーに接続できませんでした',
        players: { online: 0, max: 0 },
        version: null,
        motd: null,
        gamemode: null,
        map: null,
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_ENV: process.env.VERCEL_ENV,
            NETLIFY: process.env.NETLIFY,
            MINECRAFT_SERVER_HOST: process.env.MINECRAFT_SERVER_HOST || '未設定',
            MINECRAFT_SERVER_PORT: process.env.MINECRAFT_SERVER_PORT || '未設定'
          }
        }
      },
      { status: 500 }
    );
  }
} 