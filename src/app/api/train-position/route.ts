import { NextRequest, NextResponse } from 'next/server';

// 仮のダミーデータ
const dummyTrainPositions = [
  {
    line: '山手線',
    direction: '外回り',
    station: '高輪ゲートウェイ',
  },
  {
    line: '山手線',
    direction: '内回り',
    station: '秋葉原',
  },
  {
    line: '京浜東北線',
    direction: '下り',
    station: '東京',
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const line = searchParams.get('line');
  const direction = searchParams.get('direction');

  if (!line || !direction) {
    return NextResponse.json({ error: 'line and direction are required' }, { status: 400 });
  }

  // ダミーデータから該当する列車位置を取得
  const train = dummyTrainPositions.find(
    t => t.line === line && t.direction === direction
  );

  if (!train) {
    return NextResponse.json({ error: 'No train position found' }, { status: 404 });
  }

  return NextResponse.json(train);
} 