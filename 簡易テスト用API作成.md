# 簡易テスト用API作成とデバッグ

## 作成したテストAPI
- **パス**: `/api/test`
- **ファイル**: `src/app/api/test/route.ts`
- **メソッド**: GET, POST

## テスト手順

### 1. ブラウザでテスト
```
http://localhost:3000/api/test
```

### 2. curlでテスト
```bash
# GET テスト
curl http://localhost:3000/api/test

# POST テスト  
curl -X POST http://localhost:3000/api/test
```

### 3. 期待結果
```json
{
  "message": "APIテスト成功",
  "timestamp": "2024-12-02T...",
  "status": "OK"
}
```

## 404エラーの原因と対処法

### A. Next.js設定問題
- `next.config.js` の確認
- APIルート設定の確認

### B. ファイル配置問題
- `src/app/api/[name]/route.ts` 形式の確認
- ファイル名の確認（必ず `route.ts`）

### C. 開発サーバー問題
- 純粋なNext.js: `npx next dev`
- Netlify: `netlify dev`
- ポート確認: 3000 vs 8888

### D. ビルドエラー
- TypeScriptエラーの確認
- 依存関係の確認

## トラブルシューティング段階

### ステップ1: 基本API確認
- `/api/test` が動作するか

### ステップ2: 既存API確認  
- `/api/status` が動作するか

### ステップ3: 目標API確認
- `/api/send-points` が動作するか

### ステップ4: フロントエンド統合
- UIからのAPIコール確認