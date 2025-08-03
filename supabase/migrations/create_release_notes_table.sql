-- リリースノートテーブルの作成
CREATE TABLE IF NOT EXISTS release_notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）の設定
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがリリースノートを閲覧できるポリシー
DROP POLICY IF EXISTS "Anyone can view release notes" ON release_notes;
CREATE POLICY "Anyone can view release notes" ON release_notes
  FOR SELECT USING (true);

-- 管理者のみがリリースノートを作成・更新・削除できるポリシー
DROP POLICY IF EXISTS "Admin can manage release notes" ON release_notes;
CREATE POLICY "Admin can manage release notes" ON release_notes
  FOR ALL USING (auth.jwt() ->> 'email' = 'aoiroserver.m@gmail.com');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_release_notes_created_at ON release_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_release_notes_version ON release_notes(version);
CREATE INDEX IF NOT EXISTS idx_release_notes_author ON release_notes(author);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atを自動更新するトリガー
DROP TRIGGER IF EXISTS update_release_notes_updated_at ON release_notes;
CREATE TRIGGER update_release_notes_updated_at
    BEFORE UPDATE ON release_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 