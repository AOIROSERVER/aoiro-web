import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Supabaseテーブル存在確認開始');

    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('📋 環境変数確認:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    });

    // 各テーブルの存在確認
    const tablesToCheck = [
      'train_status',
      'road_statuses',
      'quests',
      'quest_tasks',
      'user_profiles',
      'user_profiles_secure',
      'bonus_statistics',
      'login_bonus',
      'anonymous_email_notification_settings',
      'notification_tokens'
    ];

    const results: { [key: string]: any } = {};

    for (const tableName of tablesToCheck) {
      try {
        console.log(`🔍 ${tableName} テーブル確認中...`);
        
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (error) {
          console.error(`❌ ${tableName} エラー:`, error);
          results[tableName] = {
            exists: false,
            error: error.message,
            code: error.code
          };
        } else {
          console.log(`✅ ${tableName} 存在確認`);
          results[tableName] = {
            exists: true,
            data: data
          };
        }
      } catch (err) {
        console.error(`❌ ${tableName} 例外:`, err);
        results[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }

    // Supabase接続テスト
    const { data: testData, error: testError } = await supabase
      .from('train_status')
      .select('count')
      .limit(1);

    console.log('🔍 Supabase接続テスト結果:', {
      hasTestData: !!testData,
      testError: testError ? testError.message : null
    });

    return NextResponse.json({
      success: true,
      environment: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      },
      connection: {
        testData: !!testData,
        testError: testError?.message || null
      },
      tables: results
    });

  } catch (error) {
    console.error('❌ デバッグAPI エラー:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 