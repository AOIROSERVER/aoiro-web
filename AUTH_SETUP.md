# AOIROid認証機能セットアップガイド

## 概要
AOIROidの新規アカウント作成機能を正常に動作させるためのセットアップガイドです。
ゲームタグ機能を含む完全な認証システムを提供します。

## 1. Supabaseプロジェクトの設定

### 1.1 認証設定（重要）

**⚠️ Email Authが有効になっていない場合、新規アカウント作成ができません**

1. Supabaseダッシュボードにアクセス
2. プロジェクトを選択
3. 「Authentication」→「Providers」をクリック
4. 「Email」プロバイダーを有効化
5. 「Authentication」→「Configuration」をクリック
6. 「Email Auth」セクションで以下を設定：
   - **Enable email signup**: 有効にする（最重要）
   - **Enable email confirmations**: 有効にする
   - **Enable email change confirmations**: 有効にする
   - **Enable secure email change**: 有効にする

**詳細な設定手順は `SUPABASE_EMAIL_AUTH_SETUP.md` を参照してください**

### 1.2 メールテンプレートの設定

1. 「Authentication」→「Email Templates」をクリック
2. 以下のテンプレートをカスタマイズ：
   - **Confirm signup**: 新規登録確認メール
   - **Reset password**: パスワードリセットメール

### 1.3 URL設定

1. 「Authentication」→「Configuration」→「URL Configuration」をクリック
2. 以下のURLを設定：
   - **Site URL**: `http://localhost:3000`（開発環境）
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

### 1.4 OAuth設定

#### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. OAuth 2.0クライアントIDを作成
3. 承認済みリダイレクトURIに以下を追加：
   - `https://cqxadmvnsusscsudrmqd.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback`（開発環境用）
4. Supabaseダッシュボードで「Authentication」→「Providers」→「Google」を有効化
5. クライアントIDとクライアントシークレットを設定

#### Microsoft OAuth
1. [Azure Portal](https://portal.azure.com/)でアプリケーションを登録
2. リダイレクトURIを設定
3. Supabaseダッシュボードで「Authentication」→「Providers」→「Microsoft」を有効化
4. クライアントIDとクライアントシークレットを設定

#### Discord OAuth
1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリケーションを作成
2. OAuth2設定でリダイレクトURIを設定
3. Supabaseダッシュボードで「Authentication」→「Providers」→「Discord」を有効化
4. クライアントIDとクライアントシークレットを設定

## 2. 環境変数の設定

### 開発環境
プロジェクトルートに`.env.local`ファイルを作成：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://cqxadmvnsusscsudrmqd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# 管理者設定
NEXT_PUBLIC_ADMIN_SECRET=aoiro_admin_secret_2024
NEXT_PUBLIC_ADMIN_EMAIL=aoiroserver.m@gmail.com
NEXT_PUBLIC_ADMIN_PASSWORD=aoiro_admin_password_2024
```

### 本番環境（Netlify）
Netlifyダッシュボードで環境変数を設定：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_SECRET`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_ADMIN_PASSWORD`

## 3. データベーステーブルの作成

SupabaseのSQLエディタで以下のテーブルを作成：

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

## 4. 認証フローの確認

### 4.1 新規登録フロー
1. ユーザーが`/register`ページでアカウント作成（ユーザー名、ゲームタグ、メールアドレス、パスワード）
2. Supabaseが確認メールを送信
3. ユーザーがメールのリンクをクリック
4. `/auth/callback`でメール確認完了とプロフィール作成
5. ログインページにリダイレクト

### 4.2 ログインフロー
1. ユーザーが`/login`ページでログイン
2. 認証成功後、`/train-status`にリダイレクト

### 4.3 パスワードリセットフロー
1. ユーザーが`/reset-password`ページでメールアドレス入力
2. Supabaseがリセットメールを送信
3. ユーザーがメールのリンクをクリック
4. パスワード変更ページで新しいパスワードを設定

## 5. トラブルシューティング

### 5.1 Email Authが有効になっていない場合
- Supabaseダッシュボードで「Authentication」→「Providers」を確認
- 「Email」プロバイダーが有効になっているか確認
- 「Authentication」→「Configuration」で「Enable email signup」が有効になっているか確認
- 詳細は `SUPABASE_EMAIL_AUTH_SETUP.md` を参照

### 5.2 メール確認が動作しない場合
- Supabaseのメール設定を確認
- メールテンプレートが正しく設定されているか確認
- リダイレクトURIが正しく設定されているか確認
- `/test-auth`ページでテストを実行

### 5.3 OAuthログインが動作しない場合
- 各プロバイダーの設定を確認
- リダイレクトURIが正しく設定されているか確認
- クライアントIDとシークレットが正しく設定されているか確認

### 5.4 本番環境での問題
- 環境変数が正しく設定されているか確認
- ドメインが正しく設定されているか確認
- SSL証明書が有効か確認

## 6. セキュリティ考慮事項

- 管理者アカウントの認証情報は環境変数で管理
- パスワードは8文字以上を推奨
- メール確認を必須にする
- OAuthプロバイダーの設定は本番環境用と開発環境用を分ける

## 7. テスト

### 7.1 新規登録テスト
1. `/register`ページにアクセス
2. ユーザー名、ゲームタグ、メールアドレス、パスワードを入力
3. アカウント作成ボタンをクリック
4. 確認メールが送信されることを確認
5. メールのリンクをクリックして確認完了
6. プロフィールページでゲームタグが正しく表示されることを確認

### 7.2 ログインテスト
1. `/login`ページにアクセス
2. 登録済みのメールアドレスとパスワードでログイン
3. 正常にログインできることを確認

### 7.3 プロフィール編集テスト
1. `/profile`ページにアクセス
2. ユーザー名とゲームタグを編集
3. 保存ボタンをクリック
4. 変更が正しく保存されることを確認

### 7.4 パスワードリセットテスト
1. `/reset-password`ページにアクセス
2. メールアドレスを入力
3. リセットメールが送信されることを確認 