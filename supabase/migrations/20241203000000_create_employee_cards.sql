-- 社員証明書テーブルの作成
CREATE TABLE IF NOT EXISTS employee_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    employee_number VARCHAR(20) NOT NULL,
    card_number VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- テーブルコメントの追加
COMMENT ON TABLE employee_cards IS '社員証明書情報を格納するテーブル';
COMMENT ON COLUMN employee_cards.user_id IS 'ユーザーID（base64エンコードされたメールアドレス）';
COMMENT ON COLUMN employee_cards.user_email IS 'ユーザーのメールアドレス';
COMMENT ON COLUMN employee_cards.section_name IS 'セクション名（例：開発セクション、営業セクション）';
COMMENT ON COLUMN employee_cards.employee_number IS '社員番号（例：EMP001）';
COMMENT ON COLUMN employee_cards.card_number IS 'カード番号（例：1234 5678 9012 3456）';
COMMENT ON COLUMN employee_cards.issue_date IS '発行日';
COMMENT ON COLUMN employee_cards.expiry_date IS '有効期限';
COMMENT ON COLUMN employee_cards.is_active IS '有効フラグ';

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_employee_cards_user_id ON employee_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_cards_user_email ON employee_cards(user_email);
CREATE INDEX IF NOT EXISTS idx_employee_cards_employee_number ON employee_cards(employee_number);
CREATE INDEX IF NOT EXISTS idx_employee_cards_is_active ON employee_cards(is_active);

-- ユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_cards_user_email_unique ON employee_cards(user_email) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_cards_employee_number_unique ON employee_cards(employee_number) WHERE is_active = true;

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_cards_updated_at 
    BEFORE UPDATE ON employee_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS（Row Level Security）の有効化
ALTER TABLE employee_cards ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- ユーザーは自分の証明書情報のみ閲覧可能
CREATE POLICY "Users can view own employee card" ON employee_cards
    FOR SELECT USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 管理者は全証明書情報を閲覧・編集可能（特定のメールアドレスで判定）
CREATE POLICY "Admins can manage all employee cards" ON employee_cards
    FOR ALL USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) = 'aoiroserver.m@gmail.com'
    );

-- サンプルデータの挿入（テスト用）
-- 注意: 実際のユーザーIDに置き換えてから実行してください
-- 例: INSERT INTO employee_cards (user_id, user_email, section_name, employee_number, card_number, issue_date, expiry_date)
--      VALUES ('base64_encoded_email', 'your-email@example.com', '開発セクション', 'EMP001', '1234 5678 9012 3456', '2024-01-15', '2026-12-31');
