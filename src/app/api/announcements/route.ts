import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('お知らせの取得エラー:', error);
      return NextResponse.json({ error: 'お知らせの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, date, tags } = body;

    if (!title || !content || !date) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert([{ title, content, date, tags }])
      .select();

    if (error) {
      console.error('お知らせの作成エラー:', error);
      return NextResponse.json({ error: 'お知らせの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 