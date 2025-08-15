# Google Sheets機能 有効化手順

## 概要
Minecraft ID認証システムでGoogle SheetsにMCIDを記録する機能を有効化するための手順です。

## 必要な環境変数

### 1. GOOGLE_SERVICE_ACCOUNT_KEY
Google Cloud Platformで作成したサービスアカウントの秘密鍵（JSON形式）

### 2. GOOGLE_SPREADSHEET_ID
記録先のGoogleスプレッドシートのID

## 設定手順

### Step 1: Google Cloud Platform プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. Google Sheets APIを有効化

### Step 2: サービスアカウントの作成
1. 「IAM と管理」→「サービスアカウント」を選択
2. 「サービスアカウントを作成」をクリック
3. サービスアカウント名を入力（例：`minecraft-auth-sheets`）
4. 「キーを作成」→「JSON」を選択して秘密鍵をダウンロード

### Step 3: スプレッドシートの準備
1. [Google Sheets](https://sheets.google.com/) で新しいスプレッドシートを作成
2. スプレッドシートのURLからIDを取得
   - 例：`https://docs.google.com/spreadsheets/d/1rb2x4ONBTvpawQH-tQvkL-Ah3ziQP0msC23KPrv-204/edit`
   - ID：`1rb2x4ONBTvpawQH-tQvkL-Ah3ziQP0msC23KPrv-204`
3. サービスアカウントのメールアドレスに編集権限を付与

### Step 4: 環境変数の設定

#### Netlifyの場合
1. Netlifyダッシュボードでプロジェクトを選択
2. 「Site settings」→「Environment variables」を選択
3. 以下の環境変数を追加：

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
GOOGLE_SPREADSHEET_ID=1rb2x4ONBTvpawQH-tQvkL-Ah3ziQP0msC23KPrv-204
```

#### ローカル開発の場合
`.env.local`ファイルに追加：

```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SPREADSHEET_ID=1rb2x4ONBTvpawQH-tQvkL-Ah3ziQP0msC23KPrv-204
```

## スプレッドシートの構造

認証が成功した場合、以下の形式でデータが自動追加されます：

| 認証日時 | Minecraft ID | Discord表示名 | Discordユーザー名 | Discord User ID |
|---------|-------------|---------------|------------------|-----------------|
| 2025/01/15 14:30:25 | PlayerName123 | ユーザー名 | username#1234 | 123456789012345678 |
| 2025/01/15 15:45:12 | AnotherPlayer | 未連携 | 未連携 | 未連携 |

## 注意事項

1. **環境変数のサイズ制限**: Netlifyでは環境変数の合計サイズが4KBを超えるとデプロイに失敗する可能性があります
2. **権限の確認**: サービスアカウントがスプレッドシートにアクセスできることを確認してください
3. **API制限**: Google Sheets APIには1日あたりのリクエスト制限があります
4. **記録対象**: 認証が成功したMCIDのみが記録されます（失敗したIDは記録されません）

## トラブルシューティング

### よくあるエラー

#### 1. "Invalid private key" エラー
- 秘密鍵のJSONが正しくコピーされているか確認
- 改行文字（\n）が正しく含まれているか確認

#### 2. "Access denied" エラー
- サービスアカウントのメールアドレスがスプレッドシートの共有設定に含まれているか確認
- 編集権限が付与されているか確認

#### 3. "API not enabled" エラー
- Google Sheets APIが有効化されているか確認
- プロジェクトでAPIが有効化されているか確認

## 動作確認

1. 環境変数を設定
2. アプリケーションを再デプロイ
3. Minecraft ID認証を実行
4. スプレッドシートにデータが追加されることを確認

## ログの確認

ブラウザの開発者ツールまたはサーバーログで以下のメッセージを確認できます：

- `🔍 Google Sheets Configuration:` - 設定状況
- `📝 Data to append:` - 追加されるデータ
- `✅ Data appended successfully:` - 成功時のログ
- `❌ Google Sheets API error:` - エラー時のログ
