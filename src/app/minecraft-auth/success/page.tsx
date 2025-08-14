'use client';

import React, { useEffect, useState, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  Slide,
} from "@mui/material";
import { CheckCircle, Home, Refresh } from "@mui/icons-material";
import { useRouter } from "next/navigation";

function MinecraftAuthSuccessContent() {
  const [countdown, setCountdown] = useState(5);
  const [minecraftId, setMinecraftId] = useState('');
  const router = useRouter();
  
  // クライアントサイドでのみsearchParamsを取得
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setMinecraftId(searchParams.get('minecraftId') || '');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRetry = () => {
    router.push('/minecraft-auth/verify');
  };

  const handleJoinDiscord = () => {
    // AOIROSERVERのDiscordサーバーに参加
    window.open('https://discord.com/invite/U9DVtc2y5J', '_blank');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #4CAF50 100%)',
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
        background: 'radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, rgba(69, 160, 73, 0.05) 100%)',
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
        background: 'radial-gradient(circle, rgba(69, 160, 73, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
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
      {[...Array(30)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: Math.random() * 6 + 3,
            height: Math.random() * 6 + 3,
            background: 'rgba(76, 175, 80, 0.2)',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            zIndex: 0
          }}
        />
      ))}
      
      {/* 成功の光線効果 */}
      {[...Array(8)].map((_, i) => (
        <Box
          key={`ray-${i}`}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '2px',
            height: '200px',
            background: 'linear-gradient(to bottom, rgba(76, 175, 80, 0.8), transparent)',
            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
            transformOrigin: 'center bottom',
            animation: `rayRotate 4s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            zIndex: 0
          }}
        />
      ))}

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
          textAlign: 'center',
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
          {/* 成功アイコン */}
          <Box sx={{ mb: 3, position: 'relative' }}>
            <CheckCircle 
              sx={{ 
                fontSize: 100, 
                color: '#4CAF50',
                filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.6))',
                animation: 'successPulse 2s ease-in-out infinite'
              }} 
            />
            {/* 成功の輪 */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '3px solid rgba(76, 175, 80, 0.3)',
              animation: 'successRing 2s ease-in-out infinite',
              zIndex: -1
            }} />
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 140,
              height: 140,
              borderRadius: '50%',
              border: '2px solid rgba(76, 175, 80, 0.2)',
              animation: 'successRing 2s ease-in-out infinite 0.5s',
              zIndex: -1
            }} />
          </Box>

          {/* タイトル */}
          <Typography variant="h3" component="h1" gutterBottom sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #4CAF50, #45a049, #2E7D32)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(76, 175, 80, 0.3)',
            animation: 'glow 3s ease-in-out infinite alternate',
            mb: 3
          }}>
            🎉 認証完了！
          </Typography>

          {/* サブタイトル */}
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            AOIROSERVERの認定メンバーになりました
          </Typography>

          {/* Minecraft ID表示 */}
          {minecraftId && (
            <Box sx={{ 
              mb: 4, 
              p: 3, 
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(69, 160, 73, 0.05))',
              borderRadius: 3,
              border: '1px solid rgba(76, 175, 80, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmer 2s infinite',
                zIndex: 0
              }
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                🎮 Minecraft ID: <span style={{ 
                  color: '#4CAF50',
                  textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
                }}>{minecraftId}</span>
              </Typography>
            </Box>
          )}

          {/* 完了メッセージ */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            おめでとうございます！Minecraft IDの認証が完了しました。
            <br />
            AOIROSERVERでより多くの機能を利用できるようになりました。
          </Typography>

          {/* 自動リダイレクト情報 */}
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2">
              {countdown}秒後にホームページに自動的に移動します
            </Typography>
          </Alert>

          {/* アクションボタン */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGoHome}
              startIcon={<Home />}
              sx={{
                background: 'linear-gradient(45deg, #2196F3, #1976D2, #1565C0)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 3s ease infinite',
                borderRadius: 3,
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(33, 150, 243, 0.4)',
                }
              }}
            >
              ホームページへ
            </Button>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleJoinDiscord}
              startIcon={<span style={{ fontSize: '20px' }}>🎮</span>}
              sx={{
                background: 'linear-gradient(45deg, #7289DA, #5865F2, #4752C4)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 3s ease infinite 0.5s',
                borderRadius: 3,
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(114, 137, 218, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(114, 137, 218, 0.4)',
                }
              }}
            >
              Discordに参加
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={handleRetry}
              startIcon={<Refresh />}
              sx={{
                borderColor: '#4CAF50',
                color: '#4CAF50',
                borderRadius: 3,
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderWidth: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#45a049',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
                }
              }}
            >
              別のIDで認証
            </Button>
          </Box>

          {/* 追加情報 */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>次のステップ:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • サーバーに参加してゲームを楽しむ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • コミュニティに参加する
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 各種機能を利用する
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
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        
        @keyframes rayRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) rotate(180deg); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) rotate(360deg); opacity: 0.8; }
        }
        
        @keyframes glow {
          0% { text-shadow: 0 0 30px rgba(76, 175, 80, 0.3); }
          100% { text-shadow: 0 0 50px rgba(76, 175, 80, 0.6); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes successPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes successRing {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </Box>
  );
}

export default function MinecraftAuthSuccessPage() {
  return (
    <Suspense fallback={
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <Typography>読み込み中...</Typography>
        </Card>
      </Box>
    }>
      <MinecraftAuthSuccessContent />
    </Suspense>
  );
}
