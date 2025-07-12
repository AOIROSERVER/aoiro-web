"use client";
import React, { useState, useEffect } from "react";
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

export default function DebugSessionPage() {
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { supabase, user, session } = useAuth();

  const checkSessionStatus = async () => {
    setLoading(true);
    setDebugInfo("");
    
    try {
      console.log('🔍 Checking session status...');
      
      // 現在のセッションを取得
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      // 現在のユーザーを取得
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      // ローカルストレージの状態を確認
      const localStorageSession = typeof window !== 'undefined' ? localStorage.getItem('aoiro-auth-token') : null;
      
      // クッキーの状態を確認
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      const debugData = {
        session: {
          exists: !!currentSession,
          user: currentSession?.user?.email,
          accessToken: currentSession?.access_token ? 'present' : 'missing',
          refreshToken: currentSession?.refresh_token ? 'present' : 'missing',
          expiresAt: currentSession?.expires_at,
          error: sessionError?.message
        },
        user: {
          exists: !!currentUser,
          email: currentUser?.email,
          id: currentUser?.id,
          provider: currentUser?.app_metadata?.provider,
          error: userError?.message
        },
        localStorage: {
          session: localStorageSession ? 'present' : 'missing',
          parsed: localStorageSession ? JSON.parse(localStorageSession) : null
        },
        cookies: {
          count: Object.keys(cookies).length,
          keys: Object.keys(cookies),
          authCookies: Object.keys(cookies).filter(key => key.includes('auth') || key.includes('supabase'))
        },
        context: {
          hasUser: !!user,
          hasSession: !!session,
          userEmail: user?.email,
          sessionUser: session?.user?.email
        }
      };
      
      console.log('Session debug data:', debugData);
      setDebugInfo(JSON.stringify(debugData, null, 2));
      
    } catch (error: any) {
      console.error('❌ Session check failed:', error);
      setDebugInfo(`Session check error: ${error.message}\n\nFull error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    setLoading(true);
    setDebugInfo("");
    
    try {
      console.log('🧹 Clearing all session data...');
      
      // Supabaseセッションをクリア
      await supabase.auth.signOut();
      
      // ローカルストレージをクリア
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aoiro-auth-token');
        localStorage.removeItem('admin');
        
        // 認証関連のクッキーをクリア
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
      
      setDebugInfo("All session data cleared successfully");
      
    } catch (error: any) {
      console.error('❌ Clear data failed:', error);
      setDebugInfo(`Clear data error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleOAuth = async () => {
    setLoading(true);
    setDebugInfo("");
    
    try {
      console.log('🧪 Testing Google OAuth...');
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        setDebugInfo(`Google OAuth Error: ${error.message}\n\nError Details: ${JSON.stringify(error, null, 2)}`);
      } else {
        console.log('✅ Google OAuth initiated successfully');
        setDebugInfo(`Google OAuth initiated successfully\n\nData: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      setDebugInfo(`Test error: ${error.message}\n\nFull error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSessionStatus();
  }, []);

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
            セッション診断
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            セッション設定の問題を診断します
          </Typography>

          <Box sx={{ width: '100%', mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={checkSessionStatus}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? '診断中...' : 'セッション状態確認'}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={clearAllData}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              全データクリア
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={testGoogleOAuth}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Google OAuth テスト
            </Button>
          </Box>

          {debugInfo && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {debugInfo}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ width: '100%', my: 2 }} />
          
          <Typography variant="h6" mb={2}>
            現在の状態
          </Typography>
          
          <Box sx={{ width: '100%', textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>認証コンテキスト:</strong>
              <br />
              • ユーザー: {user ? user.email : 'なし'}
              <br />
              • セッション: {session ? 'あり' : 'なし'}
              <br />
              • ローディング: {loading ? 'はい' : 'いいえ'}
            </Typography>
          </Box>
        </Box>
      </Card>
    </Container>
  );
} 