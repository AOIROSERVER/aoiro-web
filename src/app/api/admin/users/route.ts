import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('ユーザー取得API開始');
    console.log('環境変数確認:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '設定済み' : '未設定'
    });

    // 管理者権限チェック（簡易版）
    // 実際の実装では、より厳密な認証が必要

    // 認証済みユーザーの一覧を取得
    console.log('supabase.auth.admin.listUsers()実行開始');
    const { data: users, error } = await supabase.auth.admin.listUsers();
    console.log('listUsers結果:', { users: users?.users?.length || 0, error });

    if (error) {
      console.error('ユーザー取得エラー:', error);
      
      // 環境変数が設定されていない場合の代替手段
      if (error.message.includes('service_role') || error.message.includes('admin')) {
        console.log('サービスロールキーが設定されていないため、代替手段を試行');
        
        // 通常のSupabaseクライアントを使用してユーザー情報を取得
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          return NextResponse.json(
            { error: '認証情報の取得に失敗しました' },
            { status: 500 }
          );
        }
        
        // 現在ログインしているユーザーのみを返す
        if (!user) {
          return NextResponse.json(
            { error: 'ユーザー情報が取得できませんでした' },
            { status: 401 }
          );
        }
        
        const userList = [{
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        }];
        
        return NextResponse.json({
          success: true,
          users: userList,
          note: 'サービスロールキーが設定されていないため、現在のユーザーのみ表示'
        });
      }
      
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 必要な情報のみを抽出
    const userList = users.users.map(user => ({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }));

    return NextResponse.json({
      success: true,
      users: userList
    });

  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
