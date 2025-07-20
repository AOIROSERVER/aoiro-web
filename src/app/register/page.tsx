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
import { Email, Lock, LockOpen, Person, Login as RegisterIcon, Tag, Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterContent() {
  const [username, setUsername] = useState("");
  const [gameTag, setGameTag] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // パスワードの強度をチェック
  const isPasswordStrong = password.length >= 6;
  
  // メールアドレスの形式をチェック
  const isValidEmail = email.includes('@');
  
  // ゲームタグの有効性をチェック
  const isValidGameTag = gameTag.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(gameTag);
  
  // パスワード確認の一致をチェック
  const doPasswordsMatch = password === confirmPassword && password.length > 0;
  
  // フォームが有効かどうかをチェック
  const isFormValid = username.length > 0 && isValidGameTag && isValidEmail && isPasswordStrong && doPasswordsMatch;

  // URLパラメータからエラーを取得
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'session_error':
          setError('セッションの設定に失敗しました。再度登録してください。');
          break;
        case 'auth_error':
          setError('認証に失敗しました。再度お試しください。');
          break;
        default:
          setError('登録に失敗しました。再度お試しください。');
      }
    }
  }, [searchParams]);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    // バリデーション
    if (!username || !gameTag || !email || !password || !confirmPassword) {
      setError('すべての項目を入力してください');
      setLoading(false);
      return;
    }

    // ゲームタグのバリデーション
    if (gameTag.length < 3) {
      setError('ゲームタグは3文字以上で入力してください');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(gameTag)) {
      setError('ゲームタグは英数字、ハイフン、アンダースコアのみ使用できます');
      setLoading(false);
      return;
    }

    // ゲームタグの重複チェック
    try {
      const { data: existingGameTag, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('game_tag', gameTag)
        .single();

      if (existingGameTag) {
        setError('このゲームタグは既に使用されています');
        setLoading(false);
        return;
      }
    } catch (error) {
      // エラーが発生した場合（レコードが見つからない場合）は重複していない
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 アカウント登録開始:', { email, username, gameTag });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            game_tag: gameTag,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      console.log('🔍 登録結果:', { 
        success: !error, 
        error: error?.message,
        user: data?.user?.email,
        session: !!data?.session,
        emailConfirmed: data?.user?.email_confirmed_at
      });
      
      if (error) {
        console.error('❌ 登録エラー:', error);
        throw error;
      }
      
      // 登録成功後の詳細情報
      if (data?.user) {
        console.log('✅ ユーザー登録成功:', {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          createdAt: data.user.created_at,
          metadata: data.user.user_metadata
        });
        
        // メール確認の状態をチェック
        if (!data.user.email_confirmed_at) {
          console.log('📧 メール確認待ち状態');
          console.log('📧 確認メールが送信されているはずです');
          console.log('📧 スパムフォルダも確認してください');
        } else {
          console.log('✅ メール確認済み');
        }
      }
      
      // 登録成功後、確認メール送信の案内
      router.push("/login?message=registration_success");
    } catch (err: any) {
      console.error('❌ 登録処理エラー:', err);
      setError(err.error_description || err.message);
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
                    新しいアカウントを作成して、より便利に
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

              {/* ユーザー名入力 */}
              <Fade in={true} timeout={1200}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="ユーザー名"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                    startAdornment: <Person sx={{ color: "#667eea", mr: 1 }} />,
                  }}
                />
              </Fade>

              {/* ゲームタグ入力 */}
              <Fade in={true} timeout={1300}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="gameTag"
                  label="ゲームタグ"
                  name="gameTag"
                  autoComplete="off"
                  value={gameTag}
                  onChange={(e) => setGameTag(e.target.value)}
                  disabled={loading}
                  helperText="英数字、ハイフン、アンダースコアのみ使用可能（3文字以上）"
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
                    startAdornment: <Tag sx={{ color: "#667eea", mr: 1 }} />,
                  }}
                />
              </Fade>

              {/* メールアドレス入力 */}
              <Fade in={true} timeout={1400}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="メールアドレス"
                  name="email"
                  autoComplete="email"
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
              </Fade>

              {/* パスワード入力 */}
              <Fade in={true} timeout={1500}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="パスワード"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
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
              </Fade>

              {/* パスワード確認入力 */}
              <Fade in={true} timeout={1600}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="パスワード確認"
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        sx={{ minWidth: 'auto', p: 0.5 }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />
              </Fade>

              {/* 登録ボタン */}
              <Fade in={true} timeout={1700}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  onClick={handleRegister}
                  disabled={loading || !isFormValid}
                  startIcon={<RegisterIcon />}
                  sx={{ 
                    mt: 3, 
                    mb: 3, 
                    py: 2, 
                    borderRadius: 3,
                    background: isFormValid 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #b0b0b0 0%, #909090 100%)',
                    boxShadow: isFormValid 
                      ? '0 8px 25px rgba(102, 126, 234, 0.3)'
                      : 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'none',
                    '&:hover': {
                      background: isFormValid 
                        ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                        : 'linear-gradient(135deg, #b0b0b0 0%, #909090 100%)',
                      boxShadow: isFormValid 
                        ? '0 12px 35px rgba(102, 126, 234, 0.5)'
                        : 'none',
                      transform: isFormValid ? 'translateY(-3px)' : 'none',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #b0b0b0 0%, #909090 100%)',
                      boxShadow: 'none',
                      transform: 'none',
                    },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {loading ? '登録中...' : 'アカウント作成'}
                </Button>
              </Fade>

              {/* リンク */}
              <Fade in={true} timeout={1800}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    mt: 2,
                  }}
                >
                  <Link 
                    href="/login" 
                    variant="body2"
                    sx={{
                      color: '#667eea',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    すでにアカウントをお持ちの方はこちら
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
} 