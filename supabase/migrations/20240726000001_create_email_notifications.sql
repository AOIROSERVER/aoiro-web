-- メール通知設定テーブル
CREATE TABLE IF NOT EXISTS email_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  line_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, line_id)
);

-- メール通知履歴テーブル
CREATE TABLE IF NOT EXISTS email_notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mailgun_message_id TEXT
);

-- RLSポリシーの設定
ALTER TABLE email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notification_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知設定のみアクセス可能
CREATE POLICY "Users can view own email notification settings" ON email_notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email notification settings" ON email_notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email notification settings" ON email_notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email notification settings" ON email_notification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ユーザーは自分の通知履歴のみアクセス可能
CREATE POLICY "Users can view own email notification history" ON email_notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email notification history" ON email_notification_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_email_notification_settings_user_id ON email_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notification_settings_line_id ON email_notification_settings(line_id);
CREATE INDEX IF NOT EXISTS idx_email_notification_history_user_id ON email_notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notification_history_sent_at ON email_notification_history(sent_at); 