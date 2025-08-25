# マインクラフト認証セットアップガイド

## 🚨 重要：ポート設定について

### 問題の原因
「リクエストの形式に問題があります」エラーは、Discord OAuthのリダイレクトURI設定が原因です。

### 現在の状況
- **アクセス先**: `http://localhost:8888/minecraft-auth/`
- **Discord OAuth設定**: `http://localhost:3000/auth/callback` のみ許可
- **結果**: ポートの不一致でOAuth認証が失敗

## 解決方法

### 方法1: localhost:3000を使用（推奨）
```
正しい: http://localhost:3000/minecraft-auth/
間違い: http://localhost:8888/minecraft-auth/
```

### 方法2: Discord OAuthに8888ポートを追加

#### Discord Developer Portal設定
1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. アプリケーション → OAuth2 → General
3. **Redirects** セクションに追加：
   ```
   http://localhost:8888/auth/callback
   ```
4. **Save Changes** をクリック

#### Supabase設定
1. Supabaseダッシュボード → Authentication → Configuration → URL Configuration
2. **Redirect URLs** に追加：
   ```
   http://localhost:8888/auth/callback
   ```

## テスト手順

### 1. ポート確認
```bash
# 開発サーバーのポートを確認
npm run dev
# ↓ 表示されるポートを確認
# Local: http://localhost:3000 または http://localhost:8888
```

### 2. マインクラフト認証テスト
1. 正しいポートでアクセス: `http://localhost:3000/minecraft-auth/`
2. 「Discordで認証」ボタンをクリック
3. Discord認証画面にリダイレクト
4. 認証完了後、verifyページに戻る

### 3. エラー確認
- ブラウザ開発者ツール（F12）でコンソールログを確認
- ネットワークタブでリクエストURLを確認

## よくあるエラーと対処法

### 「リクエストの形式に問題があります」
- **原因**: ポート不一致
- **対処**: 正しいポートでアクセス

### 「redirect_uri_mismatch」
- **原因**: Discord OAuth設定のリダイレクトURI不一致
- **対処**: Discord Developer Portalでリダイレクトが追加

### 「invalid_grant」
- **原因**: 認証コードの期限切れ
- **対処**: ブラウザを再読み込みして再試行

## デバッグログ確認

### コンソールで確認すべき項目
```javascript
🔍 Port Configuration Debug: {
  currentOrigin: "http://localhost:8888",
  hostname: "localhost", 
  port: "8888",
  isLocalhost: true,
  correctedOrigin: "http://localhost:3000",  // ← これが修正後の値
  currentURL: "http://localhost:8888/minecraft-auth/"
}
```

### 正常なログ例
```javascript
🔄 Starting Discord OAuth for MCID auth...
🎮 Minecraft auth flow flag set in sessionStorage
MCID auth redirect URL: http://localhost:3000/auth/callback?from=minecraft-auth&next=%2Fminecraft-auth%2Fverify&source=minecraft-auth-page
✅ Discord OAuth initiated successfully
```

## 注意事項

### ローカル開発環境
- **推奨**: `localhost:3000` を使用
- **理由**: Discord OAuth設定がシンプル

### 本番環境
- **本番URL**: `https://aoiroserver.site/minecraft-auth/`
- **設定済み**: Discord OAuthとSupabase設定済み

## 設定確認チェックリスト

### Discord Developer Portal
- [ ] Client IDとClient Secretが設定済み
- [ ] Redirectsに `http://localhost:3000/auth/callback` が追加済み
- [ ] Redirectsに `http://localhost:8888/auth/callback` が追加済み（必要に応じて）
- [ ] Scopesで `identify` と `email` が選択済み

### Supabase
- [ ] Authentication → Providers → Discord が有効
- [ ] Client IDとClient Secretが正しく設定
- [ ] Redirect URLsに `http://localhost:3000/auth/callback` が追加済み
- [ ] Redirect URLsに `http://localhost:8888/auth/callback` が追加済み（必要に応じて）

### 環境変数
- [ ] `NEXT_PUBLIC_SUPABASE_URL` が設定済み
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定済み