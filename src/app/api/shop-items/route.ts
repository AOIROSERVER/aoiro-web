import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントを初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🛍️ ショップアイテム取得要求:', {
      timestamp: new Date().toISOString()
    });

    // アクティブなショップアイテムを取得
    const { data: items, error: itemsError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('points', { ascending: true });

    if (itemsError) {
      console.error('❌ ショップアイテム取得エラー:', itemsError);
      return NextResponse.json(
        { error: 'ショップアイテムの取得に失敗しました' },
        { status: 500 }
      );
    }

    console.log('✅ ショップアイテム取得成功:', {
      itemCount: items?.length || 0
    });

    return NextResponse.json({
      success: true,
      items: items || []
    });

  } catch (error) {
    console.error('❌ ショップアイテムAPI エラー:', error);
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
