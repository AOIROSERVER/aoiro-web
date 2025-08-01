import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントを初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { targetEmail, points, reason, adminEmail } = await request.json();

    // バリデーション
    if (!targetEmail || !points || !adminEmail) {
      return NextResponse.json(
        { error: '必要な項目が不足しています' },
        { status: 400 }
      );
    }

    if (typeof points !== 'number' || points <= 0 || points > 10000) {
      return NextResponse.json(
        { error: '有効なポイント数を指定してください（1-10000）' },
        { status: 400 }
      );
    }

    // 管理者権限チェック
    const isAdmin = adminEmail === 'aoiroserver.m@gmail.com' || 
                   adminEmail === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    console.log('🎯 ポイント送信要求:', {
      targetEmail,
      points,
      reason: reason || '管理者からのポイント送信',
      adminEmail,
      timestamp: new Date().toISOString()
    });

    // 対象ユーザーを検索
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles_secure')
      .select('id, email, points')
      .eq('email', targetEmail)
      .single();

    if (userError || !targetUser) {
      console.error('❌ ユーザー検索エラー:', userError);
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('👤 対象ユーザー:', {
      id: targetUser.id,
      email: targetUser.email,
      currentPoints: targetUser.points || 0
    });

    // ポイントを更新
    const newPoints = (targetUser.points || 0) + points;
    const { data: updateResult, error: updateError } = await supabase
      .from('user_profiles_secure')
      .update({ points: newPoints })
      .eq('id', targetUser.id)
      .select();

    if (updateError) {
      console.error('❌ ポイント更新エラー:', updateError);
      return NextResponse.json(
        { error: 'ポイントの更新に失敗しました' },
        { status: 500 }
      );
    }

    console.log('✅ ポイント更新成功:', {
      userId: targetUser.id,
      previousPoints: targetUser.points || 0,
      addedPoints: points,
      newPoints: newPoints
    });

    // ポイント送信履歴を記録（任意）
    try {
      await supabase
        .from('point_transactions')
        .insert({
          user_id: targetUser.id,
          points: points,
          type: 'admin_grant',
          description: reason || '管理者からのポイント送信',
          admin_email: adminEmail,
          created_at: new Date().toISOString()
        });
    } catch (historyError) {
      console.warn('⚠️ 履歴記録に失敗（処理は続行）:', historyError);
    }

    return NextResponse.json({
      success: true,
      message: `${targetEmail} に ${points} ポイントを送信しました`,
      user: {
        email: targetUser.email,
        previousPoints: targetUser.points || 0,
        newPoints: newPoints,
        addedPoints: points
      }
    });

  } catch (error) {
    console.error('❌ ポイント送信API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}