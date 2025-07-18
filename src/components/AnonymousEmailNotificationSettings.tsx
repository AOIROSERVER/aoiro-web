"use client";
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Button, 
  TextField, 
  Alert, 
  Divider,
  Paper,
  Chip
} from '@mui/material';
import { Email, Save, Delete } from '@mui/icons-material';
import { supabase } from '../lib/supabase';

interface AnonymousEmailNotificationSetting {
  id: string;
  email: string;
  line_id: string;
  enabled: boolean;
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
  { id: 'HS', name: '東急田園都市線' },
];

export const AnonymousEmailNotificationSettings = () => {
  const [settings, setSettings] = useState<AnonymousEmailNotificationSetting[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadSettings = async (email: string) => {
    if (!email) return;
    
    try {
      setLoading(true);
      console.log('🔧 設定読み込み開始:', email);
      
      // 匿名ユーザー用テーブルから設定を取得
      const { data: existingSettings, error } = await supabase
        .from('anonymous_email_notification_settings')
        .select('*')
        .eq('email', email);

      console.log('🔧 設定取得結果:', { existingSettings, error });

      if (error) {
        console.error('❌ 設定取得エラー:', error);
        setMessage({ type: 'error', text: `設定の取得に失敗しました: ${error.message}` });
        return;
      }

      setSettings(existingSettings || []);
      console.log('🔧 設定を更新:', existingSettings || []);
    } catch (error) {
      console.error('❌ 設定読み込みエラー:', error);
      setMessage({ type: 'error', text: `設定の読み込みに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (lineId: string, enabled: boolean) => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    try {
      console.log('🔧 設定更新開始:', { lineId, enabled, userEmail });
      
      const existingSetting = settings.find(s => s.line_id === lineId);
      console.log('🔧 既存設定:', existingSetting);
      
      if (existingSetting) {
        // 既存の設定を更新
        console.log('🔧 既存設定を更新:', existingSetting.id);
        const { data, error } = await supabase
          .from('anonymous_email_notification_settings')
          .update({ enabled, updated_at: new Date().toISOString() })
          .eq('id', existingSetting.id)
          .select();

        console.log('🔧 更新結果:', { data, error });
        if (error) throw error;
      } else {
        // 新しい設定を作成
        console.log('🔧 新規設定を作成:', { email: userEmail, line_id: lineId, enabled });
        const { data, error } = await supabase
          .from('anonymous_email_notification_settings')
          .insert({
            email: userEmail,
            line_id: lineId,
            enabled
          })
          .select();

        console.log('🔧 作成結果:', { data, error });
        if (error) throw error;
      }

      // ローカル状態を更新
      setSettings(prev => {
        const filtered = prev.filter(s => s.line_id !== lineId);
        return [...filtered, { id: existingSetting?.id || '', email: userEmail, line_id: lineId, enabled }];
      });

      setMessage({ type: 'success', text: '✅ 設定を更新しました' });
    } catch (error) {
      console.error('❌ 設定更新エラー:', error);
      setMessage({ type: 'error', text: `設定の更新に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const deleteSetting = async (lineId: string) => {
    if (!userEmail) return;

    try {
      const setting = settings.find(s => s.line_id === lineId);
      if (!setting) return;

      const { error } = await supabase
        .from('anonymous_email_notification_settings')
        .delete()
        .eq('id', setting.id);

      if (error) throw error;

      // ローカル状態を更新
      setSettings(prev => prev.filter(s => s.line_id !== lineId));
      setMessage({ type: 'success', text: '✅ 設定を削除しました' });
    } catch (error) {
      console.error('設定削除エラー:', error);
      setMessage({ type: 'error', text: '設定の削除に失敗しました' });
    }
  };

  const saveAllSettings = async () => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    setSaving(true);
    try {
      // 全ての路線の設定を保存
      const promises = lineData.map(line => {
        const existingSetting = settings.find(s => s.line_id === line.id);
        const enabled = existingSetting?.enabled || false;

        if (existingSetting) {
          return supabase
            .from('anonymous_email_notification_settings')
            .update({ enabled, updated_at: new Date().toISOString() })
            .eq('id', existingSetting.id);
        } else {
          return supabase
            .from('anonymous_email_notification_settings')
            .insert({
              email: userEmail,
              line_id: line.id,
              enabled
            });
        }
      });

      await Promise.all(promises);
      await loadSettings(userEmail);
      setMessage({ 
        type: 'success', 
        text: `✅ 登録完了！\n\n${userEmail}に遅延情報が自動で送信されるようになりました。\n\n今後、列車の遅延や運転見合わせなどの情報が変更されると、このメールアドレスに自動で通知が送信されます。` 
      });
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = (email: string) => {
    setUserEmail(email);
    if (email) {
      loadSettings(email);
    } else {
      setSettings([]);
    }
  };



  const testDatabaseConnection = async () => {
    try {
      console.log('🔧 データベース接続テスト開始');
      
      // テーブルの存在確認
      const { data: tableTest, error: tableError } = await supabase
        .from('anonymous_email_notification_settings')
        .select('count')
        .limit(1);

      console.log('🔧 テーブルテスト結果:', { tableTest, tableError });

      if (tableError) {
        console.error('❌ テーブルエラー:', tableError);
        setMessage({ type: 'error', text: `テーブルエラー: ${tableError.message}` });
        return;
      }

      // テストデータの挿入
      const { data: insertTest, error: insertError } = await supabase
        .from('anonymous_email_notification_settings')
        .insert({
          email: 'test@example.com',
          line_id: 'TEST',
          enabled: true
        })
        .select();

      console.log('🔧 挿入テスト結果:', { insertTest, insertError });

      if (insertError) {
        console.error('❌ 挿入エラー:', insertError);
        setMessage({ type: 'error', text: `挿入エラー: ${insertError.message}` });
        return;
      }

      // テストデータの削除
      if (insertTest && insertTest.length > 0) {
        const { error: deleteError } = await supabase
          .from('anonymous_email_notification_settings')
          .delete()
          .eq('id', insertTest[0].id);

        if (deleteError) {
          console.error('❌ 削除エラー:', deleteError);
        }
      }

      setMessage({ type: 'success', text: 'データベース接続テスト成功' });
    } catch (error) {
      console.error('❌ データベース接続テストエラー:', error);
      setMessage({ type: 'error', text: `データベース接続テスト失敗: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">
        <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
        遅延情報メール登録
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="body2" color="text.secondary" mb={1}>
          メールアドレスを登録すると、列車の遅延や運転見合わせなどの情報が自動で送信されます。
          ログイン不要で簡単に設定できます。
        </Typography>
      </Paper>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h6" mb={1}>📧 通知先メールアドレス</Typography>
        <TextField
          fullWidth
          value={userEmail}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="example@email.com"
          size="small"
          type="email"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          このメールアドレスに遅延情報が送信されます
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" mb={2}>🚄 通知を受け取る路線を選択</Typography>

      {loading ? (
        <Typography>設定を読み込み中...</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lineData.map((line) => {
            const setting = settings.find(s => s.line_id === line.id);
            const isEnabled = setting?.enabled || false;

            return (
              <Paper key={line.id} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isEnabled}
                        onChange={(e) => updateSetting(line.id, e.target.checked)}
                        color="primary"
                      />
                    }
                    label={line.name}
                  />
                  {setting && (
                    <Chip 
                      label="設定済み" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                  )}
                </Box>
                {setting && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => deleteSetting(line.id)}
                  >
                    削除
                  </Button>
                )}
              </Paper>
            );
          })}
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={saveAllSettings}
          disabled={saving || !userEmail}
          size="large"
        >
          {saving ? '登録中...' : '📧 遅延情報の受信を開始'}
        </Button>
        

        
        <Button
          variant="outlined"
          color="info"
          onClick={testDatabaseConnection}
        >
          データベース接続テスト
        </Button>
      </Box>
    </Box>
  );
}; 