-- =====================================================
-- 社員証明書アクセス管理システム - 完全版
-- =====================================================

-- 既存のテーブルを削除（存在する場合）
DROP TABLE IF EXISTS access_change_history CASCADE;
DROP TABLE IF EXISTS employee_access_logs CASCADE;
DROP TABLE IF EXISTS authorized_employee_access CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 既存のビューを削除（存在する場合）
DROP VIEW IF EXISTS active_employee_access CASCADE;
DROP VIEW IF EXISTS department_user_count CASCADE;
DROP VIEW IF EXISTS access_statistics CASCADE;

-- 1. 許可された社員証明書アクセスユーザーのメインテーブル
CREATE TABLE IF NOT EXISTS authorized_employee_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- SupabaseのユーザーID（オプション）
  user_email TEXT NOT NULL UNIQUE, -- メールアドレス（必須・一意）
  user_name TEXT NOT NULL, -- ユーザーの表示名（必須）
  employee_id TEXT, -- 社員番号
  department TEXT NOT NULL, -- 部署名（必須）
  position TEXT NOT NULL, -- 役職（必須）
  access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'admin', 'manager')), -- アクセスレベル
  is_active BOOLEAN DEFAULT true, -- アクセス権限の有効/無効
  granted_by UUID, -- 権限を付与した管理者のID
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 権限付与日時
  expires_at TIMESTAMP WITH TIME ZONE, -- 権限の有効期限（NULL = 無期限）
  last_access_at TIMESTAMP WITH TIME ZONE, -- 最後のアクセス日時
  access_count INTEGER DEFAULT 0, -- アクセス回数
  notes TEXT, -- 備考・メモ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- レコード更新日時
);

-- 2. 部署マスターテーブル
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_code TEXT UNIQUE NOT NULL, -- 部署コード
  department_name TEXT NOT NULL, -- 部署名
  parent_department_id UUID REFERENCES departments(id), -- 親部署ID（階層構造用）
  is_active BOOLEAN DEFAULT true, -- 部署の有効/無効
  display_order INTEGER DEFAULT 0, -- 表示順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 役職マスターテーブル
CREATE TABLE IF NOT EXISTS positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position_code TEXT UNIQUE NOT NULL, -- 役職コード
  position_name TEXT NOT NULL, -- 役職名
  level INTEGER DEFAULT 0, -- 役職レベル（数値が大きいほど上位）
  is_active BOOLEAN DEFAULT true, -- 役職の有効/無効
  display_order INTEGER DEFAULT 0, -- 表示順序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. アクセスログテーブル
CREATE TABLE IF NOT EXISTS employee_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- ユーザーID
  user_email TEXT NOT NULL, -- メールアドレス
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'print')), -- アクセス種別
  access_result TEXT NOT NULL CHECK (access_result IN ('success', 'denied', 'expired', 'inactive')), -- アクセス結果
  ip_address INET, -- IPアドレス
  user_agent TEXT, -- ユーザーエージェント
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- アクセス日時
  session_id TEXT, -- セッションID
  error_message TEXT -- エラーメッセージ（アクセス拒否時）
);

-- 5. 権限変更履歴テーブル
CREATE TABLE IF NOT EXISTS access_change_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID, -- 変更対象ユーザーID
  target_user_email TEXT NOT NULL, -- 変更対象メールアドレス
  change_type TEXT NOT NULL CHECK (change_type IN ('grant', 'revoke', 'modify', 'activate', 'deactivate')), -- 変更種別
  old_values JSONB, -- 変更前の値
  new_values JSONB, -- 変更後の値
  changed_by UUID, -- 変更者ID
  changed_by_email TEXT NOT NULL, -- 変更者メールアドレス
  change_reason TEXT, -- 変更理由
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 変更日時
);

-- =====================================================
-- インデックスの作成
-- =====================================================

-- メインテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_user_id ON authorized_employee_access(user_id);
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_user_email ON authorized_employee_access(user_email);
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_is_active ON authorized_employee_access(is_active);
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_department ON authorized_employee_access(department);
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_position ON authorized_employee_access(position);
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_access_level ON authorized_employee_access(access_level);
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_expires_at ON authorized_employee_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_authorized_employee_access_granted_at ON authorized_employee_access(granted_at);

-- 部署・役職テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_departments_department_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_positions_position_code ON positions(position_code);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(is_active);

-- ログ・履歴テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_employee_access_logs_user_email ON employee_access_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_employee_access_logs_access_type ON employee_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_employee_access_logs_accessed_at ON employee_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_access_change_history_target_user_email ON access_change_history(target_user_email);
CREATE INDEX IF NOT EXISTS idx_access_change_history_changed_at ON access_change_history(changed_at);

-- =====================================================
-- 制約の追加
-- =====================================================

-- メインテーブルの制約
ALTER TABLE authorized_employee_access 
  ADD CONSTRAINT chk_user_id_or_email 
  CHECK (user_id IS NOT NULL OR user_email IS NOT NULL);

ALTER TABLE authorized_employee_access 
  ADD CONSTRAINT chk_expires_at_future 
  CHECK (expires_at IS NULL OR expires_at > NOW());

-- 部署テーブルの制約
ALTER TABLE departments 
  ADD CONSTRAINT chk_department_code_format 
  CHECK (department_code ~ '^[A-Z0-9]{2,10}$');

-- 役職テーブルの制約
ALTER TABLE positions 
  ADD CONSTRAINT chk_position_level_positive 
  CHECK (level >= 0);

-- =====================================================
-- トリガー関数とトリガーの作成
-- =====================================================

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS update_authorized_employee_access_updated_at ON authorized_employee_access;
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
DROP TRIGGER IF EXISTS log_employee_access_trigger ON employee_access_logs;
DROP TRIGGER IF EXISTS log_access_changes_trigger ON authorized_employee_access;

-- 既存のトリガー関数を削除（存在する場合）
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_employee_access() CASCADE;
DROP FUNCTION IF EXISTS log_access_changes() CASCADE;

-- 更新時のタイムスタンプを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- アクセスログを自動記録するトリガー関数
CREATE OR REPLACE FUNCTION log_employee_access()
RETURNS TRIGGER AS $$
BEGIN
  -- アクセス成功時のみログを記録
  IF NEW.access_result = 'success' THEN
    INSERT INTO employee_access_logs (
      user_id, user_email, access_type, access_result, 
      accessed_at, session_id
    ) VALUES (
      NEW.user_id, NEW.user_email, 'view', 'success', 
      NOW(), gen_random_uuid()::text
    );
    
    -- アクセス回数を更新
    UPDATE authorized_employee_access 
    SET access_count = access_count + 1, 
        last_access_at = NOW()
    WHERE user_email = NEW.user_email;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 権限変更履歴を自動記録するトリガー関数
CREATE OR REPLACE FUNCTION log_access_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規作成時
  IF TG_OP = 'INSERT' THEN
    INSERT INTO access_change_history (
      target_user_id, target_user_email, change_type, 
      new_values, changed_by_email
    ) VALUES (
      NEW.user_id, NEW.user_email, 'grant', 
      to_jsonb(NEW), COALESCE(NEW.granted_by::text, 'system')
    );
  END IF;
  
  -- 更新時
  IF TG_OP = 'UPDATE' THEN
    -- 重要な変更のみ記録
    IF OLD.is_active != NEW.is_active OR 
       OLD.department != NEW.department OR 
       OLD.position != NEW.position OR 
       OLD.access_level != NEW.access_level THEN
      
      INSERT INTO access_change_history (
        target_user_id, target_user_email, change_type, 
        old_values, new_values, changed_by_email
      ) VALUES (
        NEW.user_id, NEW.user_email, 'modify', 
        to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.granted_by::text, 'system')
      );
    END IF;
  END IF;
  
  -- 削除時
  IF TG_OP = 'DELETE' THEN
    INSERT INTO access_change_history (
      target_user_id, target_user_email, change_type, 
      old_values, changed_by_email
    ) VALUES (
      OLD.user_id, OLD.user_email, 'revoke', 
      to_jsonb(OLD), 'system'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_authorized_employee_access_updated_at
  BEFORE UPDATE ON authorized_employee_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER log_employee_access_trigger
  AFTER INSERT ON employee_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION log_employee_access();

CREATE TRIGGER log_access_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON authorized_employee_access
  FOR EACH ROW
  EXECUTE FUNCTION log_access_changes();

-- =====================================================
-- ビューの作成
-- =====================================================

-- 有効なユーザーの一覧ビュー
CREATE OR REPLACE VIEW active_employee_access AS
SELECT 
  aea.id,
  aea.user_id,
  aea.user_email,
  aea.user_name,
  aea.employee_id,
  aea.department,
  aea.position,
  aea.access_level,
  aea.granted_at,
  aea.expires_at,
  aea.last_access_at,
  aea.access_count,
  aea.notes,
  CASE 
    WHEN aea.expires_at IS NULL THEN '無期限'
    WHEN aea.expires_at > NOW() THEN '有効'
    ELSE '期限切れ'
  END as status,
  CASE 
    WHEN aea.expires_at IS NULL THEN NULL
    ELSE aea.expires_at - NOW()
  END as days_until_expiry
FROM authorized_employee_access aea
WHERE aea.is_active = true;

-- 部署別ユーザー数ビュー
CREATE OR REPLACE VIEW department_user_count AS
SELECT 
  department,
  COUNT(*) as user_count,
  COUNT(CASE WHEN access_level = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN access_level = 'manager' THEN 1 END) as manager_count,
  COUNT(CASE WHEN access_level = 'basic' THEN 1 END) as basic_count
FROM authorized_employee_access
WHERE is_active = true
GROUP BY department
ORDER BY user_count DESC;

-- アクセス統計ビュー
CREATE OR REPLACE VIEW access_statistics AS
SELECT 
  DATE_TRUNC('day', accessed_at) as access_date,
  COUNT(*) as total_access,
  COUNT(CASE WHEN access_result = 'success' THEN 1 END) as successful_access,
  COUNT(CASE WHEN access_result = 'denied' THEN 1 END) as denied_access,
  COUNT(DISTINCT user_email) as unique_users
FROM employee_access_logs
WHERE accessed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', accessed_at)
ORDER BY access_date DESC;

-- =====================================================
-- サンプルデータの挿入
-- =====================================================

-- 部署マスターデータ
INSERT INTO departments (department_code, department_name, display_order) VALUES
('DEV', '開発部', 1),
('SALES', '営業部', 2),
('HR', '人事部', 3),
('ACCT', '経理部', 4),
('IT', 'IT部', 5)
ON CONFLICT (department_code) DO NOTHING;

-- 役職マスターデータ
INSERT INTO positions (position_code, position_name, level, display_order) VALUES
('INTERN', 'インターン', 1, 1),
('STAFF', 'スタッフ', 2, 2),
('SENIOR', 'シニア', 3, 3),
('LEAD', 'リーダー', 4, 4),
('MANAGER', 'マネージャー', 5, 5),
('DIRECTOR', 'ディレクター', 6, 6),
('VP', '副社長', 7, 7),
('CEO', '社長', 8, 8)
ON CONFLICT (position_code) DO NOTHING;

-- サンプルユーザーデータ（運営が手動で管理）
-- INSERT INTO authorized_employee_access (
--   user_email, user_name, employee_id, department, position, access_level, notes
-- ) VALUES 
--   ('admin@aoiroserver.com', '管理者太郎', 'EMP001', 'IT', 'マネージャー', 'admin', 'システム管理者'),
--   ('dev1@aoiroserver.com', '開発者花子', 'EMP002', '開発部', 'シニア', 'basic', 'メイン開発者'),
--   ('sales1@aoiroserver.com', '営業者次郎', 'EMP003', '営業部', 'リーダー', 'manager', '営業チームリーダー');

-- =====================================================
-- RLS（Row Level Security）の設定
-- =====================================================

-- メインテーブルのRLS設定
ALTER TABLE authorized_employee_access ENABLE ROW LEVEL SECURITY;

-- 管理者のみが全データにアクセス可能
CREATE POLICY "管理者は全データにアクセス可能" ON authorized_employee_access
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE email = 'aoiroserver.m@gmail.com'
    )
  );

-- 一般ユーザーは自分のデータのみ読み取り可能
CREATE POLICY "ユーザーは自分のデータのみ読み取り可能" ON authorized_employee_access
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'email' = user_email
  );

-- 部署・役職テーブルのRLS設定
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- 部署・役職は全ユーザーが読み取り可能
CREATE POLICY "部署・役職は全ユーザーが読み取り可能" ON departments
  FOR SELECT USING (true);

CREATE POLICY "役職は全ユーザーが読み取り可能" ON positions
  FOR SELECT USING (true);

-- ログ・履歴テーブルのRLS設定
ALTER TABLE employee_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_change_history ENABLE ROW LEVEL SECURITY;

-- 管理者のみがログ・履歴にアクセス可能
CREATE POLICY "管理者のみがログ・履歴にアクセス可能" ON employee_access_logs
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE email = 'aoiroserver.m@gmail.com'
    )
  );

CREATE POLICY "管理者のみが変更履歴にアクセス可能" ON access_change_history
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE email = 'aoiroserver.m@gmail.com'
    )
  );

-- =====================================================
-- コメントの追加
-- =====================================================

COMMENT ON TABLE authorized_employee_access IS '社員証明書へのアクセス権限を持つユーザーのリスト';
COMMENT ON TABLE departments IS '部署マスターテーブル';
COMMENT ON TABLE positions IS '役職マスターテーブル';
COMMENT ON TABLE employee_access_logs IS '社員証明書アクセスログ';
COMMENT ON TABLE access_change_history IS 'アクセス権限変更履歴';

COMMENT ON VIEW active_employee_access IS '有効なユーザーの一覧ビュー';
COMMENT ON VIEW department_user_count IS '部署別ユーザー数ビュー';
COMMENT ON VIEW access_statistics IS 'アクセス統計ビュー';

-- =====================================================
-- 完了メッセージ
-- =====================================================

-- このSQLファイルの実行が完了しました
-- 社員証明書アクセス管理システムの基盤が構築されました
