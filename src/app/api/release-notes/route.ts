import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// リリースノートの型定義
type ReleaseNote = {
  id?: number;
  title: string;
  content: string;
  version: string;
  date: string;
  author: string;
  created_at?: string;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('release_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('リリースノート取得エラー:', error);
      return NextResponse.json({ error: 'リリースノートの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('リリースノート取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, version, author } = body;

    // バリデーション
    if (!title || !content || !version) {
      return NextResponse.json(
        { error: 'タイトル、内容、バージョンは必須です' },
        { status: 400 }
      );
    }

    // 管理者権限のチェック（簡易的な実装）
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const releaseNote: Omit<ReleaseNote, 'id' | 'created_at'> = {
      title,
      content,
      version,
      date: new Date().toISOString(),
      author: author || '管理者'
    };

    const { data, error } = await supabase
      .from('release_notes')
      .insert([releaseNote])
      .select()
      .single();

    if (error) {
      console.error('リリースノート作成エラー:', error);
      return NextResponse.json(
        { error: 'リリースノートの作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('リリースノート作成エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 