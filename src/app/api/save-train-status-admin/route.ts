import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 管理者用のSupabaseクライアント（サービスロールキー使用）
// 環境変数が設定されていない場合は通常のクライアントを使用
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('🚨 管理者用運行情報保存開始:', { 
      lineId: data.lineId, 
      status: data.status,
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // 現在のステータスを取得して変更を検知
    const { data: currentData } = await supabaseAdmin
      .from('train_status')
      .select('status, detail')
      .eq('line_id', data.lineId)
      .single();

    const previousStatus = currentData?.status || '不明';
    const hasChanged = previousStatus !== data.status;

    console.log('📊 ステータス比較:', {
      previous: previousStatus,
      current: data.status,
      hasChanged
    });

    // Supabaseにデータを保存（管理者権限）
    console.log('💾 管理者用Supabase保存開始:', {
      table: 'train_status',
      data: {
        line_id: data.lineId,
        name: data.name,
        status: data.status,
        section: data.section || '',
        detail: data.detail || '',
        color: data.color || '#000000'
      }
    });

    const { data: savedData, error } = await supabaseAdmin
      .from('train_status')
      .upsert({
        line_id: data.lineId,
        name: data.name,
        status: data.status,
        section: data.section || '',
        detail: data.detail || '',
        color: data.color || '#000000',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'line_id'
      })
      .select();

    if (error) {
      console.error('❌ 管理者用Supabase保存エラー:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        message: '管理者用保存失敗', 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('✅ 管理者用Supabase保存成功:', savedData);

    return NextResponse.json({ 
      message: '管理者用保存成功',
      hasChanged,
      previousStatus,
      currentStatus: data.status,
      savedData
    });

  } catch (error) {
    console.error('❌ 管理者用運行状況保存エラー:', error);
    return NextResponse.json({ 
      message: '管理者用保存失敗', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 