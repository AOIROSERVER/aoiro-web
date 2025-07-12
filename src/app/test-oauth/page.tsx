"use client";
import { Box, Typography, Button, Card, CardContent, Alert } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

export default function TestOAuthPage() {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const testGoogleOAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🧪 Testing Google OAuth...');
      console.log('Current origin:', window.location.origin);
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectUrl);
      
      // セッションをクリア
      console.log('🧹 Clearing session...');
      await supabase.auth.signOut();
      
      // Google OAuthを開始
      console.log('📡 Starting Google OAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        throw error;
      }
      
      console.log('✅ Google OAuth initiated successfully');
      console.log('OAuth data:', data);
      setSuccess('Google OAuthが正常に開始されました。リダイレクトを待っています...');
      
    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setError(err.message || 'Google OAuthテストに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConfig = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🔧 Testing Supabase configuration...');
      
      // 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', sessionError);
      
      // ユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('User error:', userError);
      
      // Supabase設定情報
      console.log('Supabase URL:', 'https://cqxadmvnsusscsudrmqd.supabase.co');
      console.log('Supabase Key (first 20 chars):', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
      
      setSuccess('Supabase設定のテストが完了しました。コンソールを確認してください。');
      
    } catch (err: any) {
      console.error('❌ Supabase config test failed:', err);
      setError(err.message || 'Supabase設定テストに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🗑️ Clearing all data...');
      
      // セッションをクリア
      await supabase.auth.signOut();
      
      // ローカルストレージをクリア
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aoiro-auth-token');
        localStorage.removeItem('admin');
        console.log('✅ LocalStorage cleared');
      }
      
      setSuccess('すべてのデータがクリアされました');
      
    } catch (err: any) {
      console.error('❌ Clear data failed:', err);
      setError(err.message || 'データクリアに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1a237e', mb: 3 }}>
        🧪 OAuth テストページ
      </Typography>

      {/* エラー表示 */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* 成功メッセージ表示 */}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* テストボタン */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
            🔧 テスト機能
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={testGoogleOAuth}
              disabled={loading}
              sx={{ bgcolor: '#4285f4' }}
            >
              🔍 Google OAuth テスト
            </Button>
            <Button
              variant="outlined"
              onClick={testSupabaseConfig}
              disabled={loading}
              color="primary"
            >
              ⚙️ Supabase設定テスト
            </Button>
            <Button
              variant="outlined"
              onClick={clearAllData}
              disabled={loading}
              color="error"
            >
              🗑️ データクリア
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 情報表示 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
            📋 テスト手順
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography>1. 「Supabase設定テスト」を実行して設定を確認</Typography>
            <Typography>2. 「Google OAuth テスト」を実行してログインをテスト</Typography>
            <Typography>3. ブラウザのコンソールでログを確認</Typography>
            <Typography>4. エラーが発生した場合は「データクリア」を実行</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 