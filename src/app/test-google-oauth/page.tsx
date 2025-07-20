"use client";

import { useState } from 'react';
import { Box, Button, Typography, Card, Alert, Container } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function TestGoogleOAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { supabase } = useAuth();

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
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aoiro-auth-token');
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });
      
      if (error) {
        console.error('❌ Google OAuth test error:', error);
        setError(`Google OAuth エラー: ${error.message}`);
      } else {
        console.log('✅ Google OAuth test initiated successfully');
        setSuccess('Google OAuth テストが正常に開始されました。リダイレクトを待機中...');
      }
    } catch (err: any) {
      console.error('❌ Google OAuth test exception:', err);
      setError(`テストエラー: ${err.message || '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      setSuccess('キャッシュがクリアされました');
      setError(null);
    } catch (err: any) {
      setError(`キャッシュクリアエラー: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Google OAuth テスト
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          このページではGoogleログイン機能をテストできます。
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={testGoogleOAuth}
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? 'テスト中...' : 'Google OAuth テスト'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={clearCache}
            sx={{ minWidth: 200 }}
          >
            キャッシュクリア
          </Button>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            デバッグ情報
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem'
          }}>
            {`Origin: ${typeof window !== 'undefined' ? window.location.origin : 'N/A'}
Redirect URL: ${typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : 'N/A'}
User Agent: ${typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}`}
          </Typography>
        </Box>
      </Card>
    </Container>
  );
} 