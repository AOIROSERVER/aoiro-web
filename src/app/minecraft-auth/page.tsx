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
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';

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
  const [discordUser, setDiscordUser] = useState<any>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const { supabase, user, session } = useAuth();
  const router = useRouter();

  // 入社申請などから戻る用の redirect を保存
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) sessionStorage.setItem('mcid-auth-redirect', redirect);
  }, []);

  // AOIRO IDログイン必須チェック
  useEffect(() => {
    const checkAoiroIdLogin = async () => {
      console.log('🔍 Checking AOIRO ID login status...');
      console.log('User:', user);
      console.log('Session:', session);
      
      // AOIRO IDにログインしていない場合はログインページにリダイレクト
      if (!user || !session) {
        console.log('❌ AOIRO ID not logged in, redirecting to login page...');
        setError('MCID認証を利用するには、まずAOIRO IDにログインしてください。');
        
        // 2秒後にログインページにリダイレクト
        setTimeout(() => {
          router.push('/login?redirect=/minecraft-auth');
        }, 2000);
        return;
      }
      
      console.log('✅ AOIRO ID logged in:', user.email);
    };
    
    checkAoiroIdLogin();
  }, [user, session, router]);

  // 認証状態とDiscord連携状態の確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      // AOIRO IDにログインしていない場合は処理を停止
      if (!user || !session) {
        return;
      }
      
      console.log('🔍 Checking auth status for Discord auth...');
      console.log('User:', user);
      console.log('Session:', session);
      
      // URLパラメータから認証完了をチェック
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('auth_success');
      const error = urlParams.get('error');
      const errorDetails = urlParams.get('details');
      
      if (error) {
        console.log('❌ Auth error from URL:', error);
        console.log('Error details:', errorDetails);
        
        let errorMessage = '認証に失敗しました';
        let suggestionMessage = '';
        
        // エラータイプに応じたメッセージを設定
        switch (error) {
          case 'session_error':
            errorMessage = 'セッションの設定に失敗しました';
            suggestionMessage = 'ブラウザのキャッシュをクリアして再度お試しください。';
            break;
          case 'no_session':
            errorMessage = 'セッションの作成に失敗しました';
            suggestionMessage = '認証処理中に問題が発生しました。再度お試しください。';
            break;
          case 'code_exchange_error':
            errorMessage = '認証コードの交換に失敗しました';
            suggestionMessage = '認証処理中に問題が発生しました。再度お試しください。';
            break;
          case 'auth_error':
            errorMessage = '認証処理中にエラーが発生しました';
            suggestionMessage = '再度お試しください。';
            break;
          case 'invalid_grant':
            errorMessage = '認証コードが無効です';
            suggestionMessage = '再度お試しください。';
            break;
          case 'redirect_uri_mismatch':
            errorMessage = 'リダイレクトURIの設定に問題があります';
            suggestionMessage = '管理者にお問い合わせください。';
            break;
          case 'client_id_error':
            errorMessage = 'クライアントIDの設定に問題があります';
            suggestionMessage = '管理者にお問い合わせください。';
            break;
          case 'pkce_error':
            errorMessage = '認証セッションに問題があります';
            suggestionMessage = 'ブラウザを再読み込みして再度お試しください。';
            break;
          case 'bad_request':
            errorMessage = 'リクエストの形式に問題があります';
            suggestionMessage = 'ブラウザを再読み込みして再度お試しください。';
            break;
          default:
            errorMessage = decodeURIComponent(error);
            if (errorDetails) {
              suggestionMessage = decodeURIComponent(errorDetails);
            }
        }
        
        // 詳細なエラー情報がある場合は追加
        if (errorDetails && !suggestionMessage) {
          suggestionMessage = decodeURIComponent(errorDetails);
        }
        
        setError(`${errorMessage}${suggestionMessage ? `\n\n対処法: ${suggestionMessage}` : ''}`);
        
        // エラーパラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (authSuccess === 'true') {
        console.log('✅ Auth success detected from URL');
        setSuccess('Discord認証が完了しました！');
        
        // 認証成功後、Discord連携状態を確認
        setTimeout(async () => {
          try {
            console.log('🔍 Checking Discord auth state after success...');
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            console.log('Current session after auth success:', currentSession);
            
            if (currentSession?.user?.user_metadata?.provider === 'discord') {
              console.log('✅ Discord user authenticated, updating state...');
              setIsLinked(true);
              if (currentSession.user.user_metadata) {
                setDiscordUser({
                  username: currentSession.user.user_metadata.full_name || currentSession.user.user_metadata.name,
                  avatar: currentSession.user.user_metadata.avatar_url,
                  discriminator: currentSession.user.user_metadata.discriminator,
                  id: currentSession.user.user_metadata.sub
                });
              }
              setSuccess('Discordアカウントの連携が完了しました！Minecraft ID認証ページに移動します...');
              
              // 1秒後にMinecraft ID認証ページに自動リダイレクト
              setTimeout(() => {
                console.log('🔄 Redirecting to minecraft-auth verify page...');
                router.push('/minecraft-auth/verify');
              }, 1000);
              
            } else {
              console.log('❌ Discord user not found after auth success');
              console.log('User metadata:', currentSession?.user?.user_metadata);
              console.log('App metadata:', currentSession?.user?.app_metadata);
              setError('Discord認証は完了しましたが、連携状態の確認に失敗しました。ページを再読み込みしてください。');
            }
          } catch (err) {
            console.error('Error checking auth state after success:', err);
            setError('認証状態の確認に失敗しました。ページを再読み込みしてください。');
          }
        }, 500);
        
        // 成功パラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session:', currentSession);
      
      if (currentSession?.user) {
        console.log('✅ User is authenticated:', currentSession.user.email);
        console.log('User metadata:', currentSession.user.user_metadata);
        console.log('App metadata:', currentSession.user.app_metadata);
        
        // Discord認証済みかチェック（より柔軟な判定）
        const isDiscordUser = currentSession.user.user_metadata?.provider === 'discord' ||
                              currentSession.user.app_metadata?.provider === 'discord' ||
                              currentSession.user.user_metadata?.full_name ||
                              currentSession.user.user_metadata?.avatar_url ||
                              currentSession.user.user_metadata?.name;
        
        if (isDiscordUser) {
          console.log('🎯 Discord user already authenticated');
          setIsLinked(true);
          
          // Discordユーザー情報を設定
          if (currentSession.user.user_metadata) {
            setDiscordUser({
              username: currentSession.user.user_metadata.full_name || 
                       currentSession.user.user_metadata.name || 
                       currentSession.user.user_metadata.preferred_username ||
                       currentSession.user.email?.split('@')[0] || 'Unknown',
              avatar: currentSession.user.user_metadata.avatar_url,
              discriminator: currentSession.user.user_metadata.discriminator,
              id: currentSession.user.user_metadata.sub || currentSession.user.id
            });
          }
          
          if (!authSuccess) {
            setSuccess('Discordアカウントが連携されています！');
          }
        } else {
          console.log('❌ User is not Discord authenticated');
          console.log('User metadata:', currentSession.user.user_metadata);
          console.log('App metadata:', currentSession.user.app_metadata);
          setIsLinked(false);
          
          // AOIRO IDでログインしているがDiscord認証が未完了の場合
          setError(null); // エラーメッセージをクリア
        }
      } else {
        console.log('❌ No active session found');
        setIsLinked(false);
      }
    };
    
    checkAuthStatus();
  }, [supabase, user, session]);

  const handleDiscordAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🔄 Starting Discord OAuth for MCID auth...');
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      console.log('Current pathname:', window.location.pathname);
      
      // マインクラフト認証フローのフラグを設定
      sessionStorage.setItem('minecraft-auth-flow', 'true');
      console.log('🎮 Minecraft auth flow flag set in sessionStorage');
      
      // 既存のセッションを確認
      console.log('🔍 Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session user:', session?.user);
      
      // MCID認証専用のリダイレクトURLを設定
      // fromパラメータをminecraft-authに設定し、認証コールバック処理で確実に認識されるようにする
      const params = new URLSearchParams({
        from: 'minecraft-auth',
        next: '/minecraft-auth/verify',
        source: 'minecraft-auth-page'
      });
      // ローカル開発環境では正しいポートを使用
      const origin = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
      const redirectUrl = `${origin}/auth/callback?${params.toString()}`;
      console.log('MCID auth redirect URL:', redirectUrl);
      console.log('URL parameters:', {
        from: 'minecraft-auth',
        next: '/minecraft-auth/verify',
        source: 'minecraft-auth-page',
        encodedParams: params.toString()
      });
      console.log('Full redirect URL:', redirectUrl);
      
      // ポート設定デバッグ情報
      console.log('🔍 Port Configuration Debug:', {
        currentOrigin: window.location.origin,
        hostname: window.location.hostname,
        port: window.location.port,
        isLocalhost: window.location.hostname === 'localhost',
        correctedOrigin: origin,
        currentURL: window.location.href
      });
      
      // まずセッションをクリア（PKCE問題回避）
      console.log('🧹 Clearing existing session for fresh OAuth...');
      await supabase.auth.signOut();
      
      // セッションクリア後少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // OAuthオプションを設定（より詳細なデバッグ）
      const oauthOptions = {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
        queryParams: {
          response_type: 'code',
        }
      };
      
      console.log('📡 Initiating Discord OAuth with options:', oauthOptions);
      console.log('OAuth redirectTo:', oauthOptions.redirectTo);
      console.log('🔍 Full OAuth Configuration:', {
        provider: 'discord',
        redirectTo: oauthOptions.redirectTo,
        origin: origin,
        correctedURL: redirectUrl,
        queryParams: oauthOptions.queryParams,
        skipBrowserRedirect: oauthOptions.skipBrowserRedirect,
        timestamp: new Date().toISOString()
      });
      
      console.log('🚀 Calling supabase.auth.signInWithOAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: oauthOptions,
      });
      
      console.log('OAuth Response:', {
        hasData: !!data,
        hasError: !!error,
        dataUrl: data?.url,
        dataProvider: data?.provider,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorName: error?.name
      });
      
      if (error) {
        console.error('❌ Discord OAuth error:', error);
        throw error;
      }
      
      console.log('✅ Discord OAuth initiated successfully');
      console.log('OAuth data:', data);
      console.log('Provider: discord');
      console.log('Redirect URL used:', redirectUrl);
      console.log('OAuth response:', data);
      
      // 認証が開始されたことを示すメッセージ
      setSuccess('Discord認証が開始されました。認証完了後、Minecraft ID認証ページに移動します...');
      
      // 認証完了を監視するためのポーリングを開始
      const checkAuthCompletion = async () => {
        try {
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession?.user?.user_metadata?.provider === 'discord') {
            console.log('✅ Discord auth completed, updating state...');
            setIsLinked(true);
            if (newSession.user.user_metadata) {
              setDiscordUser({
                username: newSession.user.user_metadata.full_name || newSession.user.user_metadata.name,
                avatar: newSession.user.user_metadata.avatar_url,
                discriminator: newSession.user.user_metadata.discriminator,
                id: newSession.user.user_metadata.sub
              });
            }
            setSuccess('Discordアカウントの連携が完了しました！');
            return true;
          }
          return false;
        } catch (err) {
          console.error('Auth completion check error:', err);
          return false;
        }
      };
      
      // 即座に1回チェック
      const immediateCheck = await checkAuthCompletion();
      if (immediateCheck) {
        return; // 既に認証完了している場合は終了
      }
      
      // 5秒間隔で認証完了をチェック
      const authCheckInterval = setInterval(async () => {
        const completed = await checkAuthCompletion();
        if (completed) {
          clearInterval(authCheckInterval);
        }
      }, 5000);
      
      // 30秒後にタイムアウト
      setTimeout(() => {
        clearInterval(authCheckInterval);
        if (!isLinked) {
          setError('認証の完了確認がタイムアウトしました。ページを再読み込みしてください。');
        }
      }, 30000);
      
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

  // 代替認証方法（直接Supabase URLを使用）
  const handleAlternativeDiscordAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🔄 Starting Alternative Discord OAuth (Direct Supabase)...');
      
      // マインクラフト認証フローのフラグを設定
      sessionStorage.setItem('minecraft-auth-flow', 'true');
      
      // セッションクリア
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Supabaseの直接URLを使用
      const params = new URLSearchParams({
        from: 'minecraft-auth',
        next: '/minecraft-auth/verify',
        source: 'minecraft-auth-page-alt'
      });
      const supabaseDirectUrl = 'https://cqxadmvnsusscsudrmqd.supabase.co/auth/v1/callback';
      const redirectUrl = `${supabaseDirectUrl}?${params.toString()}`;
      
      console.log('🔍 Alternative OAuth Configuration:', {
        provider: 'discord',
        redirectTo: redirectUrl,
        isSupabaseDirect: true,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            response_type: 'code',
          }
        },
      });
      
      if (error) {
        console.error('❌ Alternative Discord OAuth error:', error);
        throw error;
      }

      console.log('✅ Alternative Discord OAuth initiated successfully');
      
    } catch (err: any) {
      console.error('❌ Alternative Discord auth error:', err);
      setError('代替Discord認証に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user?.user_metadata?.provider === 'discord') {
        setIsLinked(true);
        if (currentSession.user.user_metadata) {
          setDiscordUser({
            username: currentSession.user.user_metadata.full_name || currentSession.user.user_metadata.name,
            avatar: currentSession.user.user_metadata.avatar_url,
            discriminator: currentSession.user.user_metadata.discriminator,
            id: currentSession.user.user_metadata.sub
          });
        }
        setSuccess('Discordアカウントの連携状態を更新しました！');
      } else {
        setIsLinked(false);
        setDiscordUser(null);
      }
    } catch (err) {
      console.error('Status refresh error:', err);
      setError('状態の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToMinecraft = () => {
    router.push('/minecraft-auth/verify');
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

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
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
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.5rem', sm: '2.125rem' },
              lineHeight: { xs: 1.2, sm: 1.3 },
              wordBreak: 'keep-all'
            }}>
              🔐 MCID認証システム
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: { xs: 1.4, sm: 1.5 },
              px: { xs: 1, sm: 0 }
            }}>
              AOIROSERVERの認定メンバーになるために、AOIRO IDにログインしてDiscordアカウントを連携してください
            </Typography>
          </Box>

          {/* AOIRO IDログイン状態の表示 */}
          {user && session ? (
            <Box sx={{ mb: 4 }}>
              <Card sx={{ 
                p: { xs: 2, sm: 3 }, 
                bgcolor: 'success.50', 
                border: '1px solid', 
                borderColor: 'success.200',
                borderRadius: 3,
                mb: 3
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1.5, sm: 2 }, 
                  mb: 2,
                  flexWrap: 'wrap'
                }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  <Typography variant="h6" color="success.dark" sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    wordBreak: 'keep-all'
                  }}>
                    AOIRO IDにログイン済み
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  wordBreak: 'break-all'
                }}>
                  ユーザー: {user.email}
                </Typography>
              </Card>
            </Box>
          ) : null}

          {/* Discord連携状態の表示 */}
          {isLinked && discordUser ? (
            <Box sx={{ mb: 4 }}>
              <Card sx={{ 
                p: 4, 
                bgcolor: 'success.50', 
                border: '2px solid', 
                borderColor: 'success.200',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.15)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: { xs: 24, sm: 36 } }} />
                  <Typography variant="h5" color="success.dark" sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.1rem', sm: '1.5rem' },
                    wordBreak: 'keep-all'
                  }}>
                    Discordアカウント
                  </Typography>
                  <Chip 
                    icon={<LinkIcon />} 
                    label="連携済み" 
                    color="success" 
                    variant="outlined"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.9rem' },
                      fontWeight: 'bold',
                      borderWidth: '2px'
                    }}
                  />
                </Box>
                
                <Divider sx={{ my: 3, borderColor: 'success.200' }} />
                
                <Box sx={{ 
                  bgcolor: 'white', 
                  borderRadius: 3, 
                  p: { xs: 2, sm: 3 },
                  border: '1px solid',
                  borderColor: 'success.100',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: { xs: 2, sm: 3 }
                  }}>
                    <Avatar 
                      src={discordUser.avatar} 
                      alt={discordUser.username}
                      sx={{ 
                        width: { xs: 50, sm: 80 }, 
                        height: { xs: 50, sm: 80 },
                        border: '4px solid',
                        borderColor: 'success.main',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                      }}
                      onError={(e) => {
                        // アイコン読み込みエラー時のフォールバック
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const avatarElement = target.parentElement;
                        if (avatarElement) {
                          const fallbackText = document.createElement('div');
                          fallbackText.textContent = discordUser.username.charAt(0).toUpperCase();
                          fallbackText.style.cssText = `
                            width: ${window.innerWidth < 600 ? '50px' : '80px'};
                            height: ${window.innerWidth < 600 ? '50px' : '80px'};
                            border: 4px solid #4CAF50;
                            border-radius: 50%;
                            background: linear-gradient(45deg, #7289DA, #5865F2);
                            color: white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: ${window.innerWidth < 600 ? '20px' : '32px'};
                            font-weight: bold;
                            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                          `;
                          avatarElement.appendChild(fallbackText);
                        }
                      }}
                    />
                    <Box sx={{ 
                      textAlign: 'center',
                      minWidth: 0
                    }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: 'success.dark', 
                        mb: 1,
                        fontSize: { xs: '0.9rem', sm: '1.5rem' },
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {discordUser.username}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ 
                        mb: 1,
                        fontSize: { xs: '0.7rem', sm: '1rem' },
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Discord ID: {discordUser.id}
                      </Typography>
                      {discordUser.discriminator && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          fontSize: { xs: '0.6rem', sm: '0.875rem' },
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          #{discordUser.discriminator}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleProceedToMinecraft}
                    sx={{
                      background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                      },
                      px: 5,
                      py: 2,
                      fontSize: { xs: '0.9rem', sm: '1.1rem' },
                      fontWeight: 'bold',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    🎮 MCID認証に進む
                  </Button>
                </Box>
              </Card>
            </Box>
          ) : (
            <Box sx={{ mb: 4 }}>
              <Card sx={{ p: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <InfoIcon color="info" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" color="info.dark">
                    Discordアカウントの連携が必要です
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  AOIRO IDにログイン済みです。次に、AOIROSERVERの認定メンバーになるためにDiscordアカウントを連携してください。
                  連携が完了すると、MCID認証ページに進むことができます。
                </Typography>
                
                <Box sx={{ textAlign: 'center' }}>
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
                      mb: 2
                    }}
                  >
                    {loading ? '認証中...' : 'Discordで認証・連携'}
                  </Button>
                  
                  <Typography variant="caption" color="text.secondary">
                    Discordアカウントにログインして連携を完了してください
                  </Typography>
                  
                  {/* 代替認証ボタンとデバッグオプション */}
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'grey.300' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      上記の認証で問題が発生する場合は、以下の方法をお試しください：
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={handleAlternativeDiscordAuth}
                      disabled={loading}
                      startIcon={<DiscordIcon />}
                      sx={{
                        borderColor: '#7289DA',
                        color: '#7289DA',
                        '&:hover': {
                          borderColor: '#5865F2',
                          color: '#5865F2',
                          bgcolor: 'rgba(114, 137, 218, 0.05)'
                        },
                        mb: 1
                      }}
                    >
                      代替認証方法を試す
                    </Button>
                    
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setDebugMode(!debugMode)}
                      sx={{ fontSize: '0.8rem', color: 'grey.600' }}
                    >
                      {debugMode ? 'デバッグ情報を非表示' : 'デバッグ情報を表示'}
                    </Button>
                    
                    {debugMode && (
                      <Card sx={{ mt: 2, p: 2, bgcolor: 'grey.50', fontSize: '0.8rem' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                          デバッグ情報:
                        </Typography>
                        <pre style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                          {JSON.stringify({
                            currentURL: typeof window !== 'undefined' ? window.location.href : 'N/A',
                            origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
                            hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
                            port: typeof window !== 'undefined' ? window.location.port : 'N/A',
                            sessionStorage: typeof window !== 'undefined' ? {
                              minecraftAuthFlow: sessionStorage.getItem('minecraft-auth-flow'),
                              minecraftAuthCompleted: sessionStorage.getItem('minecraft-auth-completed')
                            } : 'N/A',
                            timestamp: new Date().toISOString()
                          }, null, 2)}
                        </pre>
                      </Card>
                    )}
                  </Box>
                </Box>
              </Card>
            </Box>
          )}

          {/* 状態更新ボタン */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Tooltip title="連携状態を更新">
              <IconButton 
                onClick={handleRefreshStatus} 
                disabled={loading}
                sx={{ 
                  bgcolor: 'grey.100',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              連携状態を更新
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
