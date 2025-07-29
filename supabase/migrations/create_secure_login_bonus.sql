-- セキュアなログインボーナスシステムのための新しいテーブル構造

-- 1. ユーザープロフィールテーブル（既存のテーブルを改善）
CREATE TABLE IF NOT EXISTS user_profiles_secure (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  game_tag TEXT UNIQUE NOT NULL,
  points INTEGER DEFAULT 0,
  total_bonus_received INTEGER DEFAULT 0,
  last_bonus_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ログインボーナス履歴テーブル（詳細な履歴を保持）
CREATE TABLE IF NOT EXISTS login_bonus_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bonus_date DATE NOT NULL,
  bonus_amount INTEGER DEFAULT 100,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  UNIQUE(user_id, bonus_date)
);

-- 3. ボーナス設定テーブル（システム設定）
CREATE TABLE IF NOT EXISTS bonus_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ボーナス制限テーブル（ユーザーごとの制限管理）
CREATE TABLE IF NOT EXISTS bonus_restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('daily', 'weekly', 'monthly')),
  restriction_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, restriction_type, restriction_date)
);

-- RLS（Row Level Security）の設定
ALTER TABLE user_profiles_secure ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_bonus_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_restrictions ENABLE ROW LEVEL SECURITY;

-- user_profiles_secureテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own profile secure" ON user_profiles_secure;
CREATE POLICY "Users can view own profile secure" ON user_profiles_secure
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile secure" ON user_profiles_secure;
CREATE POLICY "Users can update own profile secure" ON user_profiles_secure
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile secure" ON user_profiles_secure;
CREATE POLICY "Users can insert own profile secure" ON user_profiles_secure
  FOR INSERT WITH CHECK (auth.uid() = id);

-- login_bonus_historyテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own bonus history" ON login_bonus_history;
CREATE POLICY "Users can view own bonus history" ON login_bonus_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bonus history" ON login_bonus_history;
CREATE POLICY "Users can insert own bonus history" ON login_bonus_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- bonus_settingsテーブルのポリシー（管理者のみ）
DROP POLICY IF EXISTS "Admin can manage bonus settings" ON bonus_settings;
CREATE POLICY "Admin can manage bonus settings" ON bonus_settings
  FOR ALL USING (auth.jwt() ->> 'email' = 'aoiroserver.m@gmail.com');

-- bonus_restrictionsテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own restrictions" ON bonus_restrictions;
CREATE POLICY "Users can view own restrictions" ON bonus_restrictions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage restrictions" ON bonus_restrictions;
CREATE POLICY "Admin can manage restrictions" ON bonus_restrictions
  FOR ALL USING (auth.jwt() ->> 'email' = 'aoiroserver.m@gmail.com');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_profiles_secure_id ON user_profiles_secure(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_secure_points ON user_profiles_secure(points);
CREATE INDEX IF NOT EXISTS idx_login_bonus_history_user_id ON login_bonus_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_bonus_history_date ON login_bonus_history(bonus_date);
CREATE INDEX IF NOT EXISTS idx_login_bonus_history_user_date ON login_bonus_history(user_id, bonus_date);
CREATE INDEX IF NOT EXISTS idx_bonus_restrictions_user_id ON bonus_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_restrictions_date ON bonus_restrictions(restriction_date);

-- 初期設定データの挿入
INSERT INTO bonus_settings (setting_key, setting_value, description) VALUES
('daily_bonus_amount', '100', '1日あたりのボーナス金額'),
('max_daily_bonus', '1', '1日あたりの最大ボーナス回数'),
('bonus_start_time', '00:00:00', 'ボーナス開始時刻'),
('bonus_end_time', '23:59:59', 'ボーナス終了時刻')
ON CONFLICT (setting_key) DO NOTHING;

-- 関数の作成：ボーナス取得チェック
CREATE OR REPLACE FUNCTION check_bonus_eligibility(user_uuid UUID, check_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  can_claim BOOLEAN,
  reason TEXT,
  current_points INTEGER,
  total_bonus_received INTEGER,
  last_bonus_date DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH user_profile AS (
    SELECT 
      up.points,
      up.total_bonus_received,
      up.last_bonus_date
    FROM user_profiles_secure up
    WHERE up.id = user_uuid
  ),
  today_bonus AS (
    SELECT COUNT(*) as claimed_today
    FROM login_bonus_history lbh
    WHERE lbh.user_id = user_uuid 
    AND lbh.bonus_date = check_date
  ),
  restrictions AS (
    SELECT COUNT(*) as has_restriction
    FROM bonus_restrictions br
    WHERE br.user_id = user_uuid 
    AND br.restriction_type = 'daily'
    AND br.restriction_date = check_date
    AND br.is_active = true
  )
  SELECT 
    CASE 
      WHEN r.has_restriction > 0 THEN false
      WHEN tb.claimed_today > 0 THEN false
      ELSE true
    END as can_claim,
    CASE 
      WHEN r.has_restriction > 0 THEN '制限によりボーナスを取得できません'
      WHEN tb.claimed_today > 0 THEN '本日は既にボーナスを取得済みです'
      ELSE 'ボーナスを取得できます'
    END as reason,
    COALESCE(up.points, 0) as current_points,
    COALESCE(up.total_bonus_received, 0) as total_bonus_received,
    up.last_bonus_date
  FROM user_profile up
  CROSS JOIN today_bonus tb
  CROSS JOIN restrictions r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の作成：ボーナス付与
CREATE OR REPLACE FUNCTION claim_daily_bonus(
  user_uuid UUID, 
  bonus_amount INTEGER DEFAULT 100,
  user_ip TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  session_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_points INTEGER,
  total_bonus_received INTEGER
) AS $$
DECLARE
  check_result RECORD;
  new_points INTEGER;
  new_total_bonus INTEGER;
BEGIN
  -- ボーナス取得資格をチェック
  SELECT * INTO check_result
  FROM check_bonus_eligibility(user_uuid, CURRENT_DATE);
  
  IF NOT check_result.can_claim THEN
    RETURN QUERY SELECT false, check_result.reason, check_result.current_points, check_result.total_bonus_received;
    RETURN;
  END IF;
  
  -- トランザクション開始
  BEGIN
    -- ボーナス履歴を記録
    INSERT INTO login_bonus_history (
      user_id, 
      bonus_date, 
      bonus_amount, 
      ip_address, 
      user_agent, 
      session_id
    ) VALUES (
      user_uuid, 
      CURRENT_DATE, 
      bonus_amount, 
      user_ip, 
      user_agent, 
      session_id
    );
    
    -- ユーザープロフィールを更新
    INSERT INTO user_profiles_secure (id, username, game_tag, points, total_bonus_received, last_bonus_date)
    VALUES (
      user_uuid,
      'user_' || user_uuid::text,
      'user_' || user_uuid::text,
      bonus_amount,
      1,
      CURRENT_DATE
    )
    ON CONFLICT (id) DO UPDATE SET
      points = user_profiles_secure.points + bonus_amount,
      total_bonus_received = user_profiles_secure.total_bonus_received + 1,
      last_bonus_date = CURRENT_DATE,
      updated_at = NOW();
    
    -- 更新後の値を取得
    SELECT points, total_bonus_received INTO new_points, new_total_bonus
    FROM user_profiles_secure
    WHERE id = user_uuid;
    
    RETURN QUERY SELECT true, 'ボーナスを正常に付与しました', new_points, new_total_bonus;
    
  EXCEPTION WHEN OTHERS THEN
    -- エラーが発生した場合はロールバック
    RETURN QUERY SELECT false, 'ボーナス付与中にエラーが発生しました: ' || SQLERRM, 0, 0;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ビューの作成：ボーナス統計
CREATE OR REPLACE VIEW bonus_statistics AS
SELECT 
  up.id as user_id,
  up.username,
  up.points,
  up.total_bonus_received,
  up.last_bonus_date,
  COUNT(lbh.id) as total_claims,
  MAX(lbh.claimed_at) as last_claim_time
FROM user_profiles_secure up
LEFT JOIN login_bonus_history lbh ON up.id = lbh.user_id
GROUP BY up.id, up.username, up.points, up.total_bonus_received, up.last_bonus_date;

-- トリガーの作成：updated_atの自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_secure_updated_at
  BEFORE UPDATE ON user_profiles_secure
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonus_settings_updated_at
  BEFORE UPDATE ON bonus_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 既存データの移行（オプション）
-- 既存のuser_profilesテーブルからデータを移行（安全な方法）
DO $$
BEGIN
  -- user_profilesテーブルが存在する場合のみ移行を実行
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    INSERT INTO user_profiles_secure (id, username, game_tag, points)
    SELECT id, username, game_tag, COALESCE(points, 0)
    FROM user_profiles
    ON CONFLICT (id) DO UPDATE SET
      points = EXCLUDED.points,
      updated_at = NOW();
    
    RAISE NOTICE 'user_profilesテーブルからのデータ移行が完了しました';
  ELSE
    RAISE NOTICE 'user_profilesテーブルが存在しないため、移行をスキップしました';
  END IF;
END $$;

-- 既存のlogin_bonusテーブルからデータを移行（安全な方法）
DO $$
BEGIN
  -- login_bonusテーブルが存在する場合のみ移行を実行
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'login_bonus') THEN
    INSERT INTO login_bonus_history (user_id, bonus_date, bonus_amount, claimed_at)
    SELECT user_id, date, 100, NOW()
    FROM login_bonus
    WHERE received = true
    ON CONFLICT (user_id, bonus_date) DO NOTHING;
    
    RAISE NOTICE 'login_bonusテーブルからのデータ移行が完了しました';
  ELSE
    RAISE NOTICE 'login_bonusテーブルが存在しないため、移行をスキップしました';
  END IF;
END $$; 