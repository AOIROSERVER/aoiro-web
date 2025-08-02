import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントを初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const isAdmin = adminEmail === 'aoiroserver.m@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    console.log('🎯 統一版ポイント送信要求:', {
      targetEmail,
      points,
      reason: reason || '管理者からのポイント送信',
      adminEmail,
      timestamp: new Date().toISOString()
    });

    // 統一テーブルでユーザーを検索
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles_unified')
      .select('id, email, points')
      .eq('email', targetEmail)
      .single();

    if (userError || !targetUser) {
      console.error('❌ ユーザー検索エラー:', userError);
      
      // ユーザーが見つからない場合、Supabase Authから検索して新規作成
      try {
        console.log('🔍 Supabase Authでユーザー検索中...');
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers.users) {
          const authUser = authUsers.users.find(user => user.email === targetEmail);
          if (authUser) {
            console.log('✅ Supabase Authでユーザー発見:', authUser.email);
            
            // 統一テーブルにユーザープロフィールを作成
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles_unified')
              .insert({
                id: authUser.id,
                email: authUser.email,
                username: authUser.email?.split('@')[0] || 'user',
                game_tag: authUser.email?.split('@')[0]?.toUpperCase() || 'USER',
                points: points // 最初のポイントとして設定
              })
              .select()
              .single();

            if (!createError && newProfile) {
              console.log('✅ user_profiles_unified にプロフィール作成完了:', newProfile);
              
              // 取引履歴も記録
              await supabase
                .from('point_transactions_unified')
                .insert({
                  user_id: authUser.id,
                  points: points,
                  type: 'admin_grant',
                  description: reason || '管理者からのポイント送信（新規ユーザー）',
                  admin_email: adminEmail
                });

              return NextResponse.json({
                success: true,
                message: `${targetEmail} に ${points} ポイントを送信しました（新規プロフィール作成）`,
                user: {
                  email: authUser.email,
                  previousPoints: 0,
                  newPoints: points,
                  addedPoints: points,
                  table: 'user_profiles_unified',
                  created: true
                }
              });
            } else {
              console.error('❌ プロフィール作成エラー:', createError);
            }
          }
        }
      } catch (authErr) {
        console.error('❌ Auth検索エラー:', authErr);
      }

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
      .from('user_profiles_unified')
      .update({ 
        points: newPoints,
        updated_at: new Date().toISOString()
      })
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

    // ポイント送信履歴を記録
    try {
      await supabase
        .from('point_transactions_unified')
        .insert({
          user_id: targetUser.id,
          points: points,
          type: 'admin_grant',
          description: reason || '管理者からのポイント送信',
          admin_email: adminEmail
        });
      console.log('✅ 取引履歴記録完了');
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
        addedPoints: points,
        table: 'user_profiles_unified'
      }
    });

  } catch (error) {
    console.error('❌ 統一版ポイント送信API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}