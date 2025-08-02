import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントを直接初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('🧪 テスト用運行情報保存開始:', { 
      lineId: data.lineId, 
      status: data.status,
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    // 現在のステータスを取得
    const { data: currentData, error: fetchError } = await supabase
      .from('train_status')
      .select('*')
      .eq('line_id', data.lineId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ 現在のステータス取得エラー:', fetchError);
      return NextResponse.json({ 
        message: '現在のステータス取得失敗', 
        error: fetchError.message 
      }, { status: 500 });
    }

    const previousStatus = currentData?.status || '平常運転';
    const hasChanged = previousStatus !== data.status;

    console.log('📊 ステータス比較:', {
      previous: previousStatus,
      current: data.status,
      hasChanged
    });

    // Supabaseにデータを保存
    console.log('💾 テスト用Supabase保存開始:', {
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

    const { data: savedData, error } = await supabase
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
      console.error('❌ テスト用Supabase保存エラー:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        message: 'テスト用保存失敗', 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('✅ テスト用Supabase保存成功:', savedData);

    return NextResponse.json({ 
      message: 'テスト用保存成功',
      hasChanged,
      previousStatus,
      currentStatus: data.status,
      savedData
    });

  } catch (error) {
    console.error('❌ テスト用運行状況保存エラー:', error);
    return NextResponse.json({ 
      message: 'テスト用保存失敗', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 