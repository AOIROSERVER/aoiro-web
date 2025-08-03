const fs = require('fs');
const path = require('path');

// train-status.jsonの内容を読み込み
const trainStatusData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/train-status.json'), 'utf8')
);

// データをSupabaseの形式に変換
const formattedData = trainStatusData.map(item => ({
  line_id: item.id,
  name: item.name,
  status: item.status,
  section: item.section || '',
  detail: item.detail || '',
  color: item.color || '#000000',
  updated_at: new Date().toISOString()
}));

console.log('同期するデータ:', formattedData);

// APIエンドポイントにPOSTリクエストを送信
async function syncData() {
  try {
    const response = await fetch('http://localhost:3000/api/train-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trainStatusData)
    });

    if (response.ok) {
      console.log('データの同期が完了しました');
    } else {
      console.error('データの同期に失敗しました:', response.statusText);
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  syncData();
}

module.exports = { syncData, formattedData }; 