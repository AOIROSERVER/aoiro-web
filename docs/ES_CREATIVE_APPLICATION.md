# クリエイティブ申請フロー

募集で「クリエイティブ必要」にした場合、運営の審査承認後にのみ応募が可能になります。**PDFはDiscordのルームに送るだけで、データベースやストレージには保存しません。**

**アプリのURL**: [https://aoiroserver.site/](https://aoiroserver.site/)

---

## Discord の設定手順（クリエイティブ申請の「許可」「拒否」ボタンを使う場合）

Discord 上のメッセージに表示される **「許可」「拒否」ボタン** を押しただけで審査できるようにするには、次の2つを設定します。

### 1. Interactions Endpoint URL を設定する

Discord が「誰かがボタンを押した」という情報をアプリに送るための URL です。

1. **Discord 開発者ポータル** を開く  
   → [https://discord.com/developers/applications](https://discord.com/developers/applications)  
   （Discord にログインした状態で開いてください）

2. **使っている Bot のアプリ** をクリックして開く  
   （入社申請の DM やクリエイティブ申請のメッセージを送っている Bot と同じアプリです）

3. 左メニューで **「General Information」** をクリックする

4. 画面を下にスクロールし、**「Interactions Endpoint URL」** の入力欄を探す

5. 次の URL を **そのままコピー＆ペースト** する  
   ```
   https://aoiroserver.site/api/discord-interaction
   ```  
   - 末尾の `/` は**付けない**  
   - `https` の `s` を忘れない  
   - スペースや改行が入らないようにする

6. **「Save Changes」** を押す

7. Discord が自動でその URL に接続テスト（PING）を送ります。  
   - 成功すると **「Valid」** と表示されます  
   - 失敗する場合は、下の「うまくいかないとき」を参照してください

---

### 2. 運営の Discord ユーザーID を環境変数に設定する

**「許可」「拒否」ボタンを押してよいのは、運営として登録した Discord アカウントだけ**にしたい場合に設定します。

#### 2-1. 運営の Discord ユーザーID を調べる

1. Discord アプリ（またはブラウザ版）で **「設定」→「詳細設定」** を開く  
2. **「開発者モード」** を **オン** にする  
3. 運営として使う **自分のプロフィール（アイコンや名前）** を右クリック  
4. **「IDをコピー」** を選ぶ  
   → これが「Discord ユーザーID」です（長い数字の並びです）

#### 2-2. 環境変数に登録する

Netlify でアプリを動かしている場合の例です。

1. Netlify の **ダッシュボード** を開く  
2. 対象サイト（aoiroserver）を選ぶ  
3. **「Site configuration」** または **「Site settings」** → **「Environment variables」** を開く  
4. **「Add a variable」** または **「Add env var」** をクリック  
5. 次のように入力する  
   - **Key（キー）**: `DISCORD_OPERATION_USER_ID`  
   - **Value（値）**: さきほどコピーした **Discord ユーザーID**（数字だけ、引用符は不要）  
6. **Save** する  
7. **「Trigger deploy」** などで **再デプロイ** する  
   （環境変数を変えたあとは、再デプロイしないと反映されません）

これで、その Discord アカウントでログインしているときだけ、クリエイティブ申請の「許可」「拒否」ボタンが有効になります。  
他の人が押すと「クリエイティブ申請の許可・拒否は管理者のみ実行できます。」と表示されます。

---

### うまくいかないとき（Interactions Endpoint URL が Valid にならない）

- **「Error submitting form」や「認証できませんでした」と出る場合**  
  - 本番環境（Netlify）に **`DISCORD_APPLICATION_PUBLIC_KEY`** が設定されているか確認する  
  - 値は Discord 開発者ポータルの **「General Information」** にある **「Public Key」**（APPLICATION ID ではありません）をコピーしたもの  
  - 環境変数を直したあとは **必ず再デプロイ** してから、もう一度 **Save Changes** を押す  

- **ボタンを押しても反応しない場合**  
  - Interactions Endpoint URL が **Valid** になっているか確認する  
  - 使っている Bot と、開発者ポータルで開いているアプリが **同じ** か確認する  

より詳しいトラブルシュートは、入社申請用の Discord 設定ガイド **[ES_APPLY_DISCORD_DM.md](./ES_APPLY_DISCORD_DM.md)** の「Interactions Endpoint URL を設定する」の節も参照してください。

---

## 流れ

1. **募集作成**で「クリエイティブ必要」を選ぶと、「クリエイティブ申請（公開はされません）（強制）」で**PDFを1枚以上・最大5枚**アップロード必須。
2. 募集を作成すると、**Discord チャンネル（ID: 1475608910458261525）** に次の内容が送られます（PDFはここにのみ送られ、DBには保存されません）：
   - 「〇〇会社さんがクリエイティブ申請をしています」
   - PDFの添付ファイル（最大5枚）
   - **「許可」「拒否」ボタン**（Discord上で押すとサイトにアクセスせずに審査完了。**管理者＝DISCORD_OPERATION_USER_ID のユーザーのみ**押せます）
   - 「ダッシュボードにアクセス」リンク（従来どおりサイトからも審査可能）
   - @運営（メンション）
3. **会社一覧・アルバイトタブ**では、審査中は「クリエイティブ申請審査中です」と表示され、「応募画面に進む」は押せません。
4. **管理者**が `/es-system/creative-review` で許可・拒否できます（管理者アカウントでのみ操作可能）。
5. 許可されると応募が可能になります。

## 環境変数（まとめ）

| 変数名 | 説明 |
|--------|------|
| `DISCORD_OPERATION_USER_ID` | 運営のDiscordユーザーID。メッセージ内で @メンション され、**このユーザーのみ** Discord の「許可」「拒否」ボタンで審査できます。未設定だとボタンは「管理者のみ実行できます」と返ります。設定方法は上記「Discord の設定手順」を参照。 |

**Interactions Endpoint URL** は、Discord 上でボタンを使う場合 **必須** です。  
→ 開発者ポータルで `https://aoiroserver.site/api/discord-interaction` を設定してください（手順は上記）。

## スプレッドシート（Companies）

次の列が追加されています（R, S, T）。PDFはDiscordにのみ送るため、T列（creative_file_url）は使いません（空のまま）。

| 列 | 内容 |
|----|------|
| R | creative_required（1=必要, 0=不要） |
| S | creative_status（pending / approved / rejected） |
| T | creative_file_url（未使用・互換用に列のみ存在） |

## 募集編集で「クリエイティブ必要」にした場合

過去の投稿一覧から募集を編集して「クリエイティブ必要」にすると、**クリエイティブ申請（PDF）の添付欄**が表示されます（任意・最大5枚）。PDFを添付して保存するとDiscordに送信され、**クリエイティブ申請審査中**になります。PDFを添付せずに保存した場合も審査中になります。承認後に応募が可能になります。
