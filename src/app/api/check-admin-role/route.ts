import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// サービスロールキーが設定されている場合はそれを使用、そうでなければ匿名キーを使用
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    console.log('管理者権限チェック開始');
    console.log('環境変数確認:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定',
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

    // サービスロールキーが設定されている場合はadmin.getUserByIdを使用
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

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
    } else {
      // サービスロールキーが設定されていない場合は、簡易的な権限チェック
      console.log('サービスロールキーが設定されていないため、簡易的な権限チェックを実行');
      
      // 現在のセッションからユーザー情報を取得
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.error('ユーザー取得エラー:', error);
        return NextResponse.json(
          { error: '認証情報の取得に失敗しました' },
          { status: 401 }
        );
      }

      // 管理者権限があるかチェック（特定のメールアドレスで判定）
      const isAdmin = user.email === 'aoiroserver.m@gmail.com';

      if (!isAdmin) {
        return NextResponse.json(
          { error: '管理者権限がありません' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        isAdmin: true,
        note: 'サービスロールキーが設定されていないため、簡易的な権限チェックを実行'
      });
    }

  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
