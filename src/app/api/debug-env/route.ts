import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Supabaseクライアントを作成
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    // 接続テスト
    const { data: testData, error: testError } = await supabase
      .from('train_status')
      .select('count')
      .limit(1);
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
      supabaseKey: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'undefined',
      connectionTest: {
        success: !testError,
        error: testError?.message || null,
        data: testData
      },
      allEnvVars: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        GMAIL_USER: !!process.env.GMAIL_USER,
        GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
        FROM_EMAIL: process.env.FROM_EMAIL
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'デバッグAPIエラー',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 