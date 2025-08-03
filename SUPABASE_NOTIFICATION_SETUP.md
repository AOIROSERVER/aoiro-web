# Supabase通知システム セットアップガイド

## 概要
このプロジェクトでは、FirebaseからSupabaseに通知システムを移行しました。Supabaseを使用することで、より統合されたデータベース管理と通知機能を提供します。

## セットアップ手順

### 1. Supabaseデータベースの設定

#### 1.1 通知関連テーブルの作成
以下のSQLをSupabaseのSQLエディタで実行してください：

```sql
-- 通知トークン管理テーブル
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('web', 'ios', 'android')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 通知設定テーブル
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, line_id)
);

-- 通知履歴テーブル
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  line_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);
```

#### 1.2 RLS（Row Level Security）の設定
各テーブルに対して適切なセキュリティポリシーを設定してください。

### 2. 環境変数の設定

`.env.local`ファイルに以下の環境変数を追加してください：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# サイトURL（通知送信時に使用）
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 通知機能の使用方法

#### 3.1 通知コンポーネントの使用
運行状況管理ページ（`/train-status/management`）に通知設定コンポーネントが追加されています。

```tsx
import { SupabaseNotification } from '../components/SupabaseNotification';

// コンポーネント内で使用
<SupabaseNotification />
```

#### 3.2 通知の送信
運行情報が更新された際に、自動的に通知が送信されます。

手動で通知を送信する場合：

```typescript
const response = await fetch('/api/notify-train-status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    lineId: 'CA',
    lineName: '東海道新幹線',
    status: '遅延',
    details: '東京〜新横浜間で遅れが発生しています'
  })
});
```

### 4. 通知履歴の取得

```typescript
const response = await fetch(`/api/supabase-notify?userId=${userId}&limit=50`);
const { notifications } = await response.json();
```

### 5. Service Worker

`public/supabase-sw.js`がService Workerとして動作し、バックグラウンドでの通知受信を処理します。

## 主な変更点

### FirebaseからSupabaseへの移行
- ✅ Firebase Cloud Messaging → Supabase通知システム
- ✅ Firebase Admin SDK → Supabase Client/Server
- ✅ Firebaseトークン管理 → Supabaseデータベース管理

### 新機能
- ✅ 通知履歴の保存と管理
- ✅ ユーザー別の通知設定
- ✅ 通知の既読管理
- ✅ より詳細な通知データ

### 削除されたファイル
- `public/firebase-messaging-sw.js`
- `public/service-worker.js`
- `src/components/TrainStatusNotification.tsx`
- `src/pages/api/notify-train-status.ts`

## トラブルシューティング

### 通知が表示されない場合
1. ブラウザの通知許可を確認
2. Service Workerが正しく登録されているか確認
3. Supabaseの接続設定を確認

### データベースエラーが発生する場合
1. RLSポリシーが正しく設定されているか確認
2. テーブルが正しく作成されているか確認
3. 環境変数が正しく設定されているか確認

## 今後の改善点

1. **Web Push APIの実装**: 実際のプッシュ通知送信機能
2. **VAPIDキーの設定**: より安全な通知送信
3. **通知テンプレート**: より豊富な通知内容
4. **通知の優先度設定**: 重要度に応じた通知管理
5. **通知のグループ化**: 関連する通知のまとめ表示

## 注意事項

- 現在の実装では、実際のプッシュ通知送信は簡易版となっています
- 本格的なプッシュ通知には、Web Push APIとVAPIDキーの設定が必要です
- 通知履歴はSupabaseデータベースに保存されるため、適切なデータ管理が必要です 