-- ユーザーアイテム所有テーブルの作成
CREATE TABLE IF NOT EXISTS user_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_spent INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON user_items(item_id);
CREATE INDEX IF NOT EXISTS idx_user_items_purchased_at ON user_items(purchased_at);
CREATE INDEX IF NOT EXISTS idx_user_items_is_active ON user_items(is_active);

-- Row Level Security (RLS) の有効化
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- ユーザーは自分のアイテムのみ閲覧可能
CREATE POLICY "Users can view their own items" ON user_items
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のアイテムを作成可能
CREATE POLICY "Users can create their own items" ON user_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のアイテムを更新可能
CREATE POLICY "Users can update their own items" ON user_items
  FOR UPDATE USING (auth.uid() = user_id);

-- 管理者は全てのアイテムを閲覧可能
CREATE POLICY "Admins can view all items" ON user_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles_secure 
      WHERE user_profiles_secure.id = auth.uid() 
      AND user_profiles_secure.email = 'aoiroserver.m@gmail.com'
    )
  );

-- コメント
COMMENT ON TABLE user_items IS 'ユーザーが購入したアイテムの所有情報';
COMMENT ON COLUMN user_items.user_id IS 'ユーザーID';
COMMENT ON COLUMN user_items.item_id IS 'アイテムID';
COMMENT ON COLUMN user_items.item_name IS 'アイテム名';
COMMENT ON COLUMN user_items.purchased_at IS '購入日時';
COMMENT ON COLUMN user_items.points_spent IS '消費したポイント数';
COMMENT ON COLUMN user_items.is_active IS 'アイテムが有効かどうか';
COMMENT ON COLUMN user_items.metadata IS '追加のメタデータ';
