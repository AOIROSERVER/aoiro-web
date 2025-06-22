import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const roadOrder = [
  'C1_INNER', 'C1_OUTER', 'C2_INNER', 'C2_OUTER', 'YE', 'KK'
];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('road_statuses')
      .select('*');

    if (error) {
      throw error;
    }

    // 道路を定義された順序でソート
    const sortedRoads = data.sort((a, b) => {
      const aIndex = roadOrder.indexOf(a.id);
      const bIndex = roadOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return NextResponse.json(sortedRoads);
  } catch (error) {
    console.error('道路状況の取得に失敗しました:', error);
    return NextResponse.json(
      { error: '道路状況の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { id, status, congestion, note } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '道路IDが必要です' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('road_statuses')
      .update({ status, congestion, note, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('道路状況の更新に失敗しました:', error);
    return NextResponse.json(
      { error: '道路状況の更新に失敗しました' },
      { status: 500 }
    );
  }
} 