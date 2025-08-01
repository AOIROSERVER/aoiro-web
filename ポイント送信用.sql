-- ポイント送信機能用SQL（シンプル版）

-- 1. user_profilesテーブルにpointsカラムを追加（存在しない場合）
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 2. 既存ユーザーのpointsを0に設定（NULLの場合）
UPDATE user_profiles 
SET points = 0 
WHERE points IS NULL;

-- 3. テスト用ユーザーを作成
INSERT INTO user_profiles (id, email, username, game_tag, points, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'test@test.com', 'testuser', 'TEST_USER', 500, NOW(), NOW()),
  (gen_random_uuid(), 'demo@example.com', 'demouser', 'DEMO_USER', 1000, NOW(), NOW()),
  (gen_random_uuid(), 'sample@sample.com', 'sampleuser', 'SAMPLE_USER', 200, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  points = EXCLUDED.points,
  updated_at = NOW();

-- 4. 管理者アカウントのポイントを設定
UPDATE user_profiles 
SET points = 10000, updated_at = NOW()
WHERE email = 'aoiroserver.m@gmail.com';

-- 5. 確認用クエリ
SELECT email, username, points 
FROM user_profiles 
WHERE email IN ('aoiroserver.m@gmail.com', 'test@test.com', 'demo@example.com', 'sample@sample.com')
ORDER BY email;