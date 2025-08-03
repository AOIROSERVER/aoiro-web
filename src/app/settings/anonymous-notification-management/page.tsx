"use client";
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Alert, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip
} from '@mui/material';
import { Delete, Email, Notifications } from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';

interface AnonymousNotificationSetting {
  id: string;
  email: string;
  line_id: string;
  enabled: boolean;
  created_at: string;
}

interface AnonymousNotificationToken {
  id: string;
  email: string;
  device_type: string;
  is_active: boolean;
  created_at: string;
}

export default function AnonymousNotificationManagementPage() {
  const [email, setEmail] = useState('');
  const [emailSettings, setEmailSettings] = useState<AnonymousNotificationSetting[]>([]);
  const [pushTokens, setPushTokens] = useState<AnonymousNotificationToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadSettings = async (targetEmail: string) => {
    if (!targetEmail) return;
    
    try {
      setLoading(true);
      
      // メール通知設定を取得
      const { data: emailData, error: emailError } = await supabase
        .from('anonymous_email_notification_settings')
        .select('*')
        .eq('email', targetEmail);

      if (emailError) {
        console.error('メール設定取得エラー:', emailError);
        setMessage({ type: 'error', text: 'メール設定の取得に失敗しました' });
        return;
      }

      // プッシュ通知トークンを取得
      const { data: tokenData, error: tokenError } = await supabase
        .from('anonymous_notification_tokens')
        .select('*')
        .eq('email', targetEmail);

      if (tokenError) {
        console.error('トークン取得エラー:', tokenError);
        setMessage({ type: 'error', text: 'プッシュ通知設定の取得に失敗しました' });
        return;
      }

      setEmailSettings(emailData || []);
      setPushTokens(tokenData || []);
    } catch (error) {
      console.error('設定読み込みエラー:', error);
      setMessage({ type: 'error', text: '設定の読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (newEmail) {
      loadSettings(newEmail);
    } else {
      setEmailSettings([]);
      setPushTokens([]);
    }
  };

  const deleteEmailSetting = async (settingId: string) => {
    try {
      const { error } = await supabase
        .from('anonymous_email_notification_settings')
        .delete()
        .eq('id', settingId);

      if (error) throw error;

      setEmailSettings(prev => prev.filter(s => s.id !== settingId));
      setMessage({ type: 'success', text: 'メール通知設定を削除しました' });
    } catch (error) {
      console.error('メール設定削除エラー:', error);
      setMessage({ type: 'error', text: 'メール通知設定の削除に失敗しました' });
    }
  };

  const deletePushToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('anonymous_notification_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setPushTokens(prev => prev.filter(t => t.id !== tokenId));
      setMessage({ type: 'success', text: 'プッシュ通知設定を削除しました' });
    } catch (error) {
      console.error('トークン削除エラー:', error);
      setMessage({ type: 'error', text: 'プッシュ通知設定の削除に失敗しました' });
    }
  };

  const deleteAllSettings = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    try {
      // メール通知設定を削除
      const { error: emailError } = await supabase
        .from('anonymous_email_notification_settings')
        .delete()
        .eq('email', email);

      // プッシュ通知トークンを削除
      const { error: tokenError } = await supabase
        .from('anonymous_notification_tokens')
        .delete()
        .eq('email', email);

      if (emailError || tokenError) {
        throw new Error('設定の削除に失敗しました');
      }

      setEmailSettings([]);
      setPushTokens([]);
      setMessage({ type: 'success', text: '全ての通知設定を削除しました' });
    } catch (error) {
      console.error('設定削除エラー:', error);
      setMessage({ type: 'error', text: '設定の削除に失敗しました' });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">
        匿名通知設定管理
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="body2" color="text.secondary" mb={1}>
          メールアドレスを入力して、匿名ユーザーの通知設定を管理できます。
        </Typography>
      </Paper>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h6" mb={1}>メールアドレス</Typography>
        <TextField
          fullWidth
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="メールアドレスを入力"
          size="small"
          type="email"
        />
      </Box>

      {loading && (
        <Typography>設定を読み込み中...</Typography>
      )}

      {email && !loading && (
        <>
          {/* メール通知設定 */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Email sx={{ mr: 1 }} />
                メール通知設定 ({emailSettings.length}件)
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>路線ID</TableCell>
                    <TableCell>有効</TableCell>
                    <TableCell>作成日時</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emailSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>{setting.line_id}</TableCell>
                      <TableCell>
                        <Chip 
                          label={setting.enabled ? '有効' : '無効'} 
                          color={setting.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(setting.created_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => deleteEmailSetting(setting.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emailSettings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        メール通知設定がありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* プッシュ通知設定 */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ mr: 1 }} />
                プッシュ通知設定 ({pushTokens.length}件)
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>デバイスタイプ</TableCell>
                    <TableCell>有効</TableCell>
                    <TableCell>作成日時</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pushTokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>{token.device_type}</TableCell>
                      <TableCell>
                        <Chip 
                          label={token.is_active ? '有効' : '無効'} 
                          color={token.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(token.created_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => deletePushToken(token.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pushTokens.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        プッシュ通知設定がありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 一括削除ボタン */}
          {(emailSettings.length > 0 || pushTokens.length > 0) && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="error"
                onClick={deleteAllSettings}
                startIcon={<Delete />}
              >
                全ての通知設定を削除
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
} 