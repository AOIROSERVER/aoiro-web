# Discord DM で入社申請（画像付き）を受け取る設定ガイド

応募者が「技術確認用画像」を添付して入社申請すると、**画像はDBに保存されず**、その会社の**社長（募集作成者）の Discord DM** に「〇〇さんが入社申請をしています」というメッセージと画像、および **「ダッシュボードにアクセスする」** リンクボタンが送られます。社長はそのボタンからダッシュボード（自分の投稿）を開き、そこで許可・拒否を行います。

---

## 必要なもの

- Discord 開発者ポータルで作成した **アプリケーション（Bot）**
- **Bot トークン**（環境変数 `DISCORD_BOT_TOKEN`）
- **アプリの Public Key**（環境変数 `DISCORD_APPLICATION_PUBLIC_KEY`）
- **Interactions Endpoint URL**（DM のリンクボタンは URL を開くだけなので、設定しなくても DM は届きます。以前のように Discord 上で許可・拒否ボタンを使う場合は必須でしたが、現在はダッシュボードで操作するため省略可能です）
- 社長が Bot と **同じ Discord サーバーにいる**こと（DM を送るために必要）

---

## 手順 1: Discord 開発者ポータルでアプリを用意する

1. **https://discord.com/developers/applications** にアクセスし、Discord でログインします。
2. 既に Bot 用のアプリがある場合はそれを開き、ない場合は **「New Application」** で新規作成します。
3. 左メニュー **「Bot」** を開きます。
   - **「Reset Token」** でトークンを表示し、**必ずコピーして安全な場所に保存**します。  
     → この値を **環境変数 `DISCORD_BOT_TOKEN`** に設定します。
   - **「Privileged Gateway Intents」** は、DM 送信だけならデフォルトのままで問題ありません。
4. 左メニュー **「General Information」** を開きます。
   - **「APPLICATION ID」** の下にある **「Public Key」** をコピーします。  
     → この値を **環境変数 `DISCORD_APPLICATION_PUBLIC_KEY`** に設定します。

---

## 手順 2: Interactions Endpoint URL を設定する（任意・DM にリンクボタンのみ表示する場合は不要）

### 何を入力するか

**Interactions Endpoint URL** には、**あなたのサイトの本番URL + `/api/discord-interaction`** を入力します。

- **形式**: `https://あなたのドメイン/api/discord-interaction`
- **例（Netlify の場合）**: `https://あなたのサイト名.netlify.app/api/discord-interaction`
- **例（独自ドメイン）**: `https://aoiro.example.com/api/discord-interaction`
- **注意**: 末尾にスラッシュ（`/`）は付けません。`/api/discord-interaction` までで止めます。

### 入力の手順

1. Discord 開発者ポータルで **「General Information」** を開く。
2. 下の方にある **「Interactions Endpoint URL」** の入力欄をクリックする。
3. 上記の形式で URL を**1文字も間違えず**に貼り付ける（`https` 必須・スペースや改行が入らないようにする）。
4. **「Save Changes」** を押す。
5. Discord がその URL に **PING** を送って検証する。成功すると「Valid」と表示される。

### 「Error submitting form. Please try again, or click here to contact support.」が出る場合

このメッセージは、**Save を押したあと Discord があなたの URL に PING を送ったが、正しい応答が返ってこなかった**ときに表示されます。

**確認すること（順に試してください）**:

1. **URL が本番で動いているか**  
   ブラウザで `https://あなたのドメイン/api/discord-interaction` を **POST** で開くことはできないので、代わりに **サイトのトップ**（例: `https://あなたのドメイン/`）が開くか確認する。トップが開く = デプロイされている。

2. **URL の typo**  
   - `https` になっているか  
   - ドメインのあとに `/api/discord-interaction` が**必ず**続いているか  
   - 末尾に余計な `/` やスペースが付いていないか  

3. **環境変数が本番に入っているか**  
   Netlify などでは、**本番の Environment variables** に `DISCORD_APPLICATION_PUBLIC_KEY` が設定されていないと、PING への応答（署名検証）が失敗し、Discord が「Valid」にしません。  
   → Netlify の **Site settings → Environment variables** で、**Production** に `DISCORD_APPLICATION_PUBLIC_KEY` が入っているか確認する。

4. **保存してから再度デプロイ**  
   環境変数を追加・変更したあとは **「Trigger deploy」などで再デプロイ**しないと反映されません。再デプロイ後に、もう一度 Interactions Endpoint URL を開いて **Save Changes** を押し直す。

5. **しばらく待ってから再度 Save**  
   デプロイ直後は CDN の反映で数分かかることがあります。数分後に再度 Save を試す。

#### 「指定されたインタラクション・エンドポイントURLを認証できませんでした」（PATCH 400 / Validation errors）

Save を押したときにこのメッセージが出る場合は、**Discord があなたの URL に POST（PING）を送ったが、署名検証が通らなかった**状態です。次を順に確認してください。

1. **Public Key の形式**
   - 開発者ポータル **General Information** の **Public Key** は **64文字の英数字（16進数）** です。
   - コピー時に**前後にスペースや改行が入っていないか**確認し、もう一度コピーして環境変数に貼り直してください。コード側で前後の空白は自動で除去するようにしていますが、途中に空白が入っていると検証に失敗します。
   - **APPLICATION ID** ではなく **Public Key** をコピーしているかも確認してください（別の項目です）。

2. **Netlify の環境変数スコープ**
   - **Site settings → Environment variables** で `DISCORD_APPLICATION_PUBLIC_KEY` の **Scopes** を確認します。
   - **Build** だけにチェックが入っていると、**実行時（Functions）では変数が読めず**、署名検証で失敗します。
   - **All** または **Deploy previews** を含むようにするか、少なくとも **Production のランタイムで使う**スコープに含めてください。Netlify の Next では API ルートはサーバー（Functions）で動くため、**ランタイムで参照できる**ようにする必要があります。

3. **同じアプリの Key か**
   - ブラウザの URL が `.../applications/1339549341676998656/...` のように **Application ID** を含んでいます。  
   - 使っている **Public Key** は、**この同じアプリ**の General Information にあるものですよね？ 別のアプリの Key を貼っていると検証できません。

4. **再デプロイ後に Save**
   - 環境変数を直したあとは **必ず「Trigger deploy」で再デプロイ**し、デプロイ完了後に Discord で再度 **Save Changes** を押してください。古いビルドのままでは変数が反映されません。

5. **ログで 401 / 500 を確認**
   - Netlify の **Functions のログ**（またはデプロイログ）で、Discord が PING を送ったタイミングに `/api/discord-interaction` へのリクエストが 401 や 500 で返っていないか確認します。  
   - 401 = 署名不一致（Key の値・形式の見直し）、500 = キー未設定やサーバーエラーです。

正しく設定できていると、Save 後に **「Valid」** と表示されます。現在は DM に「ダッシュボードにアクセスする」リンクのみ表示し、許可・拒否はダッシュボードで行うため、Interactions Endpoint URL を未設定のままでも利用できます。

---

## 手順 3: Bot をサーバーに追加する

1. 開発者ポータル左メニュー **「OAuth2」→「URL Generator」** を開きます。
2. **SCOPES** で **「bot」** にチェックを入れます。
3. **BOT PERMISSIONS** は、DM を送るだけなら「Send Messages」など最小限で構いません（必要に応じて設定）。
4. 一番下に表示される **Generated URL** をコピーし、ブラウザで開きます。
5. **社長がログインしている Discord のサーバー** を選び、Bot を招待します。  
   → 社長と Bot が**同じサーバーにいる**状態にすると、Bot から社長へ DM を送れるようになります。

※ 社長が Bot に一度でも DM を送ったことがあれば、別サーバーでも DM が届く場合がありますが、**同じサーバーにいる**設定にしておくのが確実です。

---

## 手順 4: 環境変数を設定する

本番・ステージングの環境変数に次を設定します。

| 変数名 | 値 | 取得場所 |
|--------|-----|----------|
| `DISCORD_BOT_TOKEN` | Bot のトークン | 開発者ポータル → Bot → Reset Token |
| `DISCORD_APPLICATION_PUBLIC_KEY` | アプリの Public Key | 開発者ポータル → General Information → Public Key |

- Netlify / Vercel などでは、**Environment variables** に上記を追加します。
- ローカルでは `.env.local` に `DISCORD_BOT_TOKEN=...` と `DISCORD_APPLICATION_PUBLIC_KEY=...` を書きます。

---

## 手順 5: 募集作成で「技術確認用画像」を設定する

1. サイトの **「会社一覧」** などから **「募集作成」** を開きます。
2. 応募フォーム設定で **「技術確認用画像を必須にする」** にチェックを入れると、応募時に画像が必須になります。チェックを外すと任意です。
3. 募集を保存すると、その募集の**作成者（社長）**の Discord アカウントが `created_by_discord_id` として記録されます。  
   → 入社申請が送信されると、**この Discord ID 宛に DM** が送られます。

※ 社長は **Discord 連携でログインした状態で** 募集を作成している必要があります（そうでないと `created_by_discord_id` が保存されず、DM が送られません）。

---

## 届く DM の流れ（イメージ）

1. 応募者が応募画面で **志望理由** と（任意または必須の）**技術確認用画像** を送信する。
2. 申請が **Google スプレッドシート（CompanyApplications）** に 1 行追加される（画像はスプレッドシートには保存されない）。
3. 社長の **Discord ID** が分かっている場合、Bot が **社長との DM チャンネル** を作成し、次の内容を送信する：
   - テキスト: 「〇〇 さんが **会社名** への入社申請をしています。ダッシュボードで許可・拒否できます。」
   - 画像がある場合: その画像が添付される。
   - **「ダッシュボードにアクセスする」** リンクボタン（押すと https://aoiroserver.site/es-system/recruit/my/ が開く）。
4. 社長が **ダッシュボード（自分の投稿）** を開き、該当申請の **✅（許可）** または **❌（拒否）** を押すと、申請ステータスが更新される。許可の場合は AIC 所属も更新される。

---

## よくあるトラブル

### DM が届かない

1. **社長の Discord ID が保存されていない**
   - 募集は **Discord でログインしたユーザー**が「募集作成」で作った場合だけ、`created_by_discord_id` が Google スプレッドシート（Companies シートの M 列）に保存されます。
   - 昔作った募集や、Discord 以外でログインして作った募集では M 列が空のため、**DM は送られません**（申請自体は受け付けられ、申請一覧には出ます）。
   - **対処**: その募集を一度「編集」して保存し直すか、スプレッドシートで該当会社の M 列に社長の Discord ユーザーID を手動で入れてください。

2. **社長と Bot が同じサーバーにいるか**
   - Bot と社長が**同じ Discord サーバー**にいないと、Bot から社長へ DM を送れないことがあります。
   - **対処**: Bot を社長のいるサーバーに招待してください。

3. **Discord の DM 設定**
   - 社長が **「サーバーからの DM」** を拒否していると届きません。Discord のプライバシー設定を確認してください。

4. **サーバーログで原因を確認**
   - デプロイ先のログに次のメッセージが出ていないか確認してください。
   - `[es-apply] 社長のDiscord IDがありません` → 上記 1 のとおり、M 列（created_by_discord_id）が空です。
   - `[es-apply] Discord create DM failed:` → Discord API が DM 作成を拒否（403 が多い）。上記 2・3 を確認。
   - `[es-apply] Discord send message failed:` → DM は開けたがメッセージ送信に失敗。レスポンス本文で理由を確認。

5. **申請は成功しているが DM だけ届かない場合**
   - 申請完了画面で「社長へのDiscord通知は送れていません。申請は管理者・社長が申請一覧から確認できます。」と出る場合、申請は受け付け済みです。社長は「過去の投稿一覧」→ 該当募集の「申請一覧」で許可・拒否できます。

### ボタンを押しても反応しない / エラーになる

- 現在は DM に「**ダッシュボードにアクセスする**」リンクボタンが表示され、許可・拒否は **ダッシュボード（自分の投稿）** の申請一覧で **✅（許可）** と **❌（拒否）** の記号で行います。Discord 上でボタンが反応しない事象は発生しません。
- ダッシュボードの **https://aoiroserver.site/es-system/recruit/my/** が開くか、申請一覧で ✅ / ❌ が押せるか確認してください。

### 画像が送られてこない

- 応募画面で **技術確認用画像** を添付して送信しているか確認してください。
- 画像は **8MB 以下** を推奨です（Discord の制限）。

### 「Error submitting form. Please try again, or click here to contact support.」（dis.gd/contact）

- このメッセージは **Discord 側**のエラーです（ログインや埋め込みなどで Discord がエラーを返したときに表示されます）。
- 入社申請フォームそのもののエラーではありません。申請が送信できているかは、画面に「申請を送信しました」と出るか、申請一覧にその申請が並ぶかで確認してください。
- DM が届かない場合は、上記「DM が届かない」を参照してください。

---

## まとめチェックリスト

- [ ] Discord 開発者ポータルで Bot トークンを取得し、`DISCORD_BOT_TOKEN` に設定した
- [ ] General Information の Public Key をコピーし、`DISCORD_APPLICATION_PUBLIC_KEY` に設定した
- [ ] Interactions Endpoint URL は任意（設定する場合は `https://あなたのドメイン/api/discord-interaction` で Valid にできる）
- [ ] Bot を社長のいるサーバーに招待した
- [ ] 募集は Discord 連携でログインした社長が作成し、`created_by_discord_id` が保存されている

以上で、入社申請が画像付きで Discord DM に届き、DM の「ダッシュボードにアクセスする」から自分の投稿を開いて ✅ / ❌ で許可・拒否できる状態になります。
