"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import { 
  Person, 
  Email, 
  CalendarToday, 
  AccountCircle,
  Tag,
  CheckCircle,
  Info,
  Chat
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

interface UserProfile {
  id: string;
  username: string;
  game_tag: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  points?: number;
}

function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [user, router]);

  useEffect(() => {
    // ユーザーのメタデータからアバターURLを取得
    const userAvatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url;
    if (userAvatarUrl) {
      setAvatarUrl(userAvatarUrl);
    } else if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching profile...');
      
      const response = await fetch('/api/user-profile-secure');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Profile data received:', data);
        console.log('👤 User data:', user);
        
        if (data.profile) {
          if (typeof data.profile.points === 'number') {
            console.log('✅ Points updated:', data.profile.points);
          } else {
            console.log('⚠️ No points column in profile');
          }
          setProfile(data.profile);
        } else {
          console.log('⚠️ No profile found');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Profile fetch error:', errorData);
        // エラーはコンソールにのみ出力し、UIには表示しない
      }
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      // エラーはコンソールにのみ出力し、UIには表示しない
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

    if (loading) {
    return (
      <Container component="main" maxWidth="sm" sx={{ pt: 8 }}>
        <Card sx={{ 
          p: 4, 
          borderRadius: 4, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <Typography sx={{ color: 'white' }}>読み込み中...</Typography>
          </Box>
        </Card>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ pt: 8 }}>
      <Card sx={{ 
        p: 4, 
        borderRadius: 4, 
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 装飾的な背景要素 */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 0
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          zIndex: 0
        }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* アバター表示 */}
          <Avatar
            src={avatarUrl || undefined}
            sx={{ 
              width: 100, 
              height: 100, 
              mb: 3, 
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '4px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <Person sx={{ fontSize: 50, color: 'white' }} />
          </Avatar>

          <Typography component="h1" variant="h4" fontWeight="bold" mb={1} sx={{ color: 'white' }}>
            アカウント情報
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, textAlign: 'center' }}>
            あなたのアカウント詳細を確認できます
          </Typography>



          {/* AOIRO ID セクション */}
          <Box sx={{ width: '100%', mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" mb={3} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'white',
              fontSize: '1.2rem'
            }}>
              <Chat sx={{ mr: 1.5, fontSize: '1.5rem' }} />
              Discord アカウント情報
            </Typography>
            <Card sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              borderRadius: 3, 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <ListItemIcon>
                    <Person sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ color: 'white', fontWeight: 500 }}>Discord ユーザー名</Typography>}
                    secondary={
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {user?.user_metadata?.discord_username 
                          ? `${user.user_metadata.discord_username}#${user.user_metadata.discord_discriminator || '0000'}`
                          : user?.user_metadata?.username || user?.email?.split('@')[0] || '未設定'
                        }
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <ListItemIcon>
                    <Tag sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ color: 'white', fontWeight: 500 }}>Discord ID</Typography>}
                    secondary={
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {user?.user_metadata?.discord_id || user?.user_metadata?.game_tag || user?.email?.split('@')[0] || '未設定'}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <ListItemIcon>
                    <Email sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ color: 'white', fontWeight: 500 }}>メールアドレス</Typography>}
                    secondary={<Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{user.email || '未設定'}</Typography>}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ color: 'white', fontWeight: 500 }}>アカウント作成日</Typography>}
                    secondary={
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {user?.created_at 
                          ? new Date(user.created_at).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : profile?.created_at 
                            ? new Date(profile.created_at).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : '不明'
                        }
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Card>
          </Box>

          {/* ポイント情報 セクション */}
          <Box sx={{ width: '100%', mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" mb={3} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'white',
              fontSize: '1.2rem'
            }}>
              <CheckCircle sx={{ mr: 1.5, fontSize: '1.5rem' }} />
              ポイント情報
            </Typography>
            <Card sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              borderRadius: 3, 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <List sx={{ p: 0 }}>
                <ListItem>
                  <ListItemIcon>
                    <Info sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ color: 'white', fontWeight: 500 }}>現在のポイント</Typography>}
                    secondary={
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {profile?.points !== null && profile?.points !== undefined ? profile.points : "-"} ポイント
                      </Typography>
                    } 
                  />
                </ListItem>
              </List>
            </Card>
          </Box>

          <Divider sx={{ width: '100%', my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

          {/* ログアウトボタン */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleSignOut}
            sx={{ 
              mt: 2,
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              },
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            ログアウト
          </Button>
        </Box>
      </Card>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
} 