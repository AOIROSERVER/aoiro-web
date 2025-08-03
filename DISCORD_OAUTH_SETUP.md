# Discord OAuth設定ガイド

## 概要
AOIROidでDiscordログインを有効化するための詳細な設定ガイドです。

## 1. Discord Developer Portalでの設定

### 1.1 アプリケーションの作成
1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリック
3. アプリケーション名を入力（例：「AOIROid」）
4. 「Create」をクリック

### 1.2 OAuth2設定
1. 左サイドバーから「OAuth2」をクリック
2. 「General」タブで以下を設定：

#### Client IDとClient Secret
- **Client ID**: コピーして保存
- **Client Secret**: 「Reset Secret」で生成し、コピーして保存

#### Redirects設定
**Redirects** セクションに以下を**正確に**追加：
```
https://cqxadmvnsusscsudrmqd.supabase.co/auth/v1/callback
https://aoiroserver.site/auth/callback
http://localhost:3000/auth/callback
```

#### Scopes設定
**Scopes** セクションで以下を選択：
- ✅ `identify` - ユーザーの基本情報を取得
- ✅ `email` - ユーザーのメールアドレスを取得

### 1.3 重要な注意点
- **末尾のスラッシュ**: `/auth/callback/` ではなく `/auth/callback`
- **プロトコル**: `http://` と `https://` を正確に設定
- **大文字小文字**: 正確にコピー&ペースト
- **ドメイン名**: `aoiroserver.site` が正確か確認

## 2. Supabaseでの設定

### 2.1 Discordプロバイダーの有効化
1. Supabaseダッシュボード → 「Authentication」→「Providers」
2. 「Discord」を探して「Enabled」にチェック
3. 以下の情報を入力：
   - **Client ID**: Discord Developer Portalで取得したClient ID
   - **Client Secret**: Discord Developer Portalで取得したClient Secret

### 2.2 URL設定
**Authentication** → **Configuration** → **URL Configuration** で以下を設定：

#### Site URL
```
https://aoiroserver.site
```

#### Redirect URLs
```
https://aoiroserver.site/auth/callback
http://localhost:3000/auth/callback
```

## 3. 環境変数の設定

### 3.1 開発環境
プロジェクトルートに `.env.local` ファイルを作成：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://cqxadmvnsusscsudrmqd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 管理者設定
NEXT_PUBLIC_ADMIN_SECRET=aoiro_admin_secret_2024
NEXT_PUBLIC_ADMIN_EMAIL=aoiroserver.m@gmail.com
NEXT_PUBLIC_ADMIN_PASSWORD=aoiro_admin_password_2024

# サイトURL（通知送信時に使用）
NEXT_PUBLIC_SITE_URL=https://aoiroserver.site
```

### 3.2 本番環境（Netlify）
Netlifyダッシュボードで環境変数を設定：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## 4. デバッグ方法

### 4.1 ブラウザの開発者ツール
1. F12キーを押して開発者ツールを開く
2. 「Console」タブでエラーメッセージを確認
3. 「Network」タブでリクエストURLを確認

### 4.2 Supabaseログ
1. Supabaseダッシュボードで「Logs」を確認
2. 「Authentication」ログでエラー内容を確認

### 4.3 テスト手順
1. `/login` ページで「Discordでログイン」ボタンをクリック
2. Discord認証画面にリダイレクトされるか確認
3. Discordアカウントでログイン後、アプリに戻るか確認

## 5. よくある問題と対処法

### 5.1 「OAuth2 redirect_uriが無効です」エラー
**原因**: Discord Developer PortalのリダイレクトURI設定ミス
**対処法**: 
- Discord Developer Portalで正確なリダイレクトURIを設定
- 末尾のスラッシュやプロトコル（http/https）を確認

### 5.2 「認証に失敗しました」エラー
**原因**: SupabaseのDiscordプロバイダー設定ミス
**対処法**:
- SupabaseでClient IDとClient Secretを再確認
- Discord Developer PortalでClient Secretを再生成

### 5.3 「Client ID not found」エラー
**原因**: SupabaseのClient ID設定ミス
**対処法**:
- Discord Developer PortalでClient IDを再確認
- Supabaseで正確にコピー&ペースト

### 5.4 「Client Secret invalid」エラー
**原因**: SupabaseのClient Secret設定ミス
**対処法**:
- Discord Developer Portalで「Reset Secret」を実行
- 新しいClient SecretをSupabaseに設定

## 6. セキュリティ設定

### 6.1 Discord Developer Portal設定
- **Public Bot**: 無効（認証のみ使用）
- **Bot Permissions**: 不要
- **OAuth2 Scopes**: `identify`, `email` のみ

### 6.2 Supabase設定
- **Redirect URLs**: 本番・開発環境の両方を設定
- **Site URL**: 正しいドメインを設定

## 7. 動作確認

### 7.1 設定確認
1. Supabaseダッシュボードで「Authentication」→「Providers」→「Discord」が「Enabled」になっているか確認
2. Client IDとClient Secretが正しく設定されているか確認

### 7.2 テスト実行
1. `/login` ページで「Discordでログイン」ボタンをクリック
2. Discord認証画面にリダイレクトされるか確認
3. Discordアカウントでログイン後、アプリに戻るか確認

### 7.3 エラー確認
- 問題があれば、Supabaseの「Authentication」→「Logs」でエラー内容を確認
- ブラウザの開発者ツール（F12）でコンソールエラーを確認

## 8. トラブルシューティング

### 8.1 ログの確認
- ブラウザのコンソールで詳細なログを確認
- Supabaseのログで認証エラーを確認
- ネットワークタブでリクエストURLを確認

### 8.2 設定の再確認
- Discord Developer Portalの設定を再確認
- Supabaseの設定を再確認
- 環境変数を再確認

### 8.3 テスト用アカウント
- テスト用のDiscordアカウントでログインを試行
- 別のブラウザでログインを試行
- シークレットウィンドウでログインを試行

## 9. 本番環境での注意点

### 9.1 ドメイン設定
- 本番環境のドメインをDiscord Developer Portalに登録
- SSL証明書が有効であることを確認

### 9.2 環境変数
- 本番環境で環境変数が正しく設定されていることを確認
- 機密情報が公開されていないことを確認

### 9.3 ログ監視
- 本番環境でログを定期的に確認
- エラーが発生した場合の対応手順を準備

## 10. まとめ

Discordログインを有効化するには：

1. **Discord Developer Portal**でアプリケーションを作成
2. **OAuth2設定**でリダイレクトURIを設定
3. **Supabase**でDiscordプロバイダーを有効化
4. **環境変数**を正しく設定
5. **テスト**を実行して動作確認

設定後は `/login` で「Discordでログイン」ボタンを押してテストしてください。 