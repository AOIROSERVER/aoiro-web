import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

// Supabaseクライアントを初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    console.log('📦 マイアイテム取得要求:', {
      timestamp: new Date().toISOString()
    });

    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Authorizationヘッダーが不足');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // トークンでユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ 認証エラー:', authError);
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    console.log('👤 ユーザー情報:', {
      id: user.id,
      email: user.email
    });

    // 新しいSQLファンクションを使用してユーザーアイテムを取得
    const { data: items, error: itemsError } = await supabase
      .rpc('get_user_items', {
        p_user_id: user.id
      });

    if (itemsError) {
      console.error('❌ アイテム取得エラー:', itemsError);
      return NextResponse.json(
        { error: 'アイテムの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 統計情報も取得
    const { data: statistics, error: statsError } = await supabase
      .rpc('get_shop_statistics', {
        p_user_id: user.id
      });

    if (statsError) {
      console.warn('⚠️ 統計情報取得エラー（処理は続行）:', statsError);
    }

    console.log('✅ アイテム取得成功:', {
      userId: user.id,
      itemCount: items?.length || 0,
      statistics: statistics
    });

    return NextResponse.json({
      success: true,
      items: items || [],
      statistics: statistics || {},
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ マイアイテムAPI エラー:', error);
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
