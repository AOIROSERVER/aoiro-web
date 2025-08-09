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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Paper,
  Fade,
  Zoom,
  Grow,
} from "@mui/material";
import {
  ShoppingCart,
  MonetizationOn,
  CheckCircle,
  Warning,
  Info,
  Star,
  LocalOffer,
  Timer,
  Diamond,
  AutoAwesome,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createVibrateOnClick, VIBRATION_PATTERNS } from "@/lib/vibration";
import { supabase } from "../../lib/supabase";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  available: boolean;
  stock?: number;
  gradient?: string;
  glowColor?: string;
}

interface UserProfile {
  points: number;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'theme_dark',
    name: 'ダークテーマ',
    description: 'アプリをダークテーマに変更できます',
    points: 100,
    category: 'カスタマイズ',
    icon: '🌙',
    rarity: 'common',
    available: true,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glowColor: '#667eea',
  },
  {
    id: 'theme_blue',
    name: 'ブルーテーマ',
    description: 'アプリをブルーテーマに変更できます',
    points: 150,
    category: 'カスタマイズ',
    icon: '🔵',
    rarity: 'common',
    available: true,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    glowColor: '#4facfe',
  },
  {
    id: 'notification_priority',
    name: '優先通知',
    description: '通知を優先的に表示されます',
    points: 200,
    category: '機能',
    icon: '🔔',
    rarity: 'rare',
    available: true,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    glowColor: '#fa709a',
  },
  {
    id: 'custom_avatar',
    name: 'カスタムアバター',
    description: 'オリジナルのアバターを作成できます',
    points: 300,
    category: 'カスタマイズ',
    icon: '👤',
    rarity: 'rare',
    available: true,
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    glowColor: '#a8edea',
  },
  {
    id: 'premium_support',
    name: 'プレミアムサポート',
    description: '24時間以内のサポートを受けられます',
    points: 500,
    category: 'サポート',
    icon: '💎',
    rarity: 'epic',
    available: true,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glowColor: '#667eea',
  },
  {
    id: 'exclusive_badge',
    name: '限定バッジ',
    description: '特別なバッジを表示できます',
    points: 1000,
    category: '限定',
    icon: '🏆',
    rarity: 'legendary',
    available: true,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    glowColor: '#f093fb',
  },
];

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

export default function PointShopPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchUserProfile();
  }, [user, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-profile-secure');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setUserProfile({ points: data.profile.points || 0 });
        }
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!userProfile || userProfile.points < item.points) {
      setMessage({ type: 'error', text: 'ポイントが不足しています' });
      return;
    }

    setSelectedItem(item);
    setShowDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem || !userProfile || !user) return;

    try {
      setPurchasing(selectedItem.id);
      
      // ユーザーのセッショントークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessage({ type: 'error', text: '認証セッションが見つかりません' });
        return;
      }

      const response = await fetch('/api/purchase-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          points: selectedItem.points,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: `${selectedItem.name}を購入しました！` });
        // プロフィールを更新
        await fetchUserProfile();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || '購入に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' });
    } finally {
      setPurchasing(null);
      setShowDialog(false);
      setSelectedItem(null);
    }
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
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
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
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
              p: 3,
              mb: 3,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}>
              <ShoppingCart sx={{ 
                mr: 2, 
                fontSize: '2.5rem',
                color: '#fff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }} />
              <Box>
                <Typography variant="h3" component="h1" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  mb: 1
                }}>
                  ポイントショップ
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500
                }}>
                  ポイントを使って特別なアイテムを購入できます
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* ユーザーポイント表示 */}
        {userProfile && (
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
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Box sx={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                    borderRadius: '50%',
                    p: 2,
                    mr: 3,
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
                  }}>
                    <MonetizationOn sx={{ color: '#fff', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      mb: 0.5
                    }}>
                      {userProfile.points.toLocaleString()} ポイント
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500
                    }}>
                      利用可能なポイント
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label="利用可能" 
                  color="success" 
                  icon={<CheckCircle />}
                  sx={{ 
                    color: 'white',
                    background: 'rgba(76, 175, 80, 0.8)',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    py: 1
                  }}
                />
              </Box>
            </Paper>
          </Zoom>
        )}

        {/* メッセージ表示 */}
        {message && (
          <Fade in timeout={300}>
            <Alert 
              severity={message.type} 
              sx={{ 
                mb: 4,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 3
              }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          </Fade>
        )}

        {/* ショップアイテム */}
        <Grid container spacing={4}>
          {SHOP_ITEMS.map((item, index) => (
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
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 20px 40px rgba(0,0,0,0.3), 0 0 20px ${item.glowColor}40`,
                    '& .item-glow': {
                      opacity: 1,
                      transform: 'scale(1.1)',
                    },
                    '& .item-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    }
                  },
                  '&:active': {
                    transform: 'translateY(-4px) scale(1.01)',
                  }
                }}
                onClick={() => handlePurchase(item)}
              >
                {/* 光の効果 */}
                <Box className="item-glow" sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 60,
                  height: 60,
                  background: `radial-gradient(circle, ${item.glowColor}40 0%, transparent 70%)`,
                  borderRadius: '50%',
                  opacity: 0,
                  transition: 'all 0.4s ease',
                  pointerEvents: 'none',
                }} />

                <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Typography 
                      className="item-icon"
                      variant="h1" 
                      sx={{ 
                        fontSize: '4rem',
                        transition: 'all 0.3s ease',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                      }}
                    >
                      {item.icon}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {getRarityIcon(item.rarity)}
                      <Chip 
                        label={RARITY_NAMES[item.rarity]} 
                        size="small"
                        sx={{ 
                          ml: 1,
                          background: RARITY_GRADIENTS[item.rarity],
                          color: 'white',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="h5" component="h3" gutterBottom sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    mb: 2
                  }}>
                    {item.name}
                  </Typography>

                  <Typography variant="body1" sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    mb: 3, 
                    minHeight: 60,
                    lineHeight: 1.6
                  }}>
                    {item.description}
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Chip 
                      label={`${item.points} ポイント`}
                      icon={<MonetizationOn />}
                      sx={{ 
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    <Chip 
                      label={item.category}
                      size="small"
                      sx={{ 
                        background: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 4, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!userProfile || userProfile.points < item.points || purchasing === item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(item);
                    }}
                    sx={{
                      background: userProfile && userProfile.points >= item.points 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      py: 2,
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: userProfile && userProfile.points >= item.points 
                          ? 'rgba(255,255,255,0.3)' 
                          : 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                      },
                      '&:disabled': {
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)',
                      }
                    }}
                  >
                    {purchasing === item.id ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      '購入する'
                    )}
                  </Button>
                </CardActions>
              </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* 購入確認ダイアログ */}
        <Dialog 
          open={showDialog} 
          onClose={() => setShowDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }
          }}
        >
          <DialogTitle sx={{ 
            background: selectedItem?.gradient,
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}>
            購入確認
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            {selectedItem && (
              <Box>
                <Box display="flex" alignItems="center" mb={3}>
                  <Typography variant="h1" sx={{ mr: 3, fontSize: '4rem' }}>
                    {selectedItem.icon}
                  </Typography>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {selectedItem.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      {selectedItem.description}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    必要ポイント:
                  </Typography>
                  <Chip 
                    label={`${selectedItem.points} ポイント`}
                    icon={<MonetizationOn />}
                    sx={{ 
                      background: '#FFA726',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      py: 1
                    }}
                  />
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    現在のポイント:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                    {userProfile?.points || 0} ポイント
                  </Typography>
                </Box>
                
                {userProfile && userProfile.points < selectedItem.points && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    ポイントが不足しています
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={() => setShowDialog(false)}
              sx={{ 
                color: 'text.secondary',
                fontWeight: 'bold',
                px: 3,
                py: 1.5
              }}
            >
              キャンセル
            </Button>
            <Button 
              onClick={confirmPurchase}
              variant="contained"
              disabled={!userProfile || userProfile.points < (selectedItem?.points || 0)}
              sx={{ 
                background: selectedItem?.gradient || '#4CAF50',
                color: 'white',
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  background: selectedItem?.gradient || '#45A049',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                }
              }}
            >
              購入する
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
