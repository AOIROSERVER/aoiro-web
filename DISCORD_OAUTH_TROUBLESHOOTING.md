# Discord OAuth トラブルシューティングガイド

## 問題: 「セッションの設定に失敗しました」エラー

### 1. 即座に確認すべき項目

#### 1.1 Discord Developer Portal設定
- [ ] **Client ID**が正しく設定されているか
- [ ] **Client Secret**が正しく設定されているか
- [ ] **Redirects**に以下が正確に追加されているか：
  ```
  https://aoiroserver.site/auth/callback
  https://cqxadmvnsusscsudrmqd.supabase.co/auth/v1/callback
  http://localhost:3000/auth/callback
  ```
- [ ] **Scopes**で以下が選択されているか：
  - [ ] `identify`
  - [ ] `email`

#### 1.2 Supabase設定
- [ ] **Authentication** → **Providers** → **Discord**が有効になっているか
- [ ] **Client ID**がDiscord Developer Portalと一致しているか
- [ ] **Client Secret**がDiscord Developer Portalと一致しているか
- [ ] **Redirect URLs**に以下が設定されているか：
  ```
  https://aoiroserver.site/auth/callback
  http://localhost:3000/auth/callback
  ```

#### 1.3 環境変数
- [ ] `NEXT_PUBLIC_SUPABASE_URL`が正しく設定されているか
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しく設定されているか

### 2. デバッグ手順

#### 2.1 ブラウザの開発者ツールで確認
1. F12キーを押して開発者ツールを開く
2. **Console**タブでエラーメッセージを確認
3. **Network**タブでリクエストURLを確認

#### 2.2 確認すべきログ
```javascript
// ブラウザコンソールで確認
console.log('🎮 Discord OAuth Debug Info:');
console.log('- Provider:', provider);
console.log('- Redirect URL:', redirectUrl);
console.log('- Origin:', window.location.origin);
```

#### 2.3 Supabaseログで確認
1. Supabaseダッシュボード → **Logs**
2. **Authentication**ログでエラー内容を確認
3. エラーメッセージを記録

### 3. よくある問題と解決方法

#### 3.1 「redirect_uri_mismatch」エラー
**原因**: Discord Developer PortalとSupabaseのリダイレクトURIが一致していない

**解決方法**:
1. Discord Developer PortalでリダイレクトURIを確認
2. SupabaseでリダイレクトURIを確認
3. 両方が完全に一致するように設定

#### 3.2 「client_id_error」エラー
**原因**: Client IDが正しく設定されていない

**解決方法**:
1. Discord Developer PortalでClient IDを再確認
2. SupabaseでClient IDを再設定
3. 環境変数を再確認

#### 3.3 「invalid_grant」エラー
**原因**: 認証コードが無効または期限切れ

**解決方法**:
1. ブラウザのキャッシュをクリア
2. シークレットウィンドウで試行
3. 別のブラウザで試行

### 4. テスト手順

#### 4.1 基本テスト
1. `/login`ページで「Discordでログイン」ボタンをクリック
2. Discord認証画面にリダイレクトされるか確認
3. Discordアカウントでログイン後、アプリに戻るか確認

#### 4.2 詳細テスト
1. ブラウザの開発者ツールを開いたままテスト
2. コンソールログを確認
3. ネットワークタブでリクエストを確認

### 5. 設定確認チェックリスト

#### 5.1 Discord Developer Portal
- [ ] アプリケーションが作成されている
- [ ] OAuth2設定が有効
- [ ] Client IDが正しい
- [ ] Client Secretが正しい
- [ ] リダイレクトURIが正確に設定されている
- [ ] スコープが正しく設定されている

#### 5.2 Supabase
- [ ] Discordプロバイダーが有効
- [ ] Client IDが設定されている
- [ ] Client Secretが設定されている
- [ ] リダイレクトURLが設定されている
- [ ] Site URLが正しく設定されている

#### 5.3 環境変数
- [ ] `NEXT_PUBLIC_SUPABASE_URL`が設定されている
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`が設定されている
- [ ] 本番環境で環境変数が正しく設定されている

### 6. 緊急時の対応

#### 6.1 即座に試すべきこと
1. ブラウザのキャッシュをクリア
2. シークレットウィンドウで試行
3. 別のブラウザで試行
4. モバイルブラウザで試行

#### 6.2 設定をリセットする場合
1. Discord Developer PortalでClient Secretを再生成
2. SupabaseでDiscordプロバイダーを無効化して再有効化
3. 環境変数を再設定

### 7. ログの確認方法

#### 7.1 ブラウザコンソール
```javascript
// エラーメッセージを確認
console.error('❌ Session setting error:', sessionError);
console.error('Session error details:', {
  message: sessionError.message,
  status: sessionError.status,
  name: sessionError.name
});
```

#### 7.2 Supabaseログ
1. Supabaseダッシュボード → **Logs**
2. **Authentication**を選択
3. エラーメッセージを確認

### 8. 最終確認

問題が解決しない場合は、以下を確認してください：

1. **Discord Developer Portal**の設定を再確認
2. **Supabase**の設定を再確認
3. **環境変数**を再確認
4. **ブラウザのキャッシュ**をクリア
5. **別のブラウザ**で試行

それでも解決しない場合は、詳細なエラーログを収集して管理者にお問い合わせください。 