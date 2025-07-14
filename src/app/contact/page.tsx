"use client";
import { Box, Typography, TextField, Button, Alert, Paper, Divider, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox } from "@mui/material";
import { ArrowBack, Email, Send, Warning } from "@mui/icons-material";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function ContactPage() {
  const [contactType, setContactType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [device, setDevice] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

  const handleSend = async () => {
    if (!contactType || !name || !email || !device || !subject || !message || !agreement) {
      setError("全ての必須項目を入力し、同意事項にチェックしてください");
      return;
    }

    if (!captchaToken) {
      setError("hCaptchaの認証を完了してください");
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("正しいメールアドレスを入力してください");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // APIを呼び出してメール送信
      const response = await fetch('/api/send-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactType,
          name,
          email,
          device,
          subject,
          message,
          captchaToken
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '送信に失敗しました');
      }

      setSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "送信に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken("");
  };

  const handleCaptchaError = () => {
    setError("hCaptchaの認証に失敗しました。もう一度お試しください。");
    setCaptchaToken("");
  };

  return (
    <Box sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 2,
        background: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box
          onClick={() => router.back()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#666',
            '&:hover': { color: '#333' }
          }}
        >
          <ArrowBack sx={{ mr: 1 }} />
          <Typography>戻る</Typography>
        </Box>
      </Box>

      {/* メインコンテンツ */}
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#222', mb: 1, textAlign: 'center' }}>
          お問い合わせフォーム
        </Typography>
        <Typography sx={{ color: '#666', mb: 4, textAlign: 'center' }}>
          ご質問やご要望がございましたら、以下のフォームにご記入ください
        </Typography>

        {sent ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              お問い合わせを送信しました！
            </Alert>
            <Typography sx={{ color: '#333', mb: 2 }}>
              お問い合わせを受け付けました。内容を確認の上、ご返信いたします。
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setSent(false)}
              sx={{ mt: 2 }}
            >
              新しいお問い合わせを作成
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ p: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
                お問い合わせフォーム
              </Typography>
              <Typography sx={{ color: '#666', mb: 3 }}>
                以下のフォームにご記入いただき、送信ボタンを押すとメールアプリが開きます。
              </Typography>
            </Box>

            {/* お問い合わせ種類 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>お問い合わせ種類 *</InputLabel>
              <Select
                value={contactType}
                label="お問い合わせ種類 *"
                onChange={(e) => setContactType(e.target.value)}
                required
              >
                <MenuItem value="運行情報について">運行情報について</MenuItem>
                <MenuItem value="道路状況について">道路状況について</MenuItem>
                <MenuItem value="アプリの不具合">アプリの不具合</MenuItem>
                <MenuItem value="機能の要望">機能の要望</MenuItem>
                <MenuItem value="その他">その他</MenuItem>
              </Select>
            </FormControl>

            {/* 基本情報 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="お名前 *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                sx={{ flex: 1 }}
              />
              <TextField
                label="メールアドレス *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                sx={{ flex: 1 }}
              />
            </Box>

            {/* 使用端末 */}
            <TextField
              label="使用端末 *"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              fullWidth
              required
              placeholder="例：PC、スマートフォン、タブレットなど"
              sx={{ mb: 3 }}
            />

            {/* 件名 */}
            <TextField
              label="件名 *"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
            />

            {/* お問い合わせ内容 */}
            <TextField
              label="お問い合わせ内容 *"
              multiline
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              required
              sx={{ mb: 4 }}
              placeholder="ご質問やご要望を詳しくお聞かせください..."
            />

            {/* 同意事項 */}
            <Paper sx={{ p: 3, mb: 4, background: '#fff3cd', border: '1px solid #ffeaa7' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Warning sx={{ color: '#856404', mr: 1, mt: 0.5 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#856404' }}>
                  利用規約および同意事項
                </Typography>
              </Box>
              <Typography sx={{ color: '#856404', mb: 2, fontSize: '14px' }}>
                本フォームの送信をもって、以下の内容に同意いただいたものとみなします：
              </Typography>
              <Box component="ul" sx={{ color: '#856404', pl: 3, mb: 2, fontSize: '14px' }}>
                <li>本フォームは、当社への質問や要望を送信するためのもので、送信された情報はサービス向上のために使用されます。</li>
                <li>他者を誹謗中傷する内容、不正行為、営業活動など、当社が不適切と判断する内容の送信は禁止です。</li>
                <li>提供された個人情報は、当社のプライバシーポリシーに従って適切に管理されます。</li>
                <li>プライバシーポリシーに同意すること</li>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreement}
                    onChange={(e) => setAgreement(e.target.checked)}
                    required
                  />
                }
                label="私は上記の利用規約・同意事項を読み、すべてに同意します。"
                sx={{ color: '#856404' }}
              />
            </Paper>

            {/* hCaptcha */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <HCaptcha
                ref={captchaRef}
                sitekey="10000000-ffff-ffff-ffff-000000000001"
                onVerify={handleCaptchaVerify}
                onExpire={handleCaptchaExpire}
                onError={handleCaptchaError}
                theme="light"
              />
            </Box>

            {/* 送信ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                sx={{ minWidth: 120 }}
              >
                キャンセル
              </Button>
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={loading || !agreement || !captchaToken}
                startIcon={loading ? null : <Send />}
                sx={{ 
                  minWidth: 120,
                  background: '#1976d2',
                  '&:hover': { background: '#1565c0' }
                }}
              >
                {loading ? '送信中...' : '送信'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* その他の連絡方法 */}
        <Paper sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mb: 2 }}>
            その他の連絡方法
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Email sx={{ color: '#1976d2', mr: 2 }} />
            <Box>
              <Typography fontWeight="bold" sx={{ color: '#222' }}>
                メール
              </Typography>
              <Typography sx={{ color: '#666' }}>
                aoiroserver@gmail.com
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              width: 24, 
              height: 24, 
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
              </svg>
            </Box>
            <Box>
              <Typography fontWeight="bold" sx={{ color: '#222' }}>
                Discord
              </Typography>
              <Typography sx={{ color: '#666' }}>
                <a 
                  href="https://discord.com/invite/U9DVtc2y5J" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', textDecoration: 'none' }}
                >
                  サーバーに参加
                </a>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 