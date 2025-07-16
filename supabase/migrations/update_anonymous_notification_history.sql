-- 匿名通知履歴テーブルに新しいフィールドを追加
ALTER TABLE anonymous_email_notification_history 
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'delay_notification',
ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'immediate';

-- 既存のレコードに対してデフォルト値を設定
UPDATE anonymous_email_notification_history 
SET 
  notification_type = 'delay_notification',
  frequency = 'immediate'
WHERE notification_type IS NULL;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_anonymous_email_history_type ON anonymous_email_notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_anonymous_email_history_frequency ON anonymous_email_notification_history(frequency); 