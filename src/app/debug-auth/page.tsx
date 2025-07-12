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

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { supabase, user } = useAuth();

  const testGoogleOAuth = async () => {
    setLoading(true);
    setDebugInfo("");
    
    try {
      console.log('🔍 Testing Google OAuth...');
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectUrl);
      
      // セッションをクリア
      await supabase.auth.signOut();
      
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
      console.error('❌ Google OAuth exception:', error);
      setDebugInfo(`Google OAuth Exception: ${error.message}\n\nFull Error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      setDebugInfo(`Current Session: ${JSON.stringify(session, null, 2)}\n\nCurrent User: ${JSON.stringify(user, null, 2)}`);
    } catch (error: any) {
      setDebugInfo(`Session Check Error: ${error.message}`);
    }
  };

  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      setDebugInfo("Session cleared successfully");
    } catch (error: any) {
      setDebugInfo(`Clear Session Error: ${error.message}`);
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
            Google OAuth デバッグ
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Googleログインの問題を調査します
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
              onClick={checkCurrentSession}
              sx={{ mb: 2 }}
            >
              現在のセッション確認
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

          {debugInfo && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {debugInfo}
              </Typography>
            </Alert>
          )}

          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="h6" mb={2}>
              現在のユーザー情報
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={JSON.stringify(user, null, 2)}
              InputProps={{
                readOnly: true,
              }}
              sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </Box>
        </Box>
      </Card>
    </Container>
  );
} 