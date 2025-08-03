-- 不足している可能性のあるテーブルを作成するSQLスクリプト
-- 2024-12-03: 運行状況、道路状況、クエスト関連テーブルの作成

-- 1. 運行状況テーブル
CREATE TABLE IF NOT EXISTS train_status (
  id SERIAL PRIMARY KEY,
  line_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT '平常運転',
  section VARCHAR(200),
  detail TEXT,
  color VARCHAR(7) DEFAULT '#000000',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 運行状況テーブルのRLSポリシー
ALTER TABLE train_status ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "train_status_select_policy" ON train_status
  FOR SELECT USING (true);

-- 管理者のみが更新可能
CREATE POLICY "train_status_update_policy" ON train_status
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 管理者のみが挿入可能
CREATE POLICY "train_status_insert_policy" ON train_status
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. 道路状況テーブル
CREATE TABLE IF NOT EXISTS road_statuses (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT '正常',
  congestion INTEGER DEFAULT 0,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 道路状況テーブルのRLSポリシー
ALTER TABLE road_statuses ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "road_statuses_select_policy" ON road_statuses
  FOR SELECT USING (true);

-- 管理者のみが更新可能
CREATE POLICY "road_statuses_update_policy" ON road_statuses
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 管理者のみが挿入可能
CREATE POLICY "road_statuses_insert_policy" ON road_statuses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. クエストテーブル（既存の場合はスキップ）
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200),
  description TEXT NOT NULL,
  detailed_description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('daily', 'weekly', 'special')),
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  reward VARCHAR(100) NOT NULL,
  estimated_time VARCHAR(50),
  icon VARCHAR(50) DEFAULT 'assignment',
  background_image TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クエストテーブルのRLSポリシー
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "quests_select_policy" ON quests
  FOR SELECT USING (true);

-- 管理者のみが更新・挿入可能
CREATE POLICY "quests_insert_policy" ON quests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "quests_update_policy" ON quests
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. クエストタスクテーブル
CREATE TABLE IF NOT EXISTS quest_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クエストタスクテーブルのRLSポリシー
ALTER TABLE quest_tasks ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "quest_tasks_select_policy" ON quest_tasks
  FOR SELECT USING (true);

-- 管理者のみが更新・挿入可能
CREATE POLICY "quest_tasks_insert_policy" ON quest_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "quest_tasks_update_policy" ON quest_tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. 匿名メール通知設定テーブル
CREATE TABLE IF NOT EXISTS anonymous_email_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  train_notifications BOOLEAN DEFAULT true,
  road_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 匿名メール通知設定テーブルのRLSポリシー
ALTER TABLE anonymous_email_notification_settings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り・更新可能
CREATE POLICY "anonymous_email_notification_settings_select_policy" ON anonymous_email_notification_settings
  FOR SELECT USING (true);

CREATE POLICY "anonymous_email_notification_settings_insert_policy" ON anonymous_email_notification_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anonymous_email_notification_settings_update_policy" ON anonymous_email_notification_settings
  FOR UPDATE USING (true);

-- 6. 通知トークンテーブル
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  device_type VARCHAR(20) DEFAULT 'web',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知トークンテーブルのRLSポリシー
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のトークンのみアクセス可能
CREATE POLICY "notification_tokens_select_policy" ON notification_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_tokens_insert_policy" ON notification_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_tokens_update_policy" ON notification_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. 初期データの挿入

-- 運行状況の初期データ
INSERT INTO train_status (line_id, name, status, color) VALUES
('CA', '中央線', '平常運転', '#00bb86'),
('H', '日比谷線', '平常運転', '#b5b5ac'),
('G', '銀座線', '平常運転', '#f39700'),
('AK', 'あきが丘線', '平常運転', '#e37e40'),
('AU', 'あおうみ線', '平常運転', '#15206b')
ON CONFLICT (line_id) DO NOTHING;

-- 道路状況の初期データ
INSERT INTO road_statuses (id, name, status, congestion) VALUES
('C1_INNER', '首都高速1号線（内回り）', '正常', 0),
('C1_OUTER', '首都高速1号線（外回り）', '正常', 0),
('C2_INNER', '首都高速2号線（内回り）', '正常', 0),
('C2_OUTER', '首都高速2号線（外回り）', '正常', 0),
('YE', '横浜横須賀道路', '正常', 0),
('KK', '川崎横浜道路', '正常', 0)
ON CONFLICT (id) DO NOTHING;

-- サンプルクエストの挿入
INSERT INTO quests (title, description, category, difficulty, reward, icon, is_active) VALUES
('🚀 初回ログイン', 'AOIROSERVERに初回ログインして、アプリの世界に参加しましょう！', 'special', 'easy', '100ポイント', 'login', true),
('📱 プロフィール設定', 'プロフィール情報を設定して、他のユーザーと交流しましょう', 'daily', 'easy', '50ポイント', 'profile', true),
('🔔 通知設定', 'プッシュ通知を有効にして、最新情報を受け取りましょう', 'daily', 'easy', '30ポイント', 'notification', true)
ON CONFLICT DO NOTHING;

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_train_status_line_id ON train_status(line_id);
CREATE INDEX IF NOT EXISTS idx_road_statuses_id ON road_statuses(id);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active);
CREATE INDEX IF NOT EXISTS idx_quest_tasks_quest_id ON quest_tasks(quest_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);

-- 完了メッセージ
SELECT 'テーブル作成完了' as status; 