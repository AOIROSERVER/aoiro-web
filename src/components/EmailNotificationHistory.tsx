"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Email, History } from '@mui/icons-material';

interface EmailNotificationHistoryItem {
  id: string;
  line_id: string;
  line_name: string;
  status: string;
  message: string;
  sent_at: string;
  mailgun_message_id?: string;
}

export const EmailNotificationHistory = () => {
  const [history, setHistory] = useState<EmailNotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('ログインが必要です');
        return;
      }

      const { data, error } = await supabase
        .from('email_notification_history')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('履歴取得エラー:', error);
        setError('履歴の取得に失敗しました');
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('履歴読み込みエラー:', error);
      setError('履歴の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '遅延':
        return 'error';
      case '運転見合わせ':
        return 'warning';
      case '平常運転':
        return 'success';
      case '運転再開':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">
        <History sx={{ mr: 1, verticalAlign: 'middle' }} />
        メール通知履歴
      </Typography>

      {history.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Email sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography color="text.secondary">
            メール通知履歴はありません
          </Typography>
        </Box>
      ) : (
        <List>
          {history.map((item, index) => (
            <Box key={item.id}>
              <ListItem sx={{ 
                border: '1px solid #e0e0e0', 
                mb: 1, 
                borderRadius: 1,
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {item.line_name}
                  </Typography>
                  <Chip
                    label={item.status}
                    color={getStatusColor(item.status) as any}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {item.message}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    送信日時: {new Date(item.sent_at).toLocaleString('ja-JP')}
                  </Typography>
                  {item.mailgun_message_id && (
                    <Typography variant="caption" color="text.secondary">
                      ID: {item.mailgun_message_id}
                    </Typography>
                  )}
                </Box>
              </ListItem>
              {index < history.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}; 