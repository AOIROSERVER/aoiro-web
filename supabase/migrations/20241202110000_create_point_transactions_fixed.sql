-- ポイント取引履歴テーブルの作成（修正版）
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('admin_grant', 'quest_reward', 'login_bonus', 'purchase', 'transfer')),
  description TEXT,
  admin_email VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_point_transactions_admin_email ON point_transactions(admin_email);

-- Row Level Security (RLS) の有効化
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- ユーザーは自分のポイント履歴のみ閲覧可能
CREATE POLICY "Users can view their own point transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 管理者は全ての履歴を閲覧可能
CREATE POLICY "Admins can view all point transactions" ON point_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles_secure 
      WHERE user_profiles_secure.id = auth.uid() 
      AND user_profiles_secure.email = 'aoiroserver.m@gmail.com'
    )
  );

-- 管理者はポイント履歴を作成可能
CREATE POLICY "Admins can create point transactions" ON point_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles_secure 
      WHERE user_profiles_secure.id = auth.uid() 
      AND user_profiles_secure.email = 'aoiroserver.m@gmail.com'
    )
  );

-- コメント
COMMENT ON TABLE point_transactions IS 'ユーザーのポイント取引履歴を記録するテーブル';
COMMENT ON COLUMN point_transactions.user_id IS '対象ユーザーのID';
COMMENT ON COLUMN point_transactions.points IS '変動ポイント数（正の値は増加、負の値は減少）';
COMMENT ON COLUMN point_transactions.type IS '取引タイプ（admin_grant: 管理者付与, quest_reward: クエスト報酬, login_bonus: ログインボーナス, purchase: 購入, transfer: 送金）';
COMMENT ON COLUMN point_transactions.description IS '取引の説明';
COMMENT ON COLUMN point_transactions.admin_email IS '管理者による操作の場合の管理者メールアドレス';
COMMENT ON COLUMN point_transactions.metadata IS '追加のメタデータ（JSON形式）';