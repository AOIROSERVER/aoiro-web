'use client';

import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  Slide,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// Discordアイコン
const DiscordIcon = () => (
  <img
    src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/discord.svg"
    alt="Discord"
    width={20}
    height={20}
    style={{ filter: 'grayscale(0%)' }}
  />
);

function DiscordAuthContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { supabase, user, session } = useAuth();
  const router = useRouter();

  // 認証状態の確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking auth status for Discord auth...');
      console.log('User:', user);
      console.log('Session:', session);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session:', currentSession);
      
      if (currentSession?.user) {
        console.log('✅ User is authenticated:', currentSession.user.email);
        console.log('User metadata:', currentSession.user.user_metadata);
        console.log('App metadata:', currentSession.user.app_metadata);
        
        // Discord認証済みかチェック
        if (currentSession.user.user_metadata?.provider === 'discord') {
          console.log('🎯 Discord user already authenticated, redirecting to verification...');
          setSuccess('Discord認証が完了しています！Minecraft ID認証ページに移動します...');
          
          // 少し待ってからMinecraft ID認証ページにリダイレクト
          setTimeout(() => {
            router.push('/minecraft-auth/verify');
          }, 2000);
        } else {
          console.log('❌ User is not Discord authenticated');
        }
      } else {
        console.log('❌ No active session found');
      }
    };
    
    checkAuthStatus();
  }, [supabase, user, session, router]);

  const handleDiscordAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🔄 Starting Discord OAuth...');
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      // Supabaseの直接URLを使用（Discord Developer Portalの設定と一致）
      const supabaseCallbackUrl = 'https://cqxadmvnsusscsusdrmqd.supabase.co/auth/v1/callback';
      const customCallbackUrl = 'https://aoiroserver.site/auth/callback';
      console.log('Supabase callback URL:', supabaseCallbackUrl);
      console.log('Custom callback URL:', customCallbackUrl);
      console.log('From minecraft-auth page:', true);
      
      // 既存のセッションを確認（クリアは行わない）
      console.log('🔍 Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session user:', session?.user);
      console.log('Session access token:', session?.access_token ? 'present' : 'missing');
      
      // Supabaseの直接URLにfromパラメータを追加
      const redirectUrlWithParams = supabaseCallbackUrl + '?from=minecraft-auth&next=/minecraft-auth/verify';
      console.log('Final redirect URL with params:', redirectUrlWithParams);
      console.log('URL parameters:', {
        from: 'minecraft-auth',
        next: '/minecraft-auth/verify',
        fullUrl: redirectUrlWithParams
      });
      console.log('Expected callback URL:', redirectUrlWithParams);
      console.log('URL encoding test:', encodeURIComponent('from=minecraft-auth&next=/minecraft-auth/verify'));
      
      const oauthOptions = {
        redirectTo: redirectUrlWithParams,
        skipBrowserRedirect: false,
        queryParams: {
          response_type: 'code',
        },
        // 追加のデバッグ情報
        options: {
          redirectTo: redirectUrlWithParams,
        }
      };
      
      console.log('📡 Initiating Discord OAuth with options:', oauthOptions);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: oauthOptions,
      });
      
      if (error) {
        console.error('❌ Discord OAuth error:', error);
        throw error;
      }
      
      console.log('✅ Discord OAuth initiated successfully');
      console.log('OAuth data:', data);
      console.log('Provider: discord');
      console.log('Redirect URL used:', redirectUrlWithParams);
      console.log('OAuth options used:', oauthOptions);
      
      // ブラウザリダイレクトが自動的に行われる
      console.log('🔄 Waiting for browser redirect...');
      console.log('Expected callback URL:', redirectUrlWithParams);
      console.log('Supabase will handle the callback and redirect to:', customCallbackUrl);
      
    } catch (err: any) {
      console.error('❌ Discord auth error:', err);
      console.error('Full error object:', err);
      console.error('Error type:', typeof err);
      console.error('Error keys:', Object.keys(err || {}));
      
      let errorMessage = err.error_description || err.message || '認証に失敗しました';
      
      if (err.message?.includes('redirect_uri')) {
        errorMessage = 'DiscordのリダイレクトURI設定に問題があります。管理者にお問い合わせください。';
      } else if (err.message?.includes('client_id')) {
        errorMessage = 'DiscordのクライアントID設定に問題があります。管理者にお問い合わせください。';
      } else if (err.message?.includes('scope')) {
        errorMessage = 'Discordのスコープ設定に問題があります。管理者にお問い合わせください。';
      } else if (err.message?.includes('invalid_grant')) {
        errorMessage = 'Discordの認証コードが無効です。再度お試しください。';
      } else if (err.message?.includes('unauthorized_client')) {
        errorMessage = 'Discordのクライアント認証に失敗しました。設定を確認してください。';
      } else if (err.message?.includes('bad_code_verifier')) {
        errorMessage = '認証セッションに問題があります。ブラウザを再読み込みして再度お試しください。';
      }
      
      console.error('🚨 Setting error message:', errorMessage);
      setError(errorMessage);
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
              🔐 Discord認証
            </Typography>
            <Typography variant="body1" color="text.secondary">
              まずDiscordアカウントで認証してください
            </Typography>
            
            {/* デバッグ情報 */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.8rem' }}>
                <Typography variant="caption" color="text.secondary">
                  デバッグ: User: {user ? 'あり' : 'なし'} | Session: {session ? 'あり' : 'なし'}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              AOIROSERVERの認定メンバーになるために、まずDiscordアカウントで認証を行ってください。
            </Typography>
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleDiscordAuth}
              disabled={loading}
              startIcon={loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <DiscordIcon />}
              sx={{
                background: 'linear-gradient(45deg, #7289DA, #5865F2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5865F2, #7289DA)',
                },
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                mb: 3
              }}
            >
              {loading ? '認証中...' : 'Discordで認証'}
            </Button>

            <Typography variant="body2" color="text.secondary">
              認証が完了すると、自動的にMinecraft ID認証ページに移動します
            </Typography>
          </Box>

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

export default function DiscordAuthPage() {
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
      <DiscordAuthContent />
    </Suspense>
  );
}
