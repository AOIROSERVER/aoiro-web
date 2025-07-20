# Google OAuth設定ガイド

## 概要
AOIROidのGoogleログイン機能を正常に動作させるための設定ガイドです。

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択

### 1.2 OAuth 2.0クライアントIDの作成
1. 「APIとサービス」→「認証情報」をクリック
2. 「認証情報を作成」→「OAuth 2.0クライアントID」を選択
3. アプリケーションの種類を選択：
   - **Webアプリケーション**を選択
4. 以下の情報を入力：
   - **名前**: AOIROid Web App
   - **承認済みリダイレクトURI**: 
     - `https://cqxadmvnsusscsudrmqd.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`（開発環境用）
     - `https://aoiroserver.site/auth/callback`（本番環境用）

### 1.3 必要なAPIの有効化
1. 「APIとサービス」→「ライブラリ」をクリック
2. 以下のAPIを有効化：
   - Google+ API
   - Google People API

## 2. Supabaseでの設定

### 2.1 Google OAuthプロバイダーの有効化
1. Supabaseダッシュボードにアクセス
2. プロジェクトを選択
3. 「Authentication」→「Providers」をクリック
4. 「Google」プロバイダーを有効化
5. 以下の情報を設定：
   - **Client ID**: Google Cloud Consoleで取得したクライアントID
   - **Client Secret**: Google Cloud Consoleで取得したクライアントシークレット

### 2.2 URL設定の確認
1. 「Authentication」→「Configuration」→「URL Configuration」をクリック
2. 以下のURLが正しく設定されているか確認：
   - **Site URL**: `https://aoiroserver.site`（本番環境）
   - **Redirect URLs**: `https://aoiroserver.site/auth/callback`

## 3. 環境変数の確認

### 3.1 開発環境
`.env.local`ファイルに以下が設定されているか確認：
```env
NEXT_PUBLIC_SUPABASE_URL=https://cqxadmvnsusscsudrmqd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3.2 本番環境（Netlify）
Netlifyダッシュボードで以下が設定されているか確認：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. トラブルシューティング

### 4.1 よくある問題と解決方法

#### 問題: "redirect_uri_mismatch" エラー
**原因**: Google Cloud ConsoleのリダイレクトURI設定が間違っている
**解決方法**:
1. Google Cloud Consoleで承認済みリダイレクトURIを確認
2. 以下のURIが含まれているか確認：
   - `https://cqxadmvnsusscsudrmqd.supabase.co/auth/v1/callback`
   - `https://aoiroserver.site/auth/callback`

#### 問題: "invalid_client" エラー
**原因**: クライアントIDまたはシークレットが間違っている
**解決方法**:
1. SupabaseダッシュボードでGoogle OAuth設定を確認
2. クライアントIDとシークレットが正しく入力されているか確認

#### 問題: "auth_error" エラー
**原因**: 認証フローでエラーが発生
**解決方法**:
1. ブラウザのキャッシュをクリア
2. 開発者ツール（F12）のコンソールでエラーを確認
3. `/test-google-oauth`ページでテストを実行

### 4.2 デバッグ手順

1. **ブラウザの開発者ツールを開く**
   - F12キーを押す
   - コンソールタブを選択

2. **Googleログインを試行**
   - ログインページで「Googleでログイン」をクリック
   - コンソールに表示されるエラーメッセージを確認

3. **テストページを使用**
   - `/test-google-oauth`ページにアクセス
   - 「Google OAuth テスト」ボタンをクリック
   - 詳細なエラー情報を確認

4. **Supabase設定を確認**
   - SupabaseダッシュボードでGoogle OAuthが有効になっているか確認
   - クライアントIDとシークレットが正しく設定されているか確認

## 5. セキュリティ考慮事項

### 5.1 クライアントシークレットの管理
- クライアントシークレットは絶対に公開しない
- 環境変数で管理する
- 定期的に更新する

### 5.2 リダイレクトURIの制限
- 承認済みリダイレクトURIは必要最小限に制限する
- 本番環境と開発環境で異なるURIを使用する

### 5.3 スコープの制限
- 必要最小限のスコープのみを要求する
- ユーザーのプライバシーを尊重する

## 6. テスト

### 6.1 基本テスト
1. `/test-google-oauth`ページにアクセス
2. 「Google OAuth テスト」ボタンをクリック
3. 正常にリダイレクトされることを確認

### 6.2 ログインテスト
1. `/login`ページにアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントを選択
4. 正常にログインできることを確認

### 6.3 エラーハンドリングテスト
1. 意図的に間違った設定でテスト
2. エラーメッセージが適切に表示されることを確認

## 7. 更新手順

### 7.1 クライアントシークレットの更新
1. Google Cloud Consoleで新しいクライアントシークレットを生成
2. Supabaseダッシュボードで設定を更新
3. 環境変数を更新（必要に応じて）

### 7.2 リダイレクトURIの追加
1. Google Cloud Consoleで新しいリダイレクトURIを追加
2. SupabaseダッシュボードでURL設定を更新

## 8. 参考リンク

- [Google OAuth 2.0 ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs) 