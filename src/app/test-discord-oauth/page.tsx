"use client";
import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  Fade,
  Slide,
  Divider,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

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

export default function TestDiscordOAuthPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase } = useAuth();

  const handleDiscordTest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('🧪 Starting Discord OAuth test...');
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectUrl);
      
      // セッションをクリアしてから新しい認証を開始
      console.log('🧹 Clearing existing session...');
      await supabase.auth.signOut();
      
      const oauthOptions = {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
        queryParams: {
          response_type: 'code',
        },
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
      console.log('Redirect URL used:', redirectUrl);
      
      setSuccess('Discord OAuthが正常に開始されました。リダイレクトを待機中...');
      
      // ブラウザリダイレクトが自動的に行われる
      console.log('🔄 Waiting for browser redirect...');
      
    } catch (err: any) {
      console.error('❌ Discord test error:', err);
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

  const handleClearSession = async () => {
    try {
      await supabase.auth.signOut();
      setSuccess('セッションが正常にクリアされました。');
      setError(null);
    } catch (err: any) {
      setError('セッションのクリアに失敗しました: ' + err.message);
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
                    Discord OAuth テスト
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '1.1rem',
                      opacity: 0.8
                    }}
                  >
                    Discord連携機能の動作確認とデバッグ
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

              {/* 成功表示 */}
              {success && (
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
                    {success}
                  </Alert>
                </Fade>
              )}

              {/* Discord OAuth テストボタン */}
              <Fade in={true} timeout={1200}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleDiscordTest}
                  disabled={loading}
                  startIcon={<DiscordIcon />}
                  sx={{ 
                    mb: 3, 
                    py: 2, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #7289DA 0%, #5b6eae 100%)',
                    boxShadow: '0 8px 25px rgba(114, 137, 218, 0.3)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5b6eae 0%, #4a5a8f 100%)',
                      boxShadow: '0 12px 35px rgba(114, 137, 218, 0.5)',
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
                  {loading ? 'テスト中...' : 'Discord OAuth テスト'}
                </Button>
              </Fade>

              {/* 区切り線 */}
              <Fade in={true} timeout={1300}>
                <Box sx={{ width: '100%', my: 2 }}>
                  <Divider sx={{ 
                    '&::before, &::after': {
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    }
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        px: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: 1
                      }}
                    >
                      または
                    </Typography>
                  </Divider>
                </Box>
              </Fade>

              {/* セッションクリアボタン */}
              <Fade in={true} timeout={1400}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleClearSession}
                  sx={{ 
                    mb: 3, 
                    py: 2, 
                    borderRadius: 3,
                    border: '2px solid #667eea',
                    color: '#667eea',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'none',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      borderColor: '#5a6fd8',
                      color: '#5a6fd8',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  セッションクリア
                </Button>
              </Fade>

              {/* 説明 */}
              <Fade in={true} timeout={1500}>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.9rem',
                      lineHeight: 1.6
                    }}
                  >
                    このページはDiscord OAuthの動作確認とデバッグ用です。
                    <br />
                    問題が発生した場合は、ブラウザの開発者ツール（F12）でコンソールログを確認してください。
                  </Typography>
                </Box>
              </Fade>
            </Box>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
} 