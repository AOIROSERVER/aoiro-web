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
  Fade,
  Slide,
} from "@mui/material";
import { CheckCircle, Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

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

function MinecraftAuthContent() {
  const [minecraftId, setMinecraftId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [discordUser, setDiscordUser] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'discord' | 'minecraft' | 'completed'>('discord');
  
  const { supabase, user, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 認証状態の確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking auth status for Minecraft auth...');
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
          console.log('🎯 Discord user detected, setting user data...');
          const discordUserData = {
            id: currentSession.user.user_metadata.provider_id,
            username: currentSession.user.user_metadata.user_name || currentSession.user.user_metadata.name,
            discriminator: currentSession.user.user_metadata.discriminator || '0000',
            global_name: currentSession.user.user_metadata.full_name,
            avatar: currentSession.user.user_metadata.avatar_url
          };
          console.log('Discord user data:', discordUserData);
          setDiscordUser(discordUserData);
          setAuthStep('minecraft');
          console.log('✅ Auth step changed to minecraft');
        } else {
          console.log('❌ User is not Discord authenticated, metadata:', currentSession.user.user_metadata);
          setAuthStep('discord');
        }
      } else {
        console.log('❌ No active session found');
        setAuthStep('discord');
      }
    };
    
    // 初回チェック
    checkAuthStatus();
    
    // 定期的にセッション状態をチェック（OAuth認証後の状態変更を確実に検出）
    const interval = setInterval(checkAuthStatus, 2000);
    
    // 5秒後に追加チェック（OAuth認証完了後の遅延を考慮）
    const delayedCheck = setTimeout(checkAuthStatus, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(delayedCheck);
    };
  }, [supabase, user, session]);

  // Supabase認証状態変更の監視
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change event:', event);
      console.log('Session:', session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, checking Discord auth...');
        console.log('User metadata:', session.user.user_metadata);
        console.log('App metadata:', session.user.app_metadata);
        
        if (session.user.user_metadata?.provider === 'discord') {
          console.log('🎯 Discord user authenticated, setting user data...');
          const discordUserData = {
            id: session.user.user_metadata.provider_id,
            username: session.user.user_metadata.user_name || session.user.user_metadata.name,
            discriminator: session.user.user_metadata.discriminator || '0000',
            global_name: session.user.user_metadata.full_name,
            avatar: session.user.user_metadata.avatar_url
          };
          console.log('Discord user data:', discordUserData);
          setDiscordUser(discordUserData);
          setAuthStep('minecraft');
          setError(null); // エラーをクリア
          console.log('✅ Auth step changed to minecraft after sign in');
        } else {
          console.log('❌ User is not Discord authenticated, metadata:', session.user.user_metadata);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, resetting auth step...');
        setDiscordUser(null);
        setAuthStep('discord');
        setError(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed, checking session...');
        // トークン更新後にセッション状態を再チェック
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user?.user_metadata?.provider === 'discord') {
          console.log('🎯 Discord session refreshed, updating user data...');
          const discordUserData = {
            id: currentSession.user.user_metadata.provider_id,
            username: currentSession.user.user_metadata.user_name || currentSession.user.user_metadata.name,
            discriminator: currentSession.user.user_metadata.discriminator || '0000',
            global_name: currentSession.user.user_metadata.full_name,
            avatar: currentSession.user.user_metadata.avatar_url
          };
          setDiscordUser(discordUserData);
          setAuthStep('minecraft');
          setError(null);
        }
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated, checking Discord auth...');
        if (session?.user?.user_metadata?.provider === 'discord') {
          console.log('🎯 Discord user updated, setting user data...');
          const discordUserData = {
            id: session.user.user_metadata.provider_id,
            username: session.user.user_metadata.user_name || session.user.user_metadata.name,
            discriminator: session.user.user_metadata.discriminator || '0000',
            global_name: session.user.user_metadata.full_name,
            avatar: session.user.user_metadata.avatar_url
          };
          setDiscordUser(discordUserData);
          setAuthStep('minecraft');
          setError(null);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // URLパラメータからエラーと認証状態を取得
  useEffect(() => {
    const errorParam = searchParams ? searchParams.get('error') : null;
    const accessToken = searchParams ? searchParams.get('access_token') : null;
    const refreshToken = searchParams ? searchParams.get('refresh_token') : null;
    
    console.log('🔍 URL parameters check:', { errorParam, accessToken: !!accessToken, refreshToken: !!refreshToken });
    
    if (errorParam) {
      console.log('❌ Error parameter detected:', errorParam);
      switch (errorParam) {
        case 'session_error':
          setError('セッションの設定に失敗しました。ブラウザのキャッシュをクリアして再度お試しください。');
          break;
        case 'auth_error':
          setError('Discord認証に失敗しました。再度お試しください。');
          break;
        default:
          setError(`認証エラーが発生しました: ${errorParam}`);
      }
    } else if (accessToken && refreshToken) {
      console.log('✅ OAuth tokens detected in URL, waiting for auth state change...');
      // OAuth認証完了のトークンがURLにある場合は、認証状態変更を待つ
      // エラーは表示しない
      
      // 少し待ってからセッション状態を強制的にチェック
      setTimeout(async () => {
        console.log('🔄 Force checking session after OAuth callback...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Current session after OAuth callback:', currentSession);
        
        if (currentSession?.user?.user_metadata?.provider === 'discord') {
          console.log('🎯 Discord OAuth completed, setting user data...');
          const discordUserData = {
            id: currentSession.user.user_metadata.provider_id,
            username: currentSession.user.user_metadata.user_name || currentSession.user.user_metadata.name,
            discriminator: currentSession.user.user_metadata.discriminator || '0000',
            global_name: currentSession.user.user_metadata.full_name,
            avatar: currentSession.user.user_metadata.avatar_url
          };
          setDiscordUser(discordUserData);
          setAuthStep('minecraft');
          setError(null);
          console.log('✅ Auth step changed to minecraft after OAuth callback');
        }
      }, 1500);
    }
  }, [searchParams, supabase.auth]);

  const handleDiscordAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Starting Discord OAuth for Minecraft auth...');
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
      const redirectUrlWithParams = supabaseCallbackUrl + '?from=minecraft-auth&next=/minecraft-auth';
      console.log('Final redirect URL with params:', redirectUrlWithParams);
      console.log('URL parameters:', {
        from: 'minecraft-auth',
        next: '/minecraft-auth',
        fullUrl: redirectUrlWithParams
      });
      console.log('Expected callback URL:', redirectUrlWithParams);
      console.log('URL encoding test:', encodeURIComponent('from=minecraft-auth&next=/minecraft-auth'));
      
      const oauthOptions = {
        redirectTo: `${window.location.origin}/minecraft-auth`,
        skipBrowserRedirect: false,
        queryParams: {
          response_type: 'code',
        }
      };
      
      console.log('📡 Initiating Discord OAuth with options:', oauthOptions);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: oauthOptions,
      });
      
      if (error) {
        console.error('❌ Discord OAuth error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        throw error;
      }
      
      console.log('✅ Discord OAuth initiated successfully');
      console.log('OAuth data:', data);
      console.log('Provider: discord');
      console.log('Redirect URL used:', oauthOptions.redirectTo);
      console.log('OAuth options used:', oauthOptions);
      
      // ブラウザリダイレクトが自動的に行われる
      console.log('🔄 Waiting for browser redirect...');
      console.log('Expected redirect to:', oauthOptions.redirectTo);
      
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
          discordUserId: discordUser?.id,
          discordUsername: discordUser?.username,
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

      // Discord認定メンバーロール付与
      const roleResponse = await fetch('/api/assign-discord-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordUserId: discordUser?.id,
          minecraftId: minecraftId.trim(),
        }),
      });

      const roleData = await roleResponse.json();

      if (!roleResponse.ok) {
        throw new Error(roleData.error || 'Discord ロール付与に失敗しました');
      }

      console.log('✅ Discord role assigned successfully');

      // Googleスプレッドシートに記録（一時的に無効化）
      try {
        const sheetResponse = await fetch('/api/record-minecraft-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            minecraftId: minecraftId.trim(),
            discordUserId: discordUser?.id,
            discordUsername: discordUser?.username,
            discordGlobalName: discordUser?.global_name,
          }),
        });

        if (sheetResponse.ok) {
          const sheetData = await sheetResponse.json();
          if (sheetData.disabled) {
            console.log('ℹ️ Google Sheets機能は現在無効化されています');
          } else {
            console.log('✅ Record saved to Google Sheets successfully');
          }
        } else {
          console.warn('⚠️ Failed to save to Google Sheets, but auth was successful');
        }
      } catch (sheetError) {
        console.warn('⚠️ Google Sheets記録でエラーが発生しましたが、認証は成功しました:', sheetError);
      }

      setSuccess(`認証が完了しました！Minecraft ID「${minecraftId}」がDiscordアカウントに紐付けられ、認定メンバーロールが付与されました。`);
      setAuthStep('completed');

    } catch (err: any) {
      console.error('❌ Minecraft auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (user: any) => {
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
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
            
            {/* デバッグ情報 */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.8rem' }}>
                <Typography variant="caption" color="text.secondary">
                  デバッグ: 現在のステップ: {authStep} | Discord User: {discordUser ? 'あり' : 'なし'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  User: {user ? 'あり' : 'なし'} | Session: {session ? 'あり' : 'なし'}
                </Typography>
                {discordUser && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Discord ID: {discordUser.id} | Username: {discordUser.username}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {authStep === 'discord' && (
            <Box sx={{ spaceY: 3 }}>
              <Typography variant="body1" sx={{ textAlign: 'center', mb: 3 }}>
                まずDiscordアカウントで認証してください
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
                  fontWeight: 'bold'
                }}
              >
                {loading ? '認証中...' : 'Discordで認証'}
              </Button>
            </Box>
          )}

          {authStep === 'minecraft' && discordUser && (
            <Box sx={{ spaceY: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <img
                    src={getAvatarUrl(discordUser)}
                    alt="Discord Avatar"
                    style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 12 }}
                  />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {discordUser.global_name || discordUser.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{discordUser.username}#{discordUser.discriminator}
                    </Typography>
                  </Box>
                </Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Discord認証完了
                </Alert>
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
                  fontWeight: 'bold'
                }}
              >
                {loading ? '認証中...' : '認証する'}
              </Button>
            </Box>
          )}

          {authStep === 'completed' && (
            <Box sx={{ textAlign: 'center', spaceY: 3 }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                🎉
              </Typography>
              <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 'bold', mb: 2 }}>
                認証完了！
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Minecraft IDが正常に認証され、Discordアカウントに紐付けられました。
                認定メンバーロールが付与されました！
              </Typography>
              
              <Button
                variant="contained"
                onClick={() => router.push('/')}
                sx={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #764ba2, #667eea)',
                  },
                  px: 4,
                  py: 1.5
                }}
              >
                ホームに戻る
              </Button>
            </Box>
          )}

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

export default function MinecraftAuthPage() {
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
      <MinecraftAuthContent />
    </Suspense>
  );
}
