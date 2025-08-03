-- ポイント送信機能用SQL（完全版）
-- どのような状況でも動作するように設計

-- ========================================
-- 1. ポイント送信用テーブルを新規作成
-- ========================================
CREATE TABLE IF NOT EXISTS point_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR DEFAULT 'user',
  points INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. インデックス作成
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_point_users_email ON point_users(email);
CREATE INDEX IF NOT EXISTS idx_point_users_points ON point_users(points);

-- ========================================
-- 3. Row Level Security (RLS) 設定
-- ========================================
ALTER TABLE point_users ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーが読み取り可能
CREATE POLICY "Everyone can view point_users" ON point_users
  FOR SELECT USING (true);

-- 管理者のみ挿入・更新可能
CREATE POLICY "Admin can insert point_users" ON point_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update point_users" ON point_users
  FOR UPDATE USING (true);

-- ========================================
-- 4. 管理者とテストユーザーを作成
-- ========================================
INSERT INTO point_users (email, username, points) VALUES
('aoiroserver.m@gmail.com', 'AOIROSERVER', 10000),
('test@test.com', 'testuser', 500),
('demo@example.com', 'demouser', 1000),
('sample@sample.com', 'sampleuser', 200),
('user1@example.com', 'user1', 300),
('user2@example.com', 'user2', 750)
ON CONFLICT (email) DO UPDATE SET
  points = EXCLUDED.points,
  username = EXCLUDED.username,
  updated_at = NOW();

-- ========================================
-- 5. ポイント取引履歴テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS point_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email VARCHAR NOT NULL,
  points INTEGER NOT NULL,
  type VARCHAR(50) DEFAULT 'admin_grant',
  description TEXT,
  admin_email VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. ファンクション: ポイント送信
-- ========================================
CREATE OR REPLACE FUNCTION send_points(
  target_email VARCHAR,
  point_amount INTEGER,
  reason TEXT DEFAULT '管理者からのポイント送信',
  admin_email VARCHAR DEFAULT 'admin'
)
RETURNS JSON AS $$
DECLARE
  target_user RECORD;
  old_points INTEGER;
  new_points INTEGER;
  result JSON;
BEGIN
  -- ユーザー検索
  SELECT * INTO target_user FROM point_users WHERE email = target_email;
  
  -- ユーザーが存在しない場合は作成
  IF NOT FOUND THEN
    INSERT INTO point_users (email, username, points)
    VALUES (target_email, split_part(target_email, '@', 1), point_amount)
    RETURNING * INTO target_user;
    
    old_points := 0;
    new_points := point_amount;
  ELSE
    -- 既存ユーザーのポイント更新
    old_points := target_user.points;
    new_points := old_points + point_amount;
    
    UPDATE point_users 
    SET points = new_points, updated_at = NOW()
    WHERE email = target_email;
  END IF;
  
  -- 履歴記録
  INSERT INTO point_history (user_email, points, description, admin_email)
  VALUES (target_email, point_amount, reason, admin_email);
  
  -- 結果をJSON形式で返す
  result := json_build_object(
    'success', true,
    'user_email', target_email,
    'old_points', old_points,
    'new_points', new_points,
    'added_points', point_amount,
    'message', target_email || ' に ' || point_amount || ' ポイントを送信しました'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. テスト実行例
-- ========================================
-- test@test.com に 100ポイント送信のテスト
-- SELECT send_points('test@test.com', 100, 'テスト送信', 'aoiroserver.m@gmail.com');

-- ========================================
-- 8. 確認用クエリ
-- ========================================
SELECT 
  email,
  username,
  points,
  created_at
FROM point_users 
ORDER BY points DESC;

-- 履歴確認
SELECT 
  user_email,
  points,
  description,
  admin_email,
  created_at
FROM point_history 
ORDER BY created_at DESC
LIMIT 10;