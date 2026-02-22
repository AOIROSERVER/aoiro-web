# Netlify 環境変数 4KB 制限への対応

Netlify では**サーバーレス関数に渡す環境変数の合計が約 4KB を超えるとデプロイが失敗**します。

## エラー例

```
Failed to create function: invalid parameter for function creation: Your environment variables exceed the 4KB limit imposed by ...
```

## 対処手順

### 1. 現在のサイズを確認する

リポジトリで以下を実行し、どの変数が容量を消費しているか確認します。

```bash
# .env.local を読み込んで測定（dotenv が .env.local を読むようにする）
node -r dotenv/config scripts/measure-env-size.js
```

または手動で環境変数を読み込む場合:

```bash
set -a && source .env.local 2>/dev/null; set +a
node scripts/measure-env-size.js
```

**合計が 4096 bytes を超えている場合は、Netlify の環境変数を削減する必要があります。**

なお、ローカルで実行すると `PATH` や IDE 用の変数も含まれるため、Netlify に設定している変数だけの実サイズより多くなることがあります。Netlify の「Environment variables」に表示されている変数だけを想定して削減を検討してください。

---

### 2. Netlify で「ビルド時のみ」にできる変数

次の変数は **API ルート（サーバーレス関数）から参照していません**。  
Netlify の「Environment variables」で **Scopes を「Build」にすると、関数には渡されず 4KB にカウントされません**。

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`（**非常に長い**）
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `NEXT_PUBLIC_ADMIN_SECRET`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_ADMIN_PASSWORD`

**手順**: Netlify → Site settings → Build & deploy → Environment → 該当変数を編集 → **Scopes で「Build」を選択**。

※ これらの変数がクライアントやビルド時以外で必要なら「Build」にしないでください。

---

### 3. 本番で使っていない変数を削除する

Netlify の環境変数一覧で、**本番で未使用のものは削除**してください。

例（使っていない機能があれば削除を検討）:

- `MAILGUN_*`（メールに GMAIL のみ使っている場合）
- `SMTP_*`（未使用の場合）
- `OPENXBL_API_KEY`（Xbox 認証を本番で使っていない場合）
- `DISCORD_ES_WEBHOOK_URL`（未使用の場合）
- 重複している変数（例: `EMAIL_USER` と `GMAIL_USER` が同じ用途なら片方だけ）

---

### 4. 長い秘密を外部に移す（推奨・上級）

次のような**長い値**は 4KB を圧迫します。

| 変数名 | 目安サイズ | 用途 |
|--------|------------|------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | 約 1.5KB〜2KB | GAS・スプレッドシート連携 |
| `FIREBASE_PRIVATE_KEY` | 約 1.7KB | Firebase Admin（API で未使用なら Build のみに） |
| `SUPABASE_SERVICE_ROLE_KEY` | 約 200B | 認証・DB |
| `VAPID_PRIVATE_KEY` | 約 50B | プッシュ通知 |
| `DISCORD_BOT_TOKEN` | 約 70B | Discord API |

**対策案**:

- **GOOGLE_SERVICE_ACCOUNT_KEY**:  
  - スプレッドシート連携を別サービス（Cloud Functions / 別バックエンド）に移し、この Next アプリからは HTTP で呼ぶ。  
  - または AWS Secrets Manager / HashiCorp Vault などに保存し、API ルートの起動時に取得する。
- **FIREBASE_***:  
  - API ルートで使っていなければ、Netlify で **Scopes = Build** にすると関数には渡りません。

---

### 5. 必須の環境変数（削除しないこと）

以下は API ルートで参照しているため、**本番でその機能を使う場合は Netlify に設定し、削除しないでください**。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（認証・管理者系）
- `NEXT_PUBLIC_SUPERADMIN_EMAIL`（管理者判定）
- `DISCORD_BOT_TOKEN` / `DISCORD_CHANNEL_ID` / `DISCORD_SERVER_ID` / `DISCORD_MEMBER_ROLE_ID`（Discord 連携）
- `VAPID_PRIVATE_KEY`（プッシュ通知）
- `EMAIL_USER` または `GMAIL_USER`、`EMAIL_PASS` または `GMAIL_APP_PASSWORD`、`FROM_EMAIL`（メール送信）
- `HCAPTCHA_SECRET_KEY`（hCaptcha 使用時）
- `GOOGLE_SERVICE_ACCOUNT_KEY`、`GOOGLE_SPREADSHEET_ID`（スプレッドシート・GAS 使用時）
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_BASE_URL`（通知・リンク生成）

---

### 6. 対応後の確認

1. Netlify で上記の削除・Scopes 変更を行う。
2. 再デプロイする。
3. まだ失敗する場合は、`scripts/measure-env-size.js` を Netlify の「Build environment」に近い形で実行できるようにし、**Netlify に実際に設定している変数だけ**で再度サイズを確認する。

---

## 参考

- [Netlify: Environment variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify: Limits on serverless function payload](https://docs.netlify.com/functions/configure-and-deploy/#deploy-attributes)
