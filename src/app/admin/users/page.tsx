"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

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

      if (!response.ok) {
        window.location.href = '/';
        return;
      }

      loadUsers();
    } catch (error) {
      console.error('権限チェックエラー:', error);
      window.location.href = '/';
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('ユーザー読み込みエラー:', error);
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

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight="bold" mb={2} sx={{ color: "#0a1a0a" }}>
              ユーザー管理
            </Typography>
            <Typography variant="body1" sx={{ color: "#666" }}>
              システムに登録されているユーザーの一覧を表示します
            </Typography>
          </Box>
          <Button
            variant="outlined"
            href="/admin"
            startIcon={<ArrowBack />}
            sx={{
              borderColor: "#0a1a0a",
              color: "#0a1a0a",
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: "500",
              "&:hover": {
                borderColor: "#1a2a1a",
                backgroundColor: "rgba(10, 26, 10, 0.04)",
              }
            }}
          >
            ダッシュボードに戻る
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ユーザー情報</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>登録日</TableCell>
                <TableCell>最終ログイン</TableCell>
                <TableCell>ステータス</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: user.user_metadata?.avatar_url 
                            ? `url(${user.user_metadata.avatar_url}) center/cover`
                            : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {!user.user_metadata?.avatar_url && 
                          (user.user_metadata?.full_name?.[0] || 
                           user.user_metadata?.name?.[0] || 
                           user.email[0].toUpperCase())
                        }
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.user_metadata?.full_name || user.user_metadata?.name || '名前未設定'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          ID: {user.id.slice(0, 8)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('ja-JP')
                        : '未ログイン'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.last_sign_in_at ? 'アクティブ' : '非アクティブ'}
                      size="small"
                      color={user.last_sign_in_at ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 統計情報 */}
      <Paper sx={{ p: 4, bgcolor: "#fafafa", borderRadius: 3 }}>
        <Typography variant="h6" mb={3} sx={{ color: "#0a1a0a", fontWeight: "600" }}>
          ユーザー統計
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center', minWidth: 120 }}>
            <Typography variant="h4" sx={{ color: "#1976d2", fontWeight: "bold", mb: 1 }}>
              {users.length}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              総ユーザー数
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 120 }}>
            <Typography variant="h4" sx={{ color: "#388e3c", fontWeight: "bold", mb: 1 }}>
              {users.filter(u => u.last_sign_in_at).length}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              アクティブユーザー
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 120 }}>
            <Typography variant="h4" sx={{ color: "#f57c00", fontWeight: "bold", mb: 1 }}>
              {users.filter(u => !u.last_sign_in_at).length}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              非アクティブユーザー
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 注意事項 */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>注意:</strong> ユーザー情報は読み取り専用です。
          ユーザーの削除や権限変更が必要な場合は、Supabase管理画面から行ってください。
        </Typography>
      </Alert>
    </Container>
  );
}
