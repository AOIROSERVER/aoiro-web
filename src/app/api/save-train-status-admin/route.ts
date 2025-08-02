import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 管理者用のSupabaseクライアント（サービスロールキー使用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('🚨 管理者用運行情報保存開始:', { 
      lineId: data.lineId, 
      status: data.status,
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    // 管理者権限チェック（簡易的な実装）
    const adminEmail = data.adminEmail || 'aoiroserver.m@gmail.com';
    const isAdmin = adminEmail === 'aoiroserver.m@gmail.com' || 
                   adminEmail === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
    
    if (!isAdmin) {
      console.error('❌ 管理者権限なし:', adminEmail);
      return NextResponse.json({ 
        message: '管理者権限が必要です',
        error: 'Unauthorized'
      }, { status: 403 });
    }

    // 現在のステータスを取得して変更を検知
    const { data: currentData, error: fetchError } = await supabase
      .from('train_status')
      .select('*')
      .eq('line_id', data.lineId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('現在のステータス取得エラー:', fetchError);
    }

    const previousStatus = currentData?.status || '平常運転';
    const hasChanged = previousStatus !== data.status;

    console.log('📊 ステータス変更チェック:', {
      previous: previousStatus,
      current: data.status,
      hasChanged
    });

    // Supabaseにデータを保存（サービスロールキー使用）
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
      console.error('❌ 管理者用Supabase保存エラー:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        message: '保存失敗', 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('✅ 管理者用Supabase保存成功:', savedData);

    return NextResponse.json({ 
      message: '保存成功（管理者用）',
      hasChanged,
      previousStatus,
      currentStatus: data.status,
      savedData
    });
  } catch (error) {
    console.error('❌ 管理者用運行状況保存エラー:', error);
    return NextResponse.json({ 
      message: '保存失敗', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 