-- ESシステム用のテーブルを作成
CREATE TABLE es_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_type VARCHAR(50) NOT NULL, -- '運営申請', '入社申請'
  minecraft_tag VARCHAR(100) NOT NULL,
  age VARCHAR(10), -- 運営申請のみ必須
  email VARCHAR(255), -- 運営申請で必須
  prefecture VARCHAR(20), -- 運営申請のみ必須
  device VARCHAR(255), -- 運営申請・入社申請で必須
  motivation TEXT, -- 運営申請・入社申請で必須
  portfolio_url TEXT, -- 入社申請で必須、運営申請で任意
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id), -- 審査者
  review_notes TEXT, -- 審査メモ
  reviewed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE es_submissions ENABLE ROW LEVEL SECURITY;

-- 管理者のみがすべてのレコードを閲覧・編集可能
CREATE POLICY "Admins can view all ES submissions"
  ON es_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update ES submissions"
  ON es_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- サービスロールはすべての操作が可能（API経由でのみ）
CREATE POLICY "Service role can manage ES submissions"
  ON es_submissions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- インデックスを作成（パフォーマンス向上のため）
CREATE INDEX idx_es_submissions_status ON es_submissions(status);
CREATE INDEX idx_es_submissions_application_type ON es_submissions(application_type);
CREATE INDEX idx_es_submissions_submitted_at ON es_submissions(submitted_at DESC);

-- updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_es_submissions_updated_at
  BEFORE UPDATE ON es_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ストレージバケットを作成（ポートフォリオファイル用）
INSERT INTO storage.buckets (id, name, public)
VALUES ('es-portfolios', 'es-portfolios', true);

-- ストレージポリシーを設定
CREATE POLICY "Anyone can upload portfolio files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'es-portfolios');

CREATE POLICY "Anyone can view portfolio files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'es-portfolios');

CREATE POLICY "Admins can delete portfolio files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'es-portfolios' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );
