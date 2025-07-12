"use client";
import React, { useState } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

export default function TestGoogleOAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { supabase } = useAuth();

  const testGoogleOAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setDebugInfo("");
    
    try {
      console.log('🧪 Testing Google OAuth...');
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
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
        setError(`Google OAuth Error: ${error.message}`);
        setDebugInfo(`Error Details: ${JSON.stringify(error, null, 2)}`);
      } else {
        console.log('✅ Google OAuth initiated successfully');
        setSuccess('Google OAuthが正常に開始されました。リダイレクトを待っています...');
        setDebugInfo(`OAuth Data: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setError(err.message || 'Google OAuthテストに失敗しました');
      setDebugInfo(`Exception: ${JSON.stringify(err, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSupabaseConfig = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      setDebugInfo(`Supabase Config Check:\n\nSession: ${JSON.stringify(session, null, 2)}\n\nUser: ${JSON.stringify(user, null, 2)}`);
    } catch (error: any) {
      setError(`Config check failed: ${error.message}`);
    }
  };

  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      setSuccess("セッションがクリアされました");
      setDebugInfo("");
    } catch (error: any) {
      setError(`Session clear failed: ${error.message}`);
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ pt: 8 }}>
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5" fontWeight="bold" mb={1}>
            Google OAuth テスト
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Googleログインの設定をテストします
          </Typography>

          <Box sx={{ width: '100%', mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={testGoogleOAuth}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Google OAuth テスト中...' : 'Google OAuth テスト'}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={checkSupabaseConfig}
              sx={{ mb: 2 }}
            >
              Supabase設定確認
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={clearSession}
              sx={{ mb: 2 }}
            >
              セッションクリア
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

          {debugInfo && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {debugInfo}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ width: '100%', my: 2 }} />
          
          <Typography variant="h6" mb={2}>
            トラブルシューティング
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left', width: '100%' }}>
            <strong>Google OAuthが動作しない場合の確認事項：</strong>
            <br />
            1. SupabaseダッシュボードでGoogle OAuthが有効になっているか
            <br />
            2. Google Cloud ConsoleでリダイレクトURIが正しく設定されているか
            <br />
            3. クライアントIDとシークレットが正しく設定されているか
            <br />
            4. ブラウザのキャッシュをクリアしてから再試行
            <br />
            5. 開発者ツール（F12）のコンソールでエラーを確認
          </Typography>
        </Box>
      </Card>
    </Container>
  );
} 