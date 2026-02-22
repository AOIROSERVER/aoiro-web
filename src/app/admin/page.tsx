"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  Alert
} from '@mui/material';
import {
  CreditCard,
  People,
  Settings,
  Dashboard,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // 管理者権限チェック
  useEffect(() => {
    if (!authLoading && user) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  const checkAdminRole = async () => {
    try {
      const response = await fetch('/api/check-admin-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (response.ok) {
        setIsAdmin(true);
      } else {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('権限チェックエラー:', error);
      router.push('/');
      return;
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5" sx={{ color: "#666" }}>
            読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h4" sx={{ color: "#d32f2f", mb: 3 }}>
            アクセス拒否
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            このページにアクセスする権限がありません。
          </Typography>
        </Box>
      </Container>
    );
  }

  const adminFeatures = [
    {
      title: '社員証明書管理',
      description: '社員証明書の作成、編集、削除を行います',
      icon: <CreditCard sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/admin/employee-cards',
      color: '#e3f2fd'
    },
    {
      title: 'ユーザー管理',
      description: 'システムユーザーの管理を行います',
      icon: <People sx={{ fontSize: 40, color: '#388e3c' }} />,
      path: '/admin/users',
      color: '#e8f5e8'
    },
    {
      title: 'システム設定',
      description: 'システム全体の設定を行います',
      icon: <Settings sx={{ fontSize: 40, color: '#f57c00' }} />,
      path: '/admin/settings',
      color: '#fff3e0'
    },
    {
      title: '入社申請・カンパニー管理',
      description: '会社の登録、フォーム紐づけ、申請の許可・拒否',
      icon: <Business sx={{ fontSize: 40, color: '#059669' }} />,
      path: '/es-system/company-admin',
      color: '#ecfdf5'
    }
  ];

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography component="h1" variant="h3" fontWeight="bold" mb={3} sx={{ color: "#0a1a0a" }}>
          管理者ダッシュボード
        </Typography>
        <Typography variant="h6" sx={{ color: "#666", mb: 2 }}>
          ようこそ、管理者様
        </Typography>
        <Typography variant="body1" sx={{ color: "#666" }}>
          システム管理機能にアクセスできます
        </Typography>
      </Box>

      {/* 管理者機能カード */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {adminFeatures.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" fontWeight="bold" mb={2} sx={{ color: "#0a1a0a" }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push(feature.path)}
                  sx={{
                    background: "linear-gradient(135deg, #0a1a0a 0%, #2a3a2a 100%)",
                    color: "white",
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: "bold",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1a2a1a 0%, #3a4a3a 100%)",
                    }
                  }}
                >
                  アクセス
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* システム情報 */}
      <Paper sx={{ p: 4, bgcolor: "#fafafa", borderRadius: 3 }}>
        <Typography variant="h6" mb={3} sx={{ color: "#0a1a0a", fontWeight: "600" }}>
          システム情報
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold", mb: 1 }}>
                AOIRO
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                バージョン 1.0.0
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: "#388e3c", fontWeight: "bold", mb: 1 }}>
                社員証明書
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                管理システム
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: "#f57c00", fontWeight: "bold", mb: 1 }}>
                Supabase
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                データベース
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: "#7b1fa2", fontWeight: "bold", mb: 1 }}>
                Next.js
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                フレームワーク
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 注意事項 */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>注意:</strong> 管理者権限は慎重に使用してください。
          システムの変更は他のユーザーに影響を与える可能性があります。
        </Typography>
      </Alert>
    </Container>
  );
}
