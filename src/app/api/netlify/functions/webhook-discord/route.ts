import { NextRequest, NextResponse } from 'next/server';

// 列車位置情報を保存するMap（サーバーサイドで保持）
// 注意: 本番環境では、Redisやデータベースを使用することを推奨
const trainPositions = new Map<string, {
  tag: string;
  line: string;
  direction: string;
  station: string;
  timestamp: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('受信:', body);

    // GETアクションの場合は位置情報を返す
    if (body.action === 'get') {
      console.log('GETアクション: 電車位置情報を取得中...');
      
      // 全路線の位置情報を返す
      const allPositions = Array.from(trainPositions.entries()).map(([key, value]) => ({
        key,
        ...value
      }));

      console.log('返却する位置情報:', allPositions);

      return NextResponse.json({
        status: 'ok',
        positions: allPositions,
        count: allPositions.length,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
      });
    }

    // contentが存在しない場合はエラーを返す
    if (!body.content) {
      console.warn('⚠️ contentが存在しません:', body);
      return NextResponse.json(
        { error: 'contentが存在しません' },
        { status: 400 }
      );
    }

    // メッセージの形式を検証（両方の形式に対応）
    const parts = body.content.split('/');
    const isNewFormat = parts.length === 4 && body.content.includes('到着'); // タグ/〇〇線/〇〇方面/〇〇到着
    const isOldFormat = parts.length === 3 && body.content.includes('到着'); // 〇〇線/〇〇方面/〇〇到着
    
    if (!isNewFormat && !isOldFormat) {
      return NextResponse.json(
        { error: '不正なメッセージ形式です' },
        { status: 400 }
      );
    }

    // メッセージを解析
    let line: string, direction: string, station: string, tag: string;
    
    if (isNewFormat) {
      // 新しい形式: タグ/〇〇線/〇〇方面/〇〇到着
      [tag, line, direction, station] = parts;
      tag = tag.trim();
    } else {
      // 古い形式: 〇〇線/〇〇方面/〇〇到着
      [line, direction, station] = parts;
      // 古い形式の場合は、自動的にタグを生成
      const lineCodeMap: Record<string, string> = {
        '山手線': 'JY',
        '京浜東北線': 'JK',
        '東海道新幹線': 'CA',
        '総武線': 'JB',
        '中央線': 'JC',
        '丸の内線': 'M',
        '日比谷線': 'H',
        '銀座線': 'G',
        '東海道線': 'JT',
        '横須賀線': 'JO',
        'あきが丘線': 'AK'
      };
      
      const directionCodeMap: Record<string, string> = {
        '外回り': 'O',
        '内回り': 'I',
        '上り': 'U',
        '下り': 'D',
        'out': 'O',
        'in': 'I',
        'up': 'U',
        'down': 'D'
      };
      
      const lineCode = lineCodeMap[line.trim()] || 'XX';
      const directionCode = directionCodeMap[direction.trim()] || 'X';
      const carNumber = '1';
      
      tag = `${lineCode}${directionCode}${carNumber}`;
    }

    const position = {
      tag: tag,
      line: line.trim(),
      direction: direction.trim(),
      station: station.replace('到着', '').trim(),
      timestamp: new Date().toISOString()
    };

    // タグごとに最新の位置を保存
    const key = position.tag;
    trainPositions.set(key, position);

    console.log('保存された位置情報:', position);

    // 全路線の位置情報を返す
    const allPositions = Array.from(trainPositions.entries()).map(([key, value]) => ({
      key,
      ...value
    }));

    return NextResponse.json({
      status: 'ok',
      positions: allPositions
    });
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }
  });
}
