"use client";
import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  Paper,
  TextField,
  Divider
} from '@mui/material';
import { Notifications, Email } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export const AnonymousSupabaseNotification = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // ブラウザが通知をサポートしているかチェック
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      setMessage({ type: 'error', text: 'このブラウザは通知をサポートしていません' });
      return;
    }

    if (!userEmail) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await registerServiceWorker();
        await saveToken();
        setMessage({ type: 'success', text: '通知の許可を取得しました' });
      } else {
        setMessage({ type: 'error', text: '通知の許可が拒否されました' });
      }
    } catch (error) {
      console.error('通知の許可を取得できませんでした:', error);
      setMessage({ type: 'error', text: '通知の許可を取得できませんでした' });
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/supabase-sw.js');
        console.log('Service Worker登録成功:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker登録失敗:', error);
        throw error;
      }
    }
  };

  const saveToken = async () => {
    try {
      if (!userEmail) {
        throw new Error('メールアドレスが設定されていません');
      }

      // デバイス情報を生成（簡易版）
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        email: userEmail
      };

      // トークンとしてデバイス情報のハッシュを使用
      const token = btoa(JSON.stringify(deviceInfo));

      // 匿名ユーザー用テーブルにトークンを保存
      const { error } = await supabase
        .from('anonymous_notification_tokens')
        .upsert({
          email: userEmail,
          token: token,
          device_type: 'web',
          is_active: true
        }, {
          onConflict: 'token'
        });

      if (error) {
        console.error('トークンの保存に失敗:', error);
        throw error;
      } else {
        console.log('匿名ユーザー通知トークンを保存しました');
      }
    } catch (error) {
      console.error('トークン保存エラー:', error);
      throw error;
    }
  };

  const sendTestNotification = async () => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    try {
      const response = await fetch('/api/supabase-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          lineId: 'TEST',
          lineName: 'テスト通知',
          status: 'テスト',
          details: 'これはテスト通知です。通知設定が正常に動作していることを確認できます。',
          isAnonymous: true
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'テスト通知を送信しました' });
      } else {
        throw new Error('テスト通知の送信に失敗しました');
      }
    } catch (error) {
      console.error('テスト通知送信エラー:', error);
      setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' });
    }
  };

  const removeToken = async () => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    try {
      const { error } = await supabase
        .from('anonymous_notification_tokens')
        .delete()
        .eq('email', userEmail);

      if (error) {
        console.error('トークン削除エラー:', error);
        setMessage({ type: 'error', text: '通知設定の削除に失敗しました' });
      } else {
        setMessage({ type: 'success', text: '通知設定を削除しました' });
      }
    } catch (error) {
      console.error('トークン削除エラー:', error);
      setMessage({ type: 'error', text: '通知設定の削除に失敗しました' });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">
        <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
        匿名プッシュ通知設定
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="body2" color="text.secondary" mb={1}>
          ログイン不要でプッシュ通知を設定できます。メールアドレスを入力して設定を開始してください。
        </Typography>
      </Paper>

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
          type="email"
        />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" mb={2}>通知設定</Typography>
      
      <div style={{ padding: '10px', border: '1px solid #ccc', margin: '10px 0', borderRadius: '4px' }}>
        <Typography variant="body1" mb={1}>通知の許可状態: {permission}</Typography>
        
        {permission === 'default' && (
          <Button 
            variant="contained"
            color="primary"
            onClick={requestPermission}
            disabled={!userEmail}
            startIcon={<Notifications />}
            sx={{ mr: 1 }}
          >
            通知を許可する
          </Button>
        )}
        
        {permission === 'granted' && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ 通知が許可されています
            </Alert>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined"
                color="success"
                onClick={sendTestNotification}
                disabled={!userEmail}
                startIcon={<Notifications />}
              >
                テスト通知を送信
              </Button>
              <Button 
                variant="outlined"
                color="error"
                onClick={removeToken}
                disabled={!userEmail}
                startIcon={<Notifications />}
              >
                通知設定を削除
              </Button>
            </Box>
          </Box>
        )}
        
        {permission === 'denied' && (
          <Alert severity="error">
            ❌ 通知が拒否されています。ブラウザの設定で通知を許可してください。
          </Alert>
        )}
      </div>
    </Box>
  );
}; 