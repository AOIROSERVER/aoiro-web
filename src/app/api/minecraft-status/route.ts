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
    
    const apiUrl = `https://api.mcsrvstat.us/bedrock/3/${host}:${port}`;
    
    console.log(`Minecraftサーバー接続確認: ${host}:${port}`);
    console.log(`API呼び出し時刻: ${new Date().toLocaleString('ja-JP')}`);
    console.log(`実際のAPI URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AOIRO-Status-Checker/1.0'
      },
      // タイムアウトを10秒に設定
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // デバッグ用：プリティプリントでレスポンスを出力
    console.log('MinecraftサーバーAPIレスポンス:');
    console.log(JSON.stringify(data, null, 2));
    
    // キャッシュ情報の詳細ログ
    if (data.debug) {
      console.log('🔍 デバッグ情報:');
      console.log(`  - キャッシュヒット: ${data.debug.cachehit}`);
      console.log(`  - キャッシュ時刻: ${new Date(data.debug.cachetime * 1000).toLocaleString('ja-JP')}`);
      console.log(`  - キャッシュ期限: ${new Date(data.debug.cacheexpire * 1000).toLocaleString('ja-JP')}`);
      console.log(`  - APIバージョン: ${data.debug.apiversion}`);
      
      if (data.debug.error) {
        console.log('❌ エラー詳細:', data.debug.error);
      }
    }
    
    console.log(`📊 最終結果: online=${data.online}`);
    
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