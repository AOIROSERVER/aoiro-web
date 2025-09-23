'use client';

import React, { useState, useEffect, useRef } from 'react';
import { keyframes } from '@emotion/react';

import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  CreditCard, 
  ContactlessOutlined, 
  Person,
  Info,
  ArrowDownward,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  QrCode
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// アニメーション用のkeyframes
const pulseKeyframe = keyframes`
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.05); 
  }
`;

const fadeInUpKeyframe = keyframes`
  0% { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const slideInFromLeftKeyframe = keyframes`
  0% { 
    opacity: 0; 
    transform: translateX(-50px); 
  }
  100% { 
    opacity: 1; 
    transform: translateX(0); 
  }
`;

const slideInFromRightKeyframe = keyframes`
  0% { 
    opacity: 0; 
    transform: translateX(50px); 
  }
  100% { 
    opacity: 1; 
    transform: translateX(0); 
  }
`;

// 3D回転AICカードコンポーネント
const RotatingAICCard = ({ scrollProgress, isVisible }: { scrollProgress: number; isVisible: boolean }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // スクロールに基づく回転と位置の計算
  // 最初の25%で左に移動完了、その後は回転しながら拡大
  const isRotationPhase = scrollProgress < 0.85;
  const isScalePhase = scrollProgress >= 0.75 && scrollProgress < 0.85;
  const rotationProgress = Math.min(scrollProgress / 0.85, 1);
  const scaleProgress = Math.max(0, (scrollProgress - 0.75) / 0.1);
  const fixedProgress = scrollProgress >= 0.85 ? 1 : 0;
  
  // スムーズな回転アニメーション（イージング関数を使用）
  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const smoothRotationProgress = easeInOutCubic(rotationProgress);
  
  // 回転の終了を段階的に行う（0.8から0.85の間で徐々に回転を停止）
  const rotationEndProgress = Math.max(0, Math.min(1, (scrollProgress - 0.8) / 0.05));
  const rotationFadeOut = 1 - rotationEndProgress;
  
  // 矢印表示時は裏側を表示（180度回転）
  const isArrowPhase = scrollProgress >= 0.85;
  const rotationX = isRotationPhase ? smoothRotationProgress * 45 * rotationFadeOut : (isArrowPhase ? 0 : 0);
  const rotationY = isRotationPhase ? smoothRotationProgress * 360 * rotationFadeOut : (isArrowPhase ? 180 : 0);
  const rotationZ = isRotationPhase ? smoothRotationProgress * 15 * rotationFadeOut : (isArrowPhase ? 0 : 0);
  const translateY = 0;
  const translateX = Math.min(scrollProgress * 4, 1) * 300; // 最初の25%で右に移動完了
  const scale = isScalePhase ? 1.2 + scaleProgress * 0.3 : (scrollProgress >= 0.85 ? 1.5 : 1.2);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg) scale(${scale})`,
        transformStyle: 'preserve-3d',
        perspective: '2000px',
        zIndex: 1,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out, transform 0.1s ease-out',
        width: isMobile ? '300px' : '350px',
        height: isMobile ? '190px' : '220px',
        filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))',
      }}
    >
      {/* AICカードの前面 */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 6,
          background: 'linear-gradient(135deg, #060146 0%, #0a0a5a 25%, #1a1a6a 50%, #0a0a5a 75%, #060146 100%)',
          color: 'white',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 20px 60px rgba(6, 1, 70, 0.4), 0 8px 32px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          transform: 'translateZ(20px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              conic-gradient(from 180deg at 30% 60%, transparent 0deg, rgba(255,255,255,0.05) 60deg, transparent 120deg),
              radial-gradient(circle at 30% 60%, rgba(255,255,255,0.08) 0%, transparent 50%),
              linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.02) 25%, transparent 50%, rgba(255,255,255,0.02) 75%, transparent 100%)
            `,
            zIndex: 1
          }
        }}
      >
        {/* 白い幾何学的形状 */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '25%',
            left: '60%',
            width: '80%',
            height: '80%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)',
            transform: 'rotate(45deg)',
            transformOrigin: 'center'
          }
        }} />

        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '20%',
            right: '20%',
            width: '40%',
            height: '40%',
            background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 100%)',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 0 0)',
            transform: 'rotate(-25deg)',
            transformOrigin: 'center'
          }
        }} />

        {/* カード内容（表面） */}
        <Box sx={{ 
          position: 'relative', 
          zIndex: 2, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          transform: isArrowPhase ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.3s ease-in-out',
          backfaceVisibility: 'hidden'
        }}>
          {/* 上部 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                width: 0, 
                height: 0, 
                borderRight: '10px solid white',
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                opacity: 0.9
              }} />
              <Typography variant="h6" fontWeight="bold" sx={{ 
                fontSize: '1.1rem',
                letterSpacing: '0.5px',
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                AOIRO ID Card
              </Typography>
            </Box>
            <Box sx={{ 
              width: 40, 
              height: 28, 
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <ContactlessOutlined sx={{ fontSize: 18, color: 'white' }} />
            </Box>
          </Box>

          {/* 中央 */}
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="body1" sx={{ 
              opacity: 0.8,
              fontWeight: 400,
              letterSpacing: '0.5px',
              color: '#e0e0e0',
              mb: 1.5,
              fontSize: '0.85rem'
            }}>
              Employee ID Card
            </Typography>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ 
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                fontSize: {
                  xs: '1.6rem',
                  sm: '1.8rem',
                  md: '2.0rem',
                  lg: '2.2rem'
                },
                opacity: 0.95,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'block',
                mb: 0.5
              }}>
                メンバー
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                fontSize: '0.9rem',
                opacity: 0.9,
                letterSpacing: '0.3px',
                display: 'block'
              }}>
                セクション
              </Typography>
            </Box>
          </Box>

          {/* 下部 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  background: 'rgba(255,255,255,0.2)'
                }}
              >
                <Person sx={{ fontSize: 18, color: 'white' }} />
              </Avatar>
              <Typography variant="body2" fontWeight="bold" sx={{ 
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                fontSize: '0.85rem',
                lineHeight: 1.2
              }}>
                ユーザー名
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              fontWeight="900" 
              sx={{ 
                letterSpacing: '1.2px',
                color: 'white',
                fontSize: '2.8rem',
                fontFamily: "'Arial Black', 'Helvetica Black', sans-serif",
                textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 0 25px rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                zIndex: 1,
                position: 'relative',
                lineHeight: 1,
                WebkitTextStroke: '0.8px rgba(255,255,255,0.9)',
                fontStyle: 'italic',
                textAlign: 'right',
                transform: 'skew(-5deg)'
              }}
            >
              AIC
            </Typography>
          </Box>
        </Box>

        {/* カード内容（裏側） */}
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          transform: isArrowPhase ? 'rotateY(0deg) scaleX(-1)' : 'rotateY(180deg) scaleX(-1)',
          transition: 'transform 0.3s ease-in-out',
          backfaceVisibility: 'hidden',
          p: 1.5
        }}>
          {/* 裏側の上部 - カード番号 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.7rem',
              letterSpacing: '0.3px',
              mb: 0.5
            }}>
              カード番号
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ 
                color: '#ffffff',
                fontSize: '1rem',
                letterSpacing: '1px',
                fontFamily: 'monospace'
              }}>
                0001 7559 5451 2607         
              </Typography>
              <Box sx={{ 
                width: 24, 
                height: 24, 
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <QrCode sx={{ fontSize: 14, color: 'white' }} />
              </Box>
            </Box>
          </Box>

          {/* 裏側の中央 - 署名 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.7rem',
              letterSpacing: '0.3px',
              mb: 0.5
            }}>
              署名
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ 
              color: '#ffffff',
              fontSize: '0.9rem',
              letterSpacing: '0.5px',
              fontFamily: 'monospace'
            }}>
              KUIYO
            </Typography>
          </Box>

          {/* 裏側の中央 - 3列の情報 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.6rem',
                letterSpacing: '0.3px',
                mb: 0.5
              }}>
                社員番号
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ 
                color: '#ffffff',
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
                fontFamily: 'monospace'
              }}>
                EMP01
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.6rem',
                letterSpacing: '0.3px',
                mb: 0.5
              }}>
                有効期限
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ 
                color: '#ffffff',
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
                fontFamily: 'monospace'
              }}>
                30/08
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.6rem',
                letterSpacing: '0.3px',
                mb: 0.5
              }}>
                セクション
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ 
                color: '#ffffff',
                fontSize: '0.8rem',
                letterSpacing: '0.5px'
              }}>
                メンバー
              </Typography>
            </Box>
          </Box>

          {/* 裏側の下部 - 注意事項とお問い合わせ */}
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="caption" sx={{ 
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.5rem',
              lineHeight: 1.2,
              display: 'block',
              mb: 1
            }}>
              注意事項:本人以外の使用禁止・有効期限の確認・適切な保管・管理
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.5rem',
              lineHeight: 1.2,
              display: 'block'
            }}>
              お問い合わせ: AOIROSERVER サポートセンター
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.5rem',
              lineHeight: 1.2,
              display: 'block'
            }}>
              aoiroserver@gmail.com
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* カードの厚みを表現するエッジ */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(6, 1, 70, 0.8) 0%, rgba(10, 10, 90, 0.6) 100%)',
          transform: 'translateZ(-8px)',
          zIndex: -1,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(6, 1, 70, 0.6) 0%, rgba(10, 10, 90, 0.4) 100%)',
          transform: 'translateZ(-16px)',
          zIndex: -2,
          boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
        }}
      />

      {/* カード説明用の矢印とラベル（カードが裏返った時から表示） */}
      {scrollProgress > 0.85 && (
        <>
          {/* カード番号の説明 */}
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              right: '-300px',
              opacity: fixedProgress,
              transform: `translateX(${(1 - fixedProgress) * 50}px)`,
              transition: 'all 0.3s ease-out',
              zIndex: 5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArrowBack sx={{ color: '#FF6B35', fontSize: { xs: 18, sm: 22, md: 26 } }} />
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transform: 'scaleX(-1)'
                }}
              >
                カード番号
              </Typography>
            </Box>
          </Box>

          {/* 署名の説明 */}
          <Box
            sx={{
              position: 'absolute',
              top: '35%',
              right: '-300px',
              opacity: fixedProgress,
              transform: `translateX(${(1 - fixedProgress) * 50}px)`,
              transition: 'all 0.3s ease-out',
              zIndex: 5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArrowBack sx={{ color: '#FF6B35', fontSize: { xs: 18, sm: 22, md: 26 } }} />
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transform: 'scaleX(-1)'
                }}
              >
                署名
              </Typography>
            </Box>
          </Box>

          {/* 社員番号の説明 */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: '-300px',
              opacity: fixedProgress,
              transform: `translateX(${(1 - fixedProgress) * 50}px)`,
              transition: 'all 0.3s ease-out',
              zIndex: 5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArrowBack sx={{ color: '#FF6B35', fontSize: { xs: 18, sm: 22, md: 26 } }} />
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transform: 'scaleX(-1)'
                }}
              >
                社員番号
              </Typography>
            </Box>
          </Box>

          {/* 有効期限の説明 */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: '-220px',
              opacity: fixedProgress,
              transform: `translateX(${(1 - fixedProgress) * 50}px)`,
              transition: 'all 0.3s ease-out',
              zIndex: 5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArrowBack sx={{ color: '#FF6B35', fontSize: { xs: 18, sm: 22, md: 26 } }} />
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transform: 'scaleX(-1)'
                }}
              >
                有効期限
              </Typography>
            </Box>
          </Box>

          {/* セクションの説明 */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: '-140px',
              opacity: fixedProgress,
              transform: `translateX(${(1 - fixedProgress) * 50}px)`,
              transition: 'all 0.3s ease-out',
              zIndex: 5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArrowBack sx={{ color: '#FF6B35', fontSize: { xs: 18, sm: 22, md: 26 } }} />
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transform: 'scaleX(-1)'
                }}
              >
                セクション
              </Typography>
            </Box>
          </Box>
        </>
      )}

    </Box>
  );
};

export default function AICIntroPage() {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCardVisible, setIsCardVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(scrollTop / docHeight, 1);
        setScrollProgress(progress);
        
        // カードの可視性を制御
        setIsCardVisible(progress < 0.98);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 背景エフェクト */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 142, 83, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 167, 38, 0.05) 0%, transparent 50%)
          `,
          zIndex: 1
        }}
      />

      {/* 3D回転AICカード */}
      <RotatingAICCard scrollProgress={scrollProgress} isVisible={isCardVisible} />

       {/* ヒーローセクション */}
       <Box
         sx={{
           minHeight: '100vh',
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'flex-start',
           justifyContent: 'center',
           textAlign: 'left',
           py: 8,
           px: 4,
           position: 'relative',
           zIndex: 2
         }}
       >
         <Container maxWidth="lg" sx={{ width: '100%' }}>
           <Typography
             variant="h1"
             fontWeight="bold"
             sx={{
               color: 'white',
               fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
               mb: 3,
               animation: `${fadeInUpKeyframe} 1s ease-out`,
               textShadow: '0 4px 20px rgba(255, 107, 53, 0.3)'
             }}
           >
             AIC
           </Typography>
           <Typography
             variant="h2"
             sx={{
               color: 'rgba(255,255,255,0.9)',
               fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
               mb: 6,
               animation: `${fadeInUpKeyframe} 1s ease-out 0.2s both`,
               fontWeight: 300
             }}
           >
             AOIRO ID Card
           </Typography>
           <Typography
             variant="h5"
             sx={{
               color: 'rgba(255,255,255,0.7)',
               fontSize: { xs: '1rem', sm: '1.2rem' },
               mb: 8,
               animation: `${fadeInUpKeyframe} 1s ease-out 0.4s both`,
               maxWidth: '600px',
               lineHeight: 1.6
             }}
           >
             デジタル時代の新しい身分証明システム
           </Typography>
           
           {/* スクロールインジケーター */}
           <Box
             sx={{
               animation: `${fadeInUpKeyframe} 1s ease-out 0.6s both`,
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'flex-start',
               gap: 2
             }}
           >
             <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
               スクロールして詳細を見る
             </Typography>
             <ArrowDownward sx={{ color: 'rgba(255,255,255,0.6)', animation: `${pulseKeyframe} 2s infinite` }} />
           </Box>
         </Container>
       </Box>

      {/* 機能説明セクション */}
      {[
        {
          title: "デジタル社員証",
          description: "AIC（AOIRO ID Card）は、従来の物理的な社員証をデジタル化した革新的な身分証明システムです。",
          features: [
            "QRコードによる即座の身分確認",
            "非接触式のセキュリティ認証",
            "リアルタイムでの有効性検証",
            "モバイルデバイスでの簡単アクセス"
          ]
        },
        {
          title: "高度なセキュリティ",
          description: "最新の暗号化技術と多要素認証により、最高レベルのセキュリティを提供します。",
          features: [
            "256ビット暗号化によるデータ保護",
            "生体認証との連携",
            "不正使用の即座検出",
            "定期的なセキュリティ更新"
          ]
        },
        {
          title: "シームレスな統合",
          description: "既存のシステムと完全に統合し、業務効率を大幅に向上させます。",
          features: [
            "既存システムとのAPI連携",
            "カスタマイズ可能な設定",
            "リアルタイム同期",
            "クロスプラットフォーム対応"
          ]
        },
        {
          title: "未来への投資",
          description: "デジタル化の波に対応し、持続可能な未来を築くための基盤技術です。",
          features: [
            "環境に優しいペーパーレス化",
            "スケーラブルなアーキテクチャ",
            "継続的な機能アップデート",
            "グローバルスタンダード準拠"
          ]
        },
        {
          title: "革新的なテクノロジー",
          description: "最新のテクノロジーを活用し、従来の概念を覆す新しい体験を提供します。",
          features: [
            "AI技術による自動認識",
            "ブロックチェーン技術の活用",
            "クラウドベースの管理システム",
            "IoTデバイスとの連携"
          ]
        },
        {
          title: "ユーザビリティの追求",
          description: "誰でも簡単に使える直感的なインターフェースを提供します。",
          features: [
            "ワンタップでの操作",
            "多言語対応",
            "アクセシビリティ機能",
            "直感的なデザイン"
          ]
        },
        {
          title: "リアルタイム同期",
          description: "すべてのデバイスでリアルタイムに情報が同期され、常に最新の状態を保ちます。",
          features: [
            "クラウドベースの同期システム",
            "オフライン対応機能",
            "自動バックアップ",
            "複数デバイス間での連携"
          ]
        },
        {
          title: "カスタマイズ性",
          description: "組織のニーズに合わせて柔軟にカスタマイズできるシステムです。",
          features: [
            "カスタムデザイン対応",
            "組織別設定管理",
            "権限レベルの細かい制御",
            "ブランドカラー対応"
          ]
        },
        {
          title: "データ分析",
          description: "使用状況やアクセスパターンを分析し、組織の効率化をサポートします。",
          features: [
            "使用統計の可視化",
            "アクセスログの管理",
            "レポート機能",
            "予測分析機能"
          ]
        },
        {
          title: "コンプライアンス対応",
          description: "各種規制や標準に準拠し、安全で信頼性の高いシステムを提供します。",
          features: [
            "GDPR準拠",
            "ISO27001認証",
            "SOC2 Type II対応",
            "プライバシー保護機能"
          ]
        },
        {
          title: "スケーラビリティ",
          description: "組織の成長に合わせて柔軟にスケールできるアーキテクチャです。",
          features: [
            "水平スケーリング対応",
            "負荷分散機能",
            "自動スケーリング",
            "高可用性設計"
          ]
        },
        {
          title: "API連携",
          description: "既存のシステムやサードパーティサービスとの連携を簡単に実現します。",
          features: [
            "RESTful API提供",
            "Webhook対応",
            "SDK提供",
            "サードパーティ連携"
          ]
        },
        {
          title: "モバイル最適化",
          description: "スマートフォンやタブレットでの使用に最適化された体験を提供します。",
          features: [
            "レスポンシブデザイン",
            "タッチ操作最適化",
            "オフライン機能",
            "プッシュ通知対応"
          ]
        }
      ].map((feature, index) => (
        <Box
          key={index}
          className="feature-section"
          sx={{
            minHeight: '120vh',
            display: 'flex',
            alignItems: 'center',
            py: 8,
            px: 2,
            position: 'relative',
            zIndex: 10
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    animation: `${slideInFromLeftKeyframe} 0.8s ease-out`,
                    animationDelay: '0.2s',
                    animationFillMode: 'both'
                  }}
                >
                  <Typography 
                    variant="h2" 
                    fontWeight="bold" 
                    sx={{ 
                      color: 'white',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      mb: 3,
                      textAlign: { xs: 'center', md: 'left' }
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: { xs: '1rem', sm: '1.2rem' },
                      mb: 4,
                      lineHeight: 1.6,
                      textAlign: { xs: 'center', md: 'left' }
                    }}
                  >
                    {feature.description}
                  </Typography>
                  <Box sx={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    borderRadius: 4, 
                    p: 4,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}>
                    {feature.features.map((featureItem, featureIndex) => (
                      <Box 
                        key={featureIndex}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          animation: `${fadeInUpKeyframe} 0.6s ease-out`,
                          animationDelay: `${0.6 + featureIndex * 0.1}s`,
                          animationFillMode: 'both'
                        }}
                      >
                        <CheckCircle sx={{ color: '#4CAF50', mr: 2, fontSize: { xs: 20, sm: 24 } }} />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: 'white',
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                          }}
                        >
                          {featureItem}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                {/* 右側は空（カードが表示される） */}
              </Grid>
            </Grid>
          </Container>
        </Box>
      ))}

      {/* 空のセクション（モバイル最適化の後） */}
      <Box
        sx={{
          minHeight: '200vh',
          position: 'relative',
          zIndex: 2,
          background: `
            radial-gradient(circle at 30% 20%, rgba(255, 107, 53, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(255, 142, 83, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 167, 38, 0.03) 0%, transparent 50%)
          `
        }}
      />

      {/* CTAセクション */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 2,
          position: 'relative',
          zIndex: 2
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              fontWeight="bold"
              sx={{
                color: 'white',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                mb: 4,
                animation: `${fadeInUpKeyframe} 1s ease-out`
              }}
            >
              AICを体験してみませんか？
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: { xs: '1rem', sm: '1.2rem' },
                mb: 6,
                animation: `${fadeInUpKeyframe} 1s ease-out 0.2s both`,
                lineHeight: 1.6
              }}
            >
              デジタル社員証の未来を今すぐ体験
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                justifyContent: 'center',
                flexWrap: 'wrap',
                animation: `${fadeInUpKeyframe} 1s ease-out 0.4s both`
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<CreditCard />}
                onClick={() => router.push('/employee-card')}
                sx={{
                  background: 'linear-gradient(45deg, #FF6B35, #FF8E53)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF8E53, #FF6B35)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(255, 107, 53, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                AICを表示
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Info />}
                onClick={() => router.push('/more')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                詳細情報
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
