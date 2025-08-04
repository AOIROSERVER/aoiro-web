import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('お知らせの取得エラー:', error);
      return NextResponse.json({ error: 'お知らせが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, date, tags } = body;

    if (!title || !content || !date) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({ title, content, date, tags, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('お知らせの更新エラー:', error);
      return NextResponse.json({ error: 'お知らせの更新に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('お知らせの削除エラー:', error);
      return NextResponse.json({ error: 'お知らせの削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: 'お知らせを削除しました' });
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
} 