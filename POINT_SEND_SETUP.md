# ポイント送信機能セットアップガイド

## 概要
管理者アカウントでログインした際に、特定のメールアドレスのユーザーに指定したポイントを送信できる機能です。

## 機能の詳細

### 🎯 主な機能
- **管理者専用ボタン**: その他ページに「ポイント送信」ボタンを表示
- **ポイント送信ダイアログ**: メールアドレス、ポイント数、理由の入力
- **バリデーション**: 1-10,000ポイントの範囲制限
- **履歴記録**: ポイント送信の履歴をデータベースに保存
- **権限チェック**: 管理者のみが実行可能

### 🔐 権限管理
管理者として認識されるメールアドレス：
- `aoiroserver.m@gmail.com`
- `NEXT_PUBLIC_SUPERADMIN_EMAIL` 環境変数で指定されたメール

## セットアップ手順

### 1. データベースマイグレーション
```bash
# Supabase SQL エディターで以下のマイグレーションを実行
cat supabase/migrations/20241202100000_create_point_transactions.sql
```

### 2. 環境変数の設定
`.env.local` に以下を追加：
```env
# Supabase Service Role Key（サーバーサイドでの操作用）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 管理者メールアドレス
NEXT_PUBLIC_SUPERADMIN_EMAIL=your_admin_email@example.com
```

### 3. 必要な権限
- `user_profiles` テーブルへの読み書き権限
- `point_transactions` テーブルへの作成権限

## 使用方法

### 管理者としてのポイント送信
1. 管理者アカウントでログイン
2. 「その他」ページに移動
3. 「ポイント送信」ボタンをクリック
4. 送信先メールアドレスを入力
5. 送信ポイント数を入力（1-10,000）
6. 理由を入力（任意）
7. 「ポイント送信」ボタンで実行

### API エンドポイント
```typescript
POST /api/send-points
{
  "targetEmail": "user@example.com",
  "points": 100,
  "reason": "クエスト報酬の補填",
  "adminEmail": "admin@example.com"
}
```

## セキュリティ

### 権限チェック
- 管理者メールアドレスの照合
- Supabase Service Role Key の使用
- Row Level Security (RLS) による データアクセス制御

### バリデーション
- メールアドレス形式チェック
- ポイント数の範囲制限（1-10,000）
- 対象ユーザーの存在確認

## データベース構造

### point_transactions テーブル
```sql
- id: UUID (主キー)
- user_id: UUID (対象ユーザー)
- points: INTEGER (ポイント数)
- type: VARCHAR (取引タイプ: admin_grant)
- description: TEXT (理由・説明)
- admin_email: VARCHAR (操作した管理者)
- metadata: JSONB (追加データ)
- created_at: TIMESTAMP (作成日時)
```

## トラブルシューティング

### よくある問題
1. **「管理者権限が必要です」エラー**
   - 環境変数が正しく設定されているか確認
   - ログインしているメールアドレスが管理者リストに含まれているか確認

2. **「ユーザーが見つかりません」エラー**
   - 送信先メールアドレスがuser_profilesテーブルに存在するか確認

3. **「ポイントの更新に失敗しました」エラー**
   - Supabase Service Role Key が正しく設定されているか確認
   - user_profilesテーブルの構造を確認

### ログの確認
ブラウザの開発者ツールとサーバーログで詳細なエラー情報を確認できます。

## 将来の拡張

### 予定機能
- ポイント送信履歴の表示
- 一括ポイント送信
- ポイント送信の取り消し機能
- 送信通知メール機能