"use client";
import { 
  Box, 
  Typography, 
  Button, 
  Divider, 
  Paper,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  FormGroup,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Switch,
  FormControlLabel
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Email, 
  Notifications, 
  Train, 
  Warning, 
  CheckCircle,
  Schedule,
  Save,
  Delete,
  Info
} from "@mui/icons-material";
import { supabase } from '../../../lib/supabase';

interface LineInfo {
  id: string;
  name: string;
  company: string;
}

interface NotificationSetting {
  id?: string;
  email: string;
  line_id: string;
  enabled: boolean;
  delay_notification: boolean;
  suspension_notification: boolean;
  recovery_notification: boolean;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
  created_at?: string;
  updated_at?: string;
}

const lineData: LineInfo[] = [
  { id: 'HA', name: '東急東横線', company: '東急電鉄' },
  { id: 'HS', name: '東急田園都市線', company: '東急電鉄' },
  { id: 'JB', name: '山手線', company: 'JR東日本' },
  { id: 'JC', name: '中央線', company: 'JR東日本' },
  { id: 'JK', name: '京浜東北線', company: 'JR東日本' },
  { id: 'JT', name: '東海道線', company: 'JR東日本' },
  { id: 'JY', name: 'JR山手線', company: 'JR東日本' },
  { id: 'KB', name: '京浜急行線', company: '京浜急行電鉄' },
  { id: 'KK', name: '京王線', company: '京王電鉄' },
  { id: 'CA', name: '東海道新幹線', company: 'JR東海' },
];

export default function NotificationSettingsPage() {
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const router = useRouter();

  const loadSettings = async (userEmail: string) => {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      
      const { data: existingSettings, error } = await supabase
        .from('anonymous_email_notification_settings')
        .select('*')
        .eq('email', userEmail);

      if (error) {
        console.error('設定取得エラー:', error);
        setMessage({ type: 'error', text: '設定の取得に失敗しました' });
        return;
      }

      // 既存の設定を拡張して新しいフィールドを追加
      const expandedSettings = lineData.map(line => {
        const existing = existingSettings?.find(s => s.line_id === line.id);
        return {
          id: existing?.id || '',
          email: userEmail,
          line_id: line.id,
          enabled: existing?.enabled || false,
          delay_notification: existing?.delay_notification || false,
          suspension_notification: existing?.suspension_notification || false,
          recovery_notification: existing?.recovery_notification || false,
          notification_frequency: existing?.notification_frequency || 'immediate',
          created_at: existing?.created_at,
          updated_at: existing?.updated_at,
        };
      });

      setSettings(expandedSettings);
    } catch (error) {
      console.error('設定読み込みエラー:', error);
      setMessage({ type: 'error', text: '設定の読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (lineId: string, field: string, value: any) => {
    if (!email) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    try {
      const existingSetting = settings.find(s => s.line_id === lineId);
      const updatedSettings = settings.map(s => 
        s.line_id === lineId ? { ...s, [field]: value } : s
      );
      setSettings(updatedSettings);

      if (existingSetting?.id) {
        // 既存の設定を更新
        const { error } = await supabase
          .from('anonymous_email_notification_settings')
          .update({ 
            [field]: value, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingSetting.id);

        if (error) throw error;
      } else {
        // 新しい設定を作成
        const newSetting = updatedSettings.find(s => s.line_id === lineId);
        const { error } = await supabase
          .from('anonymous_email_notification_settings')
          .insert({
            email: email,
            line_id: lineId,
            enabled: newSetting?.enabled || false,
            delay_notification: newSetting?.delay_notification || false,
            suspension_notification: newSetting?.suspension_notification || false,
            recovery_notification: newSetting?.recovery_notification || false,
            notification_frequency: newSetting?.notification_frequency || 'immediate',
          });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: '設定を更新しました' });
    } catch (error) {
      console.error('設定更新エラー:', error);
      setMessage({ type: 'error', text: '設定の更新に失敗しました' });
    }
  };

  const saveAllSettings = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    setSaving(true);
    try {
      const promises = settings.map(setting => {
        if (setting.id) {
          return supabase
            .from('anonymous_email_notification_settings')
            .update({
              enabled: setting.enabled,
              delay_notification: setting.delay_notification,
              suspension_notification: setting.suspension_notification,
              recovery_notification: setting.recovery_notification,
              notification_frequency: setting.notification_frequency,
              updated_at: new Date().toISOString()
            })
            .eq('id', setting.id);
        } else {
          return supabase
            .from('anonymous_email_notification_settings')
            .insert({
              email: email,
              line_id: setting.line_id,
              enabled: setting.enabled,
              delay_notification: setting.delay_notification,
              suspension_notification: setting.suspension_notification,
              recovery_notification: setting.recovery_notification,
              notification_frequency: setting.notification_frequency,
            });
        }
      });

      await Promise.all(promises);
      await loadSettings(email);
      setMessage({ 
        type: 'success', 
        text: `✅ 登録完了！\n\n${email}に運行情報が自動で送信されるようになりました。\n\n今後、列車の遅延や運転見合わせなどの情報が変更されると、このメールアドレスに自動で通知が送信されます。` 
      });
    } catch (error) {
      console.error('設定保存エラー:', error);
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    if (newEmail) {
      loadSettings(newEmail);
    } else {
      setSettings([]);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" mb={2} color="#222">
          <Train sx={{ mr: 2, fontSize: 48, color: '#1976d2' }} />
          運行情報メールサービス
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={1}>
          さらに便利に。
        </Typography>
        <Typography variant="h5" fontWeight="bold" color="#1976d2">
          運行情報を配信中！！
        </Typography>
      </Box>

      {/* サービス説明 */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: '#f8f9fa', textAlign: 'center' }}>
        <Typography variant="h6" mb={2} color="#222">
          運行情報メールサービスとは？
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          列車の遅延や運転見合わせなどの情報をメールでお届けするサービスです。
          15分以上の遅れ・運転見合わせが発生または見込まれる場合に、メールでお知らせします。
          登録は無料です。
        </Typography>
      </Paper>

      {/* メールアドレス登録 */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: '#fff' }}>
        <Typography variant="h6" mb={3} color="#222">
          会員登録・登録内容変更方法
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          会員登録・登録内容変更方法はメールでご案内します。
          「運行情報メールサービス会員規約」と「プライバシーポリシー」をご確認の上、
          ご同意いただける場合は以下の入力欄にメールアドレスを入力してボタンをクリックしてください。
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="メールアドレス"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="example@email.com"
            type="email"
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            ※メールを受信するには「noreply@aoiroserver.site」からのメールを受信出来るよう、指定受信の設定をお願いいたします。
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={() => setShowAdvancedSettings(true)}
          disabled={!email}
          sx={{ py: 1.5, fontSize: '1.1rem' }}
        >
          同意して次へ
        </Button>
      </Paper>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* 詳細設定 */}
      {showAdvancedSettings && email && (
        <Paper sx={{ p: 4, mb: 4, bgcolor: '#fff' }}>
          <Typography variant="h6" mb={3} color="#222">
            路線別通知設定
          </Typography>
          
          <Grid container spacing={2} mb={3}>
            {lineData.map((line) => {
              const setting = settings.find(s => s.line_id === line.id);
              if (!setting) return null;

              return (
                <Grid item xs={12} md={6} key={line.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" color="#222">
                            {line.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {line.company}
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={setting.enabled} 
                              onChange={(e) => updateSetting(line.id, 'enabled', e.target.checked)}
                              color="primary"
                            />
                          }
                          label=""
                        />
                      </Box>

                      {setting.enabled && (
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="subtitle2" mb={1} color="#666">
                            通知タイプ
                          </Typography>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={setting.delay_notification}
                                  onChange={(e) => updateSetting(line.id, 'delay_notification', e.target.checked)}
                                  size="small"
                                />
                              }
                              label="遅延情報"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={setting.suspension_notification}
                                  onChange={(e) => updateSetting(line.id, 'suspension_notification', e.target.checked)}
                                  size="small"
                                />
                              }
                              label="運転見合わせ"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={setting.recovery_notification}
                                  onChange={(e) => updateSetting(line.id, 'recovery_notification', e.target.checked)}
                                  size="small"
                                />
                              }
                              label="復旧情報"
                            />
                          </FormGroup>

                          <Typography variant="subtitle2" mb={1} mt={2} color="#666">
                            通知頻度
                          </Typography>
                          <FormControl component="fieldset" size="small">
                            <RadioGroup
                              value={setting.notification_frequency}
                              onChange={(e) => updateSetting(line.id, 'notification_frequency', e.target.value)}
                            >
                              <FormControlLabel value="immediate" control={<Radio size="small" />} label="即座に通知" />
                              <FormControlLabel value="daily" control={<Radio size="small" />} label="日次まとめ" />
                              <FormControlLabel value="weekly" control={<Radio size="small" />} label="週次まとめ" />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={saveAllSettings}
              disabled={saving}
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              {saving ? '保存中...' : '設定を保存'}
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => router.push('/settings/anonymous-notification-management')}
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              通知設定管理
            </Button>
          </Box>
        </Paper>
      )}

      {/* 注意事項 */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
        <Typography variant="h6" mb={2} color="#856404">
          <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
          注意事項
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <Typography component="li" variant="body2" color="#856404" mb={1}>
            悪天候時や運転支障時、システムに関するメールについては、選択していただいた路線・曜日・時間帯に関わらず配信させていただく場合がございます。
          </Typography>
          <Typography component="li" variant="body2" color="#856404" mb={1}>
            インターネット情報の通信遅延などの原因により、メールが届かないことや、到着が遅れることがあります。
          </Typography>
          <Typography component="li" variant="body2" color="#856404" mb={1}>
            メールでお知らせする情報は実際のダイヤの状況と差異がある場合があります。
          </Typography>
          <Typography component="li" variant="body2" color="#856404">
            メール受信やサイト閲覧等に関する通信料はお客さまのご負担となります。
          </Typography>
        </Box>
      </Paper>

      {/* テスト通知 */}
      {email && (
        <Paper sx={{ p: 4, mb: 4, bgcolor: '#e8f5e8', border: '1px solid #c8e6c9' }}>
          <Typography variant="h6" mb={2} color="#2e7d32">
            🧪 テスト通知
          </Typography>
          <Typography variant="body2" color="#2e7d32" mb={3}>
            通知設定をテストするために、テスト通知を送信できます。
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="success"
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-train-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      lineId: 'HA',
                      lineName: '東急東横線',
                      status: '遅延',
                      details: 'テスト通知です',
                      email: email
                    })
                  });
                  if (response.ok) {
                    setMessage({ type: 'success', text: '遅延テスト通知を送信しました' });
                  } else {
                    setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' });
                  }
                } catch (error) {
                  setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' });
                }
              }}
            >
              遅延テスト通知
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-train-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      lineId: 'HA',
                      lineName: '東急東横線',
                      status: '運転見合わせ',
                      details: 'テスト通知です',
                      email: email
                    })
                  });
                  if (response.ok) {
                    setMessage({ type: 'success', text: '運転見合わせテスト通知を送信しました' });
                  } else {
                    setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' });
                  }
                } catch (error) {
                  setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' });
                }
              }}
            >
              運転見合わせテスト通知
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-train-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      lineId: 'HA',
                      lineName: '東急東横線',
                      status: '平常運転',
                      details: 'テスト通知です',
                      email: email
                    })
                  });
                  if (response.ok) {
                    setMessage({ type: 'success', text: '復旧テスト通知を送信しました' });
                  } else {
                    setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' });
                  }
                } catch (error) {
                  setMessage({ type: 'error', text: 'テスト通知の送信に失敗しました' });
                }
              }}
            >
              復旧テスト通知
            </Button>
          </Box>
        </Paper>
      )}

      {/* リンク */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          よくあるご質問（FAQ）はこちら。
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          指定受信の方法についてはこちら。
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          運行情報メール会員の退会はこちら。
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="text" size="small" color="primary">
            運行情報メールサービス会員規約
          </Button>
          <Button variant="text" size="small" color="primary">
            プライバシーポリシー
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 