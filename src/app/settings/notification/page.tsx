"use client";
import { 
  Box, 
  Typography, 
  Button, 
  Divider, 
  Paper,
  TextField,
  Alert
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Email, 
  Train, 
  Info
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
        const lineIds = ['HA', 'HS', 'JB', 'JC', 'JK', 'JT', 'JY1', 'JY2', 'KB', 'KK', 'CA', 'JO', 'M', 'Z', 'C', 'H', 'G', 'AK', 'AU'];
        
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
            onChange={(e) => setEmail(e.target.value)}
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
          onClick={saveEmail}
          disabled={!email || saving}
          sx={{ py: 1.5, fontSize: '1.1rem' }}
        >
          {saving ? '登録中...' : '同意して登録'}
        </Button>
      </Paper>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
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

      {/* テストメール送信 */}
      {email && (
        <Paper sx={{ p: 4, mb: 4, bgcolor: '#e8f5e8', border: '1px solid #c8e6c9' }}>
          <Typography variant="h6" mb={2} color="#2e7d32">
            🧪 メール送信テスト
          </Typography>
          <Typography variant="body2" color="#2e7d32" mb={3}>
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
          >
            テストメール送信
          </Button>
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