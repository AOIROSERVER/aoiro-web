'use client';

import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  Slide,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

function MinecraftVerificationContent() {
  const [minecraftId, setMinecraftId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { supabase, user, session } = useAuth();
  const router = useRouter();

  // シンプルな認証状態の確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking auth status for Minecraft verification...');
      console.log('User:', user);
      console.log('Session:', session);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session:', currentSession);
      
      if (currentSession?.user) {
        console.log('✅ User is authenticated:', currentSession.user.email);
        console.log('User metadata:', currentSession.user.user_metadata);
        console.log('App metadata:', currentSession.user.app_metadata);
      } else {
        console.log('ℹ️ No active session found');
      }
    };
    
    checkAuthStatus();
  }, [supabase, user, session]);

  // シンプルな認証状態変更の監視
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change event:', event);
      console.log('Session:', session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in');
        console.log('User metadata:', session.user.user_metadata);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase.auth]);



  const handleMinecraftAuth = async () => {
    if (!minecraftId.trim()) {
      setError('Minecraft IDを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 Starting Minecraft ID verification...');
      
      // Minecraft IDの存在確認
      const verifyResponse = await fetch('/api/verify-minecraft-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minecraftId: minecraftId.trim(),
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Minecraft ID認証に失敗しました');
      }

      if (!verifyData.exists) {
        setError('指定されたMinecraft IDは存在しません。正確なIDを入力してください。');
        return;
      }

      console.log('✅ Minecraft ID verified successfully');

      // 認証成功
      setSuccess(`Minecraft ID「${minecraftId}」の認証が完了しました！`);
      
      // 3秒後にホームページにリダイレクト
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err: any) {
      console.error('❌ Minecraft auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 装飾的な背景要素 */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Card sx={{ 
          p: 4, 
          borderRadius: 3, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255,255,255,0.95)'
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🎮 Minecraft ID認証
            </Typography>
            <Typography variant="body1" color="text.secondary">
              AOIROSERVERの認定メンバーになろう
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Minecraft IDを入力して認証を行ってください
            </Typography>
            
            {/* デバッグ情報 */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.8rem' }}>
                <Typography variant="caption" color="text.secondary">
                  User: {user ? 'Authenticated' : 'Not authenticated'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Session: {session ? 'Active' : 'No session'}
                </Typography>
                {user && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    User Metadata: {JSON.stringify(user.user_metadata, null, 2)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Minecraft ID"
            value={minecraftId}
            onChange={(e) => setMinecraftId(e.target.value)}
            placeholder="あなたのMinecraft IDを入力"
            variant="outlined"
            disabled={loading}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            正確なMinecraft IDを入力してください
          </Typography>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleMinecraftAuth}
            disabled={loading || !minecraftId.trim()}
            startIcon={loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <CheckCircle />}
            sx={{
              background: 'linear-gradient(45deg, #4CAF50, #45a049)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049, #4CAF50)',
              },
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            {loading ? '認証中...' : '認証する'}
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => router.push('/minecraft-auth')}
            sx={{ mb: 2 }}
          >
            ← Discord認証ページに戻る
          </Button>

          {/* エラーメッセージ */}
          {error && (
            <Slide direction="up" in={!!error}>
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            </Slide>
          )}

          {/* 成功メッセージ */}
          {success && (
            <Slide direction="up" in={!!success}>
              <Alert severity="success" sx={{ mt: 3 }}>
                {success}
              </Alert>
            </Slide>
          )}

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              認証に問題がある場合は、サーバー管理者にお問い合わせください
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}

export default function MinecraftVerificationPage() {
  return (
    <Suspense fallback={
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <Typography>読み込み中...</Typography>
        </Card>
      </Box>
    }>
      <MinecraftVerificationContent />
    </Suspense>
  );
}

