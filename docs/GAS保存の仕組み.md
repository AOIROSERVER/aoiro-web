# 募集データの保存の仕組み（GAS・Supabase）

「GASで保存」＝**Googleスプレッドシート（Google Sheets）に保存**するという意味です。  
このプロジェクトでは、**文字データはすべてGoogleスプレッドシート**に書き込み、**アイキャッチ画像だけSupabase**に保存しています。

---

## 1. データの流れ（全体像）

```
【募集作成】
  募集作成ページで入力
       ↓
  アイキャッチ画像 → ブラウザから Supabase Storage（recruit-eyecatch）に直接アップロード → 画像のURLを取得
  その他のテキスト → そのままAPIに送信
       ↓
  Next.js API（/api/es-companies）
       ↓
  Google Sheets API を使ってスプレッドシートの「Companies」シートに1行追加
  （画像は「画像のURL」としてスプレッドシートに保存）

【入社申請】
  応募フォームで入力
       ↓
  Next.js API（/api/es-apply）
       ↓
  同じくGoogle Sheets API で「CompanyApplications」シートに1行追加
```

- **文字・数値・JSON** → すべて **Googleスプレッドシート** に保存されます。
- **画像ファイル** → **Supabase Storage**（バケット名 `recruit-eyecatch`）に**ブラウザから直接**アップロードし、その **URL（文字列）** をスプレッドシートの「画像URL」列に保存します。  
  - 認証はログイン中のセッション（anon key + JWT）で行うため、**SUPABASE_SERVICE_ROLE_KEY は不要**です。  
  - Supabase ダッシュボードでバケット `recruit-eyecatch` を public 作成し、Storage の RLS で「認証済みユーザーが INSERT 可能」にしてください。

---

## 2. 「GASで保存」とは？（もう少し詳しく）

- **GAS** は Google Apps Script の略ですが、ここでは **「Googleのスプレッドシートに保存する」** という意味で使っています。
- 実際の書き込みは **Next.js の API** が **Google Sheets API** を使って行います。
- 用意するものは次の2つです：
  1. **Googleスプレッドシート**（会社一覧・申請一覧を書く場所）
  2. **サービスアカウントの鍵（JSON）**（Next.js がスプレッドシートに書き込む権限）

Google Apps Script（.gs）のコードを自分で書かなくても、**環境変数で鍵を渡すだけで、Next.js から直接スプレッドシートに保存**できます。

---

## 3. 設定手順（GAS＝スプレッドシートに保存するために）

### ステップ1: スプレッドシートを用意する

1. [Google スプレッドシート](https://sheets.google.com/) で新しいスプレッドシートを作成するか、既存のES用のスプレッドシートを使う。
2. スプレッドシートの **URL** から **ID** をコピーする。  
   例: `https://docs.google.com/spreadsheets/d/【ここがID】/edit`  
   → この **ID** をあとで環境変数に書く。

### ステップ2: シート（タブ）を2つ作る

同じスプレッドシート内に、次の **名前** でシートを2つ作る（中身は空でOK）。

| シート名 | 用途 |
|----------|------|
| **Companies** | 募集（会社・プロジェクト）一覧。募集作成で1行ずつ追加される。 |
| **CompanyApplications** | 入社申請一覧。ユーザーが応募するたびに1行追加される。 |

最初の1行は **ヘッダー行** として、初回保存時に自動で作られる場合もありますが、手動で作っておいても問題ありません。

### ステップ3: Google Cloud でサービスアカウントを作る

1. [Google Cloud Console](https://console.cloud.google.com/) を開く。
2. プロジェクトを選ぶ（または新規作成）。
3. **「APIとサービス」→「認証情報」** を開く。
4. **「認証情報を作成」→「サービスアカウント」** を選ぶ。
5. 名前（例: `es-sheets-writer`）を入れて作成。
6. 作成したサービスアカウントを開き、**「キー」タブ → 「鍵を追加」→「新しい鍵を作成」→「JSON」** で鍵をダウンロードする。
7. ダウンロードした **JSON ファイルの中身を、1行の文字列としてコピー** する（改行を消してよい。またはそのままでも可）。

### ステップ4: スプレッドシートにサービスアカウントを共有する

1. ダウンロードしたJSONの中に `"client_email": "xxxxx@xxxxx.iam.gserviceaccount.com"` のようなメールアドレスがある。
2. 用意した **Googleスプレッドシート** を開き、**「共有」** から、この **メールアドレス** を **編集者** として追加する。

これで、Next.js からそのスプレッドシートに書き込めるようになります。

### ステップ5: 環境変数を設定する

`.env.local`（または本番の環境変数）に次の2つを設定する。

```env
# ステップ1でコピーしたスプレッドシートのID
GOOGLE_SHEETS_ID=ここにスプレッドシートID

# ステップ3でダウンロードしたJSONの中身を、そのまま1行で貼り付ける
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...", ...}
```

- `GOOGLE_SERVICE_ACCOUNT_KEY` は **JSON 全体を1つの文字列** として入れる。
- 本番（Netlify など）では、環境変数のサイズ制限に注意（大きい場合は「シークレット」や「ファイル」で渡す方法を検討）。

ここまで設定すると、**募集作成・入社申請** のデータが、すべて **GAS（＝Googleスプレッドシート）** に保存されます。

---

## 4. アイキャッチ画像だけ Supabase に保存する理由

- 画像ファイルは **バイナリで大きく**、スプレッドシートのセルには向かないため、**画像本体はSupabase Storage** にアップロードします。
- アップロード後に **公開URL** が返るので、その **URL（文字列）** だけをスプレッドシートの「画像URL」列に保存します。
- 一覧・詳細ページでは、そのURLを参照して画像を表示します。

**設定:**

1. Supabase の **Storage** で、バケット名 **`recruit-eyecatch`** を作成する。
2. バケットを **公開（public）** にすると、アップロードした画像のURLをそのまま表示できます。
3. 既に `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` が設定されていれば、募集作成ページの「アイキャッチ画像」アップロードがそのまま使えます。

---

## 5. シートの列の意味（参照）

### Companies シート（募集一覧）

| 列 | 内容 |
|----|------|
| A | id（自動） |
| B | name（会社名・プロジェクト名） |
| C | description（説明） |
| D | location（勤務地・場所） |
| E | employment_type（雇用形態） |
| F | tags（タグ・カンマ区切り） |
| G | form_json（応募フォームのJSON） |
| H | max_participants（参加可能人数） |
| I | image_urls（アイキャッチのURL。SupabaseのURLが入る） |
| J | created_at |
| K | active（1=表示する, 0=非表示） |

### CompanyApplications シート（入社申請一覧）

| 列 | 内容 |
|----|------|
| A | 申請ID |
| B | 申請日時 |
| C | 会社ID |
| D | 会社名 |
| E | メール |
| F | Discord |
| G | Minecraftタグ |
| H | フォーム回答（JSON） |
| I | ステータス（pending / approved / rejected） |

---

## 6. まとめ

- **文字などテキストデータ** → すべて **GAS（Googleスプレッドシート）** に保存。  
  設定は **GOOGLE_SHEETS_ID** と **GOOGLE_SERVICE_ACCOUNT_KEY** の2つ。
- **アイキャッチ画像** → **Supabase Storage** に保存し、**画像のURLだけ** をスプレッドシートに記録。
- 募集作成ページで「募集を作成（GASに保存）」を押すと、上記の流れでスプレッドシートとSupabaseに保存されます。
