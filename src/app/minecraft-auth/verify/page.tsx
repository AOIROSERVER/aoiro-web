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
      console.log('📋 Verification response:', verifyData);

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Minecraft ID認証に失敗しました');
      }

      if (!verifyData.exists) {
        setError('指定されたMinecraft IDは存在しません。正確なIDを入力してください。');
        // 認証失敗時はGoogle Sheetsに記録しない
        return;
      }

      console.log('✅ Minecraft ID verified successfully');
      if (verifyData.xuid) {
        console.log('📋 XUID:', verifyData.xuid);
      }
      if (verifyData.gamertag) {
        console.log('📋 Gamertag:', verifyData.gamertag);
      }
      if (verifyData.avatarUrl) {
        console.log('📋 Avatar URL:', verifyData.avatarUrl);
      }

      // 認証成功時のみGoogle Sheetsに記録
      try {
        console.log('📝 Recording successful authentication to Google Sheets...');
        const recordResponse = await fetch('/api/record-minecraft-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            minecraftId: minecraftId.trim(),
            discordUserId: user?.id || null,
            discordUsername: user?.user_metadata?.preferred_username || user?.user_metadata?.name || null,
            discordGlobalName: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
          }),
        });

        const recordData = await recordResponse.json();
        
        if (recordData.success) {
          if (recordData.sheetsError) {
            console.warn('⚠️ Google Sheets recording failed but auth succeeded:', recordData.message);
          } else {
            console.log('✅ Successfully recorded to Google Sheets');
          }
        } else {
          console.warn('⚠️ Google Sheets recording failed:', recordData.error);
        }
      } catch (recordError) {
        console.warn('⚠️ Failed to record to Google Sheets:', recordError);
        // 記録エラーでも認証は成功として扱う
      }

      // 認証成功
      setSuccess(`Minecraft ID「${minecraftId}」の認証が完了しました！`);
      
      // アバター画像URLも取得して認証完了ページにリダイレクト
      const avatarUrl = verifyData.avatarUrl || null;
      setTimeout(() => {
        const params = new URLSearchParams({
          minecraftId: minecraftId.trim(),
          ...(avatarUrl && { avatarUrl })
        });
        router.push(`/minecraft-auth/success?${params.toString()}`);
      }, 1000);

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
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #667eea 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 動的な背景要素 */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
        animation: 'float 6s ease-in-out infinite',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)',
        animation: 'float 8s ease-in-out infinite reverse',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
        animation: 'pulse 10s ease-in-out infinite',
        zIndex: 0
      }} />
      
      {/* パーティクル効果 */}
      {[...Array(20)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            zIndex: 0
          }}
        />
      ))}
      
      {/* ローディング中の特別な背景効果 */}
      {loading && (
        <>
          {/* 回転する光の輪 */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            border: '2px solid rgba(255, 152, 0, 0.1)',
            animation: 'rotate 8s linear infinite',
            zIndex: 0
          }} />
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 500,
            borderRadius: '50%',
            border: '2px solid rgba(255, 87, 34, 0.1)',
            animation: 'rotate 6s linear infinite reverse',
            zIndex: 0
          }} />
          
          {/* ローディング中のパーティクル */}
          {[...Array(15)].map((_, i) => (
            <Box
              key={`loading-${i}`}
              sx={{
                position: 'absolute',
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                background: 'radial-gradient(circle, rgba(255, 152, 0, 0.3), rgba(255, 87, 34, 0.1))',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `loadingFloat ${Math.random() * 4 + 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
                zIndex: 0
              }}
            />
          ))}
        </>
      )}

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Card sx={{ 
          p: 4, 
          borderRadius: 4, 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            zIndex: -1
          }
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(102, 126, 234, 0.3)',
              animation: 'glow 3s ease-in-out infinite alternate',
              mb: 3
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
            sx={{ 
              mb: 3,
              position: 'relative',
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  border: '1px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 0 20px rgba(102, 126, 234, 0.2)',
                  transform: 'translateY(-2px)',
                },
                '&.Mui-focused': {
                  border: '1px solid rgba(102, 126, 234, 0.8)',
                  boxShadow: '0 0 25px rgba(102, 126, 234, 0.3)',
                  transform: 'scale(1.02)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent)',
                    animation: 'shimmer 2s infinite',
                    zIndex: 0
                  }
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.8)',
                transition: 'all 0.3s ease',
                '&.Mui-focused': {
                  color: '#667eea',
                  transform: 'scale(1.05)',
                  textShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
                }
              },
              '& .MuiInputBase-input': {
                color: 'rgba(255,255,255,0.9)',
                transition: 'all 0.3s ease',
                '&::placeholder': {
                  color: 'rgba(255,255,255,0.5)',
                  opacity: 1
                }
              }
            }}
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
            startIcon={loading ? (
              <Box sx={{ position: 'relative', width: 20, height: 20 }}>
                {/* ローディングスピナー */}
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid rgba(255,255,255,0.9)',
                  animation: 'spin 1s linear infinite'
                }} />
                {/* 内側のパルス効果 */}
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.8)',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              </Box>
            ) : <CheckCircle />}
            sx={{
              background: loading ? 
                'linear-gradient(45deg, #FF9800, #FF5722, #E64A19)' : 
                'linear-gradient(45deg, #4CAF50, #45a049, #2E7D32)',
              backgroundSize: '200% 200%',
              animation: loading ? 'loadingGradient 2s ease infinite' : 'gradientShift 3s ease infinite',
              borderRadius: 3,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              mb: 4,
              boxShadow: loading ? 
                '0 8px 25px rgba(255, 152, 0, 0.4)' : 
                '0 8px 25px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&::before': loading ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmer 1.5s infinite',
                zIndex: 0
              } : {},
              '&:hover': {
                transform: loading ? 'none' : 'translateY(-2px)',
                boxShadow: loading ? 
                  '0 8px 25px rgba(255, 152, 0, 0.4)' : 
                  '0 12px 35px rgba(76, 175, 80, 0.4)',
                background: loading ? 
                  'linear-gradient(45deg, #FF9800, #FF5722, #E64A19)' : 
                  'linear-gradient(45deg, #45a049, #4CAF50, #2E7D32)',
              },
              '&:disabled': {
                background: 'rgba(76, 175, 80, 0.5)',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>認証中</span>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.8)',
                        animation: `bounce 1.4s ease-in-out infinite both`,
                        animationDelay: `${i * 0.16}s`
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ) : '認証する'}
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
            <Typography variant="body2" color="text.secondary" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              認証に問題がある場合は、サーバー管理者にお問い合わせください
            </Typography>
          </Box>
        </Card>
      </Container>
      
      {/* CSSアニメーション */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        
        @keyframes glow {
          0% { text-shadow: 0 0 30px rgba(102, 126, 234, 0.3); }
          100% { text-shadow: 0 0 50px rgba(102, 126, 234, 0.6); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes loadingGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        @keyframes rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes loadingFloat {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.8; }
        }
      `}</style>
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

