# データベーステーブル確認ガイド

## エラーの原因
`ERROR: 42P01: relation "user_profiles" does not exist`

## 問題の分析
コードベースでは以下の2つのテーブル名が使用されています：
- `user_profiles` ← **存在しない**
- `user_profiles_secure` ← **実際に存在する可能性**

## 確認方法

### 1. Supabase SQL エディターで確認
```sql
-- 存在するテーブルを確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%profile%';

-- または
\dt
```

### 2. API経由で確認
```bash
# テーブル構造確認API（既存）
curl http://localhost:3000/api/check-table-structure
```

### 3. 現在のテーブル構造確認
```sql
-- user_profiles_secure テーブルの構造
\d user_profiles_secure

-- カラム一覧
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles_secure';
```

## 修正済みファイル
- ✅ `src/app/api/send-points/route.ts` → `user_profiles_secure` に変更
- ✅ `supabase/migrations/20241202100000_create_point_transactions.sql` → `user_profiles_secure` に変更

## 次の手順
1. **データベースでテーブル名を確認**
2. **必要に応じて残りのファイルも修正**
3. **マイグレーションを実行**
4. **ポイント送信機能をテスト**

## 想定される実際のテーブル構造
```sql
-- user_profiles_secure テーブル
CREATE TABLE user_profiles_secure (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR,
  game_tag VARCHAR,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 確認コマンド
```bash
# 1. 開発サーバー起動
npm run dev

# 2. ポイント送信テスト（管理者ログイン後）
# → その他ページで「ポイント送信」ボタンをクリック

# 3. ブラウザ開発者ツールでエラー確認
# Console タブでAPIエラーをチェック
```