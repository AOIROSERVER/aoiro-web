
-- ユーザープロフィールテーブルの作成
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  game_tag TEXT UNIQUE NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ログインボーナステーブルの作成
CREATE TABLE IF NOT EXISTS login_bonus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  received BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS（Row Level Security）の設定
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_bonus ENABLE ROW LEVEL SECURITY;

-- user_profilesテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- login_bonusテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own login bonus" ON login_bonus;
CREATE POLICY "Users can view own login bonus" ON login_bonus
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own login bonus" ON login_bonus;
CREATE POLICY "Users can insert own login bonus" ON login_bonus
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_login_bonus_user_id ON login_bonus(user_id);
CREATE INDEX IF NOT EXISTS idx_login_bonus_date ON login_bonus(date);
CREATE INDEX IF NOT EXISTS idx_login_bonus_user_date ON login_bonus(user_id, date);
