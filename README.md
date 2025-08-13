# AOIROSERVERアプリ Web

鉄道運行状況と道路状況を確認できるPWA（Progressive Web App）

## 🎮 Minecraft ID認証システム

AOIROSERVERの認定メンバーになるためのMinecraft ID認証システムを搭載しています。

### 機能
- Discord OAuth認証
- Minecraft ID存在確認（Mojang API）
- **認証成功データのみ**のGoogle Sheets自動集計
- 認定メンバーロールの自動付与

### 設定方法
詳細は `GOOGLE_SHEETS_SETUP.md` を参照してください。

## PWA機能

このアプリはPWA（Progressive Web App）として設計されており、以下の機能を提供します：

### iPhone/Androidでのネイティブアプリ体験
- ホーム画面に追加可能
- Safari/ChromeのURLバーを非表示
- フルスクリーンモードで動作
- オフライン対応

### インストール方法
1. iPhoneの場合：
   - Safariでサイトを開く
   - 共有ボタン（□↑）をタップ
   - 「ホーム画面に追加」を選択
   - アプリ名を確認して「追加」をタップ

2. Androidの場合：
   - Chromeでサイトを開く
   - メニュー（⋮）をタップ
   - 「アプリをインストール」を選択
   - 「インストール」をタップ

### 主な機能
- 鉄道運行状況の確認
- 道路状況の確認
- プッシュ通知
- オフライン対応
- レスポンシブデザイン

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
EMAIL_USER=aoiroserver.m@gmail.com
EMAIL_PASS=your_gmail_app_password

# hCaptcha設定（お問い合わせフォーム用）
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key

# Minecraftサーバー設定
MINECRAFT_SERVER_HOST=your_minecraft_server_host
MINECRAFT_SERVER_PORT=your_minecraft_server_port

# その他の設定
NEXT_PUBLIC_SITE_URL=your_site_url
```

### 3. Gmailアプリパスワードの設定

お問い合わせフォームのメール送信機能を使用するには、Gmailのアプリパスワードを設定する必要があります：

1. Gmailアカウントで2段階認証を有効にする
2. [Googleアカウント設定](https://myaccount.google.com/apppasswords)でアプリパスワードを生成
3. 生成されたパスワードを`EMAIL_PASS`環境変数に設定

### 4. hCaptchaの設定

お問い合わせフォームのスパム対策としてhCaptchaを使用しています：

1. [hCaptcha](https://www.hcaptcha.com/)でアカウントを作成
2. 新しいサイトを追加
3. 取得したSite Keyを`NEXT_PUBLIC_HCAPTCHA_SITE_KEY`に設定
4. 取得したSecret Keyを`HCAPTCHA_SECRET_KEY`に設定

**開発環境では**、テスト用のキーを使用できます：
- Site Key: `10000000-ffff-ffff-ffff-000000000001`
- Secret Key: `0x0000000000000000000000000000000000000000`

### 5. Minecraftサーバー設定

運行状況ページでMinecraftサーバーの稼働状況を表示する機能があります：

1. `MINECRAFT_SERVER_HOST`にサーバーのIPアドレスを設定
2. `MINECRAFT_SERVER_PORT`にサーバーのポート番号を設定

**注意**: セキュリティのため、実際のサーバー情報は環境変数で管理し、Gitにコミットしないでください。

### 6. データベースマイグレーション

#### ログインボーナス機能

ログインボーナス機能を使用するには、必要なテーブルを作成する必要があります：

```bash
# ログインボーナステーブルのSQLファイルを生成
npm run migrate-login-bonus
```

生成されたSQLファイルをSupabaseダッシュボードで実行してください：

1. Supabaseダッシュボードにアクセス
2. SQL Editorを開く
3. 生成されたSQLファイルの内容をコピー&ペースト
4. "Run"ボタンをクリック

または、以下のコマンドでSQLファイルの内容を表示：
```bash
cat supabase/migrations/create_login_bonus_tables.sql
```

#### リリースノート機能

リリースノート機能を使用するには、以下のSQLを実行してください：

1. Supabaseダッシュボードにアクセス
2. SQL Editorを開く
3. 以下のSQLをコピー&ペーストして実行：

```sql
-- リリースノートテーブルの作成
CREATE TABLE IF NOT EXISTS release_notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS（Row Level Security）の設定
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがリリースノートを閲覧できるポリシー
CREATE POLICY "Anyone can view release notes" ON release_notes
  FOR SELECT USING (true);

-- 管理者のみがリリースノートを作成・更新・削除できるポリシー
CREATE POLICY "Admin can manage release notes" ON release_notes
  FOR ALL USING (auth.jwt() ->> 'email' = 'aoiroserver.m@gmail.com');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_release_notes_created_at ON release_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_release_notes_version ON release_notes(version);
CREATE INDEX IF NOT EXISTS idx_release_notes_author ON release_notes(author);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atを自動更新するトリガー
CREATE TRIGGER update_release_notes_updated_at
    BEFORE UPDATE ON release_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

または、以下のコマンドでSQLファイルの内容を表示：
```bash
cat supabase/migrations/create_release_notes_table.sql
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

## 機能

- 鉄道運行情報の表示
- 道路状況の表示
- 乗換案内
- リリースノート管理（管理者専用）
  - 管理者アカウントでログインすると、リリースノートページで新しいリリースノートを作成できます
  - リリースノートはデータベースに保存され、全ユーザーが閲覧できます
- 駅情報
- お問い合わせフォーム（hCaptcha保護）
- ユーザー認証
- プッシュ通知
- ログインボーナス機能（1日100ポイント）

## トラブルシューティング

### ログインボーナスが取得できない場合

1. **データベーステーブルの確認**
   ```bash
   npm run migrate-login-bonus
   ```
   
   生成されたSQLファイルをSupabaseダッシュボードで実行してください。

2. **ブラウザのコンソールでエラーを確認**
   - F12キーを押して開発者ツールを開く
   - Consoleタブでエラーメッセージを確認

3. **Supabaseダッシュボードでの確認**
   - `user_profiles`テーブルと`login_bonus`テーブルが存在するか確認
   - RLSポリシーが正しく設定されているか確認

4. **環境変数の確認**
   - `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しく設定されているか確認

5. **認証デバッグページの確認**
   - `/debug-auth`ページにアクセスして認証状況を確認
   - サーバーサイドとフロントエンドの認証情報を比較

## 技術スタック

- Next.js 14
- React 18
- TypeScript
- Material-UI
- Supabase
- Nodemailer（メール送信）
- hCaptcha（スパム対策）
- Tailwind CSS
