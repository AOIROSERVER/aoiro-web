import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const host = process.env.MINECRAFT_SERVER_HOST;
    const port = process.env.MINECRAFT_SERVER_PORT;
    
    if (!host || !port) {
      throw new Error('Minecraftサーバー設定が環境変数に設定されていません');
    }
    
    console.log(`🧪 Minecraftサーバーテスト開始: ${host}:${port}`);
    
    const results = [];
    const testCount = 5;
    
    for (let i = 0; i < testCount; i++) {
      console.log(`\n🔄 テスト ${i + 1}/${testCount} 開始`);
      
      const startTime = Date.now();
      
      try {
        const response = await fetch(`https://api.mcsrvstat.us/bedrock/3/${host}:${port}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `AOIRO-Test-${i + 1}/1.0`
          },
          signal: AbortSignal.timeout(10000)
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
          const data = await response.json();
          
          const result = {
            testNumber: i + 1,
            timestamp: new Date().toISOString(),
            responseTime,
            online: data.online,
            cacheHit: data.debug?.cachehit || false,
            cacheTime: data.debug?.cachetime ? new Date(data.debug.cachetime * 1000).toISOString() : null,
            error: data.debug?.error || null
          };
          
          results.push(result);
          
          console.log(`✅ テスト ${i + 1} 完了: online=${data.online}, 応答時間=${responseTime}ms, キャッシュ=${data.debug?.cachehit}`);
        } else {
          results.push({
            testNumber: i + 1,
            timestamp: new Date().toISOString(),
            responseTime: endTime - startTime,
            online: false,
            cacheHit: false,
            cacheTime: null,
            error: `HTTP ${response.status}`
          });
          
          console.log(`❌ テスト ${i + 1} 失敗: HTTP ${response.status}`);
        }
      } catch (error) {
        const endTime = Date.now();
        results.push({
          testNumber: i + 1,
          timestamp: new Date().toISOString(),
          responseTime: endTime - startTime,
          online: false,
          cacheHit: false,
          cacheTime: null,
                     error: String(error)
        });
        
                 console.log(`❌ テスト ${i + 1} エラー:`, String(error));
      }
      
      // テスト間隔を少し空ける
      if (i < testCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 結果の分析
    const onlineCount = results.filter(r => r.online).length;
    const cacheHitCount = results.filter(r => r.cacheHit).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    console.log(`\n📊 テスト結果サマリー:`);
    console.log(`  - オンライン回数: ${onlineCount}/${testCount}`);
    console.log(`  - キャッシュヒット回数: ${cacheHitCount}/${testCount}`);
    console.log(`  - 平均応答時間: ${avgResponseTime.toFixed(2)}ms`);
    
    return NextResponse.json({
      summary: {
        totalTests: testCount,
        onlineCount,
        cacheHitCount,
        avgResponseTime: Math.round(avgResponseTime)
      },
      results
    });
    
  } catch (error) {
    console.error('Minecraftサーバーテストエラー:', error);
    return NextResponse.json(
      { error: 'テストに失敗しました', details: String(error) },
      { status: 500 }
    );
  }
} 