# Supabase設定ガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAPIキーを取得

## 2. データベーステーブルの作成

Supabaseのダッシュボードで以下のSQLを実行してください：

```sql
-- train_statusテーブルの作成
CREATE TABLE train_status (
  id SERIAL PRIMARY KEY,
  line_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT '平常運転',
  section TEXT,
  detail TEXT,
  color VARCHAR(7) DEFAULT '#000000',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期データの挿入
INSERT INTO train_status (line_id, name, status, color) VALUES
('CA', '東海道新幹線', '平常運転', '#0033cb'),
('JK', '京浜東北線', '平常運転', '#00b2e5'),
('JY1', '山手線（内回り）', '平常運転', '#8fd400'),
('JY2', '山手線（外回り）', '平常運転', '#8fd400'),
('JB', '総武線', '平常運転', '#ffd400'),
('JC', '中央線', '平常運転', '#f15a22'),
('JT', '東海道線', '平常運転', '#f68b1e'),
('JO', '横須賀線', '平常運転', '#1069b4'),
('M', '丸の内線', '平常運転', '#f62e36'),
('Z', '半蔵門線', '平常運転', '#8f76d6'),
('C', '千代田線', '平常運転', '#00bb86'),
('H', '日比谷線', '平常運転', '#b5b5ac'),
('G', '銀座線', '平常運転', '#f39700'),
('AK', 'あきが丘線', '平常運転', '#e37e40'),
('AU', 'あおうみ線 (空港アクセス線)', '平常運転', '#15206b');
```

## 3. 環境変数の設定

### 開発環境

プロジェクトルートに`.env.local`ファイルを作成し、以下の内容を追加：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 本番環境（Netlify）

Netlifyのダッシュボードで環境変数を設定：

1. Site settings > Environment variables
2. 以下の変数を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. RLS（Row Level Security）の設定

必要に応じて、SupabaseでRLSを有効にしてセキュリティを強化できます：

```sql
-- RLSを有効化
ALTER TABLE train_status ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Allow public read access" ON train_status
  FOR SELECT USING (true);

-- 認証されたユーザーのみ書き込み可能（必要に応じて）
CREATE POLICY "Allow authenticated insert" ON train_status
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON train_status
  FOR UPDATE USING (auth.role() = 'authenticated');
```

## 5. 動作確認

設定完了後、以下のコマンドでアプリケーションを起動：

```bash
npm run dev
```

運行情報の管理画面（`/train-status/management`）でデータの保存・取得が正常に動作することを確認してください。 