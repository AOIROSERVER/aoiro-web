'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { ExpandMore, Refresh } from '@mui/icons-material';

export default function DebugAuthPage() {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoadingDebug(true);
    setError(null);
    try {
      const res = await fetch('/api/debug-auth');
      const data = await res.json();
      setDebugInfo(data);
    } catch (err) {
      setError('デバッグ情報の取得に失敗しました');
      console.error('Debug fetch error:', err);
    } finally {
      setLoadingDebug(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        認証デバッグ
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">認証状況</Typography>
          <Button
            startIcon={<Refresh />}
            onClick={fetchDebugInfo}
            disabled={loadingDebug}
            variant="outlined"
          >
            更新
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Alert severity={user ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {user ? 'ユーザーが認証されています' : 'ユーザーが認証されていません'}
            </Alert>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">フロントエンド認証情報</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ユーザー情報:
                  </Typography>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify({
                      user: user ? {
                        id: user.id,
                        email: user.email,
                        email_confirmed_at: user.email_confirmed_at,
                        user_metadata: user.user_metadata,
                        app_metadata: user.app_metadata
                      } : null,
                      session: session ? {
                        access_token: session.access_token ? 'present' : 'missing',
                        refresh_token: session.refresh_token ? 'present' : 'missing',
                        expires_at: session.expires_at
                      } : null
                    }, null, 2)}
                  </pre>
                </Box>
              </AccordionDetails>
            </Accordion>

            {debugInfo && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">サーバーサイド認証情報</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      デバッグ情報:
                    </Typography>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {loadingDebug && (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={20} />
              </Box>
            )}
          </Box>
        )}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          トラブルシューティング
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            認証エラーが発生する場合の対処法:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              ブラウザのキャッシュとクッキーをクリアする
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              再度ログインする
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              別のブラウザで試す
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              シークレットモードで試す
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
} 