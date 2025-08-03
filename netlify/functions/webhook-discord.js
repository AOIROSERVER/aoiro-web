// 列車位置情報を保存するMap
const trainPositions = new Map();

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('受信:', body);

    // メッセージの形式を検証
    if (!body.content.match(/.+\/.+\/.+到着/)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '不正なメッセージ形式です' })
      };
    }

    // メッセージを解析
    const [line, direction, station] = body.content.split('/');
    const position = {
      line: line.trim(),
      direction: direction.trim(),
      station: station.replace('到着', '').trim(),
      timestamp: new Date().toISOString()
    };

    // 路線と方面ごとに最新の位置を保存
    const key = `${position.line}-${position.direction}`;
    trainPositions.set(key, position);

    console.log('保存された位置情報:', position);

    // 全路線の位置情報を返す
    const allPositions = Array.from(trainPositions.entries()).map(([key, value]) => ({
      key,
      ...value
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'ok',
        positions: allPositions
      })
    };
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'サーバーエラーが発生しました' })
    };
  }
};