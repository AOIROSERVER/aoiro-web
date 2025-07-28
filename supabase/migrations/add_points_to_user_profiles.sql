
-- user_profilesテーブルにpointsカラムを追加
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 既存のレコードに対してデフォルト値を設定
UPDATE user_profiles
SET points = 0
WHERE points IS NULL;

-- インデックスの作成（オプション）
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(points);

-- 確認用クエリ
SELECT 
  COUNT(*) as total_users,
  COUNT(points) as users_with_points,
  AVG(points) as average_points,
  MIN(points) as min_points,
  MAX(points) as max_points
FROM user_profiles;
