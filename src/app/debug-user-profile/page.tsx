'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Card, Typography, Button, CircularProgress, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore, Refresh } from '@mui/icons-material';

export default function DebugUserProfilePage() {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoadingDebug(true);
    setError(null);
    try {
      const res = await fetch("/api/debug-user-profile", {
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(`API Error: ${data.error} - ${data.details}`);
        return;
      }
      
      setDebugInfo(data);
    } catch (error) {
      console.error('❌ Debug fetch error:', error);
      setError('デバッグ情報の取得に失敗しました');
    } finally {
      setLoadingDebug(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDebugInfo();
    }
  }, [user]);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>ユーザープロフィールデバッグ</Typography>
      
      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">デバッグ情報</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDebugInfo}
            disabled={loadingDebug}
          >
            更新
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {debugInfo && (
          <Box>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">ユーザー情報</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(debugInfo.user, null, 2)}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">プロフィール情報</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {debugInfo.profile ? (
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(debugInfo.profile, null, 2)}
                  </Typography>
                ) : (
                  <Alert severity="warning">
                    プロフィールが見つかりません
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {!user && !loading && (
          <Alert severity="info">
            ログインしてください
          </Alert>
        )}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>フロントエンド認証状態</Typography>
        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify({
            loading,
            hasUser: !!user,
            hasSession: !!session,
            user: user ? {
              id: user.id,
              email: user.email,
              created_at: user.created_at
            } : null,
            session: session ? {
              access_token: session.access_token ? 'present' : 'missing',
              refresh_token: session.refresh_token ? 'present' : 'missing',
              expires_at: session.expires_at
            } : null
          }, null, 2)}
        </Typography>
      </Card>
    </Box>
  );
} 