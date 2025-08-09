# Minecraft ID認証システム設定ガイド

## 概要
AOIROSERVERでのMinecraft ID認証システムの設定手順を説明します。このシステムによって、DiscordアカウントとMinecraft IDを紐付けて、認定メンバーロールを自動付与できます。

## 必要な環境変数

### Discord Bot設定
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_SERVER_ID=your_discord_server_id
DISCORD_MEMBER_ROLE_ID=your_member_role_id
```

### Google Sheets設定（オプション）
```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
```

## 1. Discord Bot設定

### 1.1 Discord Developer Portalでのボット作成
1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」→「Bot」タブ
3. Bot Tokenを取得して`DISCORD_BOT_TOKEN`に設定

### 1.2 必要な権限
ボットに以下の権限を付与してください：
- `Manage Roles` - ロール管理権限
- `View Guild Members` - メンバー情報確認権限
- `Read Message History` - 必要に応じて

### 1.3 サーバーIDと認定メンバーロールIDの取得
1. Discord設定で「開発者モード」を有効化
2. サーバーを右クリック→「IDをコピー」→ `DISCORD_SERVER_ID`に設定
3. 認定メンバーロールを右クリック→「IDをコピー」→ `DISCORD_MEMBER_ROLE_ID`に設定

## 2. Google Sheets設定（オプション）

### 2.1 Google Cloud Projectの作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. Google Sheets APIを有効化

### 2.2 サービスアカウントの作成
1. 「IAM & Admin」→「Service Accounts」
2. 「Create Service Account」をクリック
3. サービスアカウント名を入力
4. 「Keys」タブで「Add Key」→「JSON」
5. ダウンロードしたJSONの内容を`GOOGLE_SERVICE_ACCOUNT_KEY`に設定

### 2.3 スプレッドシートの準備
1. Google Sheetsで新しいスプレッドシートを作成
2. スプレッドシートURLから IDを取得
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
3. `GOOGLE_SPREADSHEET_ID`にIDを設定
4. サービスアカウントのメールアドレスにスプレッドシートの編集権限を付与

## 3. システムの動作フロー

### 3.1 認証手順
1. ユーザーが `/minecraft-auth` にアクセス
2. Discordアカウントで認証
3. Minecraft IDを入力
4. システムがMinecraft IDの存在確認（Mojang API）
5. 存在する場合、Discordサーバーで認定メンバーロールを付与
6. Google Sheetsに認証記録を保存（設定されている場合）

### 3.2 APIエンドポイント
- `POST /api/verify-minecraft-id` - Minecraft ID存在確認
- `POST /api/assign-discord-role` - Discordロール付与
- `POST /api/record-minecraft-auth` - Google Sheets記録

## 4. 使用方法

### 4.1 認証ページのリンク
```
https://your-domain.com/minecraft-auth
```

### 4.2 DiscordでのリンクシェアExample：
```
🎮 **Minecraft ID認証**
AOIROSERVERの認定メンバーになるために、Minecraft IDを認証してください！

👉 認証はこちら: https://aoiroserver.site/minecraft-auth

✅ 認証完了後、自動的に認定メンバーロールが付与されます
```

## 5. トラブルシューティング

### 5.1 よくある問題

**Discord認証が失敗する**
- Discord OAuth設定を確認
- リダイレクトURLが正しく設定されているか確認

**Minecraft ID確認が失敗する**
- Mojang APIが利用可能か確認
- フォールバック機能が動作している場合あり

**ロール付与が失敗する**
- ボットの権限を確認
- ボットのロールがターゲットロールより上位にあるか確認
- ユーザーがサーバーメンバーか確認

**Google Sheets記録が失敗する**
- サービスアカウント設定を確認
- スプレッドシートの共有設定を確認
- Google Sheets APIが有効化されているか確認

### 5.2 ログの確認
ブラウザの開発者ツールまたはサーバーログで詳細なエラー情報を確認できます。

## 6. セキュリティ考慮事項

- Discord Bot Tokenは絶対に公開しないでください
- Google Serviceアカウントキーは安全に管理してください
- 認証ログを定期的に確認し、不正な利用がないか監視してください
- ボットの権限は必要最小限に設定してください

## 7. データ形式

### 7.1 Google Sheetsの出力形式
| 認証日時 | Minecraft ID | Discord表示名 | Discordユーザー名 | Discord User ID |
|---------|-------------|-------------|-----------------|-----------------|
| 2024/01/01 12:00:00 | PlayerName | Display Name | username#1234 | 123456789012345 |

この形式により、Minecraft IDとDiscordアカウントの紐付けを一目で確認できます。
