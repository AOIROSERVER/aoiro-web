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
    const isAdmin = adminEmail === 'aoiroserver.m@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    console.log('🎯 シンプル版ポイント送信要求:', {
      targetEmail,
      points,
      reason: reason || '管理者からのポイント送信',
      adminEmail,
      timestamp: new Date().toISOString()
    });

    // 複数のテーブル名でユーザーを検索
    const tableNames = ['user_profiles', 'user_profiles_secure', 'profiles'];
    let targetUser = null;
    let usedTable = '';

    for (const tableName of tableNames) {
      try {
        console.log(`🔍 ${tableName} テーブルでユーザー検索中...`);
        
        const { data, error } = await supabase
          .from(tableName)
          .select('id, email, points')
          .eq('email', targetEmail)
          .single();

        if (!error && data) {
          targetUser = data;
          usedTable = tableName;
          console.log(`✅ ${tableName} テーブルでユーザー発見:`, data);
          break;
        } else {
          console.log(`❌ ${tableName} テーブルでエラー:`, error?.message);
        }
      } catch (err) {
        console.log(`⚠️ ${tableName} テーブルアクセスエラー:`, err);
      }
    }

    if (!targetUser) {
      // Supabase Authからユーザーを直接検索
      try {
        console.log('🔍 Supabase Authでユーザー検索中...');
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers.users) {
          const authUser = authUsers.users.find(user => user.email === targetEmail);
          if (authUser) {
            console.log('✅ Supabase Authでユーザー発見:', authUser.email);
            
            // 最初に見つかったテーブルにユーザープロフィールを作成
            const createTable = tableNames[0]; // user_profiles
            try {
              const { data: newProfile, error: createError } = await supabase
                .from(createTable)
                .insert({
                  id: authUser.id,
                  email: authUser.email,
                  username: authUser.email?.split('@')[0] || 'user',
                  points: points // 最初のポイントとして設定
                })
                .select()
                .single();

              if (!createError && newProfile) {
                console.log(`✅ ${createTable} にプロフィール作成完了:`, newProfile);
                return NextResponse.json({
                  success: true,
                  message: `${targetEmail} に ${points} ポイントを送信しました（新規プロフィール作成）`,
                  user: {
                    email: authUser.email,
                    previousPoints: 0,
                    newPoints: points,
                    addedPoints: points,
                    table: createTable,
                    created: true
                  }
                });
              } else {
                console.error('❌ プロフィール作成エラー:', createError);
              }
            } catch (createErr) {
              console.error('❌ プロフィール作成例外:', createErr);
            }
          }
        }
      } catch (authErr) {
        console.error('❌ Auth検索エラー:', authErr);
      }

      return NextResponse.json(
        { 
          error: 'ユーザーが見つかりません',
          details: `${targetEmail} はどのテーブルにも存在しません。検索したテーブル: ${tableNames.join(', ')}`,
          searchedTables: tableNames
        },
        { status: 404 }
      );
    }

    console.log('👤 対象ユーザー:', {
      id: targetUser.id,
      email: targetUser.email,
      currentPoints: targetUser.points || 0,
      table: usedTable
    });

    // ポイントを更新
    const newPoints = (targetUser.points || 0) + points;
    const { data: updateResult, error: updateError } = await supabase
      .from(usedTable)
      .update({ points: newPoints })
      .eq('id', targetUser.id)
      .select();

    if (updateError) {
      console.error('❌ ポイント更新エラー:', updateError);
      return NextResponse.json(
        { error: 'ポイントの更新に失敗しました', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ ポイント更新成功:', {
      userId: targetUser.id,
      previousPoints: targetUser.points || 0,
      addedPoints: points,
      newPoints: newPoints,
      table: usedTable
    });

    return NextResponse.json({
      success: true,
      message: `${targetEmail} に ${points} ポイントを送信しました`,
      user: {
        email: targetUser.email,
        previousPoints: targetUser.points || 0,
        newPoints: newPoints,
        addedPoints: points,
        table: usedTable
      }
    });

  } catch (error) {
    console.error('❌ ポイント送信API エラー:', error);
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}