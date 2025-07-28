"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  TextField, 
  Button, 
  Alert, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import { Delete, Email, Save, History } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface EmailNotificationSetting {
  id: string;
  line_id: string;
  email: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LineInfo {
  id: string;
  name: string;
}

const lineData: LineInfo[] = [
  { id: 'CA', name: '東海道新幹線' },
  { id: 'JB', name: '総武線' },
  { id: 'JC', name: '中央線' },
  { id: 'JK', name: '京浜東北線' },
  { id: 'JT', name: '東海道線' },
  { id: 'JO', name: '横須賀線' },
  { id: 'M', name: '丸の内線' },
  { id: 'Z', name: '半蔵門線' },
  { id: 'C', name: '千代田線' },
  { id: 'H', name: '日比谷線' },
  { id: 'G', name: '銀座線' },
  { id: 'AK', name: 'あきが丘線' },
  { id: 'AU', name: 'あおうみ線 (空港アクセス線)' },
  { id: 'JY1', name: '山手線（内回り）' },
  { id: 'JY2', name: '山手線（外回り）' },
  { id: 'KB', name: '京浜急行線' },
  { id: 'KK', name: '京王線' },
  { id: 'HA', name: '東急東横線' },
];

export const EmailNotificationSettings = () => {
  const [settings, setSettings] = useState<EmailNotificationSetting[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'ログインが必要です' });
        return;
      }

      setUserEmail(user.email || '');

      // 既存の設定を取得
      const { data: existingSettings, error } = await supabase
        .from('email_notification_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('設定取得エラー:', error);
        setMessage({ type: 'error', text: '設定の取得に失敗しました' });
        return;
      }

      setSettings(existingSettings || []);
    } catch (error) {
      console.error('設定読み込みエラー:', error);
      setMessage({ type: 'error', text: '設定の読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (lineId: string, enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingSetting = settings.find(s => s.line_id === lineId);
      
      if (existingSetting) {
        // 既存の設定を更新
        const { error } = await supabase
          .from('email_notification_settings')
          .update({ enabled, updated_at: new Date().toISOString() })
          .eq('id', existingSetting.id);

        if (error) throw error;
      } else {
        // 新しい設定を作成
        const { error } = await supabase
          .from('email_notification_settings')
          .insert({
            user_id: user.id,
            line_id: lineId,
            email: userEmail,
            enabled
          });

        if (error) throw error;
      }

      // ローカル状態を更新
      setSettings(prev => {
        const filtered = prev.filter(s => s.line_id !== lineId);
        return [...filtered, { id: existingSetting?.id || '', line_id: lineId, email: userEmail, enabled }];
      });

      setMessage({ type: 'success', text: '設定を更新しました' });
    } catch (error) {
      console.error('設定更新エラー:', error);
      setMessage({ type: 'error', text: '設定の更新に失敗しました' });
    }
  };

  const deleteSetting = async (lineId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const setting = settings.find(s => s.line_id === lineId);
      if (!setting) return;

      const { error } = await supabase
        .from('email_notification_settings')
        .delete()
        .eq('id', setting.id);

      if (error) throw error;

      // ローカル状態を更新
      setSettings(prev => prev.filter(s => s.line_id !== lineId));
      setMessage({ type: 'success', text: '設定を削除しました' });
    } catch (error) {
      console.error('設定削除エラー:', error);
      setMessage({ type: 'error', text: '設定の削除に失敗しました' });
    }
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 全ての路線の設定を保存
      const promises = lineData.map(line => {
        const existingSetting = settings.find(s => s.line_id === line.id);
        const enabled = existingSetting?.enabled || false;

        if (existingSetting) {
          return supabase
            .from('email_notification_settings')
            .update({ enabled, updated_at: new Date().toISOString() })
            .eq('id', existingSetting.id);
        } else {
          return supabase
            .from('email_notification_settings')
            .insert({
              user_id: user.id,
              line_id: line.id,
              email: userEmail,
              enabled
            });
        }
      });

      await Promise.all(promises);
      await loadSettings();
      setMessage({ type: 'success', text: '全ての設定を保存しました' });
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      const response = await fetch('/api/email-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineId: 'TEST',
          lineName: 'テスト路線',
          status: 'テスト',
          details: 'メール通知のテストです',
          userEmail: userEmail
        })
      });

      if (!response.ok) {
        throw new Error('メール送信に失敗しました');
      }

      setMessage({ type: 'success', text: 'テストメールを送信しました' });
    } catch (error) {
      console.error('テストメール送信エラー:', error);
      setMessage({ type: 'error', text: 'テストメールの送信に失敗しました' });
    }
  };

  if (loading) {
    return <Typography>読み込み中...</Typography>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">
        <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
        メール通知設定
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h6" mb={1}>通知先メールアドレス</Typography>
        <TextField
          fullWidth
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="メールアドレスを入力"
          size="small"
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" mb={2}>路線別通知設定</Typography>
      
      <List>
        {lineData.map((line) => {
          const setting = settings.find(s => s.line_id === line.id);
          const enabled = setting?.enabled || false;

          return (
            <ListItem key={line.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
              <ListItemText
                primary={line.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={enabled ? '通知有効' : '通知無効'}
                      color={enabled ? 'success' : 'default'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {setting && (
                      <Typography variant="caption" color="text.secondary">
                        最終更新: {new Date(setting.updated_at || setting.created_at || '').toLocaleString('ja-JP')}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={enabled}
                  onChange={(e) => updateSetting(line.id, e.target.checked)}
                  color="primary"
                />
                {setting && (
                  <IconButton
                    edge="end"
                    onClick={() => deleteSetting(line.id)}
                    sx={{ ml: 1 }}
                  >
                    <Delete />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={saveAllSettings}
          disabled={saving}
        >
          {saving ? '保存中...' : '全て保存'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Email />}
          onClick={sendTestEmail}
          disabled={!userEmail}
        >
          テストメール送信
        </Button>

        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => router.push('/settings/email-history')}
        >
          通知履歴
        </Button>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
        <Typography variant="body2" color="#856404">
          <strong>注意事項：</strong><br/>
          • メール通知は運行状況が変更された時のみ送信されます<br/>
          • 通知設定の変更は即座に反映されます<br/>
          • メールの配信停止は設定画面から行ってください
        </Typography>
      </Box>
    </Box>
  );
}; 