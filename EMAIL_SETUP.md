# メール送信設定ガイド

## 問題の原因

現在メールが送信されない原因：
1. 環境変数（Gmail SMTP設定）が未設定
2. 古いMailgun設定が残っている可能性

## 解決手順

### 1. 環境変数ファイルの作成

プロジェクトルート（`aoiro-web/`）に`.env.local`ファイルを作成：

```bash
# aoiro-web/.env.local
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
FROM_EMAIL=noreply@aoiroserver.site

# Supabase設定（既存の設定があれば）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# アプリ設定
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Gmailアプリパスワードの取得

1. Googleアカウントにログイン
2. [Googleアカウント設定](https://myaccount.google.com/)にアクセス
3. 「セキュリティ」→「2段階認証」を有効化
4. 「アプリパスワード」を選択
5. 「メール」を選択してパスワードを生成
6. 生成されたパスワードを`GMAIL_APP_PASSWORD`に設定

### 3. 設定の確認

```bash
# サーバーを再起動
npm run dev

# テストメールを送信
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@example.com"}'
```

### 4. 運行情報メールのテスト

1. 通知設定ページにアクセス
2. メールアドレスを登録
3. テストメールを送信
4. 実際の運行情報変更をテスト

## トラブルシューティング

### メールが送信されない場合

1. **環境変数の確認**
   ```bash
   echo $GMAIL_USER
   echo $GMAIL_APP_PASSWORD
   ```

2. **サーバーログの確認**
   ```bash
   # 開発サーバーのログを確認
   npm run dev
   ```

3. **Gmail設定の確認**
   - 2段階認証が有効になっているか
   - アプリパスワードが正しく生成されているか
   - 送信元メールアドレスが正しいか

### スパムフォルダに入る場合

1. **SPFレコードの設定**
   - ドメインのDNS設定でSPFレコードを追加
   - `v=spf1 include:_spf.google.com ~all`

2. **DKIMの設定**
   - GmailのDKIM設定を有効化

3. **送信頻度の調整**
   - 短時間での大量送信を避ける

### データベースエラー

1. **Supabase設定の確認**
   - テーブルが正しく作成されているか
   - RLSポリシーが正しく設定されているか

2. **通知設定の確認**
   - ユーザーが正しく登録されているか
   - 通知設定が有効になっているか

## 設定完了後の確認

1. **テストメールの送信**
   - 通知設定ページでテストメールを送信
   - メールが正常に届くことを確認

2. **運行情報変更のテスト**
   - 管理画面で運行情報を変更
   - メール通知が送信されることを確認

3. **まとめ通知のテスト**
   - 日次・週次まとめ通知の動作確認

## 注意事項

- 環境変数ファイル（`.env.local`）はGitにコミットしない
- 本番環境では適切な環境変数を設定
- Gmailの送信制限に注意（1日500通まで）
- スパム対策として適切な送信頻度を維持 