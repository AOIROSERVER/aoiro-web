import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 デバッグ情報収集開始');
    
    // 環境変数の確認
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };
    
    console.log('📊 環境変数情報:', envInfo);
    
    // Supabaseクライアントの初期化テスト
    let supabaseClient = null;
    let supabaseError = null;
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      console.log('✅ Supabaseクライアント初期化成功');
    } catch (error) {
      supabaseError = error;
      console.error('❌ Supabaseクライアント初期化エラー:', error);
    }
    
    // テーブル存在確認テスト
    let tableTest = null;
    let tableError = null;
    
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('train_status')
          .select('count')
          .limit(1);
          
        if (error) {
          tableError = error;
          console.error('❌ テーブルアクセスエラー:', error);
        } else {
          tableTest = { success: true, data };
          console.log('✅ テーブルアクセス成功:', data);
        }
      } catch (error) {
        tableError = error;
        console.error('❌ テーブルテストエラー:', error);
      }
    }
    
    return NextResponse.json({
      message: 'デバッグ情報',
      timestamp: new Date().toISOString(),
      environment: envInfo,
      supabaseClient: supabaseClient ? 'initialized' : 'failed',
      supabaseError: supabaseError ? String(supabaseError) : null,
      tableTest,
      tableError: tableError ? {
        message: tableError.message,
        code: tableError.code,
        details: tableError.details
      } : null
    });
    
  } catch (error) {
    console.error('❌ デバッグAPIエラー:', error);
    return NextResponse.json({ 
      message: 'デバッグAPIエラー', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 