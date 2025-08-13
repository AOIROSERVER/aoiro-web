# 🚨 緊急：Netlify環境変数クリーンアップ手順

## 問題
現在Netlifyで設定されている環境変数が4KBの制限を超えており、デプロイが失敗しています。

## 即座に削除すべき環境変数

Netlifyダッシュボード（Site settings > Environment variables）で以下を削除：

### 1. Google Sheets関連（最重要 - 大容量）
```
GOOGLE_SERVICE_ACCOUNT_KEY  ← 最も大きいJSON、即座に削除！
GOOGLE_SPREADSHEET_ID
```

### 2. 重複・古い設定
```
EMAIL_PASS          ← GMAIL_APP_PASSWORDと重複
EMAIL_USER          ← GMAIL_USERと重複
MAILGUN_API_KEY     ← 古い設定、未使用
MAILGUN_DOMAIN      ← 古い設定、未使用
```

### 3. 開発・デバッグ用（本番不要）
```
NEXT_PUBLIC_SUPERADMIN_EMAIL
NEXT_PUBLIC_SUPERADMIN_PASSWORD
NEXT_PUBLIC_ADMIN_EMAIL
NEXT_PUBLIC_ADMIN_PASSWORD
NEXT_PUBLIC_ADMIN_SECRET
```

## 保持すべき必須環境変数（約15個）

### Discord認証（Minecraft認証システムに必要）
```
✅ DISCORD_BOT_TOKEN
✅ DISCORD_SERVER_ID
✅ DISCORD_MEMBER_ROLE_ID    ← 【重要】Minecraft認証用ロールID（追加必要）
✅ DISCORD_CHANNEL_ID
✅ NEXT_PUBLIC_DISCORD_WEBHOOK_URL
```

### Supabase（データベース接続）
```
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_SUPABASE_URL
```

### メール送信（お問い合わせフォーム）
```
✅ GMAIL_USER
✅ GMAIL_APP_PASSWORD
✅ FROM_EMAIL
```

### その他必要な機能
```
✅ MINECRAFT_SERVER_HOST
✅ MINECRAFT_SERVER_PORT
✅ NEXT_PUBLIC_HCAPTCHA_SITE_KEY
✅ HCAPTCHA_SECRET_KEY
✅ NEXT_PUBLIC_SITE_URL
✅ VAPID_PRIVATE_KEY
```

## 手順

### 1. Netlifyダッシュボードにアクセス
1. [Netlify](https://app.netlify.com/) にログイン
2. 該当プロジェクトを選択
3. **Site settings** → **Environment variables**

### 2. 不要な環境変数を削除
上記「削除すべき環境変数」をすべて削除

### 3. 結果確認
- 残る環境変数: 約15個
- 推定サイズ: 2-3KB（4KB制限内）

### 4. 再デプロイ
環境変数削除後、新しいデプロイを実行

## 機能への影響

### ✅ 影響なし（完全動作）
- Minecraft ID認証システム
- Discord OAuth認証
- Discord認定メンバーロール付与
- メール送信機能
- Minecraftサーバー監視

### ⏸️ 一時無効化（影響軽微）
- 管理者ページの一部機能

### 🔄 再設定が必要（Google Sheets機能）
- Google Sheets自動記録（`GOOGLE_SHEETS_SETUP.md`を参照して再設定）

## 優先順位

**最優先**: `GOOGLE_SERVICE_ACCOUNT_KEY`の削除
- これが最も大きい（おそらく1-2KB）
- 既にコードで無効化済み
- 削除しても機能に影響なし

**次優先**: 重複環境変数の削除
- EMAIL_*, MAILGUN_*, ADMIN_*系
- 古い設定や開発用設定

## 削除後の確認

環境変数削除後、以下を確認：
1. Minecraft認証が正常に動作
2. Discord連携が正常に動作
3. エラーメッセージが表示されない

Google Sheets機能は再設定が必要です。詳細は `GOOGLE_SHEETS_SETUP.md` を参照してください。
