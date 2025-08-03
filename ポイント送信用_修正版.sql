-- ポイント送信機能用SQL（修正版）
-- まず存在するテーブルに応じて実行してください

-- Option 1: user_profiles_secureテーブルが存在する場合
-- user_profiles_secureテーブルにpointsカラムを追加
ALTER TABLE user_profiles_secure 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 既存ユーザーのpointsを0に設定
UPDATE user_profiles_secure 
SET points = 0 
WHERE points IS NULL;

-- テスト用ユーザーを作成
INSERT INTO user_profiles_secure (id, email, username, game_tag, points, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'test@test.com', 'testuser', 'TEST_USER', 500, NOW(), NOW()),
  (gen_random_uuid(), 'demo@example.com', 'demouser', 'DEMO_USER', 1000, NOW(), NOW()),
  (gen_random_uuid(), 'sample@sample.com', 'sampleuser', 'SAMPLE_USER', 200, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  points = EXCLUDED.points,
  updated_at = NOW();

-- 管理者アカウントのポイントを設定
UPDATE user_profiles_secure 
SET points = 10000, updated_at = NOW()
WHERE email = 'aoiroserver.m@gmail.com';

-- 確認用クエリ
SELECT email, username, points 
FROM user_profiles_secure 
WHERE email IN ('aoiroserver.m@gmail.com', 'test@test.com', 'demo@example.com', 'sample@sample.com')
ORDER BY email;

-- ========================================

-- Option 2: profilesテーブルが存在する場合
-- profilesテーブルにpointsカラムを追加
-- ALTER TABLE profiles 
-- ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- UPDATE profiles 
-- SET points = 0 
-- WHERE points IS NULL;

-- INSERT INTO profiles (id, email, username, points, created_at, updated_at)
-- VALUES 
--   (gen_random_uuid(), 'test@test.com', 'testuser', 500, NOW(), NOW()),
--   (gen_random_uuid(), 'demo@example.com', 'demouser', 1000, NOW(), NOW()),
--   (gen_random_uuid(), 'sample@sample.com', 'sampleuser', 200, NOW(), NOW())
-- ON CONFLICT (email) DO UPDATE SET
--   points = EXCLUDED.points,
--   updated_at = NOW();

-- ========================================

-- Option 3: テーブルが存在しない場合、新規作成
-- CREATE TABLE user_profiles_simple (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   email VARCHAR UNIQUE NOT NULL,
--   username VARCHAR,
--   game_tag VARCHAR,
--   points INTEGER DEFAULT 0,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- RLS有効化
-- ALTER TABLE user_profiles_simple ENABLE ROW LEVEL SECURITY;

-- -- 基本ポリシー
-- CREATE POLICY "Enable read access for all users" ON user_profiles_simple FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON user_profiles_simple FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for users based on email" ON user_profiles_simple FOR UPDATE USING (auth.email() = email);

-- -- テストデータ挿入
-- INSERT INTO user_profiles_simple (email, username, game_tag, points)
-- VALUES 
--   ('aoiroserver.m@gmail.com', 'AOIROSERVER', 'ADMIN', 10000),
--   ('test@test.com', 'testuser', 'TEST_USER', 500),
--   ('demo@example.com', 'demouser', 'DEMO_USER', 1000),
--   ('sample@sample.com', 'sampleuser', 'SAMPLE_USER', 200);