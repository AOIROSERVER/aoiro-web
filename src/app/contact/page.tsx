"use client";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Paper, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import { 
  ArrowBack, 
  Email, 
  Send, 
  Warning, 
  ContactSupport,
  Message,
  Phone,
  Launch
} from "@mui/icons-material";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { vibrateActions, createVibrateOnClick, VIBRATION_PATTERNS } from "@/lib/vibration";

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
  const [fieldErrors, setFieldErrors] = useState({
    contactType: false,
    name: false,
    email: false,
    device: false,
    subject: false,
    message: false,
    agreement: false
  });

  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();



  // バリデーション関数
  const validateFields = () => {
    const errors = {
      contactType: !contactType,
      name: !name,
      email: !email,
      device: !device,
      subject: !subject,
      message: !message,
      agreement: !agreement
    };

    // メールアドレスの形式チェック
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      errors.email = !emailRegex.test(email);
    }

    setFieldErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  // 個別フィールドのバリデーション関数
  const validateField = (fieldName: string, value: string | boolean) => {
    let isValid = true;
    
    switch (fieldName) {
      case 'contactType':
        isValid = !!value;
        break;
      case 'name':
        isValid = !!value;
        break;
      case 'email':
        if (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailRegex.test(value as string);
        } else {
          isValid = false;
        }
        break;
      case 'device':
        isValid = !!value;
        break;
      case 'subject':
        isValid = !!value;
        break;
      case 'message':
        isValid = !!value;
        break;
      case 'agreement':
        isValid = !!value;
        break;
    }

    // 値が空でない場合のみエラーを表示（フォーカスが外れた時のみ）
    if (!value) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: true }));
    } else {
      setFieldErrors(prev => ({ ...prev, [fieldName]: !isValid }));
    }
  };

  // エラーメッセージを取得する関数
  const getErrorMessage = (fieldName: string) => {
    switch (fieldName) {
      case 'contactType':
        return '⚠️ お問い合わせ種類を選択してください';
      case 'name':
        return '⚠️ お名前を入力してください';
      case 'email':
        return '⚠️ 正しいメールアドレスを入力してください';
      case 'device':
        return '⚠️ 使用端末を入力してください';
      case 'subject':
        return '⚠️ 件名を入力してください';
      case 'message':
        return '⚠️ お問い合わせ内容を入力してください';
      case 'agreement':
        return '⚠️ 利用規約・同意事項に同意してください';
      default:
        return '⚠️ 入力してください';
    }
  };

  const handleSend = async () => {
    // フィールドバリデーション
    if (!validateFields()) {
      setError("入力していない箇所があります。赤枠で囲まれた項目を確認してください。");
      return;
    }

    if (!captchaToken) {
      setError("hCaptchaの認証を完了してください");
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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 装飾的な背景要素 */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        zIndex: 0
      }} />

      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={createVibrateOnClick(() => router.back(), VIBRATION_PATTERNS.TAP)}
            sx={{ color: 'white', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <ContactSupport sx={{ color: 'white', fontSize: 32, mr: 2 }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', wordBreak: 'break-word', whiteSpace: 'normal', margin: 0 }}>
            お問い合わせ
          </Typography>
        </Box>

        {/* メインコンテンツ */}
        <Card sx={{ 
          borderRadius: 4, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          mb: 3
        }}>
          <CardContent sx={{ p: 4 }}>
            {sent ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  お問い合わせを送信しました！
                </Alert>
                <Typography variant="h6" sx={{ color: '#333', mb: 3 }}>
                  お問い合わせを受け付けました。内容を確認の上、ご返信いたします。
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setSent(false)}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' }
                  }}
                >
                  新しいお問い合わせを作成
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#333', textAlign: 'center' }}>
                  お問い合わせフォーム
                </Typography>
                <Typography sx={{ color: '#666', mb: 4, textAlign: 'center' }}>
                  ご質問やご要望がございましたら、以下のフォームにご記入ください
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                {/* お問い合わせ種類 */}
                <Tooltip
                  title={getErrorMessage('contactType')}
                  open={fieldErrors.contactType}
                  placement="top"
                  arrow
                  disableFocusListener
                  disableHoverListener
                  disableTouchListener
                >
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>お問い合わせ種類 *</InputLabel>
                    <Select
                      value={contactType}
                      label="お問い合わせ種類 *"
                      onChange={(e) => {
                        setContactType(e.target.value);
                        if (fieldErrors.contactType) {
                          setFieldErrors(prev => ({ ...prev, contactType: false }));
                        }
                      }}
                      onBlur={() => {
                        console.log('🔍 ContactType onBlur:', contactType);
                        validateField('contactType', contactType);
                      }}
                      required
                      error={fieldErrors.contactType}
                      sx={{ 
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-error': {
                            borderColor: '#d32f2f',
                            '&:hover': {
                              borderColor: '#d32f2f'
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="運行情報について">運行情報について</MenuItem>
                      <MenuItem value="道路状況について">道路状況について</MenuItem>
                      <MenuItem value="アプリの不具合">アプリの不具合</MenuItem>
                      <MenuItem value="機能の要望">機能の要望</MenuItem>
                      <MenuItem value="その他">その他</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>

                {/* 基本情報 */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Tooltip
                      title={getErrorMessage('name')}
                      open={fieldErrors.name}
                      placement="top"
                      arrow
                      disableFocusListener
                      disableHoverListener
                      disableTouchListener
                    >
                      <TextField
                        label="お名前 *"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) {
                            setFieldErrors(prev => ({ ...prev, name: false }));
                          }
                        }}
                        onBlur={() => {
                          validateField('name', name);
                        }}
                        fullWidth
                        required
                        error={fieldErrors.name}

                        sx={{ 
                          borderRadius: 2,
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-error': {
                              borderColor: '#d32f2f',
                              '&:hover': {
                                borderColor: '#d32f2f'
                              }
                            }
                          }
                        }}
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Tooltip
                      title={getErrorMessage('email')}
                      open={fieldErrors.email}
                      placement="top"
                      arrow
                      disableFocusListener
                      disableHoverListener
                      disableTouchListener
                    >
                      <TextField
                        label="メールアドレス *"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors(prev => ({ ...prev, email: false }));
                          }
                        }}
                        onBlur={() => {
                          validateField('email', email);
                        }}
                        fullWidth
                        required
                        error={fieldErrors.email}

                        sx={{ 
                          borderRadius: 2,
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-error': {
                              borderColor: '#d32f2f',
                              '&:hover': {
                                borderColor: '#d32f2f'
                              }
                            }
                          }
                        }}
                      />
                    </Tooltip>
                  </Grid>
                </Grid>

                {/* 使用端末 */}
                <Tooltip
                  title={getErrorMessage('device')}
                  open={fieldErrors.device}
                  placement="top"
                  arrow
                  disableFocusListener
                  disableHoverListener
                  disableTouchListener
                >
                  <TextField
                    label="使用端末 *"
                                        value={device}
                      onChange={(e) => {
                        setDevice(e.target.value);
                        if (fieldErrors.device) {
                          setFieldErrors(prev => ({ ...prev, device: false }));
                        }
                      }}
                      onBlur={() => {
                        validateField('device', device);
                      }}
                      fullWidth
                      required
                      placeholder="例：PC、スマートフォン、タブレットなど"
                      error={fieldErrors.device}
                  
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        borderColor: '#d32f2f',
                        '&:hover': {
                          borderColor: '#d32f2f'
                        }
                      }
                    }
                  }}
                />
                </Tooltip>

                {/* 件名 */}
                <Tooltip
                  title={getErrorMessage('subject')}
                  open={fieldErrors.subject}
                  placement="top"
                  arrow
                  disableFocusListener
                  disableHoverListener
                  disableTouchListener
                >
                  <TextField
                    label="件名 *"
                                        value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        if (fieldErrors.subject) {
                          setFieldErrors(prev => ({ ...prev, subject: false }));
                        }
                      }}
                      onBlur={() => {
                        validateField('subject', subject);
                      }}
                      fullWidth
                      required
                      error={fieldErrors.subject}
                  
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        borderColor: '#d32f2f',
                        '&:hover': {
                          borderColor: '#d32f2f'
                        }
                      }
                    }
                  }}
                />
                </Tooltip>

                {/* お問い合わせ内容 */}
                <Tooltip
                  title={getErrorMessage('message')}
                  open={fieldErrors.message}
                  placement="top"
                  arrow
                  disableFocusListener
                  disableHoverListener
                  disableTouchListener
                >
                  <TextField
                    label="お問い合わせ内容 *"
                    multiline
                    rows={6}
                                        value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (fieldErrors.message) {
                          setFieldErrors(prev => ({ ...prev, message: false }));
                        }
                      }}
                      onBlur={() => {
                        validateField('message', message);
                      }}
                      fullWidth
                      required
                      error={fieldErrors.message}
                  
                  sx={{ 
                    mb: 4, 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        borderColor: '#d32f2f',
                        '&:hover': {
                          borderColor: '#d32f2f'
                        }
                      }
                    }
                  }}
                  placeholder="ご質問やご要望を詳しくお聞かせください..."
                />
                </Tooltip>

                {/* 同意事項 */}
                <Paper sx={{ 
                  p: 3, 
                  mb: 4, 
                  background: 'rgba(255, 193, 7, 0.1)', 
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  borderRadius: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Warning sx={{ color: '#f57c00', mr: 1, mt: 0.5 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f57c00' }}>
                      利用規約および同意事項
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#666', mb: 2, fontSize: '14px' }}>
                    本フォームの送信をもって、以下の内容に同意いただいたものとみなします：
                  </Typography>
                  <Box component="ul" sx={{ color: '#666', pl: 3, mb: 2, fontSize: '14px' }}>
                    <li>本フォームは、当社への質問や要望を送信するためのもので、送信された情報はサービス向上のために使用されます。</li>
                    <li>他者を誹謗中傷する内容、不正行為、営業活動など、当社が不適切と判断する内容の送信は禁止です。</li>
                    <li>提供された個人情報は、当社のプライバシーポリシーに従って適切に管理されます。</li>
                    <li>プライバシーポリシーに同意すること</li>
                  </Box>
                  <FormControlLabel
                    control={
                      <Tooltip
                        title={getErrorMessage('agreement')}
                        open={fieldErrors.agreement}
                        placement="top"
                        arrow
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                      >
                        <Checkbox
                          checked={agreement}
                          onChange={(e) => {
                            setAgreement(e.target.checked);
                            if (fieldErrors.agreement) {
                              setFieldErrors(prev => ({ ...prev, agreement: false }));
                            }
                          }}
                          onBlur={(e) => {
                            validateField('agreement', agreement);
                            if (!agreement) {
                              // showTooltip('agreement', e.currentTarget); // This line is removed
                            }
                          }}
                          required
                          sx={{ 
                            color: fieldErrors.agreement ? '#d32f2f' : '#f57c00',
                            '&.Mui-checked': {
                              color: fieldErrors.agreement ? '#d32f2f' : '#f57c00'
                            }
                          }}
                        />
                      </Tooltip>
                    }
                    label="私は上記の利用規約・同意事項を読み、すべてに同意します。"
                    sx={{ 
                      color: fieldErrors.agreement ? '#d32f2f' : '#666',
                      border: fieldErrors.agreement ? '1px solid #d32f2f' : 'none',
                      borderRadius: fieldErrors.agreement ? 1 : 0,
                      p: fieldErrors.agreement ? 1 : 0,
                      backgroundColor: fieldErrors.agreement ? 'rgba(211, 47, 47, 0.1)' : 'transparent'
                    }}
                  />

                </Paper>

                {/* hCaptcha */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
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
                    onClick={createVibrateOnClick(() => router.back(), VIBRATION_PATTERNS.TAP)}
                    sx={{ 
                      minWidth: 120,
                      borderRadius: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': { borderColor: '#5a6fd8', backgroundColor: 'rgba(103, 126, 234, 0.1)' }
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="contained"
                    onClick={createVibrateOnClick(handleSend, VIBRATION_PATTERNS.HEAVY)}
                    disabled={loading || !agreement || !captchaToken}
                    startIcon={loading ? null : <Send />}
                    sx={{ 
                      minWidth: 120,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' },
                      '&:disabled': { background: '#ccc' }
                    }}
                  >
                    {loading ? '送信中...' : '送信'}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* その他の連絡方法 */}
        <Card sx={{ 
          borderRadius: 4, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#333', textAlign: 'center' }}>
              その他の連絡方法
            </Typography>
            
                         <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center'
            }}>
               {/* Discordカード */}
               <Card sx={{ 
                 background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
                 color: 'white',
                 borderRadius: 4,
                 cursor: 'pointer',
                 width: { xs: '100%', sm: 400 },
                 maxWidth: 500,
                 position: 'relative',
                 overflow: 'hidden',
                 '&:hover': { 
                   transform: 'translateY(-4px)', 
                   boxShadow: '0 12px 40px rgba(88, 101, 242, 0.4)',
                   '& .discord-glow': {
                     opacity: 1,
                     transform: 'scale(1.1)'
                   }
                 },
                 transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
               }}>
                 {/* 装飾的な光の効果 */}
                 <Box className="discord-glow" sx={{
                   position: 'absolute',
                   top: -50,
                   right: -50,
                   width: 100,
                   height: 100,
                   background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                   borderRadius: '50%',
                   opacity: 0,
                   transition: 'all 0.4s ease'
                 }} />
                 
                 <CardContent sx={{ 
                   p: { xs: 3, sm: 4 }, 
                   textAlign: 'center', 
                   position: 'relative', 
                   zIndex: 1 
                 }}>
                   <Box sx={{ 
                     width: { xs: 50, sm: 60 }, 
                     height: { xs: 50, sm: 60 }, 
                     mb: { xs: 2, sm: 3 },
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     mx: 'auto',
                     background: 'rgba(255,255,255,0.15)',
                     borderRadius: '50%',
                     backdropFilter: 'blur(10px)'
                   }}>
                     <svg width={40} height={40} viewBox="0 0 24 24" fill="white" style={{ width: '60%', height: '60%' }}>
                       <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                     </svg>
                   </Box>
                   <Typography variant="h5" fontWeight="bold" mb={2} sx={{ 
                     background: 'linear-gradient(45deg, #fff, #e3f2fd)',
                     backgroundClip: 'text',
                     WebkitBackgroundClip: 'text',
                     WebkitTextFillColor: 'transparent',
                     textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                     fontSize: { xs: '1.2rem', sm: '1.5rem' }
                   }}>
                     Discord
                   </Typography>
                   <Typography variant="body1" sx={{ 
                     mb: { xs: 2, sm: 3 }, 
                     opacity: 0.9, 
                     fontWeight: 500,
                     fontSize: { xs: '0.9rem', sm: '1rem' }
                   }}>
                     コミュニティに参加
                   </Typography>
                   
                   {/* オシャレな参加ボタン */}
                   <Button
                     variant="contained"
                     onClick={() => window.open('https://discord.com/invite/U9DVtc2y5J', '_blank')}
                     sx={{
                       background: 'linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                       backdropFilter: 'blur(10px)',
                       border: '1px solid rgba(255,255,255,0.3)',
                       borderRadius: '25px',
                       px: { xs: 3, sm: 4 },
                       py: { xs: 1, sm: 1.5 },
                       color: 'white',
                       fontWeight: 'bold',
                       fontSize: { xs: '0.8rem', sm: '0.9rem' },
                       textTransform: 'none',
                       position: 'relative',
                       overflow: 'hidden',
                       '&:hover': {
                         background: 'linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2))',
                         transform: 'scale(1.05)',
                         boxShadow: '0 8px 25px rgba(255,255,255,0.3)'
                       },
                       '&:before': {
                         content: '""',
                         position: 'absolute',
                         top: 0,
                         left: '-100%',
                         width: '100%',
                         height: '100%',
                         background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                         transition: 'left 0.5s'
                       },
                       '&:hover:before': {
                         left: '100%'
                       },
                       transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                     }}
                     startIcon={<Launch sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                   >
                     サーバーに参加
                   </Button>
                 </CardContent>
               </Card>


             </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 