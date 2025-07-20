import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    console.log('🧪 メール送信テスト開始:', { email });

    const supabase = createRouteHandlerClient({ cookies });

    // Supabaseの設定を確認
    console.log('🔧 Supabase設定確認:');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Anon Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

    // テスト用のユーザー登録を試行
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log('🧪 テストユーザー登録試行:', { testEmail });

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    console.log('🧪 テスト登録結果:', {
      success: !error,
      error: error?.message,
      user: data?.user?.email,
      emailConfirmed: data?.user?.email_confirmed_at
    });

    // テストユーザーを削除
    if (data?.user) {
      console.log('🧹 テストユーザーを削除中...');
      // 注意: 実際の環境では削除しない方が良い場合があります
    }

    return NextResponse.json({
      success: true,
      message: 'メール送信テストが完了しました',
      testResult: {
        registrationSuccess: !error,
        error: error?.message,
        emailConfirmed: data?.user?.email_confirmed_at
      },
      recommendations: [
        '1. SupabaseダッシュボードでEmail Authが有効になっているか確認',
        '2. メールテンプレートが設定されているか確認',
        '3. SMTP設定が正しいか確認',
        '4. スパムフォルダを確認',
        '5. 確認メールのリダイレクトURLが正しいか確認'
      ]
    });

  } catch (error) {
    console.error('❌ メール送信テストエラー:', error);
    return NextResponse.json(
      { error: 'メール送信テストに失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 