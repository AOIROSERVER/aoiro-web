"use client";
import { 
  Box, 
  Typography, 
  Button, 
  Divider, 
  Paper,
  TextField,
  Alert,
  IconButton,
  Card,
  CardContent,
  Chip,
  Grid,
  Fade,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Email, 
  Train, 
  Info,
  ArrowBack,
  Notifications,
  Security,
  Speed,
  CheckCircle,
  Warning,
  Send,
  VerifiedUser,
  Schedule,
  LocationOn,
  Help,
  Settings,
  Cancel
} from "@mui/icons-material";
import { supabase } from '../../../lib/supabase';

interface NotificationSetting {
  id?: string;
  email: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function NotificationSettingsPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [unsubscribeEmail, setUnsubscribeEmail] = useState('');
  const [unsubscribing, setUnsubscribing] = useState(false);
  const router = useRouter();

  const saveEmail = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    setSaving(true);
    try {
      console.log('🔧 メールアドレス保存開始:', email);
      
      // Supabaseクライアントの状態を確認
      console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔧 Supabase Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
      
      // 既存の設定を確認
      console.log('🔧 既存設定の確認開始');
      const { data: existingSettings, error: checkError } = await supabase
        .from('anonymous_email_notification_settings')
        .select('*')
        .eq('email', email);

      console.log('🔧 既存設定確認結果:', { existingSettings, checkError });

      if (checkError) {
        console.error('設定確認エラー:', checkError);
        throw checkError;
      }

      if (existingSettings && existingSettings.length > 0) {
        // 既存の設定がある場合は更新
        console.log('🔧 既存設定の更新開始');
        const { error } = await supabase
          .from('anonymous_email_notification_settings')
          .update({
            enabled: true,
            delay_notification: true,
            suspension_notification: true,
            recovery_notification: true,
            notification_frequency: 'immediate',
            updated_at: new Date().toISOString()
          })
          .eq('email', email);

        if (error) {
          console.error('設定更新エラー:', error);
          throw error;
        }
        console.log('🔧 既存設定の更新完了');
      } else {
        // 新しい設定を作成（全路線に対して）
        console.log('🔧 新規設定の作成開始');
        const lineIds = ['HA', 'JB', 'JC', 'JK', 'JT', 'JY1', 'JY2', 'KB', 'KK', 'CA', 'JO', 'M', 'Z', 'C', 'H', 'G', 'AK', 'AU'];
        
        console.log('🔧 作成する路線:', lineIds);
        
        const insertPromises = lineIds.map(lineId => {
          const insertData = {
            email: email,
            line_id: lineId,
            enabled: true,
            delay_notification: true,
            suspension_notification: true,
            recovery_notification: true,
            notification_frequency: 'immediate'
          };
          console.log(`🔧 路線 ${lineId} の設定作成:`, insertData);
          return supabase
            .from('anonymous_email_notification_settings')
            .insert(insertData);
        });

        const results = await Promise.all(insertPromises);
        console.log('🔧 設定作成結果:', results);
        
        const errors = results.filter(result => result.error);
        
        if (errors.length > 0) {
          console.error('設定作成エラー:', errors);
          throw new Error('一部の路線の設定作成に失敗しました');
        }
        console.log('🔧 新規設定の作成完了');
      }

      // 登録完了メールを送信
      try {
        console.log('🔧 登録完了メール送信開始');
        console.log('🔧 送信先メールアドレス:', email);
        
        const emailResponse = await fetch('/api/registration-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        
        console.log('🔧 登録完了メールAPIレスポンス:', {
          status: emailResponse.status,
          statusText: emailResponse.statusText
        });
        
        if (emailResponse.ok) {
          const result = await emailResponse.json();
          console.log('✅ 登録完了メール送信成功:', result);
        } else {
          const errorResult = await emailResponse.json();
          console.error('❌ 登録完了メール送信失敗:', errorResult);
        }
      } catch (emailError) {
        console.error('❌ 登録完了メール送信エラー:', emailError);
      }

      setMessage({ 
        type: 'success', 
        text: `✅ 登録完了！\n\n${email}に運行情報が自動で送信されるようになりました。\n\n今後、列車の遅延や運転見合わせなどの情報が変更されると、このメールアドレスに自動で通知が送信されます。\n\n登録完了のお知らせメールも送信しました。` 
      });
    } catch (error) {
      console.error('設定保存エラー:', error);
      console.error('エラーの型:', typeof error);
      console.error('エラーの詳細:', JSON.stringify(error, null, 2));
      
      let errorMessage = '不明なエラー';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      setMessage({ type: 'error', text: `設定の保存に失敗しました: ${errorMessage}` });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!unsubscribeEmail) {
      setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
      return;
    }

    setUnsubscribing(true);
    try {
      const response = await fetch('/api/unsubscribe-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unsubscribeEmail })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `退会処理が完了しました。\n\n${unsubscribeEmail}の通知設定を無効化しました。\n\n退会完了のお知らせメールも送信しました。` 
        });
        setUnsubscribeDialogOpen(false);
        setUnsubscribeEmail('');
      } else {
        setMessage({ type: 'error', text: `退会処理に失敗しました: ${result.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '退会処理に失敗しました' });
    } finally {
      setUnsubscribing(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装飾 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* ヘッダー */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 3,
        py: 2,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        <IconButton 
          onClick={() => router.back()}
          sx={{
            background: 'rgba(102, 126, 234, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'rgba(102, 126, 234, 0.2)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <ArrowBack sx={{ color: '#667eea' }} />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Email sx={{ color: '#667eea', fontSize: 28, mr: 1 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea', fontSize: 20 }}>
            通知設定
          </Typography>
        </Box>
      </Box>

      {/* メインコンテンツ */}
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto", position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={1000}>
          <Box>
            {/* ヒーローセクション */}
            <Box sx={{ 
              textAlign: 'center', 
              mb: 6,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              p: 4,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Box sx={{ 
                background: '#fff',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.10)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                mb: 3,
                p: 2
              }}>
                <Box
                  component="img"
                  src="https://i.imgur.com/DG8qto5.png"
                  alt="電車アイコン"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  onLoad={() => console.log('画像の読み込みに成功しました')}
                  onError={(e) => {
                    console.error('画像の読み込みに失敗しました:', e);
                    // エラー時はTrainアイコンを表示
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallbackIcon = document.createElement('div');
                      fallbackIcon.innerHTML = '<svg style="width: 100%; height: 100%; color: #667eea;" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11H15V19H19V11M5,11H9V19H5V11Z"/></svg>';
                      parent.appendChild(fallbackIcon);
                    }
                  }}
                />
              </Box>
              
              <Typography variant="h2" fontWeight="bold" mb={2} sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', md: '3rem' }
              }}>
                運行情報メールサービス
              </Typography>
              
              <Typography variant="h5" color="text.secondary" mb={1} sx={{ fontWeight: 300 }}>
                さらに便利に。
              </Typography>
              
              <Chip
                icon={<Notifications />}
                label="運行情報を配信中！！"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1,
                  '& .MuiChip-icon': { color: '#fff' }
                }}
              />
            </Box>

            {/* 機能紹介カード */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Slide direction="up" in={true} timeout={1200}>
                  <Card sx={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                        mb: 2
                      }}>
                        <Speed sx={{ fontSize: 30, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        リアルタイム通知
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        列車の遅延や運転見合わせを即座にお知らせ
                      </Typography>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>

              <Grid item xs={12} md={4}>
                <Slide direction="up" in={true} timeout={1400}>
                  <Card sx={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                        mb: 2
                      }}>
                        <Security sx={{ fontSize: 30, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        安全・安心
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        プライバシーを保護し、安全な通知サービス
                      </Typography>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>

              <Grid item xs={12} md={4}>
                <Slide direction="up" in={true} timeout={1600}>
                  <Card sx={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                        mb: 2
                      }}>
                        <CheckCircle sx={{ fontSize: 30, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        無料サービス
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        完全無料で利用できる運行情報サービス
                      </Typography>
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>
            </Grid>

            {/* サービス説明 */}
            <Slide direction="up" in={true} timeout={1800}>
              <Card sx={{
                mb: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h5" mb={3} fontWeight="bold" sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    運行情報メールサービスとは？
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    列車の遅延や運転見合わせなどの情報をメールでお届けするサービスです。
                    15分以上の遅れ・運転見合わせが発生または見込まれる場合に、メールでお知らせします。
                    登録は無料です。
                  </Typography>
                </CardContent>
              </Card>
            </Slide>
            
            {/* メールアドレス登録 */}
            <Slide direction="up" in={true} timeout={2000}>
              <Card sx={{
                mb: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <VerifiedUser sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
                    <Typography variant="h5" fontWeight="bold" color="#222">
                      会員登録・登録内容変更方法
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" color="text.secondary" mb={4} sx={{ lineHeight: 1.8 }}>
                    会員登録・登録内容変更方法はメールでご案内します。
                    「運行情報メールサービス会員規約」と「プライバシーポリシー」をご確認の上、
                    ご同意いただける場合は以下の入力欄にメールアドレスを入力してボタンをクリックしてください。
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <TextField
                      fullWidth
                      label="メールアドレス"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      type="email"
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      ※メールを受信するには「noreply@aoiroserver.site」からのメールを受信出来るよう、指定受信の設定をお願いいたします。
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={saveEmail}
                    disabled={!email || saving}
                    sx={{ 
                      py: 2, 
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 15px 35px rgba(102, 126, 234, 0.5)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {saving ? '登録中...' : '同意して登録'}
                  </Button>
                </CardContent>
              </Card>
            </Slide>

            {message && (
              <Slide direction="up" in={true} timeout={2200}>
                <Alert 
                  severity={message.type} 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                  }} 
                  onClose={() => setMessage(null)}
                >
                  {message.text}
                </Alert>
              </Slide>
            )}

            {/* 注意事項 */}
            <Slide direction="up" in={true} timeout={2400}>
              <Card sx={{
                mb: 4,
                background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid #ffeaa7'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Warning sx={{ fontSize: 32, color: '#856404', mr: 2 }} />
                    <Typography variant="h5" fontWeight="bold" color="#856404">
                      注意事項
                    </Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    <Typography component="li" variant="body1" color="#856404" mb={2} sx={{ lineHeight: 1.8 }}>
                      悪天候時や運転支障時、システムに関するメールについては、選択していただいた路線・曜日・時間帯に関わらず配信させていただく場合がございます。
                    </Typography>
                    <Typography component="li" variant="body1" color="#856404" mb={2} sx={{ lineHeight: 1.8 }}>
                      インターネット情報の通信遅延などの原因により、メールが届かないことや、到着が遅れることがあります。
                    </Typography>
                    <Typography component="li" variant="body1" color="#856404" mb={2} sx={{ lineHeight: 1.8 }}>
                      メールでお知らせする情報は実際のダイヤの状況と差異がある場合があります。
                    </Typography>
                    <Typography component="li" variant="body1" color="#856404" sx={{ lineHeight: 1.8 }}>
                      メール受信やサイト閲覧等に関する通信料はお客さまのご負担となります。
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Slide>

            {/* テストメール送信 */}
            {email && (
              <Slide direction="up" in={true} timeout={2600}>
                <Card sx={{
                  mb: 4,
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  borderRadius: 3,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid #c8e6c9'
                }}>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                      <Send sx={{ fontSize: 32, color: '#2e7d32', mr: 2 }} />
                      <Typography variant="h5" fontWeight="bold" color="#2e7d32">
                        メール送信テスト
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="#2e7d32" mb={3}>
                      メール送信機能をテストするために、テストメールを送信できます。
                    </Typography>
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/test-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: email })
                          });
                          
                          const result = await response.json();
                          
                          if (response.ok) {
                            setMessage({ type: 'success', text: 'テストメールを送信しました。メールボックスを確認してください。' });
                          } else {
                            setMessage({ type: 'error', text: `テストメールの送信に失敗しました: ${result.error}` });
                          }
                        } catch (error) {
                          setMessage({ type: 'error', text: 'テストメールの送信に失敗しました' });
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      テストメール送信
                    </Button>
                  </CardContent>
                </Card>
              </Slide>
            )}

            {/* リンク */}
            <Slide direction="up" in={true} timeout={2800}>
              <Box sx={{ 
                textAlign: 'center', 
                mb: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                p: 4,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Typography variant="body1" color="text.secondary" mb={4} sx={{ fontWeight: 500 }}>
                  運行情報メール会員の退会はこちら。
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    onClick={() => router.push('/terms')}
                    sx={{
                      borderRadius: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5a6fd8',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    運行情報メールサービス会員規約
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => router.push('/privacy')}
                    sx={{
                      borderRadius: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderColor: '#5a6fd8',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    プライバシーポリシー
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => setUnsubscribeDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      '&:hover': {
                        borderColor: '#b91c1c',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    退会
                  </Button>
                </Box>
              </Box>
            </Slide>
          </Box>
        </Fade>
      </Box>

      {/* 退会ダイアログ */}
      <Dialog
        open={unsubscribeDialogOpen}
        onClose={() => setUnsubscribeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: '#dc2626'
        }}>
          <Cancel sx={{ mr: 1 }} />
          退会確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            運行情報メールサービスから退会しますか？
            退会後は、このメールアドレスに運行情報の通知が送信されなくなります。
          </DialogContentText>
          <TextField
            fullWidth
            label="メールアドレス"
            value={unsubscribeEmail}
            onChange={(e) => setUnsubscribeEmail(e.target.value)}
            placeholder="退会するメールアドレスを入力"
            type="email"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setUnsubscribeDialogOpen(false)}
            sx={{ color: '#6b7280' }}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleUnsubscribe}
            disabled={!unsubscribeEmail || unsubscribing}
            sx={{ 
              color: '#dc2626',
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 0.1)'
              }
            }}
          >
            {unsubscribing ? '退会処理中...' : '退会する'}
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Box>
  );
}