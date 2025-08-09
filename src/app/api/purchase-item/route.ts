import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントを初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { itemId, itemName, points } = await request.json();

    // バリデーション
    if (!itemId || !itemName || !points) {
      return NextResponse.json(
        { error: '必要な項目が不足しています' },
        { status: 400 }
      );
    }

    if (typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { error: '有効なポイント数を指定してください' },
        { status: 400 }
      );
    }

    console.log('🛒 アイテム購入要求:', {
      itemId,
      itemName,
      points,
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

    // 新しいSQLファンクションを使用して購入処理
    const { data: purchaseResult, error: purchaseError } = await supabase
      .rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_id: itemId,
        p_points_spent: points
      });

    if (purchaseError) {
      console.error('❌ 購入処理エラー:', purchaseError);
      return NextResponse.json(
        { error: '購入処理に失敗しました' },
        { status: 500 }
      );
    }

    if (!purchaseResult || !purchaseResult.success) {
      console.error('❌ 購入処理失敗:', purchaseResult);
      return NextResponse.json(
        { error: purchaseResult?.error || '購入処理に失敗しました' },
        { status: 400 }
      );
    }

    console.log('✅ 購入処理成功:', purchaseResult);

    return NextResponse.json({
      success: true,
      message: purchaseResult.message,
      purchase: purchaseResult.purchase
    });

  } catch (error) {
    console.error('❌ アイテム購入API エラー:', error);
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
