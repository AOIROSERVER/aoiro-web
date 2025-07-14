# AOIROSERVER Web

鉄道運行情報アプリのWeb版

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# メール送信設定（お問い合わせフォーム用）
EMAIL_USER=aoiroserver@gmail.com
EMAIL_PASS=your_gmail_app_password

# その他の設定
NEXT_PUBLIC_SITE_URL=your_site_url
```

### 3. Gmailアプリパスワードの設定

お問い合わせフォームのメール送信機能を使用するには、Gmailのアプリパスワードを設定する必要があります：

1. Gmailアカウントで2段階認証を有効にする
2. [Googleアカウント設定](https://myaccount.google.com/apppasswords)でアプリパスワードを生成
3. 生成されたパスワードを`EMAIL_PASS`環境変数に設定

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 機能

- 鉄道運行情報の表示
- 道路状況の表示
- 乗換案内
- 駅情報
- お問い合わせフォーム
- ユーザー認証
- プッシュ通知

## 技術スタック

- Next.js 14
- React 18
- TypeScript
- Material-UI
- Supabase
- Nodemailer（メール送信）
- Tailwind CSS
