// 列車位置情報のテスト用スクリプト
// 使用方法: node test-train-position.js

const testTrainPosition = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // テスト用の列車位置情報を送信
  const testPositions = [
    {
      content: '山手線/外回り/東京到着'
    },
    {
      content: '山手線/内回り/新宿到着'
    },
    {
      content: '京浜東北線/上り/浜松到着'
    },
    {
      content: 'JYO1/山手線/外回り/渋谷到着' // 新しい形式（タグ付き）
    }
  ];

  console.log('🚂 列車位置情報のテストを開始します...\n');

  // 各位置情報を送信
  for (const position of testPositions) {
    try {
      console.log(`📤 送信: ${position.content}`);
      
      // 開発環境では /api/netlify/functions/webhook-discord を使用
      const response = await fetch(`${baseUrl}/api/netlify/functions/webhook-discord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(position)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 成功:`, data);
      } else {
        const error = await response.text();
        console.log(`❌ エラー (${response.status}):`, error);
      }
    } catch (error) {
      console.error(`❌ エラー:`, error.message);
    }
    console.log('');
  }

  // 位置情報を取得
  console.log('📥 位置情報を取得中...');
  try {
    // 開発環境では /api/netlify/functions/webhook-discord を使用
    const response = await fetch(`${baseUrl}/api/netlify/functions/webhook-discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'get' })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 取得した位置情報:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ エラー (${response.status}):`, await response.text());
      console.log('\n💡 開発環境ではNetlify Functionsは動作しません。');
      console.log('   ブラウザで列車位置情報ページを開いて、手動でテストしてください。');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('\n💡 開発環境ではNetlify Functionsは動作しません。');
    console.log('   ブラウザで列車位置情報ページを開いて、手動でテストしてください。');
  }
};

// 実行
testTrainPosition();
