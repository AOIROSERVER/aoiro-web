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
import { useRouter, useSearchParams } from "next/navigation";

function MinecraftVerificationContent() {
  const [minecraftId, setMinecraftId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [discordUser, setDiscordUser] = useState<any>(null);
  
  const { supabase, user, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 認証状態の確認
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
          setError(null); // エラーをクリア
          console.log('✅ Discord user data set successfully in checkAuthStatus');
        } else {
          console.log('❌ User is not Discord authenticated, metadata:', currentSession.user.user_metadata);
          console.log('❌ Redirecting to Discord auth...');
          setError('Discord認証が必要です。Discord認証ページに移動します...');
          setTimeout(() => {
            router.push('/minecraft-auth');
          }, 2000);
        }
      } else {
        console.log('❌ No active session found, redirecting to Discord auth...');
        setError('認証が必要です。Discord認証ページに移動します...');
        setTimeout(() => {
          router.push('/minecraft-auth');
        }, 2000);
      }
    };
    
    // 初回チェック
    checkAuthStatus();
    
    // 定期的にセッション状態をチェック（OAuth認証後の状態変更を確実に検出）
    const interval = setInterval(checkAuthStatus, 500); // 500ms間隔に短縮
    
    // 2秒後に追加チェック（OAuth認証完了後の遅延を考慮）
    const delayedCheck = setTimeout(checkAuthStatus, 2000);
    
    // 4秒後にもう一度チェック（OAuth認証完了後の遅延を考慮）
    const finalCheck = setTimeout(checkAuthStatus, 4000);
    
    // 8秒後にもう一度チェック（OAuth認証完了後の遅延を考慮）
    const extraCheck = setTimeout(checkAuthStatus, 8000);
    
    // 12秒後にもう一度チェック（OAuth認証完了後の遅延を考慮）
    const finalExtraCheck = setTimeout(checkAuthStatus, 12000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(delayedCheck);
      clearTimeout(finalCheck);
      clearTimeout(extraCheck);
      clearTimeout(finalExtraCheck);
    };
  }, [supabase, user, session, router]);

  // Supabase認証状態変更の監視
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change event in verify page:', event);
      console.log('Session in verify page:', session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, checking Discord auth...');
        console.log('User metadata:', session.user.user_metadata);
        
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
          setError(null); // エラーをクリア
          console.log('✅ Discord user data set successfully in auth state change');
        } else {
          console.log('❌ User is not Discord authenticated in auth state change');
          console.log('User metadata in auth state change:', session.user.user_metadata);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed, checking Discord auth...');
        if (session?.user?.user_metadata?.provider === 'discord') {
          console.log('🎯 Discord session refreshed, updating user data...');
          const discordUserData = {
            id: session.user.user_metadata.provider_id,
            username: session.user.user_metadata.user_name || session.user.user_metadata.name,
            discriminator: session.user.user_metadata.discriminator || '0000',
            global_name: session.user.user_metadata.full_name,
            avatar: session.user.user_metadata.avatar_url
          };
          setDiscordUser(discordUserData);
          setError(null);
          console.log('✅ Discord user data set successfully in token refresh');
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
          setError(null);
          console.log('✅ Discord user data set successfully in user update');
        }
      } else if (event === 'INITIAL_SESSION') {
        console.log('🚀 Initial session event, checking Discord auth...');
        if (session?.user?.user_metadata?.provider === 'discord') {
          console.log('🎯 Discord user in initial session, setting user data...');
          const discordUserData = {
            id: session.user.user_metadata.provider_id,
            username: session.user.user_metadata.user_name || session.user.user_metadata.name,
            discriminator: session.user.user_metadata.discriminator || '0000',
            global_name: session.user.user_metadata.full_name,
            avatar: session.user.user_metadata.avatar_url
          };
          setDiscordUser(discordUserData);
          setError(null);
          console.log('✅ Discord user data set successfully in initial session');
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // URLパラメータからOAuth認証完了を検出
  useEffect(() => {
    const accessToken = searchParams?.get('access_token');
    const refreshToken = searchParams?.get('refresh_token');
    
    console.log('🔍 URL parameters check:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
    
    if (accessToken && refreshToken) {
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
          setError(null);
          console.log('✅ Auth step completed after OAuth callback');
        } else {
          console.log('❌ Discord OAuth not completed yet, retrying...');
          console.log('User metadata in OAuth callback:', currentSession?.user?.user_metadata);
          // もう一度試行
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession?.user?.user_metadata?.provider === 'discord') {
              console.log('🎯 Discord OAuth completed on retry, setting user data...');
              const discordUserData = {
                id: retrySession.user.user_metadata.provider_id,
                username: retrySession.user.user_metadata.user_name || retrySession.user.user_metadata.name,
                discriminator: retrySession.user.user_metadata.discriminator || '0000',
                global_name: retrySession.user.user_metadata.full_name,
                avatar: retrySession.user.user_metadata.avatar_url
              };
              setDiscordUser(discordUserData);
              setError(null);
              console.log('✅ Auth step completed after OAuth callback retry');
            } else {
              console.log('❌ Discord OAuth still not completed, final retry...');
              console.log('User metadata in OAuth callback retry:', retrySession?.user?.user_metadata);
              // 最終試行
              setTimeout(async () => {
                const { data: { session: finalSession } } = await supabase.auth.getSession();
                if (finalSession?.user?.user_metadata?.provider === 'discord') {
                  console.log('🎯 Discord OAuth completed on final retry, setting user data...');
                  const discordUserData = {
                    id: finalSession.user.user_metadata.provider_id,
                    username: finalSession.user.user_metadata.user_name || finalSession.user.user_metadata.name,
                    discriminator: finalSession.user.user_metadata.discriminator || '0000',
                    global_name: finalSession.user.user_metadata.full_name,
                    avatar: finalSession.user.user_metadata.avatar_url
                  };
                  setDiscordUser(discordUserData);
                  setError(null);
                  console.log('✅ Auth step completed after OAuth callback final retry');
                } else {
                  console.log('❌ Discord OAuth still not completed after final retry');
                  console.log('User metadata in OAuth callback final retry:', finalSession?.user?.user_metadata);
                }
              }, 3000);
            }
          }, 2000);
        }
      }, 500); // 500msに短縮
    }
  }, [searchParams, supabase.auth]);

  const handleMinecraftAuth = async () => {
    if (!minecraftId.trim()) {
      setError('Minecraft IDを入力してください');
      return;
    }

    if (!discordUser) {
      setError('Discord認証が必要です');
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
          discordUserId: discordUser.id,
          discordUsername: discordUser.username,
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
          discordUserId: discordUser.id,
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
            discordUserId: discordUser.id,
            discordUsername: discordUser.username,
            discordGlobalName: discordUser.global_name,
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
      
      // 5秒後にホームページにリダイレクト
      setTimeout(() => {
        router.push('/');
      }, 5000);

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

  // Discord認証状態の確認（バックグラウンドで実行）
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking Discord auth status in verify page...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session in verify page:', currentSession);
      
      if (currentSession?.user?.user_metadata?.provider === 'discord') {
        console.log('🎯 Discord user detected in verify page, setting user data...');
        const discordUserData = {
          id: currentSession.user.user_metadata.provider_id,
          username: currentSession.user.user_metadata.user_name || currentSession.user.user_metadata.name,
          discriminator: currentSession.user.user_metadata.discriminator || '0000',
          global_name: currentSession.user.user_metadata.full_name,
          avatar: currentSession.user.user_metadata.avatar_url
        };
        console.log('Discord user data in verify page:', discordUserData);
        setDiscordUser(discordUserData);
      } else {
        console.log('❌ Discord user not detected in verify page');
        console.log('User metadata:', currentSession?.user?.user_metadata);
      }
    };
    
    // 初回チェック
    checkAuthStatus();
    
    // 定期的にセッション状態をチェック（OAuth認証後の状態変更を確実に検出）
    const interval = setInterval(checkAuthStatus, 1000);
    
    // 3秒後に追加チェック（OAuth認証完了後の遅延を考慮）
    const delayedCheck = setTimeout(checkAuthStatus, 3000);
    
    // 6秒後にもう一度チェック（OAuth認証完了後の遅延を考慮）
    const finalCheck = setTimeout(checkAuthStatus, 6000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(delayedCheck);
      clearTimeout(finalCheck);
    };
  }, [supabase.auth]);

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
                  デバッグ: Discord User: {discordUser ? 'あり' : 'なし'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  User: {user ? 'あり' : 'なし'} | Session: {session ? 'あり' : 'なし'}
                </Typography>
                {discordUser && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Discord ID: {discordUser.id} | Username: {discordUser.username}
                  </Typography>
                )}
                {user && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    User Metadata: {JSON.stringify(user.user_metadata, null, 2)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {discordUser ? (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
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
          ) : (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                ℹ️ Discord認証が必要です
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Minecraft ID認証を行うには、まずDiscordアカウントで認証してください。
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/minecraft-auth')}
                sx={{
                  background: 'linear-gradient(45deg, #7289DA, #5865F2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5865F2, #7289DA)',
                  },
                  px: 4,
                  py: 1.5
                }}
              >
                Discordで認証
              </Button>
            </Box>
          )}

          {discordUser ? (
            <>
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
            </>
          ) : (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                上記の「Discordで認証」ボタンをクリックして、Discordアカウントで認証を行ってください。
              </Typography>
            </Box>
          )}

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
