# 入社申請（ES・カンパニー）機能のGoogleスプレッドシート設定

入社申請・会社一覧・申請管理は、既存のES用Googleスプレッドシート（または同じ `GOOGLE_SERVICE_ACCOUNT_KEY` で参照するスプレッドシート）に以下の**2つのシート**を追加して利用します。

**「GASで保存」の仕組みをわかりやすく知りたい場合** → [docs/GAS保存の仕組み.md](./docs/GAS保存の仕組み.md) を参照してください。

## 使用する環境変数

- **GOOGLE_SERVICE_ACCOUNT_KEY** … 既存のESシステムと同じサービスアカウントJSON
- **GOOGLE_SHEETS_ID** … スプレッドシートID（未設定の場合は既存のES用IDが使われます）

## 1. シート「Companies」（会社一覧）

会社を登録・表示するためのシートです。管理者が「会社を登録」するとここに1行追加されます。

| 列 | 内容 |
|----|------|
| A | id（自動生成UUID） |
| B | name（会社名） |
| C | description（説明） |
| D | location（勤務地） |
| E | employment_type（雇用形態） |
| F | tags（カンマ区切り） |
| G | form_json（応募フォームのJSON） |
| H | max_participants（参加可能人数） |
| I | image_urls（画像URL・カンマ区切り。Supabase等） |
| J | created_at |
| K | active（1=有効, 0=非表示） |

- **フォームJSON（G列）**  
  例: `{"fields":[{"id":"minecraft_tag","label":"Minecraftゲームタグ","type":"text","required":true},{"id":"motivation","label":"志望理由","type":"textarea","required":true}]}`  
  - `type`: `text`, `textarea`, `number`, `url` など
- シートが無い場合は、管理者が初めて「会社を登録」したときにヘッダー行が自動作成されます。事前に空のシート「Companies」を作っておいても問題ありません。

## 2. シート「CompanyApplications」（入社申請一覧）

ユーザーが「応募画面に進む」から送信した申請がここに1行ずつ追加されます。管理者は「申請リスト」で許可・拒否できます。

| 列 | 内容 |
|----|------|
| A | 申請ID（自動生成UUID） |
| B | 申請日時 |
| C | 会社ID |
| D | 会社名 |
| E | メール |
| F | Discord |
| G | Minecraftタグ |
| H | フォーム回答(JSON) |
| I | ステータス（pending / approved / rejected） |

- シートが無い場合は、初回の申請送信時にヘッダー行が自動作成されます。**シート名「CompanyApplications」で空のシートをあらかじめ作成しておく**と確実です（シートが無いと初回作成でエラーになる環境があります）。

## 画像について

会社の画像は **Supabase Storage** などにアップロードし、そのURLを会社登録時の「画像URL」にカンマ区切りで登録してください。会社一覧・詳細のヒーロー画像として表示されます。

## 管理者向け

- **会社の登録・フォーム紐づけ**: 管理画面 → 「入社申請・カンパニー管理」→「会社を登録」タブ
- **申請の確認・許可・拒否**: 同「申請リスト」タブで一覧表示し、各行の「許可」「拒否」でステータスを更新（スプレッドシートのI列が更新されます）

## Google Apps Script でデータを扱う場合

データの保存先は上記のGoogleスプレッドシートです。Next.js側は **Google Sheets API**（`GOOGLE_SERVICE_ACCOUNT_KEY`）で読み書きしています。  
Google Apps Script から同じスプレッドシートを読み書きする場合は、通常の GAS の `SpreadsheetApp.getActiveSpreadsheet()` や指定IDで開いたブックに対して、「Companies」「CompanyApplications」シートを操作するスクリプトを書けば連携できます。GAS側でデータを追加・更新する場合は、Next.js側のAPIは「読み取り」として使い、書き込みはGASに任せる構成も可能です。
