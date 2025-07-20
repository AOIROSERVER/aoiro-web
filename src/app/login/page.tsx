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
import { Email, Lock, LockOpen, Login as LoginIcon, Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

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
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
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
        default:
          setError('ログインに失敗しました。再度お試しください。');
      }
    } else if (messageParam === 'registration_success') {
      setError(null);
      setSuccessMessage('アカウントが正常に作成されました。確認メールをご確認ください。');
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/more"); // ログイン成功後、その他ページへ
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure' | 'discord') => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔄 Starting ${provider} OAuth login...`);
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectUrl);
      
      // セッションをクリアしてから新しい認証を開始
      console.log('🧹 Clearing existing session...');
      await supabase.auth.signOut();
      
      // プロバイダーごとに適切な設定を分ける
      const oauthOptions: any = {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      };
      
      // Discordのみにresponse_type: 'code'を追加
      if (provider === 'discord') {
        oauthOptions.queryParams = {
          response_type: 'code',
        };
      }
      
      console.log(`📡 Initiating ${provider} OAuth with options:`, oauthOptions);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });
      
      if (error) {
        console.error(`❌ ${provider} OAuth error:`, error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        throw error;
      }
      
      console.log(`✅ ${provider} OAuth initiated successfully`);
      console.log('OAuth data:', data);
      console.log('Provider:', provider);
      console.log('Redirect URL used:', redirectUrl);
      
      // ブラウザリダイレクトが自動的に行われる
      console.log('🔄 Waiting for browser redirect...');
      
    } catch (err: any) {
      console.error(`❌ ${provider} login error:`, err);
      console.error('Full error object:', err);
      console.error('Error type:', typeof err);
      console.error('Error keys:', Object.keys(err || {}));
      
      let errorMessage = err.error_description || err.message || '認証に失敗しました';
      
      // プロバイダー別のエラーメッセージ
      if (provider === 'discord') {
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
      } else if (provider === 'google') {
        console.error('Google OAuth詳細エラー:', {
          message: err.message,
          status: err.status,
          name: err.name,
          stack: err.stack
        });
        
        if (err.message?.includes('redirect_uri')) {
          errorMessage = 'GoogleのリダイレクトURI設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('client_id')) {
          errorMessage = 'GoogleのクライアントID設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('invalid_grant')) {
          errorMessage = 'Googleの認証コードが無効です。再度お試しください。';
        } else if (err.message?.includes('unauthorized_client')) {
          errorMessage = 'Googleのクライアント認証に失敗しました。設定を確認してください。';
        } else if (err.message?.includes('access_denied')) {
          errorMessage = 'Googleログインがキャンセルされました。再度お試しください。';
        } else if (err.message?.includes('popup_closed')) {
          errorMessage = 'Googleログインのポップアップが閉じられました。再度お試しください。';
        } else if (err.message?.includes('network')) {
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        } else if (err.message?.includes('auth_error')) {
          errorMessage = 'Google認証でエラーが発生しました。ブラウザのキャッシュをクリアして再度お試しください。';
        } else {
          errorMessage = `Googleログインエラー: ${err.message || '不明なエラーが発生しました'}`;
        }
      }
      
      console.error(`Final error message for ${provider}:`, errorMessage);
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
        <Slide direction="up" in={true} timeout={800}>
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
                background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
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
                    アカウントを作成して、より便利に
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
                    <Typography variant="body2" component="div">
                      {error}
                    </Typography>
                    {error.includes('Google') && (
                      <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                        詳細なエラー情報を確認するには、ブラウザの開発者ツール（F12）のコンソールを確認してください。
                      </Typography>
                    )}
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
                      borderRadius: 2
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
                  onClick={handleLogin}
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

              {/* 管理者ログインボタン */}
              <Fade in={true} timeout={1600}>
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
              <Fade in={true} timeout={1800}>
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