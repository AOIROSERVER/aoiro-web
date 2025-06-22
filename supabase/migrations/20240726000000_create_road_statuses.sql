-- road_statuses テーブルの作成
CREATE TABLE IF NOT EXISTS road_statuses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    color TEXT,
    status TEXT NOT NULL DEFAULT '通常',
    sub_status TEXT,
    details TEXT,
    note TEXT,
    congestion TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) の設定
ALTER TABLE road_statuses ENABLE ROW LEVEL SECURITY;

-- 公開アクセスを許可するポリシー
CREATE POLICY "Allow public read access" ON road_statuses
FOR SELECT USING (true);

-- 認証済みユーザーによる書き込みを許可するポリシー
DROP POLICY IF EXISTS "Allow authenticated write access" ON road_statuses;
CREATE POLICY "Allow anyone to write" ON road_statuses
FOR ALL USING (true);

-- 初期データの投入
INSERT INTO road_statuses (id, name, short_name, color, status, sub_status, details, congestion)
VALUES
    ('C1_INNER', '首都高速都心環状線（内回り）', 'C1', '#009688', '渋滞', '通常運転', null, '軽微'),
    ('C1_OUTER', '首都高速都心環状線（外回り）', 'C1', '#009688', '通常', '通常運転', null, '軽微'),
    ('C2_INNER', '首都高速中央循環線（内回り）', 'C2', '#8bc34a', '工事', '通常運転', null, '軽微'),
    ('C2_OUTER', '首都高速中央循環線（外回り）', 'C2', '#8bc34a', '通常', '通常運転', null, '軽微'),
    ('YE', '首都高速八重洲線', 'Y', '#4caf50', '事故', '通常運転', null, '軽微'),
    ('KK', '東京高速道路KK線', 'D8', '#673ab7', '通常', '通常運転', null, '軽微')
ON CONFLICT (id) DO NOTHING;

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION handle_road_statuses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_road_statuses_updated
BEFORE UPDATE ON road_statuses
FOR EACH ROW
EXECUTE FUNCTION handle_road_statuses_updated_at(); 