-- 匿名通知設定テーブルに新しいフィールドを追加
ALTER TABLE anonymous_email_notification_settings 
ADD COLUMN IF NOT EXISTS delay_notification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_notification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recovery_notification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly'));

-- 既存のレコードに対してデフォルト値を設定
UPDATE anonymous_email_notification_settings 
SET 
  delay_notification = true,
  suspension_notification = true,
  recovery_notification = true,
  notification_frequency = 'immediate'
WHERE delay_notification IS NULL;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_anonymous_email_settings_delay ON anonymous_email_notification_settings(delay_notification);
CREATE INDEX IF NOT EXISTS idx_anonymous_email_settings_suspension ON anonymous_email_notification_settings(suspension_notification);
CREATE INDEX IF NOT EXISTS idx_anonymous_email_settings_recovery ON anonymous_email_notification_settings(recovery_notification);
CREATE INDEX IF NOT EXISTS idx_anonymous_email_settings_frequency ON anonymous_email_notification_settings(notification_frequency); 