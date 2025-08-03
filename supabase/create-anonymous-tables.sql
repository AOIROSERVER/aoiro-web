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

-- RLSポリシーの設定（匿名アクセスを許可）
ALTER TABLE anonymous_email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_email_notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_notification_tokens ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザー用のポリシー（全ての操作を許可）
CREATE POLICY "Allow all operations for anonymous users" ON anonymous_email_notification_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON anonymous_email_notification_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for anonymous users" ON anonymous_notification_tokens
  FOR ALL USING (true) WITH CHECK (true); 