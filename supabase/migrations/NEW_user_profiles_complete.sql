-- 新しいユーザープロフィールテーブル（完全版）
-- 既存のテーブルとの競合を避けるため、新しいテーブルを作成

-- 1. 統一されたユーザープロフィールテーブルを作成
CREATE TABLE IF NOT EXISTS user_profiles_unified (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR,
  game_tag VARCHAR,
  points INTEGER DEFAULT 0 NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. インデックスの作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_unified_email ON user_profiles_unified(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_unified_points ON user_profiles_unified(points);

-- 3. Row Level Security (RLS) の有効化
ALTER TABLE user_profiles_unified ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシーの作成
-- ユーザーは自分のプロフィールのみアクセス可能
CREATE POLICY "Users can view own profile" ON user_profiles_unified
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles_unified
  FOR UPDATE USING (auth.uid() = id);

-- 管理者は全てのプロフィールにアクセス可能
CREATE POLICY "Admins can view all profiles" ON user_profiles_unified
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles_unified 
      WHERE user_profiles_unified.id = auth.uid() 
      AND user_profiles_unified.email = 'aoiroserver.m@gmail.com'
    )
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles_unified
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles_unified 
      WHERE user_profiles_unified.id = auth.uid() 
      AND user_profiles_unified.email = 'aoiroserver.m@gmail.com'
    )
  );

-- 管理者はプロフィールを作成可能
CREATE POLICY "Admins can create profiles" ON user_profiles_unified
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles_unified 
      WHERE user_profiles_unified.id = auth.uid() 
      AND user_profiles_unified.email = 'aoiroserver.m@gmail.com'
    ) OR auth.uid() = id
  );

-- 5. 既存データの移行（安全に実行）
-- 既存のuser_profilesテーブルからデータを移行
INSERT INTO user_profiles_unified (id, email, username, game_tag, points, created_at, updated_at)
SELECT 
  id, 
  email, 
  username, 
  game_tag, 
  COALESCE(points, 0) as points,
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(updated_at, NOW()) as updated_at
FROM user_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles_unified WHERE user_profiles_unified.id = user_profiles.id
)
ON CONFLICT (id) DO NOTHING;

-- 既存のuser_profiles_secureテーブルからデータを移行
INSERT INTO user_profiles_unified (id, email, username, game_tag, points, created_at, updated_at)
SELECT 
  id, 
  email, 
  username, 
  game_tag, 
  COALESCE(points, 0) as points,
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(updated_at, NOW()) as updated_at
FROM user_profiles_secure
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles_unified WHERE user_profiles_unified.id = user_profiles_secure.id
)
ON CONFLICT (id) DO NOTHING;

-- 6. 管理者アカウントの作成（Supabase Authに存在する場合）
-- 注意: 実際のUUIDは手動で確認して置き換えてください
INSERT INTO user_profiles_unified (id, email, username, game_tag, points, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'aoiroserver.m@gmail.com' LIMIT 1),
  'aoiroserver.m@gmail.com',
  'AOIROSERVER',
  'AOIROSERVER',
  10000,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  game_tag = EXCLUDED.game_tag,
  points = GREATEST(user_profiles_unified.points, EXCLUDED.points),
  updated_at = NOW();

-- 7. ポイント取引履歴テーブル（user_profiles_unifiedに対応）
CREATE TABLE IF NOT EXISTS point_transactions_unified (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('admin_grant', 'quest_reward', 'login_bonus', 'purchase', 'transfer')),
  description TEXT,
  admin_email VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_point_transactions_unified_user_id ON point_transactions_unified(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_unified_type ON point_transactions_unified(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_unified_created_at ON point_transactions_unified(created_at);

-- RLS
ALTER TABLE point_transactions_unified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON point_transactions_unified
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON point_transactions_unified
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles_unified 
      WHERE user_profiles_unified.id = auth.uid() 
      AND user_profiles_unified.email = 'aoiroserver.m@gmail.com'
    )
  );

CREATE POLICY "Admins can create transactions" ON point_transactions_unified
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles_unified 
      WHERE user_profiles_unified.id = auth.uid() 
      AND user_profiles_unified.email = 'aoiroserver.m@gmail.com'
    )
  );

-- 8. テスト用ユーザーデータの作成
INSERT INTO user_profiles_unified (id, email, username, game_tag, points, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'test@test.com', 'testuser', 'TEST_USER', 500, NOW(), NOW()),
  (gen_random_uuid(), 'demo@example.com', 'demouser', 'DEMO_USER', 1000, NOW(), NOW()),
  (gen_random_uuid(), 'sample@sample.com', 'sampleuser', 'SAMPLE_USER', 200, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  points = EXCLUDED.points,
  updated_at = NOW();

-- コメント
COMMENT ON TABLE user_profiles_unified IS '統一されたユーザープロフィールテーブル（ポイント送信機能対応）';
COMMENT ON COLUMN user_profiles_unified.points IS 'ユーザーの所有ポイント数';
COMMENT ON COLUMN user_profiles_unified.email IS 'ユーザーのメールアドレス（一意）';
COMMENT ON TABLE point_transactions_unified IS 'ポイント取引履歴テーブル（統一版）';