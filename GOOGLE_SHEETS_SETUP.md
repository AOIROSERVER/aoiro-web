# ESシステム連携設定

ESシステムでGoogleスプレッドシート、メール通知、Discord通知を設定する方法

## 必要な環境変数

`.env.local`ファイルに以下の環境変数を追加してください：

```env
# Google Sheets API設定（MCID方式と同じ）
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# メール送信設定（お問い合わせページと同じ）
GMAIL_USER=aoiroserver.m@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
FROM_EMAIL=noreply@aoiroserver.site

# Discord Webhook（オプション）
DISCORD_ES_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

## Google Service Accountの作成手順

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/

2. **プロジェクトを作成または選択**

3. **Google Sheets APIを有効化**
   - 「APIとサービス」→「ライブラリ」
   - 「Google Sheets API」を検索して有効化

4. **サービスアカウントを作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「サービスアカウント」
   - 名前とIDを設定して作成

5. **サービスアカウントキーを生成**
   - 作成したサービスアカウントをクリック
   - 「キー」タブ→「キーを追加」→「新しいキーを作成」
   - JSON形式を選択してダウンロード

6. **JSONファイルを環境変数に設定（MCID方式）**
   - ダウンロードしたJSONファイル全体を`GOOGLE_SERVICE_ACCOUNT_KEY`に設定
   - **重要**: JSONを文字列として設定（シングルクォートで囲む）
   
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
   ```
   
   **注意**: 既存のMCID機能と同じ環境変数を使用するため、MCIDが動作している場合はESシステムも同じ設定で動作します。

7. **スプレッドシートにアクセス権限を付与**
   - 対象のGoogleスプレッドシート（ID: `17oFiF5pvclax-RM38DEREfa1EFKFpzQ9y0lCgizJFE8`）を開く
   - 「共有」ボタンをクリック
   - サービスアカウントのメールアドレスを追加
   - 「編集者」権限を付与

## スプレッドシートの構造

ESシステムは以下の列構造でデータを保存します：

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| 提出日時 | 申請種類 | Minecraftタグ | 年齢 | メールアドレス | 都道府県 | 使用端末/会社名 | 意志表明 | ポートフォリオURL | ステータス |

## メール送信設定（Gmail使用の場合）

1. **Googleアカウントで2段階認証を有効化**

2. **アプリパスワードを生成**
   - https://myaccount.google.com/apppasswords
   - 「メール」を選択してアプリパスワードを生成
   - 生成されたパスワードを`SMTP_PASS`に設定

3. **環境変数例（Gmail）**
   ```env
   GMAIL_USER=aoiroserver.m@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   FROM_EMAIL=noreply@aoiroserver.site
   ```

   **注意**: ESシステムは既存のお問い合わせページと同じメール設定を使用します。

## Discord Webhook設定

1. **Discordサーバーの設定**
   - サーバー設定 → 連携サービス → ウェブフック
   - 新しいウェブフックを作成
   - WebhookのURLをコピー

2. **環境変数設定**
   ```env
   DISCORD_ES_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdef...
   ```

## デバッグ方法

1. **コンソールログの確認**
   - ブラウザの開発者ツール
   - サーバーのターミナル出力

2. **設定状況のチェック**
   - 各環境変数が正しく設定されているか
   - Googleスプレッドシートの権限設定
   - Gmail のアプリパスワード

## 注意事項

- `GOOGLE_PRIVATE_KEY`の改行文字（`\n`）は正確に設定してください
- サービスアカウントには必要最小限の権限のみを付与してください
- 環境変数ファイルは`.gitignore`に追加してコミットしないでください
- アプリパスワードは定期的に更新してください