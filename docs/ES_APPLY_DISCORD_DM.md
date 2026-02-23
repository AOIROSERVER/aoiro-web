# Discord DM で入社申請（画像付き）を受け取る設定ガイド

応募者が「技術確認用画像」を添付して入社申請すると、**画像はDBに保存されず**、その会社の**社長（募集作成者）の Discord DM** に「〇〇さんが入社申請をしています」というメッセージと画像、および **許可 / 拒否** ボタンが送られます。社長がボタンを押すと申請ステータスが更新されます。

---

## 必要なもの

- Discord 開発者ポータルで作成した **アプリケーション（Bot）**
- **Bot トークン**（環境変数 `DISCORD_BOT_TOKEN`）
- **アプリの Public Key**（環境変数 `DISCORD_APPLICATION_PUBLIC_KEY`）
- **Interactions Endpoint URL**（本番のURLを Discord に登録）
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

## 手順 2: Interactions Endpoint URL を設定する（ボタンで許可/拒否するため必須）

1. 開発者ポータルの **「General Information」** の下の方に **「Interactions Endpoint URL」** があります。
2. 本番で使う URL を入力します。  
   - 例: `https://あなたのドメイン/api/discord-interaction`  
   - ローカルで試す場合は ngrok などで HTTPS の URL を用意し、その URL を登録します。
3. **「Save Changes」** を押すと、Discord がその URL に **PING** を送って確認します。  
   - このサイト側の `/api/discord-interaction` が **PONG** を返すと「Valid」と表示されます。
   - 失敗する場合は、URL が正しいか・サーバーが起動しているか・`DISCORD_APPLICATION_PUBLIC_KEY` が正しく設定されているかを確認してください。

これで、社長が DM 内の「許可」「拒否」ボタンを押したときに、Discord がこの URL にリクエストを送り、サイト側で申請ステータスを更新できます。

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
   - テキスト: 「〇〇 さんが **会社名** への入社申請をしています。下のボタンで許可または拒否してください。」
   - 画像がある場合: その画像が添付される。
   - **許可** と **拒否** のボタン。
4. 社長が **許可** を押すと、申請ステータスが「許可」に更新され、AIC 所属も更新される。
5. **拒否** を押すと、申請ステータスが「拒否」に更新される。

---

## よくあるトラブル

### DM が届かない

- **社長と Bot が同じサーバーにいるか** 確認してください。いないと Bot から DM を送れない場合があります。
- 社長が **「サーバーからの DM」** を許可しているか、Discord のプライバシー設定を確認してください。
- ログに `Discord create DM failed` が出ていないか確認し、失敗している場合はレスポンス内容（403 など）で原因を切り分けます。

### ボタンを押しても反応しない / エラーになる

- **Interactions Endpoint URL** が正しく設定され、**https でアクセス可能**か確認してください。
- **DISCORD_APPLICATION_PUBLIC_KEY** が、開発者ポータルの **Public Key** と完全に一致しているか確認してください（余計な空白や改行が入っていないか）。
- サーバー側の `/api/discord-interaction` のログで、署名検証エラーや 500 が出ていないか確認してください。

### 画像が送られてこない

- 応募画面で **技術確認用画像** を添付して送信しているか確認してください。
- 画像は **8MB 以下** を推奨です（Discord の制限）。

---

## まとめチェックリスト

- [ ] Discord 開発者ポータルで Bot トークンを取得し、`DISCORD_BOT_TOKEN` に設定した
- [ ] General Information の Public Key をコピーし、`DISCORD_APPLICATION_PUBLIC_KEY` に設定した
- [ ] Interactions Endpoint URL に `https://あなたのドメイン/api/discord-interaction` を設定し、Valid になった
- [ ] Bot を社長のいるサーバーに招待した
- [ ] 募集は Discord 連携でログインした社長が作成し、`created_by_discord_id` が保存されている

以上で、入社申請が画像付きで Discord DM に届き、許可/拒否をボタンで行える状態になります。
