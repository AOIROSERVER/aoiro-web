"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Fade,
  Zoom,
  Grow,
  Badge,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Inventory,
  CheckCircle,
  Warning,
  Star,
  ShoppingBag,
  MonetizationOn,
  CalendarToday,
  Diamond,
  AutoAwesome,
  EmojiEvents,
  Favorite,
  Share,
  Visibility,
  TrendingUp,
  Lightbulb,
  Psychology,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createVibrateOnClick, VIBRATION_PATTERNS } from "@/lib/vibration";
import { supabase } from "../../lib/supabase";

interface UserItem {
  id: string;
  item_id: string;
  item_name: string;
  purchased_at: string;
  points_spent: number;
  is_active: boolean;
  expires_at?: string;
  category?: string;
  icon?: string;
  rarity?: string;
  gradient?: string;
}

interface UserProfile {
  points: number;
}

interface Statistics {
  totalItems: number;
  totalSpent: number;
  activeItems: number;
  rareItems: number;
  epicItems: number;
  legendaryItems: number;
}

const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
};

const RARITY_NAMES = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー',
};

const RARITY_GRADIENTS = {
  common: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)',
  rare: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
  epic: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
  legendary: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
};

const RARITY_GLOW_COLORS = {
  common: 'rgba(158, 158, 158, 0.3)',
  rare: 'rgba(33, 150, 243, 0.4)',
  epic: 'rgba(156, 39, 176, 0.5)',
  legendary: 'rgba(255, 215, 0, 0.6)',
};

export default function MyItemsPage() {
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchUserItems();
    fetchUserProfile();
  }, [user, router]);

  const fetchUserItems = async () => {
    try {
      setLoading(true);
      
      // ユーザーのセッショントークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('認証セッションが見つかりません');
        return;
      }

      const response = await fetch('/api/my-items', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserItems(data.items || []);
        setStatistics(data.statistics || {});
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'アイテムの取得に失敗しました');
      }
    } catch (error) {
      console.error('アイテム取得エラー:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user-profile-secure');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile({ points: data.profile.points || 0 });
        }
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemIcon = (itemId: string) => {
    const iconMap: { [key: string]: string } = {
      'theme_dark': '🌙',
      'theme_blue': '🔵',
      'notification_priority': '🔔',
      'custom_avatar': '👤',
      'premium_support': '💎',
      'exclusive_badge': '🏆',
    };
    return iconMap[itemId] || '📦';
  };

  const getItemCategory = (itemId: string) => {
    const categoryMap: { [key: string]: string } = {
      'theme_dark': 'カスタマイズ',
      'theme_blue': 'カスタマイズ',
      'notification_priority': '機能',
      'custom_avatar': 'カスタマイズ',
      'premium_support': 'サポート',
      'exclusive_badge': '限定',
    };
    return categoryMap[itemId] || 'その他';
  };

  const getItemRarity = (itemId: string) => {
    const rarityMap: { [key: string]: 'common' | 'rare' | 'epic' | 'legendary' } = {
      'theme_dark': 'common',
      'theme_blue': 'common',
      'notification_priority': 'rare',
      'custom_avatar': 'rare',
      'premium_support': 'epic',
      'exclusive_badge': 'legendary',
    };
    return rarityMap[itemId] || 'common';
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <Diamond sx={{ color: RARITY_COLORS.legendary, fontSize: 20 }} />;
      case 'epic':
        return <AutoAwesome sx={{ color: RARITY_COLORS.epic, fontSize: 18 }} />;
      case 'rare':
        return <AutoAwesome sx={{ color: RARITY_COLORS.rare, fontSize: 16 }} />;
      default:
        return <Star sx={{ color: RARITY_COLORS.common, fontSize: 14 }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}>
        <Box sx={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          p: 4,
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), 
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), 
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 60% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }
    }}>
      {/* パーティクル効果 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '2px',
          height: '2px',
          background: 'rgba(255,255,255,0.6)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
          left: '10%',
          top: '20%',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '3px',
          height: '3px',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
          right: '15%',
          top: '60%',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        }
      }} />

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* ヘッダー */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              p: 4,
              mb: 3,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }
            }}>
              <Box sx={{
                position: 'relative',
                mr: 3,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  right: -10,
                  bottom: -10,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  animation: 'pulse 2s ease-in-out infinite',
                },
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
                  '50%': { opacity: 1, transform: 'scale(1.1)' },
                }
              }}>
                <Inventory sx={{ 
                  fontSize: '3rem',
                  color: '#fff',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                  position: 'relative',
                  zIndex: 1,
                }} />
              </Box>
              <Box>
                <Typography variant="h2" component="h1" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  mb: 1,
                  background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  マイアイテム
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}>
                  購入したアイテムの一覧です
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* 統計情報 */}
        {statistics && (
          <Zoom in timeout={1000}>
            <Paper sx={{ 
              p: 4, 
              mb: 6, 
              background: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Box sx={{
                      background: 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)',
                      borderRadius: '50%',
                      p: 2,
                      mb: 2,
                      mx: 'auto',
                      width: 70,
                      height: 70,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -5,
                        left: -5,
                        right: -5,
                        bottom: -5,
                        background: 'radial-gradient(circle, rgba(76, 175, 80, 0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                        animation: 'pulse 2s ease-in-out infinite',
                      }
                    }}>
                      <ShoppingBag sx={{ color: '#fff', fontSize: 32, position: 'relative', zIndex: 1 }} />
                    </Box>
                    <Typography variant="h3" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      mb: 0.5
                    }}>
                      {statistics.totalItems}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500
                    }}>
                      所有アイテム数
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Box sx={{
                      background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)',
                      borderRadius: '50%',
                      p: 2,
                      mb: 2,
                      mx: 'auto',
                      width: 70,
                      height: 70,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(255, 167, 38, 0.4)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -5,
                        left: -5,
                        right: -5,
                        bottom: -5,
                        background: 'radial-gradient(circle, rgba(255, 167, 38, 0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                        animation: 'pulse 2s ease-in-out infinite 0.5s',
                      }
                    }}>
                      <MonetizationOn sx={{ color: '#fff', fontSize: 32, position: 'relative', zIndex: 1 }} />
                    </Box>
                    <Typography variant="h3" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      mb: 0.5
                    }}>
                      {(statistics.totalSpent || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500
                    }}>
                      総消費ポイント
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Box sx={{
                      background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                      borderRadius: '50%',
                      p: 2,
                      mb: 2,
                      mx: 'auto',
                      width: 70,
                      height: 70,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(33, 150, 243, 0.4)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -5,
                        left: -5,
                        right: -5,
                        bottom: -5,
                        background: 'radial-gradient(circle, rgba(33, 150, 243, 0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                        animation: 'pulse 2s ease-in-out infinite 1s',
                      }
                    }}>
                      <CheckCircle sx={{ color: '#fff', fontSize: 32, position: 'relative', zIndex: 1 }} />
                    </Box>
                    <Typography variant="h3" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      mb: 0.5
                    }}>
                      {statistics.activeItems}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500
                    }}>
                      アクティブアイテム
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Box sx={{
                      background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                      borderRadius: '50%',
                      p: 2,
                      mb: 2,
                      mx: 'auto',
                      width: 70,
                      height: 70,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(156, 39, 176, 0.4)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -5,
                        left: -5,
                        right: -5,
                        bottom: -5,
                        background: 'radial-gradient(circle, rgba(156, 39, 176, 0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                        animation: 'pulse 2s ease-in-out infinite 1.5s',
                      }
                    }}>
                      <EmojiEvents sx={{ color: '#fff', fontSize: 32, position: 'relative', zIndex: 1 }} />
                    </Box>
                    <Typography variant="h3" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      mb: 0.5
                    }}>
                      {statistics.legendaryItems}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500
                    }}>
                      レジェンダリー
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Zoom>
        )}

        {/* エラーメッセージ */}
        {error && (
          <Fade in timeout={300}>
            <Alert severity="error" sx={{ 
              mb: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* アイテム一覧 */}
        {userItems.length === 0 ? (
          <Zoom in timeout={1200}>
            <Paper sx={{ 
              p: 8, 
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }
            }}>
              <Box sx={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                p: 4,
                mb: 4,
                mx: 'auto',
                width: 140,
                height: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  right: -10,
                  bottom: -10,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  animation: 'pulse 3s ease-in-out infinite',
                }
              }}>
                <ShoppingBag sx={{ fontSize: 80, color: 'rgba(255,255,255,0.7)', position: 'relative', zIndex: 1 }} />
              </Box>
              <Typography variant="h4" sx={{ color: 'white', mb: 3, fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                まだアイテムを購入していません
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 5, fontSize: '1.1rem' }}>
                ポイントショップでアイテムを購入すると、ここに表示されます
              </Typography>
              <Button
                variant="contained"
                onClick={createVibrateOnClick(() => router.push('/point-shop'), VIBRATION_PATTERNS.TAP)}
                sx={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)',
                  color: 'white',
                  px: 6,
                  py: 2.5,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
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
                    transition: 'left 0.5s',
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #45A049 0%, #4CAF50 100%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 35px rgba(76, 175, 80, 0.5)',
                    '&::before': {
                      left: '100%',
                    }
                  }
                }}
              >
                ポイントショップへ
              </Button>
            </Paper>
          </Zoom>
        ) : (
          <Grid container spacing={4}>
            {userItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Grow in timeout={800 + index * 100}>
                  <Card sx={{ 
                    height: '100%',
                    background: item.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    transform: hoveredItem === item.id ? 'translateY(-12px) scale(1.03)' : 'translateY(0) scale(1)',
                    boxShadow: hoveredItem === item.id 
                      ? '0 25px 50px rgba(0,0,0,0.4)' 
                      : '0 8px 25px rgba(0,0,0,0.2)',
                    '&:hover': {
                      '& .item-glow': {
                        opacity: 1,
                        transform: 'scale(1.2)',
                      },
                      '& .item-icon': {
                        transform: 'scale(1.15) rotate(8deg)',
                      },
                      '& .item-actions': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      }
                    },
                    '&:active': {
                      transform: 'translateY(-8px) scale(1.02)',
                    }
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* 光の効果 */}
                    <Box className="item-glow" sx={{
                      position: 'absolute',
                      top: -30,
                      right: -30,
                      width: 80,
                      height: 80,
                      background: `radial-gradient(circle, ${RARITY_GLOW_COLORS[getItemRarity(item.item_id)]} 0%, transparent 70%)`,
                      borderRadius: '50%',
                      opacity: 0,
                      transition: 'all 0.4s ease',
                      pointerEvents: 'none',
                    }} />

                    {/* アクティブバッジ */}
                    {item.is_active && (
                      <Badge
                        badgeContent={<CheckCircle sx={{ fontSize: 12 }} />}
                        color="success"
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          zIndex: 2,
                        }}
                      />
                    )}

                    {/* アクションボタン */}
                    <Box className="item-actions" sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      opacity: 0,
                      transform: 'translateY(-10px)',
                      transition: 'all 0.3s ease',
                      zIndex: 2,
                    }}>
                      <Tooltip title="お気に入り">
                        <IconButton size="small" sx={{ 
                          background: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { background: 'rgba(255,255,255,0.3)' }
                        }}>
                          <Favorite sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Typography 
                          className="item-icon"
                          variant="h1" 
                          sx={{ 
                            fontSize: '4.5rem',
                            transition: 'all 0.3s ease',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          }}
                        >
                          {item.icon || getItemIcon(item.item_id)}
                        </Typography>
                        <Box display="flex" alignItems="center">
                          {getRarityIcon(getItemRarity(item.item_id))}
                          <Chip 
                            label={RARITY_NAMES[getItemRarity(item.item_id)]} 
                            size="small"
                            sx={{ 
                              ml: 1,
                              background: RARITY_GRADIENTS[getItemRarity(item.item_id)],
                              color: 'white',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              backdropFilter: 'blur(10px)',
                            }}
                          />
                        </Box>
                      </Box>

                      <Typography variant="h5" component="h3" gutterBottom sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mb: 2,
                        lineHeight: 1.2,
                      }}>
                        {item.item_name}
                      </Typography>

                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Chip 
                          label={`${item.points_spent} ポイント`}
                          icon={<MonetizationOn />}
                          size="small"
                          sx={{ 
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 'bold',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Chip 
                          label={item.category || getItemCategory(item.item_id)}
                          size="small"
                          icon={<Psychology />}
                          sx={{ 
                            background: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        />
                      </Box>

                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                          <CalendarToday sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', mr: 1 }} />
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {formatDate(item.purchased_at)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={item.is_active ? 'アクティブ' : '非アクティブ'}
                          color={item.is_active ? 'success' : 'default'}
                          size="small"
                          icon={item.is_active ? <CheckCircle /> : <Warning />}
                          sx={{
                            background: item.is_active ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255,255,255,0.2)',
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        />
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 4, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={createVibrateOnClick(() => {
                          // アイテムの詳細やアクションを実装
                          console.log('アイテム詳細:', item);
                        }, VIBRATION_PATTERNS.TAP)}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(10px)',
                          fontWeight: 'bold',
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
                            transition: 'left 0.5s',
                          },
                          '&:hover': {
                            borderColor: 'white',
                            background: 'rgba(255,255,255,0.1)',
                            transform: 'translateY(-2px)',
                            '&::before': {
                              left: '100%',
                            }
                          }
                        }}
                      >
                        詳細を見る
                      </Button>
                    </CardActions>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        )}

        {/* アクションボタン */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={createVibrateOnClick(() => router.push('/point-shop'), VIBRATION_PATTERNS.TAP)}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)',
              color: 'white',
              px: 8,
              py: 3,
              fontSize: '1.3rem',
              fontWeight: 'bold',
              borderRadius: 4,
              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
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
                transition: 'left 0.5s',
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #45A049 0%, #4CAF50 100%)',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 35px rgba(76, 175, 80, 0.5)',
                '&::before': {
                  left: '100%',
                }
              }
            }}
          >
            ポイントショップへ
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
