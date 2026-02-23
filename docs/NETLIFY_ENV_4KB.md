# Netlify 環境変数 4KB 制限への対応

Netlify では **Next 用サーバー関数（___netlify-server-handler）に渡す環境変数の合計が約 4KB (4096 bytes) を超えるとデプロイが失敗**します。

## エラー例

```
Failed to create function: invalid parameter for function creation: Your environment variables exceed the 4KB limit imposed by ...
Failed to upload file: ___netlify-server-handler
```

## すぐやること（デプロイを直す）

1. **Netlify ダッシュボード** → **Site settings** → **Build & deploy** → **Environment** → **Environment variables**
2. **本番で使っていない変数は削除**する（例: 使っていないメール用・Firebase 用・重複しているもの）。
3. **ビルド時だけ必要な変数は Scope を「Build」に変更**する（下記「ビルド時のみ」参照）。**Build にした変数はサーバー関数には渡されず 4KB にカウントされません。**
4. 変更を保存し、**再デプロイ**する。

## 現在のサイズを確認する

### Netlify に設定している変数だけを測定（推奨）

Netlify に実際に設定している変数名だけを列挙したファイル（例: `.env.netlify`）を用意し、値はダミーで長さだけ合わせて保存します。その後:

```bash
node scripts/measure-env-size.js .env.netlify
```

合計が **4096 bytes 未満**になるまで、変数の削除や「Build」スコープの見直しをしてください。

### 簡易ワンライナー（現在のシェルの env 全体）

```bash
node -e "const env=process.env; const size=Object.entries(env).reduce((s,[k,v])=>s+Buffer.byteLength((v!=null?k+'='+v:k)+'\n','utf8'),0); console.log('env byte size:', size, size>4096?'(OVER 4KB)':'')"
```

※ ローカルでは `PATH` 等も含まれるため、Netlify 実機より大きくなります。あくまで目安です。

### .env.local で測定

```bash
node scripts/measure-env-size.js
```

（`dotenv` で `.env.local` を読み、全変数を表示します。ローカルはシステム変数も含むため参考値です。）

---

### 2. Netlify で「ビルド時のみ」にできる変数

次の変数は **API ルート（サーバーレス関数）のランタイムでは参照していない**想定です。  
Netlify の「Environment variables」で **Scopes を「Build」にすると、サーバー関数には渡されず 4KB にカウントされません**。

| 変数名 | 備考 |
|--------|------|
| `FIREBASE_PROJECT_ID` | Firebase を API で未使用なら Build 可 |
| `FIREBASE_CLIENT_EMAIL` | 同上 |
| `FIREBASE_PRIVATE_KEY` | **非常に長い**。API で未使用なら Build にすると効果大 |
| `FIREBASE_API_KEY` | 同上 |
| `FIREBASE_AUTH_DOMAIN` | 同上 |
| `FIREBASE_STORAGE_BUCKET` | 同上 |
| `FIREBASE_MESSAGING_SENDER_ID` | 同上 |
| `FIREBASE_APP_ID` | 同上 |
| `NEXT_PUBLIC_ADMIN_SECRET` | クライアント/ビルドのみなら Build 可 |
| `NEXT_PUBLIC_ADMIN_EMAIL` | 同上（管理者ログイン画面で参照） |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 同上 |

**手順**: Netlify → Site settings → Build & deploy → Environment → 該当変数を編集 → **Scopes で「Build」を選択** → Save。

※ ランタイムで参照する変数は **Build にしないでください**（API ルートで `process.env.XXX` を使っている場合は「All」のまま）。

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

### 4. 容量を多く使う変数と対策

次のような**長い値**が 4KB を圧迫しがちです。

| 変数名 | 目安サイズ | 対策 |
|--------|------------|------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | 約 1.5KB〜2KB | 入社申請・GAS で使用中。削除不可の場合は外部シークレット化を検討 |
| `FIREBASE_PRIVATE_KEY` | 約 1.7KB | API で未使用なら **Scopes = Build** |
| `SUPABASE_SERVICE_ROLE_KEY` | 約 200B | 認証・DB で使用。削除不可 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 約 200B | クライアント・サーバー両方で使用。削除不可 |
| `VAPID_PRIVATE_KEY` | 約 50B | プッシュ通知。削除不可 |
| `DISCORD_BOT_TOKEN` | 約 70B | Discord API。削除不可 |
| `DISCORD_APPLICATION_PUBLIC_KEY` | 約 40B | インタラクション検証。削除不可 |

**対策の優先順位**  
1. 未使用の変数を Netlify から**削除**する。  
2. ビルド時のみ使う変数を **Scopes = Build** にする。  
3. それでも超える場合は、`GOOGLE_SERVICE_ACCOUNT_KEY` などを外部シークレット（AWS Secrets Manager / 自前 API 等）に移し、ランタイムで取得する構成を検討する。

---

### 5. 必須の環境変数（削除しないこと）

以下は API ルートで参照しているため、**本番でその機能を使う場合は Netlify に設定し、削除しないでください**。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（認証・管理者系。**募集のアイキャッチはクライアントから直接 Storage にアップロードするため、このキーは不要**）
- `NEXT_PUBLIC_SUPERADMIN_EMAIL`（管理者判定）
- `DISCORD_BOT_TOKEN` / `DISCORD_CHANNEL_ID` / `DISCORD_SERVER_ID` / `DISCORD_MEMBER_ROLE_ID`（Discord 連携）
- `VAPID_PRIVATE_KEY`（プッシュ通知）
- `EMAIL_USER` または `GMAIL_USER`、`EMAIL_PASS` または `GMAIL_APP_PASSWORD`、`FROM_EMAIL`（メール送信）
- `HCAPTCHA_SECRET_KEY`（hCaptcha 使用時）
- `GOOGLE_SERVICE_ACCOUNT_KEY`、`GOOGLE_SPREADSHEET_ID`（スプレッドシート・GAS 使用時）
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_BASE_URL`（通知・リンク生成）

---

### 6. 対応後の確認

1. Netlify で上記の**削除・Scopes 変更**を行う。
2. **再デプロイ**する。
3. まだ失敗する場合は、Netlify に設定している変数**だけ**で `.env.netlify` を作成し、`node scripts/measure-env-size.js .env.netlify` で合計が 4096 未満になるまで削減する。

---

## 参考

- [Netlify: Environment variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify: Limits on serverless function payload](https://docs.netlify.com/functions/configure-and-deploy/#deploy-attributes)
