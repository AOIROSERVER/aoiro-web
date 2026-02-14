# 列車位置情報のテスト方法

開発環境でNetlify Functionsをシミュレートした列車位置情報機能をテストする方法です。

## セットアップ

1. 開発サーバーを起動
```bash
cd aoiro-web
npm run dev
```

## テスト方法

### 方法1: テストスクリプトを使用（推奨）

```bash
node test-train-position.js
```

このスクリプトは以下のことを行います：
- 複数の列車位置情報を送信
- 保存された位置情報を取得して表示

### 方法2: ブラウザで列車位置情報ページを開く

1. ブラウザで以下を開く：
   ```
   http://localhost:3000/train-status/JY1/train-position?line=山手線&direction=外回り
   ```

2. または、運行情報ページから：
   - `http://localhost:3000/train-status` を開く
   - 山手線を選択
   - 「列車位置情報」ボタンをクリック

### 方法3: curlで直接APIをテスト

#### 列車位置情報を送信

```bash
# 山手線外回りが東京に到着
curl -X POST http://localhost:3000/api/netlify/functions/webhook-discord \
  -H "Content-Type: application/json" \
  -d '{"content": "山手線/外回り/東京到着"}'

# 新しい形式（タグ付き）
curl -X POST http://localhost:3000/api/netlify/functions/webhook-discord \
  -H "Content-Type: application/json" \
  -d '{"content": "JYO1/山手線/外回り/渋谷到着"}'
```

#### 位置情報を取得

```bash
curl -X POST http://localhost:3000/api/netlify/functions/webhook-discord \
  -H "Content-Type: application/json" \
  -d '{"action": "get"}'
```

## メッセージ形式

### 古い形式（3つの部分）
```
山手線/外回り/東京到着
```
- 路線名/方向/駅名到着

### 新しい形式（4つの部分）
```
JYO1/山手線/外回り/東京到着
```
- タグ/路線名/方向/駅名到着

## 対応している路線

- 山手線（内回り・外回り）
- 京浜東北線（上り・下り）
- 東海道新幹線（上り・下り）
- 総武線
- 中央線
- 丸の内線
- 日比谷線
- 銀座線
- 東海道線
- 横須賀線
- あきが丘線

## 注意事項

- 開発環境では、位置情報はサーバーのメモリに保存されます
- サーバーを再起動すると、保存された位置情報は消えます
- 本番環境では、Netlify Functionsが自動的に使用されます

## Discord連携（オプション）

Discordから実際のメッセージを取得するには、`.env.local`に以下を設定：

```env
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id
```

設定がない場合は、テスト用のモックデータが返されます。
