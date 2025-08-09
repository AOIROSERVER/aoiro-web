-- ポイントショップシステム用SQL（完全版）
-- 包括的なショップシステムの構築

-- ========================================
-- 1. ショップアイテムマスターテーブル
-- ========================================
CREATE TABLE IF NOT EXISTS shop_items (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points INTEGER NOT NULL CHECK (points > 0),
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  rarity VARCHAR(50) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  gradient VARCHAR(500),
  glow_color VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  stock_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_shop_items_is_active ON shop_items(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_items_points ON shop_items(points);

-- RLS有効化
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能
CREATE POLICY "Everyone can view shop items" ON shop_items
  FOR SELECT USING (true);

-- 管理者のみ更新可能
CREATE POLICY "Admins can manage shop items" ON shop_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles_secure 
      WHERE user_profiles_secure.id = auth.uid() 
      AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = user_profiles_secure.id 
        AND auth.users.email = 'aoiroserver.m@gmail.com'
      )
    )
  );

-- ========================================
-- 2. ユーザーアイテム所有テーブル（改良版）
-- ========================================
CREATE TABLE IF NOT EXISTS user_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(255) REFERENCES shop_items(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON user_items(item_id);
CREATE INDEX IF NOT EXISTS idx_user_items_purchased_at ON user_items(purchased_at);
CREATE INDEX IF NOT EXISTS idx_user_items_is_active ON user_items(is_active);
CREATE INDEX IF NOT EXISTS idx_user_items_expires_at ON user_items(expires_at);

-- RLS有効化
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;

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
      AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = user_profiles_secure.id 
        AND auth.users.email = 'aoiroserver.m@gmail.com'
      )
    )
  );

-- ========================================
-- 3. ショップ購入履歴テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS shop_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(255) REFERENCES shop_items(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  purchase_type VARCHAR(50) DEFAULT 'shop_item',
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user_id ON shop_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_item_id ON shop_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_created_at ON shop_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_status ON shop_purchases(status);

-- RLS有効化
ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の購入履歴のみ閲覧可能
CREATE POLICY "Users can view their own purchases" ON shop_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の購入履歴を作成可能
CREATE POLICY "Users can create their own purchases" ON shop_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理者は全ての購入履歴を閲覧可能
CREATE POLICY "Admins can view all purchases" ON shop_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles_secure 
      WHERE user_profiles_secure.id = auth.uid() 
      AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = user_profiles_secure.id 
        AND auth.users.email = 'aoiroserver.m@gmail.com'
      )
    )
  );

-- ========================================
-- 4. デフォルトショップアイテムの挿入
-- ========================================
INSERT INTO shop_items (id, name, description, points, category, icon, rarity, gradient, glow_color) VALUES
('theme_dark', 'ダークテーマ', 'アプリをダークテーマに変更できます', 100, 'カスタマイズ', '🌙', 'common', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '#667eea'),
('theme_blue', 'ブルーテーマ', 'アプリをブルーテーマに変更できます', 150, 'カスタマイズ', '🔵', 'common', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', '#4facfe'),
('notification_priority', '優先通知', '通知を優先的に表示されます', 200, '機能', '🔔', 'rare', 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', '#fa709a'),
('custom_avatar', 'カスタムアバター', 'オリジナルのアバターを作成できます', 300, 'カスタマイズ', '👤', 'rare', 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', '#a8edea'),
('premium_support', 'プレミアムサポート', '24時間以内のサポートを受けられます', 500, 'サポート', '💎', 'epic', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '#667eea'),
('exclusive_badge', '限定バッジ', '特別なバッジを表示できます', 1000, '限定', '🏆', 'legendary', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', '#f093fb')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  points = EXCLUDED.points,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  rarity = EXCLUDED.rarity,
  gradient = EXCLUDED.gradient,
  glow_color = EXCLUDED.glow_color,
  updated_at = NOW();

-- ========================================
-- 5. 購入処理用ファンクション
-- ========================================
CREATE OR REPLACE FUNCTION purchase_shop_item(
  p_user_id UUID,
  p_item_id VARCHAR(255),
  p_points_spent INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_item shop_items%ROWTYPE;
  v_user_profile user_profiles_secure%ROWTYPE;
  v_purchase_id UUID;
  v_user_item_id UUID;
  v_points_before INTEGER;
  v_points_after INTEGER;
  v_result JSON;
BEGIN
  -- アイテム情報を取得
  SELECT * INTO v_item FROM shop_items WHERE id = p_item_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'アイテムが見つかりません');
  END IF;

  -- ユーザープロフィールを取得
  SELECT * INTO v_user_profile FROM user_profiles_secure WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'ユーザープロフィールが見つかりません');
  END IF;

  -- ポイントチェック
  v_points_before := COALESCE(v_user_profile.points, 0);
  IF v_points_before < p_points_spent THEN
    RETURN json_build_object('success', false, 'error', 'ポイントが不足しています');
  END IF;

  -- トランザクション開始
  BEGIN
    -- ユーザーのポイントを更新
    v_points_after := v_points_before - p_points_spent;
    UPDATE user_profiles_secure 
    SET points = v_points_after, updated_at = NOW()
    WHERE id = p_user_id;

    -- 購入履歴を記録
    INSERT INTO shop_purchases (
      user_id, item_id, item_name, points_spent, 
      points_before, points_after, purchase_type
    ) VALUES (
      p_user_id, p_item_id, v_item.name, p_points_spent,
      v_points_before, v_points_after, 'shop_item'
    ) RETURNING id INTO v_purchase_id;

    -- ユーザーアイテム所有を記録
    INSERT INTO user_items (
      user_id, item_id, item_name, points_spent
    ) VALUES (
      p_user_id, p_item_id, v_item.name, p_points_spent
    ) RETURNING id INTO v_user_item_id;

    -- 成功レスポンス
    v_result := json_build_object(
      'success', true,
      'message', v_item.name || 'を購入しました！',
      'purchase', json_build_object(
        'id', v_purchase_id,
        'itemId', p_item_id,
        'itemName', v_item.name,
        'pointsSpent', p_points_spent,
        'pointsBefore', v_points_before,
        'pointsAfter', v_points_after,
        'userItemId', v_user_item_id
      )
    );

    RETURN v_result;

  EXCEPTION WHEN OTHERS THEN
    -- エラーが発生した場合はロールバック
    RETURN json_build_object('success', false, 'error', '購入処理中にエラーが発生しました');
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. ユーザーアイテム取得用ファンクション
-- ========================================
CREATE OR REPLACE FUNCTION get_user_items(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  item_id VARCHAR(255),
  item_name VARCHAR(255),
  points_spent INTEGER,
  purchased_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  category VARCHAR(100),
  icon VARCHAR(10),
  rarity VARCHAR(50),
  gradient VARCHAR(500)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.item_id,
    ui.item_name,
    ui.points_spent,
    ui.purchased_at,
    ui.is_active,
    ui.expires_at,
    si.category,
    si.icon,
    si.rarity,
    si.gradient
  FROM user_items ui
  LEFT JOIN shop_items si ON ui.item_id = si.id
  WHERE ui.user_id = p_user_id
  ORDER BY ui.purchased_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. ショップ統計用ファンクション
-- ========================================
CREATE OR REPLACE FUNCTION get_shop_statistics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_items INTEGER;
  v_total_spent INTEGER;
  v_active_items INTEGER;
  v_rare_items INTEGER;
  v_epic_items INTEGER;
  v_legendary_items INTEGER;
  v_result JSON;
BEGIN
  -- 統計情報を取得
  SELECT 
    COUNT(*) as total_items,
    COALESCE(SUM(points_spent), 0) as total_spent,
    COUNT(*) FILTER (WHERE is_active = true) as active_items,
    COUNT(*) FILTER (WHERE si.rarity = 'rare') as rare_items,
    COUNT(*) FILTER (WHERE si.rarity = 'epic') as epic_items,
    COUNT(*) FILTER (WHERE si.rarity = 'legendary') as legendary_items
  INTO v_total_items, v_total_spent, v_active_items, v_rare_items, v_epic_items, v_legendary_items
  FROM user_items ui
  LEFT JOIN shop_items si ON ui.item_id = si.id
  WHERE ui.user_id = p_user_id;

  v_result := json_build_object(
    'totalItems', v_total_items,
    'totalSpent', v_total_spent,
    'activeItems', v_active_items,
    'rareItems', v_rare_items,
    'epicItems', v_epic_items,
    'legendaryItems', v_legendary_items
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. コメント
-- ========================================
COMMENT ON TABLE shop_items IS 'ショップアイテムマスターテーブル';
COMMENT ON TABLE user_items IS 'ユーザーアイテム所有テーブル';
COMMENT ON TABLE shop_purchases IS 'ショップ購入履歴テーブル';
COMMENT ON FUNCTION purchase_shop_item IS 'ショップアイテム購入処理';
COMMENT ON FUNCTION get_user_items IS 'ユーザーアイテム取得';
COMMENT ON FUNCTION get_shop_statistics IS 'ショップ統計情報取得';
