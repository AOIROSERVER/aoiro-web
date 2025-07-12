"use client";
import { Box, Typography, Button, Card, CardContent, Divider } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const { loading, isAdmin, user, session, signOut } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    // ローカルストレージのデータを取得
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('aoiro-auth-token');
      const adminFlag = localStorage.getItem('admin');
      
      setLocalStorageData({
        'aoiro-auth-token': authToken ? JSON.parse(authToken) : null,
        'admin': adminFlag
      });
    }
  }, []);

  const clearAuthData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aoiro-auth-token');
      localStorage.removeItem('admin');
      setLocalStorageData({});
      console.log('🗑️ Cleared all auth data from localStorage');
    }
  };

  const setAdminFlag = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin', 'true');
      setLocalStorageData((prev: any) => ({ ...prev, admin: 'true' }));
      console.log('👑 Set admin flag in localStorage');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1a237e', mb: 3 }}>
        🔧 認証デバッグページ
      </Typography>

      {/* 認証状態 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
            🔐 認証状態
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography><strong>Loading:</strong> {loading ? '🔄 読み込み中' : '✅ 完了'}</Typography>
            <Typography><strong>User:</strong> {user ? `✅ ${user.email}` : '❌ 未認証'}</Typography>
            <Typography><strong>Session:</strong> {session ? '✅ 有効' : '❌ なし'}</Typography>
            <Typography><strong>Is Admin:</strong> {isAdmin ? '👑 管理者' : '👤 一般ユーザー'}</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ユーザー詳細 */}
      {user && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
              👤 ユーザー詳細
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography><strong>ID:</strong> {user.id}</Typography>
              <Typography><strong>Email:</strong> {user.email}</Typography>
              <Typography><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</Typography>
              <Typography><strong>Last Sign In:</strong> {new Date(user.last_sign_in_at || user.created_at).toLocaleString()}</Typography>
              <Typography><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✅' : '❌'}</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* セッション詳細 */}
      {session && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
              🎫 セッション詳細
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography><strong>Access Token:</strong> {session.access_token ? '✅ あり' : '❌ なし'}</Typography>
              <Typography><strong>Refresh Token:</strong> {session.refresh_token ? '✅ あり' : '❌ なし'}</Typography>
              <Typography><strong>Token Type:</strong> {session.token_type}</Typography>
              <Typography><strong>Expires At:</strong> {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ローカルストレージ */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
            💾 ローカルストレージ
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography><strong>Auth Token:</strong> {localStorageData['aoiro-auth-token'] ? '✅ 保存済み' : '❌ なし'}</Typography>
            <Typography><strong>Admin Flag:</strong> {localStorageData['admin'] ? '👑 設定済み' : '❌ なし'}</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={clearAuthData} color="error">
              🗑️ 認証データ削除
            </Button>
            <Button variant="outlined" onClick={setAdminFlag} color="primary">
              👑 管理者フラグ設定
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* アクション */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
            ⚡ アクション
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={() => window.location.href = '/train-status'}
              sx={{ bgcolor: '#1a237e' }}
            >
              🚂 運行情報ページへ
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.href = '/login'}
              color="primary"
            >
              🔐 ログインページへ
            </Button>
            <Button 
              variant="outlined" 
              onClick={signOut}
              color="error"
            >
              🚪 ログアウト
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* デバッグ情報 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#1a237e' }}>
            🐛 デバッグ情報
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</Typography>
            <Typography><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</Typography>
            <Typography><strong>Timestamp:</strong> {new Date().toLocaleString()}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 