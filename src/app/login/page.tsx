"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  Alert,
  Fade,
  Slide,
} from "@mui/material";
import { Email, Lock, LockOpen, Login as LoginIcon, Visibility, VisibilityOff, CheckCircle } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthCookie } from "@/lib/supabase";
import { vibrateActions, createVibrateOnClick, VIBRATION_PATTERNS } from "@/lib/vibration";

// 仮のソーシャルアイコン
const GoogleIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
    alt="Google"
    width={20}
    height={20}
  />
);
const MicrosoftIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
    alt="Microsoft"
    width={20}
    height={20}
  />
);
const DiscordIcon = () => (
  <img
    src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/discord.svg"
    alt="Discord"
    width={20}
    height={20}
    style={{ filter: 'grayscale(0%)' }}
  />
);

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [discordLinked, setDiscordLinked] = useState(false);
  const [discordUsername, setDiscordUsername] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [discordSuccessMessage, setDiscordSuccessMessage] = useState("");
  const { supabase, user, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // パスワードの強度をチェック
  const isPasswordStrong = password.length >= 6;

  // 認証状態の確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking auth status...');
      console.log('User:', user);
      console.log('Session:', session);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session:', currentSession);
      
      if (currentSession?.user) {
        console.log('✅ User is authenticated:', currentSession.user.email);
        console.log('User metadata:', currentSession.user.user_metadata);
        console.log('App metadata:', currentSession.user.app_metadata);
      } else {
        console.log('❌ No active session found');
      }
    };
    
    checkAuthStatus();
  }, [supabase, user, session]);

  // URLパラメータからエラーとメッセージを取得
  useEffect(() => {
    const errorParam = searchParams ? searchParams.get('error') : null;
    const messageParam = searchParams ? searchParams.get('message') : null;
    const discordLinkedParam = searchParams ? searchParams.get('discord_linked') : null;
    
    if (errorParam) {
      switch (errorParam) {
        case 'session_error':
          setError('セッションの設定に失敗しました。ブラウザのキャッシュをクリアして再度お試しください。');
          break;
        case 'auth_error':
          setError('認証に失敗しました。再度お試しください。');
          break;
        case 'pkce_error':
          setError('認証セッションに問題があります。ブラウザを再読み込みして再度お試しください。');
          break;
        case 'invalid_grant':
          setError('認証コードが無効です。再度お試しください。');
          break;
        case 'redirect_uri_mismatch':
          setError('リダイレクトURIの設定に問題があります。管理者にお問い合わせください。');
          break;
        case 'client_id_error':
          setError('クライアントIDの設定に問題があります。管理者にお問い合わせください。');
          break;
        case 'pkce_grant_error':
          setError('認証フローに問題があります。ブラウザのキャッシュをクリアして再度お試しください。');
          break;
        default:
          setError('ログインに失敗しました。再度お試しください。');
      }
    } else if (messageParam === 'registration_success') {
      setError(null);
      setSuccessMessage('アカウントが正常に作成されました。確認メールをご確認ください。');
    }
    
    // Discord連携が完了した場合
    if (discordLinkedParam === 'true') {
      console.log('🎉 Discord連携完了を検知しました');
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
            setDiscordSuccessMessage('Discordアカウントでログインしました！');
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
      
      getDiscordUserInfo();
    }
  }, [searchParams, supabase]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // 管理者ログイン判定（環境変数から取得）
      const adminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_SUPERADMIN_PASSWORD;
      if (email === adminEmail && password === adminPassword) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin', 'true');
        }
        router.push("/more");
        return;
      }
      
      console.log('🔄 Attempting login with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Login error:', error);
        throw error;
      }
      
      console.log('✅ Login successful:', data.user?.email);
      console.log('📋 Session details:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        accessToken: data.session?.access_token ? 'present' : 'missing',
        refreshToken: data.session?.refresh_token ? 'present' : 'missing'
      });
      
      // クッキーを手動で設定
      if (data.session?.access_token) {
        console.log('🍪 Setting auth cookies manually...');
        setAuthCookie('sb-access-token', data.session.access_token, 7);
        if (data.session.refresh_token) {
          setAuthCookie('sb-refresh-token', data.session.refresh_token, 7);
        }
        console.log('✅ Auth cookies set successfully');
      }
      
      // セッションが確実に設定されるまで少し待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push("/more"); // ログイン成功後、その他ページへ
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

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
      console.log('From login page:', true);
      
      // 既存のセッションを確認（クリアは行わない）
      console.log('🔍 Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session user:', session?.user);
      console.log('Session access token:', session?.access_token ? 'present' : 'missing');
      
      // Supabaseの直接URLにfromパラメータを追加
      const redirectUrlWithParams = supabaseCallbackUrl + '?from=login&next=/register';
      console.log('Final redirect URL with params:', redirectUrlWithParams);
      console.log('URL parameters:', {
        from: 'login',
        next: '/register',
        fullUrl: redirectUrlWithParams
      });
      console.log('Expected callback URL:', redirectUrlWithParams);
      console.log('URL encoding test:', encodeURIComponent('from=login&next=/register'));
      
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
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Slide direction="up" in={true} timeout={800}>
          <Card
            sx={{
              p: 4,
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
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
                    AOIRO IDにログイン
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '1.1rem',
                      opacity: 0.8
                    }}
                  >
                    Discord連携で簡単ログイン
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

              {/* 成功メッセージ表示 */}
              {successMessage && (
                <Fade in={true} timeout={500}>
                  <Alert 
                    severity="success" 
                    sx={{ 
                      width: '100%', 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        color: '#2e7d32'
                      }
                    }}
                  >
                    {successMessage}
                  </Alert>
                </Fade>
              )}

              {/* メール・パスワード入力 */}
              <Fade in={true} timeout={1200}>
                <Box sx={{ width: '100%', mb: 3 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="メールアドレス"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: <Email sx={{ color: "#667eea", mr: 1 }} />,
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="パスワード"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <Fade in={!isPasswordStrong} timeout={300}>
                            <LockOpen sx={{ color: "#667eea" }} />
                          </Fade>
                          <Fade in={isPasswordStrong} timeout={300}>
                            <Lock sx={{ color: "#667eea", position: 'absolute' }} />
                          </Fade>
                        </Box>
                      ),
                      endAdornment: (
                        <Button
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      ),
                    }}
                  />
                </Box>
              </Fade>

              {/* ログインボタン */}
              <Fade in={true} timeout={1400}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  onClick={createVibrateOnClick(handleLogin, VIBRATION_PATTERNS.BUTTON)}
                  disabled={loading}
                  startIcon={<LoginIcon />}
                  sx={{ 
                    mt: 2, 
                    mb: 3, 
                    py: 2, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
                      transform: 'translateY(-3px)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #b0b0b0 0%, #909090 100%)',
                      boxShadow: 'none',
                      transform: 'none',
                    },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {loading ? 'ログイン中...' : 'AOIRO IDにログイン'}
                </Button>
              </Fade>

              {/* ソーシャルログインボタン */}
              <Fade in={true} timeout={1600}>
                <Box sx={{ width: '100%', mb: 3 }}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      または
                    </Typography>
                  </Divider>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={createVibrateOnClick(handleDiscordLink, VIBRATION_PATTERNS.BUTTON)}
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
                          backgroundColor: 'rgba(114, 137, 218, 0.05)',
                          borderColor: '#b0b0b0',
                          color: '#b0b0b0',
                          transform: 'none',
                          boxShadow: 'none',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                          transition: 'left 0.5s',
                        },
                        '&:hover::before': {
                          left: '100%',
                        },
                      }}
                    >
                      Discordアカウントでログイン
                    </Button>
                  </Box>
                </Box>
              </Fade>

              {/* Discord連携完了状態表示 */}
              {discordLinked && (
                <Fade in={discordLinked} timeout={800}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'rgba(76, 175, 80, 0.1)', 
                    borderRadius: 2,
                    border: '2px solid #4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 3,
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
                        Discordアカウントでログイン完了
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
              )}

              {/* 管理者ログインボタン */}
              <Fade in={true} timeout={1800}>
                <Box sx={{ width: '100%' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    sx={{ 
                      mb: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(156, 39, 176, 0.2)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onClick={() => router.push('/admin-login')}
                  >
                    管理者ログイン
                  </Button>
                </Box>
              </Fade>

              {/* リンク */}
              <Fade in={true} timeout={2000}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    mt: 2,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Link 
                    href="/reset-password" 
                    variant="body2"
                    sx={{
                      color: '#667eea',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    パスワードを忘れましたか？
                  </Link>
                  <Link 
                    href="/register" 
                    variant="body2"
                    sx={{
                      color: '#667eea',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    新規登録はこちら
                  </Link>
                </Box>
              </Fade>
            </Box>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
} 