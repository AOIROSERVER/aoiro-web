# SQL実行手順とトラブルシューティング

## エラーの原因
```
ERROR: 42601: syntax error at or near "_id"
LINE 19: );_id);
```

## 推奨実行手順

### 1. シンプルなテーブル作成から開始
```sql
-- まずシンプルなテーブルを作成
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  admin_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. テーブル作成成功後にRLSを追加
```sql
-- Row Level Security を有効化
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のポイント履歴のみ閲覧可能
CREATE POLICY "Users can view their own point transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

### 3. 管理者ポリシーの追加
```sql
-- 管理者ポリシー（user_profiles_secureテーブルが存在する場合）
CREATE POLICY "Admins can view all point transactions" ON point_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles_secure 
      WHERE user_profiles_secure.id = auth.uid() 
      AND user_profiles_secure.email = 'aoiroserver.m@gmail.com'
    )
  );
```

## トラブルシューティング

### A. テーブル存在確認
```sql
-- 存在するテーブル一覧
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### B. user_profiles_secure テーブル確認
```sql
-- user_profiles_secureが存在するかチェック
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_profiles_secure'
);
```

### C. エラーが発生する場合の代替案
```sql
-- 管理者チェックなしのシンプルな版
CREATE POLICY "Admins can create point transactions" ON point_transactions
  FOR INSERT WITH CHECK (true);
```

## 実行推奨順序
1. `SIMPLE_point_transactions.sql` でテーブル作成
2. 成功したら RLS ポリシーを個別に追加
3. 最後にインデックスとコメントを追加

## 注意点
- コピー&ペーストで余分な文字が入らないように注意
- 一度に全てのSQLを実行せず、段階的に実行
- エラーが出たら該当行を確認して修正