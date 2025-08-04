-- お知らせテーブルの作成
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(date);
CREATE INDEX IF NOT EXISTS idx_announcements_tags ON announcements USING GIN(tags);

-- サンプルデータの挿入
INSERT INTO announcements (title, content, date, tags) VALUES
(
  '【8月9日（土）】「二宮神社例大祭」開催に伴う迂回運転について',
  '二宮神社例大祭開催に伴い、一部路線で迂回運転を実施いたします。

迂回区間：二宮神社前駅～浜松駅間
迂回期間：2025年8月9日（土）終日

迂回ルート：
・二宮神社前駅 → 浜松駅（直通）
・所要時間：約15分延長

ご不便をおかけしますが、ご理解いただきますようお願いいたします。',
  '2025-08-09',
  ARRAY['重要', '迂回運転']
),
(
  '【8月8日（金）～】「内野西」（上）バス停移設のお知らせ',
  '工事に伴い、「内野西」（上）バス停が移設されます。

移設先：内野西交差点から東へ50m
移設期間：2025年8月8日（金）～工事完了まで

影響路線：
・1番系統：内野西線
・2番系統：浜松駅線

ご不便をおかけしますが、ご理解いただきますようお願いいたします。',
  '2025-08-08',
  ARRAY['工事', 'バス停移設']
),
(
  '【7月24日（木）～8月27日（水）】夏休み期間・お盆期間の路線バスの運行について',
  '夏休み期間・お盆期間中の路線バス運行についてお知らせいたします。

期間：2025年7月24日（木）～8月27日（水）

運行変更：
・平日：通常運行
・土日祝：30分間隔運行（通常は20分間隔）
・8月13日～16日：お盆期間のため、一部路線で運行時間変更

詳細な時刻表は各バス停でご確認ください。',
  '2025-07-24',
  ARRAY['運行変更', '期間限定']
); 