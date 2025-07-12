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
  const [sessionInfo, setSessionInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { supabase, user, session, loading: authLoading } = useAuth();

  const checkSession = async () => {
    setLoading(true);
    setSessionInfo("");
    
    try {
      console.log('🔍 Checking session details...');
      
      // 現在のセッションを取得
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        setSessionInfo(`Session Error: ${error.message}\n\nError Details: ${JSON.stringify(error, null, 2)}`);
        return;
      }
      
      // 現在のユーザーを取得
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setSessionInfo(`User Error: ${userError.message}\n\nError Details: ${JSON.stringify(userError, null, 2)}`);
        return;
      }
      
      const info = {
        currentSession: currentSession,
        currentUser: currentUser,
        contextUser: user,
        contextSession: session,
        authLoading: authLoading,
        localStorage: {
          admin: localStorage.getItem('admin'),
          aoiroAuthToken: localStorage.getItem('aoiro-auth-token'),
        }
      };
      
      setSessionInfo(`Session Check Results:\n\n${JSON.stringify(info, null, 2)}`);
      
    } catch (error: any) {
      setSessionInfo(`Exception Error: ${error.message}\n\nFull Error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    setSessionInfo("");
    
    try {
      console.log('🔄 Refreshing session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setSessionInfo(`Refresh Error: ${error.message}\n\nError Details: ${JSON.stringify(error, null, 2)}`);
      } else {
        setSessionInfo(`Session Refreshed Successfully:\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setSessionInfo(`Refresh Exception: ${error.message}\n\nFull Error: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      setSessionInfo("Session cleared successfully");
    } catch (error: any) {
      setSessionInfo(`Clear Session Error: ${error.message}`);
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
            セッション状態デバッグ
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            認証セッションの詳細を確認します
          </Typography>

          <Box sx={{ width: '100%', mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={checkSession}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'セッション確認中...' : 'セッション確認'}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={refreshSession}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              セッション更新
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

          {sessionInfo && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {sessionInfo}
              </Typography>
            </Alert>
          )}

          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="h6" mb={2}>
              現在の認証状態
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={15}
              value={JSON.stringify({
                user: user,
                session: session,
                loading: authLoading,
                localStorage: {
                  admin: typeof window !== 'undefined' ? localStorage.getItem('admin') : null,
                  aoiroAuthToken: typeof window !== 'undefined' ? localStorage.getItem('aoiro-auth-token') : null,
                }
              }, null, 2)}
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