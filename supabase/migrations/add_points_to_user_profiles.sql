-- user_profilesテーブルにpointsカラムを追加
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 既存のレコードに対してデフォルト値を設定
UPDATE user_profiles 
SET points = 0 
WHERE points IS NULL;

-- インデックスの作成（オプション）
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(points); 