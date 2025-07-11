# Supabase Email Auth設定ガイド

## 概要
AOIROidの新規アカウント作成機能でEmail Authが動作しない場合の対処法を説明します。

## 1. Supabaseダッシュボードでの設定確認

### 1.1 プロジェクトにアクセス
1. [Supabase](https://supabase.com)にログイン
2. プロジェクト `cqxadmvnsusscsudrmqd` を選択

### 1.2 Authentication設定の確認（最新版）
1. 左サイドバーから「Authentication」をクリック
2. 「Providers」タブをクリック
3. 「Email」プロバイダーが有効になっているか確認

**または**

1. 左サイドバーから「Authentication」をクリック
2. 「Configuration」タブをクリック
3. 「Email Auth」セクションを確認

### 1.3 必要な設定項目
以下の項目が有効になっているか確認してください：

- ✅ **Enable email signup**: 有効
- ✅ **Enable email confirmations**: 有効
- ✅ **Enable email change confirmations**: 有効
- ✅ **Enable secure email change**: 有効
- ✅ **Enable double confirm changes**: 無効（推奨）

### 1.4 メール設定の確認（最新版）

#### 方法1: Email Templatesタブを探す
1. 「Authentication」→「Email Templates」タブをクリック
2. 以下のテンプレートが設定されているか確認：
   - **Confirm signup**: 新規登録確認メール
   - **Reset password**: パスワードリセットメール

#### 方法2: Configuration内で探す
1. 「Authentication」→「Configuration」タブをクリック
2. 「Email Templates」セクションを探す
3. または「Email Settings」セクション内でテンプレート設定を確認

#### 方法3: 代替案 - デフォルトテンプレートを使用
最新のSupabaseでは、Email Templatesセクションが非表示になっている場合があります。この場合、デフォルトのテンプレートが自動的に使用されます。

**デフォルトテンプレートが使用される場合の確認方法：**
1. テスト用のアカウントを作成
2. 確認メールが送信されるか確認
3. メールの内容が適切か確認

## 2. メールプロバイダーの設定

### 2.1 デフォルトメールプロバイダー
Supabaseはデフォルトで以下のメールプロバイダーを使用：
- **SendGrid**: 無料プランで月100通まで
- **SMTP**: カスタムSMTPサーバー

### 2.2 カスタムSMTP設定（推奨）
より確実なメール配信のために、カスタムSMTPを設定することを推奨します：

1. **Authentication** → **Configuration** → **SMTP Settings**
2. 以下の情報を入力：
   ```
   Host: smtp.gmail.com (Gmailの場合)
   Port: 587
   Username: your-email@gmail.com
   Password: your-app-password
   Sender Name: AOIROid
   Sender Email: your-email@gmail.com
   ```

### 2.3 Gmail App Passwordの設定
1. Googleアカウント設定にアクセス
2. 「セキュリティ」→「2段階認証」を有効化
3. 「アプリパスワード」を生成
4. 生成されたパスワードをSMTP設定で使用

## 3. リダイレクトURLの設定

### 3.1 サイトURLの設定
1. **Authentication** → **Configuration** → **URL Configuration**
2. 以下のURLを設定：
   ```
   Site URL: https://your-domain.com (本番環境)
   Site URL: http://localhost:3000 (開発環境)
   ```

### 3.2 リダイレクトURLの設定
1. **Authentication** → **Configuration** → **Redirect URLs**
2. 以下のURLを追加：
   ```
   https://your-domain.com/auth/callback
   http://localhost:3000/auth/callback
   ```

## 4. データベーステーブルの確認

### 4.1 user_profilesテーブルの存在確認
SQLエディタで以下のクエリを実行：

```sql
-- テーブルの存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
);

-- テーブル構造の確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles';
```

### 4.2 テーブルが存在しない場合の作成
```sql
-- ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  game_tag TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）の設定
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 5. 環境変数の確認

### 5.1 開発環境
`.env.local`ファイルに以下が設定されているか確認：

```env
NEXT_PUBLIC_SUPABASE_URL=https://cqxadmvnsusscsudrmqd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeGFkbXZuc3Vzc2NzdWRybXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTUyMjMsImV4cCI6MjA2NTkzMTIyM30.XfQ5KyRUR_9o9PfvySjud0YW-BwHH87jUSX_Em1_F54
```

### 5.2 本番環境
Netlifyの環境変数で以下が設定されているか確認：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6. テスト手順

### 6.1 テストページへのアクセス
1. アプリケーションを起動
2. `/test-auth`ページにアクセス
3. 各テストボタンをクリックして結果を確認

### 6.2 新規登録テスト
1. 「新規登録テスト」ボタンをクリック
2. 結果を確認：
   - 成功: Email Authが正常に動作
   - エラー: 設定に問題がある

### 6.3 ログインテスト
1. まず新規登録を実行
2. メール確認リンクをクリック
3. 「ログインテスト」ボタンをクリック

## 7. よくある問題と対処法

### 7.1 "Email Auth is not enabled" エラー
**原因**: SupabaseでEmail Authが無効になっている
**対処法**: 
1. Supabaseダッシュボードで「Authentication」→「Providers」
2. 「Email」プロバイダーを有効化

### 7.2 "Invalid redirect URL" エラー
**原因**: リダイレクトURLが正しく設定されていない
**対処法**:
1. Supabaseダッシュボードで「Authentication」→「Configuration」
2. 「Redirect URLs」に正しいURLを追加

### 7.3 メールが送信されない
**原因**: メール設定が正しくない
**対処法**:
1. SMTP設定を確認
2. メールテンプレートを確認（デフォルトテンプレートを使用）
3. スパムフォルダを確認

### 7.4 "User already registered" エラー
**原因**: 既に登録済みのメールアドレス
**対処法**:
1. 別のメールアドレスでテスト
2. Supabaseダッシュボードでユーザーを削除

### 7.5 "Email Templates"が見つからない
**原因**: 最新のSupabaseダッシュボードで構造が変更されている
**対処法**:
1. デフォルトテンプレートを使用（上記の方法3を参照）
2. カスタムSMTPを設定してメール配信を改善
3. テスト用アカウントでメール配信を確認

## 8. デバッグ方法

### 8.1 ブラウザの開発者ツール
1. F12キーを押して開発者ツールを開く
2. 「Console」タブでエラーメッセージを確認
3. 「Network」タブでAPIリクエストを確認

### 8.2 Supabaseログ
1. Supabaseダッシュボードで「Logs」を確認
2. 「Authentication」ログで認証エラーを確認

### 8.3 テストページの活用
`/test-auth`ページで各機能を個別にテストし、問題を特定

## 9. セキュリティ設定

### 9.1 パスワードポリシー
Supabaseダッシュボードで以下を設定：
- 最小文字数: 6文字
- 大文字小文字の組み合わせ: 推奨
- 数字の組み合わせ: 推奨

### 9.2 レート制限
- 新規登録: 1分間に3回まで
- ログイン: 1分間に5回まで
- パスワードリセット: 1分間に1回まで

## 10. 本番環境での注意点

### 10.1 ドメイン設定
- 本番環境のドメインをSupabaseに登録
- SSL証明書が有効であることを確認

### 10.2 環境変数
- 本番環境で環境変数が正しく設定されていることを確認
- 機密情報が公開されていないことを確認

### 10.3 メール配信
- 本番環境では確実なメール配信のため、カスタムSMTPを使用
- メール配信ログを定期的に確認

## 11. 最新のSupabaseダッシュボード構造

### 11.1 認証設定へのアクセス方法
1. **Authentication** → **Providers** → **Email** を有効化
2. **Authentication** → **Configuration** → **Email Auth** で詳細設定
3. **Authentication** → **Email Templates** でメールテンプレート設定（存在する場合）

### 11.2 設定項目の場所
- **Email Auth設定**: Authentication → Configuration
- **プロバイダー設定**: Authentication → Providers
- **メールテンプレート**: Authentication → Email Templates（最新版では非表示の可能性）
- **URL設定**: Authentication → Configuration → URL Configuration

### 11.3 Email Templatesが見つからない場合の対処法
1. **デフォルトテンプレートを使用**: 最新のSupabaseでは、Email Templatesセクションが非表示になっている場合があります
2. **カスタムSMTP設定**: より確実なメール配信のために、カスタムSMTPを設定
3. **テストで確認**: 実際にアカウントを作成してメール配信をテスト

## 12. メールテンプレートの代替設定方法

### 12.1 デフォルトテンプレートの使用
最新のSupabaseでは、Email Templatesセクションが利用できない場合があります。この場合、デフォルトのテンプレートが自動的に使用されます。

### 12.2 カスタムSMTPでのメール配信改善
1. **Authentication** → **Configuration** → **SMTP Settings**
2. 信頼性の高いSMTPプロバイダーを設定
3. メール配信の成功率を向上

### 12.3 メール配信のテスト
1. テスト用アカウントを作成
2. 確認メールが送信されるか確認
3. メールの内容が適切か確認
4. 必要に応じてカスタムSMTPを設定 