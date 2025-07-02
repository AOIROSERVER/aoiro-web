# Mailgunメール通知機能 セットアップガイド

## 概要
このプロジェクトでは、Mailgunを使用して運行状況の更新をメールで通知する機能を実装しています。

## セットアップ手順

### 1. Mailgunアカウントの作成

1. [Mailgun](https://www.mailgun.com/)にアクセス
2. アカウントを作成
3. メールアドレスを確認

### 2. ドメインの追加

1. Mailgunダッシュボードで「Domains」を選択
2. 「Add New Domain」をクリック
3. ドメイン名を入力（例: `mg.yourdomain.com`）
4. ドメインを追加

### 3. ドメインの検証

1. 追加したドメインの設定画面でDNSレコードを確認
2. 以下のDNSレコードをドメインに追加：
   - TXTレコード（SPF）
   - MXレコード
   - CNAMEレコード

### 4. APIキーの取得

1. Mailgunダッシュボードで「Settings」→「API Keys」を選択
2. 「Private API Key」をコピー

### 5. 環境変数の設定

`.env.local`ファイルに以下の環境変数を追加：

```env
# Mailgun設定
MAILGUN_API_KEY=your_private_api_key_here
MAILGUN_DOMAIN=your_domain.mailgun.org
```

### 6. データベースの設定

SupabaseのSQLエディタで以下のマイグレーションを実行：

```sql
-- メール通知設定テーブル
CREATE TABLE IF NOT EXISTS email_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  line_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, line_id)
);

-- メール通知履歴テーブル
CREATE TABLE IF NOT EXISTS email_notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mailgun_message_id TEXT
);

-- RLSポリシーの設定
ALTER TABLE email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notification_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知設定のみアクセス可能
CREATE POLICY "Users can view own email notification settings" ON email_notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email notification settings" ON email_notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email notification settings" ON email_notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email notification settings" ON email_notification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ユーザーは自分の通知履歴のみアクセス可能
CREATE POLICY "Users can view own email notification history" ON email_notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email notification history" ON email_notification_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 使用方法

### 1. メール通知設定

1. アプリにログイン
2. 「設定」→「通知設定」→「メール通知設定」にアクセス
3. 通知先メールアドレスを設定
4. 路線別の通知設定を有効/無効に切り替え

### 2. テストメールの送信

メール通知設定画面で「テストメール送信」ボタンをクリックして、設定を確認できます。

### 3. 通知履歴の確認

「通知履歴」ボタンから、過去に送信されたメール通知の履歴を確認できます。

## メールテンプレート

送信されるメールには以下の情報が含まれます：

- 路線名
- 運行状況（遅延、運転見合わせ、平常運転など）
- 詳細情報（設定されている場合）
- 詳細ページへのリンク
- 配信停止の案内

## トラブルシューティング

### メールが送信されない場合

1. 環境変数が正しく設定されているか確認
2. MailgunのAPIキーが有効か確認
3. ドメインが正しく検証されているか確認
4. ブラウザのコンソールでエラーメッセージを確認

### メールがスパムフォルダに入る場合

1. SPFレコードが正しく設定されているか確認
2. DKIMレコードを設定
3. メールの送信頻度を調整

### データベースエラーが発生する場合

1. RLSポリシーが正しく設定されているか確認
2. テーブルが正しく作成されているか確認
3. ユーザーがログインしているか確認

## 料金について

Mailgunの料金体系：
- 無料プラン: 月5,000通まで
- 有料プラン: 月5,000通を超える場合

詳細は[Mailgunの料金ページ](https://www.mailgun.com/pricing)を確認してください。

## セキュリティ

- APIキーは環境変数で管理
- ユーザーは自分の通知設定のみアクセス可能
- メールアドレスの検証機能を実装予定
- 配信停止機能を実装予定 