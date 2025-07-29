"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  Fade,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

// Discordアイコンコンポーネント
const DiscordIcon = () => (
  <img
    src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/discord.svg"
    alt="Discord"
    width={20}
    height={20}
    style={{ filter: 'grayscale(0%)' }}
  />
);

function RegisterContent() {
  const [discordLinked, setDiscordLinked] = useState(false);
  const [discordUsername, setDiscordUsername] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [discordSuccessMessage, setDiscordSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Discord連携のみの画面

  // URLパラメータからエラーとDiscord連携状態を取得
  useEffect(() => {
    const errorParam = searchParams ? searchParams.get('error') : null;
    const discordLinkedParam = searchParams ? searchParams.get('discord_linked') : null;
    
    if (errorParam) {
      switch (errorParam) {
        case 'session_error':
          setError('Discord連携でセッションの設定に失敗しました。ブラウザのキャッシュをクリアして再度お試しください。');
          break;
        case 'auth_error':
          setError('Discord連携で認証に失敗しました。再度お試しください。');
          break;
        default:
          setError('Discord連携でエラーが発生しました。再度お試しください。');
      }
    }
    
    // Discord連携が完了した場合
    if (discordLinkedParam === 'true') {
      console.log('🎉 Discord連携完了を検知しました');
      console.log('Current URL:', window.location.href);
      console.log('Expected URL:', 'https://aoiroserver.site/register?discord_linked=true');
      console.log('All URL parameters:', Object.fromEntries(new URLSearchParams(window.location.search)));
      
      // Discord連携状態を即座に設定
      setDiscordLinked(true);
      setError(null);
      
      // セッションからDiscordユーザー情報を取得
      const getDiscordUserInfo = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Discord session:', session);
          if (session?.user) {
            const discordName = session.user.user_metadata?.full_name || 
                               session.user.user_metadata?.name || 
                               session.user.user_metadata?.username ||
                               'Discord User';
            const discordUserId = session.user.user_metadata?.sub || 
                                 session.user.user_metadata?.discord_id ||
                                 session.user.id ||
                                 'Unknown';
            console.log('Discord username:', discordName);
            console.log('Discord ID:', discordUserId);
            setDiscordUsername(discordName);
            setDiscordId(discordUserId);
            
            // 成功メッセージを表示
            console.log('✅ Discord連携が正常に完了しました');
            setDiscordSuccessMessage('Discordアカウントが正常に連携されました！');
          } else {
            console.log('No session user found');
            setDiscordUsername('Discord User');
            setDiscordId('Unknown');
          }
        } catch (error) {
          console.error('Discord user info fetch error:', error);
          setDiscordUsername('Discord User');
        }
      };
      
      // ユーザー情報を取得
      getDiscordUserInfo();
      
      // URLパラメータをクリア（少し遅延させて状態更新を確実にする）
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('discord_linked');
          window.history.replaceState({}, '', url.toString());
          console.log('URL parameters cleared');
        }
      }, 100);
    }
  }, [searchParams]);

  const handleDiscordLink = async () => {
    setLoading(true);
    setError(null);
    setDiscordSuccessMessage('');
    setDiscordId('');
    try {
      console.log('🔄 Starting Discord OAuth link...');
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      // Supabaseの直接URLを使用（Discord Developer Portalの設定と一致）
      const supabaseCallbackUrl = 'https://cqxadmvnsusscsusdrmqd.supabase.co/auth/v1/callback';
      const customCallbackUrl = 'https://aoiroserver.site/auth/callback';
      console.log('Supabase callback URL:', supabaseCallbackUrl);
      console.log('Custom callback URL:', customCallbackUrl);
      console.log('From register page:', true);
      
      // 既存のセッションを確認（クリアは行わない）
      console.log('🔍 Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session user:', session?.user);
      console.log('Session access token:', session?.access_token ? 'present' : 'missing');
      
      // Supabaseの直接URLにfromパラメータを追加
      const redirectUrlWithParams = supabaseCallbackUrl + '?from=register&next=/register';
      console.log('Final redirect URL with params:', redirectUrlWithParams);
      console.log('URL parameters:', {
        from: 'register',
        next: '/register',
        fullUrl: redirectUrlWithParams
      });
      console.log('Expected callback URL:', redirectUrlWithParams);
      console.log('URL encoding test:', encodeURIComponent('from=register&next=/register'));
      
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
      console.log('Redirect URL used:', redirectUrlWithParams);
      console.log('OAuth options used:', oauthOptions);
      
      // ブラウザリダイレクトが自動的に行われる
      console.log('🔄 Waiting for browser redirect...');
      console.log('Expected callback URL:', redirectUrlWithParams);
      console.log('Supabase will handle the callback and redirect to:', customCallbackUrl);
      
    } catch (err: any) {
      console.error('❌ Discord link error:', err);
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
          zIndex: 0,
        }
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card 
          sx={{ 
            p: 4, 
            borderRadius: 4, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
            }
          }}
        >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Fade in={true} timeout={1000}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    component="h1" 
                    variant="h4" 
                    fontWeight="bold" 
                    mb={1}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.75rem', sm: '2.125rem' }
                    }}
                  >
                    AOIRO IDアカウント作成
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '1.1rem',
                      opacity: 0.8
                    }}
                  >
                    Discordアカウント連携で安全なアカウント作成
                  </Typography>
                </Box>
              </Fade>

              {/* エラー表示 */}
              {error && (
                <Fade in={true} timeout={500}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      width: '100%', 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        color: '#d32f2f'
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* Discord連携セクション */}
              <Fade in={true} timeout={1200}>
                <Box sx={{ width: '100%', mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    sx={{ color: '#7289DA', mb: 2 }}
                  >
                    Discordアカウント連携
                  </Typography>
                  
                  {discordLinked ? (
                    <Fade in={discordLinked} timeout={800}>
                      <Box sx={{ 
                        p: 3, 
                        bgcolor: 'rgba(76, 175, 80, 0.1)', 
                        borderRadius: 2,
                        border: '2px solid #4CAF50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        animation: 'pulse 2s ease-in-out',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.02)' },
                          '100%': { transform: 'scale(1)' },
                        }
                      }}>
                        <CheckCircle sx={{ color: '#4CAF50', fontSize: 28 }} />
                        <Box>
                          <Typography variant="body1" color="success.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            Discordアカウント連携完了
                          </Typography>
                          {discordUsername && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              ユーザー名: {discordUsername}
                            </Typography>
                          )}
                          {discordId && discordId !== 'Unknown' && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Discord ID: {discordId}
                            </Typography>
                          )}
                          {discordSuccessMessage && (
                            <Typography variant="body2" color="success.main" sx={{ fontStyle: 'italic' }}>
                              {discordSuccessMessage}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Fade>
                  ) : (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleDiscordLink}
                      disabled={loading}
                      startIcon={<DiscordIcon />}
                      sx={{ 
                        py: 2.5, 
                        borderRadius: 3,
                        border: '2px solid #7289DA',
                        color: '#7289DA',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        textTransform: 'none',
                        backgroundColor: 'rgba(114, 137, 218, 0.05)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          backgroundColor: 'rgba(114, 137, 218, 0.1)',
                          borderColor: '#5b6eae',
                          color: '#5b6eae',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(114, 137, 218, 0.3)',
                        },
                        '&:disabled': {
                          borderColor: '#b0b0b0',
                          color: '#b0b0b0',
                          backgroundColor: 'rgba(176, 176, 176, 0.05)',
                          transform: 'none',
                          boxShadow: 'none',
                        },
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s',
                        },
                        '&:hover::before': {
                          left: '100%',
                        },
                      }}
                    >
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 16, 
                            height: 16, 
                            border: '2px solid #7289DA', 
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' },
                            }
                          }} />
                          認証中...
                        </Box>
                      ) : (
                        'Discordアカウントを連携'
                      )}
                    </Button>
                  )}
                </Box>
              </Fade>



              {/* 注意事項 */}
              <Fade in={true} timeout={2000}>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      opacity: 0.7
                    }}
                  >
                    ※ Discordアカウントをお持ちでない場合は、
                    <br />
                    先にDiscordでアカウントを作成してください。
                  </Typography>
                </Box>
              </Fade>

              {/* リンク */}
              <Fade in={true} timeout={2100}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    mt: 3,
                  }}
                >
                  <Typography 
                    component="a"
                    href="/login" 
                    variant="body2"
                    sx={{
                      color: '#667eea',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    すでにアカウントをお持ちの方はこちら
                  </Typography>
                </Box>
              </Fade>
            </Box>
          </Card>
      </Container>
    </Box>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
} 