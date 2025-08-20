import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// サービスロールキーが設定されている場合はそれを使用、そうでなければ匿名キーを使用
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { user_email, user_name, department, position, access_level, is_active, expires_at, notes } = await request.json();

    // 必須フィールドのチェック
    if (!user_email || !user_name || !department || !position) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    // ユーザーを追加
    const { data, error } = await supabase
      .from('authorized_employee_access')
      .insert([
        {
          user_email,
          user_name,
          department,
          position,
          access_level: access_level || 'basic',
          is_active: is_active !== undefined ? is_active : true,
          expires_at: expires_at || null,
          notes: notes || '',
          granted_by: 'admin' // 実際の実装では認証された管理者のIDを使用
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('データベースエラー:', error);
      return NextResponse.json(
        { error: 'ユーザーの追加に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: data,
      message: 'ユーザーを追加しました'
    });

  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
