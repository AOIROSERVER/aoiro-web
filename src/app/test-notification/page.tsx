"use client";
import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Email, Send, Refresh } from '@mui/icons-material';

export default function TestNotificationPage() {
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('CA');
  const [status, setStatus] = useState('遅延');
  const [details, setDetails] = useState('テスト用の遅延情報です');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [settings, setSettings] = useState<any[]>([]);

  const testNotificationSettings = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/test-notification-settings?email=${encodeURIComponent(email)}&lineId=${lineId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '設定の取得に失敗しました');
      }

      setSettings(data.settings);
      setMessage({ 
        type: 'success', 
        text: `${email}の通知設定を取得しました。${data.count}件の設定が見つかりました。` 
      });
    } catch (error) {
      console.error('設定テストエラー:', error);
      setMessage({ type: 'error', text: `設定の取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const testEmailNotification = async () => {
    if (!email || !lineId || !status) {
      setMessage({ type: 'error', text: '必要な情報を入力してください' });
      return;
    }

    setLoading(true);
    try {
      const lineNames: { [key: string]: string } = {
        'CA': '東海道新幹線',
        'JB': '山手線',
        'JC': '中央線',
        'JK': '京浜東北線',
        'JT': '東海道線',
        'JY': 'JR山手線',
        'KB': '京浜急行線',
        'KK': '京王線',
        'HA': '東急東横線',
        'HS': '東急田園都市線'
      };

      const response = await fetch('/api/test-email-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          lineId,
          lineName: lineNames[lineId] || lineId,
          status,
          details
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'メール送信に失敗しました');
      }

      setMessage({ type: 'success', text: 'テストメールを送信しました。メールボックスを確認してください。' });
    } catch (error) {
      console.error('メールテストエラー:', error);
      setMessage({ type: 'error', text: `メール送信に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="#1a237e">
        通知設定テスト
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>テスト設定</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            fullWidth
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="路線ID"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              select
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="CA">CA - 東海道新幹線</option>
              <option value="JB">JB - 山手線</option>
              <option value="JC">JC - 中央線</option>
              <option value="JK">JK - 京浜東北線</option>
              <option value="JT">JT - 東海道線</option>
              <option value="JY">JY - JR山手線</option>
              <option value="KB">KB - 京浜急行線</option>
              <option value="KK">KK - 京王線</option>
              <option value="HA">HA - 東急東横線</option>
              <option value="HS">HS - 東急田園都市線</option>
            </TextField>
            
            <TextField
              label="ステータス"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              select
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="平常運転">平常運転</option>
              <option value="遅延">遅延</option>
              <option value="運転見合わせ">運転見合わせ</option>
            </TextField>
          </Box>
          
          <TextField
            label="詳細情報"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={testNotificationSettings}
          disabled={loading || !email}
        >
          通知設定を確認
        </Button>
        
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={testEmailNotification}
          disabled={loading || !email}
          color="primary"
        >
          テストメールを送信
        </Button>
      </Box>

      {settings.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>通知設定一覧</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>路線ID</TableCell>
                  <TableCell>有効</TableCell>
                  <TableCell>遅延通知</TableCell>
                  <TableCell>運転見合わせ通知</TableCell>
                  <TableCell>復旧通知</TableCell>
                  <TableCell>通知頻度</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settings.map((setting) => (
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
                      <Chip 
                        label={setting.hasDelayNotification ? 'ON' : 'OFF'} 
                        color={setting.hasDelayNotification ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={setting.hasSuspensionNotification ? 'ON' : 'OFF'} 
                        color={setting.hasSuspensionNotification ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={setting.hasRecoveryNotification ? 'ON' : 'OFF'} 
                        color={setting.hasRecoveryNotification ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{setting.frequency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
} 