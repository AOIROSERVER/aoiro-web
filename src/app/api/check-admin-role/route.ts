import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('管理者権限チェック開始');
    console.log('環境変数確認:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '設定済み' : '未設定'
    });

    const { userId } = await request.json();
    console.log('リクエストユーザーID:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // Supabase Authから直接ユーザー情報を取得して管理者権限をチェック
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      console.error('ユーザー取得エラー:', error);
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 管理者権限があるかチェック（特定のメールアドレスで判定）
    const isAdmin = user.user?.email === 'aoiroserver.m@gmail.com';

    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: true
    });

  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
