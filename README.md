# AOIROSERVER Web App

鉄道運行情報アプリのWeb版です。

## セットアップ

### 必要な環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# サイトURL（通知送信時に使用）
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Mailgun設定（メール通知機能用）
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain.com
```

### Mailgunの設定

1. [Mailgun](https://www.mailgun.com/)でアカウントを作成
2. ドメインを追加・検証
3. APIキーを取得
4. 上記の環境変数に設定値を入力

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

## 機能

- 運行情報の表示
- プッシュ通知
- メール通知（Mailgun使用）
- 道路情報
- ユーザー認証

## 通知機能

### プッシュ通知
- ブラウザのプッシュ通知機能を使用
- Service Workerでバックグラウンド通知を処理

### メール通知
- Mailgunを使用したメール送信
- 路線別の通知設定
- 通知履歴の管理

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
