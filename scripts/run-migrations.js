const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase設定（環境変数から読み込み）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('🚀 マイグレーション開始...');

    // 匿名ユーザー用テーブルの作成
    const migrationSQL = `
      -- 匿名ユーザー用メール通知設定テーブル
      CREATE TABLE IF NOT EXISTS anonymous_email_notification_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        line_id TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(email, line_id)
      );

      -- 匿名ユーザー用メール通知履歴テーブル
      CREATE TABLE IF NOT EXISTS anonymous_email_notification_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        line_id TEXT NOT NULL,
        line_name TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        mailgun_message_id TEXT
      );

      -- 匿名ユーザー用通知トークンテーブル
      CREATE TABLE IF NOT EXISTS anonymous_notification_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        device_type TEXT NOT NULL CHECK (device_type IN ('web', 'ios', 'android')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      );

      -- インデックスの作成
      CREATE INDEX IF NOT EXISTS idx_anonymous_email_settings_email ON anonymous_email_notification_settings(email);
      CREATE INDEX IF NOT EXISTS idx_anonymous_email_settings_line ON anonymous_email_notification_settings(line_id);
      CREATE INDEX IF NOT EXISTS idx_anonymous_email_history_email ON anonymous_email_notification_history(email);
      CREATE INDEX IF NOT EXISTS idx_anonymous_notification_tokens_email ON anonymous_notification_tokens(email);
      CREATE INDEX IF NOT EXISTS idx_anonymous_notification_tokens_token ON anonymous_notification_tokens(token);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ マイグレーションエラー:', error);
      return;
    }

    console.log('✅ マイグレーション完了');

    // テーブルの存在確認
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'anonymous_email_notification_settings',
        'anonymous_email_notification_history',
        'anonymous_notification_tokens'
      ]);

    if (tableError) {
      console.error('❌ テーブル確認エラー:', tableError);
      return;
    }

    console.log('📋 作成されたテーブル:', tables);

  } catch (error) {
    console.error('❌ マイグレーション実行エラー:', error);
  }
}

runMigrations(); 