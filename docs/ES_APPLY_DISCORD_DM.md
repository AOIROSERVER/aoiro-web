# 入社申請のDiscord DM通知（画像付き・許可/拒否ボタン）

応募者が「技術確認用画像」を添付して入社申請すると、**画像はDBに保存せず**、その会社の社長（募集作成者）の **Discord DM** に「〇〇さんが入社申請をしています」というメッセージと画像、および **許可 / 拒否** ボタンが送られます。社長がボタンを押すと申請ステータスが更新されます。

## 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `DISCORD_BOT_TOKEN` | Discord Bot のトークン（DM送信・インタラクションに使用） |
| `DISCORD_APPLICATION_PUBLIC_KEY` | Discord 開発者ポータル → アプリ → General Information の **Public Key**（インタラクション署名検証に使用） |

## Discord 開発者ポータルでの設定

1. **Bot** が社長と同じサーバーに参加している必要があります（DM を送るため）。
2. **Interactions Endpoint URL** を設定します。  
   - アプリ → General Information → **Interactions Endpoint URL**  
   - 例: `https://あなたのドメイン/api/discord-interaction`
3. **Public Key** をコピーし、`DISCORD_APPLICATION_PUBLIC_KEY` に設定します。

## 募集作成時の設定

「募集作成」画面で **「技術確認用画像を必須にする」** にチェックを入れると、応募フォームで技術確認用画像が必須になります。チェックを外すと任意です。

## フロー

1. 応募者が応募画面で志望理由・（任意または必須の）技術確認用画像を送信。
2. 申請が Google スプレッドシート（CompanyApplications）に 1 行追加される。画像はスプレッドシートには保存しない。
3. 社長の Discord ID（会社の `created_by_discord_id`）が分かれば、Bot が社長との DM チャンネルを作成し、メッセージ（応募者名・会社名・画像ありの場合その添付・許可/拒否ボタン）を送信。
4. 社長が DM で「許可」または「拒否」ボタンを押すと、`/api/discord-interaction` が呼ばれ、申請ステータスが更新される。許可の場合は AIC 所属も更新。

## 注意

- 社長が Bot と DM を開いたことがない場合、Bot から DM を送ると「メッセージを受信できません」となることがあります。その場合は社長が一度 Bot に DM を送るか、同じサーバーで Bot と接触がある必要があります。
- 画像は 8MB 以下を推奨（Discord の制限に合わせるため）。
