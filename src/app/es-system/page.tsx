"use client";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  FormHelperText,
  Divider
} from "@mui/material";
import { 
  ArrowBack, 
  Send, 
  Warning, 
  Security,
  Upload,
  Description,
  Business,
  Person,
  Email,
  LocationOn,
  Devices,
  Assignment,
  PhotoCamera,
  CameraAlt,
  Delete,
  CheckCircle,
  AutoAwesome,
  Celebration,
  Schedule,
  Drafts
} from "@mui/icons-material";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function ESSystemPage() {
  const [applicationType, setApplicationType] = useState("");
  const [minecraftTag, setMinecraftTag] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [device, setDevice] = useState("");
  const [motivation, setMotivation] = useState("");
  const [portfolio, setPortfolio] = useState<File | null>(null);
  const [portfolioPreview, setPortfolioPreview] = useState<string | null>(null);
  const [agreement, setAgreement] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    applicationType: false,
    minecraftTag: false,
    age: false,
    email: false,
    prefecture: false,
    device: false,
    motivation: false,
    portfolio: false,
    agreement: false
  });

  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

  // ポートフォリオ画像選択処理（クエストと同じ方式）
  const handlePortfolioSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください');
        return;
      }

      setPortfolio(file);

      // プレビュー用のBase64データURL作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setPortfolioPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // エラー状態をリセット
      if (fieldErrors.portfolio) {
        setFieldErrors(prev => ({ ...prev, portfolio: false }));
      }
    }
  };

  // ポートフォリオ画像削除処理
  const handlePortfolioRemove = () => {
    setPortfolio(null);
    setPortfolioPreview(null);
  };

  // 都道府県リスト
  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  // 年齢オプション
  const ageOptions: (number | string)[] = Array.from({length: 21}, (_, i) => i + 10); // 10歳から30歳まで
  ageOptions.push("30歳以上");

  // バリデーション関数
  const validateFields = () => {
    const errors = {
      applicationType: !applicationType,
      minecraftTag: !minecraftTag,
      age: applicationType === "運営申請" ? !age : false,
      email: (applicationType === "運営申請" || applicationType === "クリエイティブ申請") ? !email : false,
      prefecture: applicationType === "運営申請" ? !prefecture : false,
      device: (applicationType === "運営申請" || applicationType === "クリエイティブ申請" || applicationType === "会社申請") ? !device : false,
      motivation: (applicationType === "運営申請" || applicationType === "会社申請") ? !motivation : false,
      portfolio: applicationType === "クリエイティブ申請" ? !portfolio : false,
      agreement: !agreement
    };

    // メールアドレスの形式チェック
    if (email && (applicationType === "運営申請" || applicationType === "クリエイティブ申請")) {
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
      case 'applicationType':
        isValid = !!value;
        break;
      case 'minecraftTag':
        isValid = !!value;
        break;
      case 'age':
        isValid = applicationType === "運営申請" ? !!value : true;
        break;
      case 'email':
        if ((applicationType === "運営申請" || applicationType === "クリエイティブ申請") && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailRegex.test(value as string);
        } else if (applicationType === "運営申請" || applicationType === "クリエイティブ申請") {
          isValid = false;
        }
        break;
      case 'prefecture':
        isValid = applicationType === "運営申請" ? !!value : true;
        break;
      case 'device':
        isValid = (applicationType === "運営申請" || applicationType === "クリエイティブ申請" || applicationType === "会社申請") ? !!value : true;
        break;
      case 'motivation':
        isValid = (applicationType === "運営申請" || applicationType === "会社申請") ? !!value : true;
        break;
      case 'portfolio':
        isValid = applicationType === "クリエイティブ申請" ? !!value : true;
        break;
      case 'agreement':
        isValid = !!value;
        break;
    }

    setFieldErrors(prev => ({ ...prev, [fieldName]: !isValid }));
  };

  // エラーメッセージを取得する関数
  const getErrorMessage = (fieldName: string) => {
    switch (fieldName) {
      case 'applicationType':
        return '⚠️ 申請種類を選択してください';
      case 'minecraftTag':
        return '⚠️ Minecraftゲームタグを入力してください';
      case 'age':
        return '⚠️ 年齢を選択してください';
      case 'email':
        return '⚠️ 正しいメールアドレスを入力してください';
      case 'prefecture':
        return '⚠️ お住まいの都道府県を選択してください';
      case 'device':
        if (applicationType === "会社申請") {
          return '⚠️ 入社したい会社名を入力してください';
        }
        return '⚠️ 使用端末を入力してください';
      case 'motivation':
        return '⚠️ 意志表明を入力してください';
      case 'portfolio':
        return '⚠️ 証明画像・証明動画をアップロードしてください';
      case 'agreement':
        return '⚠️ 利用規約・同意事項に同意してください';
      default:
        return '⚠️ 入力してください';
    }
  };

  // フォーム送信処理
  const handleSubmit = async () => {
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
      // フォームデータの作成
      // データをJSON形式で送信（クエストと同じ方式）
      const submitData = {
        applicationType,
        minecraftTag,
        age,
        email,
        prefecture,
        device,
        motivation,
        portfolioData: portfolioPreview, // Base64エンコードされた画像データ
        portfolioFileName: portfolio?.name,
        captchaToken
      };

      // APIエンドポイントに送信
      const response = await fetch('/api/es-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
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
            onClick={() => router.back()}
            sx={{ color: 'white', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Security sx={{ color: 'white', fontSize: 32, mr: 2 }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', wordBreak: 'break-word', whiteSpace: 'normal', margin: 0 }}>
            ESシステム（エントリーシート）
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
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* 装飾的な背景要素 */}
                <Box sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                  }
                }} />
                <Box sx={{
                  position: 'absolute',
                  bottom: -20,
                  left: -20,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.15) 0%, rgba(102, 126, 234, 0.15) 100%)',
                  animation: 'float 3s ease-in-out infinite 1.5s',
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' }
                  }
                }} />

                {/* メインコンテンツ */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  {/* アニメーション付きチェックアイコン */}
                  <Box sx={{ mb: 3, position: 'relative' }}>
                    <Box sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                      boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                      animation: 'bounce 0.6s ease-out',
                      '@keyframes bounce': {
                        '0%': { transform: 'scale(0)', opacity: 0 },
                        '50%': { transform: 'scale(1.1)', opacity: 1 },
                        '100%': { transform: 'scale(1)', opacity: 1 }
                      }
                    }}>
                      <CheckCircle sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <AutoAwesome sx={{ 
                      position: 'absolute', 
                      top: -5, 
                      right: -5, 
                      color: '#FFD700', 
                      fontSize: 24,
                      animation: 'sparkle 2s infinite',
                      '@keyframes sparkle': {
                        '0%, 100%': { transform: 'rotate(0deg) scale(1)', opacity: 1 },
                        '50%': { transform: 'rotate(180deg) scale(1.2)', opacity: 0.7 }
                      }
                    }} />
                  </Box>

                  {/* メインメッセージ */}
                  <Typography variant="h4" fontWeight="bold" sx={{ 
                    color: '#2e7d32',
                    mb: 2,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    <Celebration sx={{ mr: 1, verticalAlign: 'middle', color: '#2e7d32' }} />
                    送信完了！
                  </Typography>

                  {/* サブメッセージ */}
                  <Typography variant="h6" sx={{ 
                    color: '#333', 
                    mb: 4,
                    fontWeight: 500,
                    lineHeight: 1.6
                  }}>
                    エントリーシートが正常に送信されました
                  </Typography>

                  {/* 詳細情報カード */}
                  <Box sx={{
                    display: 'inline-block',
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 3,
                    p: 3,
                    mb: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Schedule sx={{ color: '#667eea', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            審査期間
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="600">
                          1〜2週間程度
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Drafts sx={{ color: '#667eea', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            結果通知方法
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="600">
                          メール・Discord
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* 詳細説明 */}
                  <Typography variant="body1" sx={{ 
                    color: '#555', 
                    mb: 4,
                    maxWidth: 500,
                    mx: 'auto',
                    lineHeight: 1.7
                  }}>
                    審査を開始いたします。結果につきましては、ご入力いただいたメールアドレスまたはDiscordにてご連絡いたします。
                  </Typography>

                  {/* アクションボタン */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      onClick={() => setSent(false)}
                      startIcon={<Upload />}
                      sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': { 
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                        },
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        fontSize: '16px',
                        fontWeight: 600,
                        textTransform: 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      新しい申請を作成
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => window.location.href = '/'}
                      sx={{ 
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': { 
                          borderColor: '#5a6fd8',
                          background: 'rgba(102, 126, 234, 0.1)',
                          transform: 'translateY(-2px)'
                        },
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        fontSize: '16px',
                        fontWeight: 600,
                        textTransform: 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ホームに戻る
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
                {/* 申請必須情報セクション */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#333', textAlign: 'center' }}>
                    申請必須情報
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* 運営申請 */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        border: '2px solid #667eea',
                        borderRadius: 3,
                        height: '100%'
                      }}>
                        <CardContent>
                          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#667eea', textAlign: 'center' }}>
                            運営申請必須情報
                          </Typography>
                          <Box component="ul" sx={{ color: '#666', pl: 2, fontSize: '14px' }}>
                            <li>Minecraftゲームタグの提示</li>
                            <li>年齢の提示</li>
                            <li>メールアドレス</li>
                            <li>住まい</li>
                            <li>使用端末</li>
                            <li>意志表明</li>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* クリエイティブ申請 */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        border: '2px solid #7c3aed',
                        borderRadius: 3,
                        height: '100%'
                      }}>
                        <CardContent>
                          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#7c3aed', textAlign: 'center' }}>
                            クリエイティブ申請必須情報
                          </Typography>
                          <Box component="ul" sx={{ color: '#666', pl: 2, fontSize: '14px' }}>
                            <li>Minecraftゲームタグの提示</li>
                            <li>メールアドレス</li>
                            <li>使用端末</li>
                            <li>証明画像・証明動画</li>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* 会社申請 */}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        border: '2px solid #059669',
                        borderRadius: 3,
                        height: '100%'
                      }}>
                        <CardContent>
                          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#059669', textAlign: 'center' }}>
                            会社申請必須情報
                          </Typography>
                          <Box component="ul" sx={{ color: '#666', pl: 2, fontSize: '14px' }}>
                            <li>Minecraftゲームタグの提示</li>
                            <li>入社したい会社名</li>
                            <li>意志表明</li>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* 開発環境アラート */}
                {process.env.NODE_ENV === 'development' && (
                  <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
                    <Typography sx={{ fontSize: '14px' }}>
                      <strong>開発環境</strong>: ファイルアップロードとGoogle Sheets保存は簡易モードで動作します。データはコンソールログで確認できます。
                    </Typography>
                  </Alert>
                )}

                {/* タイトルセクション */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h5" fontWeight="bold" mb={2} sx={{ color: '#333' }}>
                    ESシステム特設ページ
                  </Typography>
                  <Box sx={{ 
                    p: 3, 
                    mb: 3, 
                    background: 'rgba(103, 126, 234, 0.1)', 
                    border: '1px solid rgba(103, 126, 234, 0.3)',
                    borderRadius: 3 
                  }}>
                    <Typography sx={{ color: '#333', mb: 2, fontSize: '16px', lineHeight: 1.7, fontWeight: 500 }}>
                      エントリーシート（ES）とは、個人情報の開示を行なってもらい、審査をして採用するかどうかを判断するシステムです。
                    </Typography>
                    <Typography sx={{ color: '#333', mb: 2, fontSize: '16px', lineHeight: 1.7, fontWeight: 500 }}>
                      BC(バックグラウンドチェック)は当鯖の運営が行うものとする。
                    </Typography>
                    <Typography sx={{ color: '#333', mb: 2, fontSize: '16px', lineHeight: 1.7, fontWeight: 500 }}>
                      ここで収集された情報は当サーバー内で不正行為があった時の証明として利用されます。
                    </Typography>
                    <Typography sx={{ color: '#333', mb: 2, fontSize: '16px', lineHeight: 1.7, fontWeight: 500 }}>
                      審査はES→BCの順で行われます。
                    </Typography>
                    <Typography sx={{ color: '#333', fontSize: '16px', lineHeight: 1.7, fontWeight: 500 }}>
                      また収集した情報は第3者へ共有されません。
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3, p: 2, background: 'rgba(103, 126, 234, 0.1)', borderRadius: 2, border: '1px solid rgba(103, 126, 234, 0.3)' }}>
                    <Typography sx={{ color: '#333', fontSize: '15px', fontWeight: 'bold', mb: 1 }}>
                      Q このシステムはどこで使われるのですか？
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: '15px' }}>
                      A 運営または社員の募集でESシステムが使用されます。
                    </Typography>
                  </Box>

                  <Alert 
                    severity="warning" 
                    icon={<Warning sx={{ fontSize: '24px' }} />}
                    sx={{ 
                      borderRadius: 2, 
                      mb: 3,
                      '& .MuiAlert-message': {
                        width: '100%'
                      }
                    }}
                  >
                    <Box>
                      <Typography fontWeight="bold" sx={{ fontSize: '16px', mb: 1 }}>
                        ⚠️ 警告
                      </Typography>
                      <Typography sx={{ fontSize: '15px', lineHeight: 1.5 }}>
                        虚偽情報を入力した場合BANさせる可能性があります。
                      </Typography>
                    </Box>
                  </Alert>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                {/* 申請種類 */}
                <Tooltip
                  title={getErrorMessage('applicationType')}
                  open={fieldErrors.applicationType}
                  placement="top"
                  arrow
                  disableFocusListener
                  disableHoverListener
                  disableTouchListener
                >
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="application-type-label">申請種類 *</InputLabel>
                    <Select
                      labelId="application-type-label"
                      id="application-type-select"
                      value={applicationType}
                      label="申請種類 *"
                      onChange={(e) => {
                        const newValue = e.target.value as string;
                        console.log('申請種類選択:', newValue);
                        setApplicationType(newValue);
                        if (fieldErrors.applicationType) {
                          setFieldErrors(prev => ({ ...prev, applicationType: false }));
                        }
                        // 申請種類が変更されたら他のフィールドをリセット
                        setAge("");
                        setEmail("");
                        setPrefecture("");
                        setDevice("");
                        setMotivation("");
                        setPortfolio(null);
                        // エラー状態もリセット
                        setFieldErrors({
                          applicationType: false,
                          minecraftTag: false,
                          age: false,
                          email: false,
                          prefecture: false,
                          device: false,
                          motivation: false,
                          portfolio: false,
                          agreement: false
                        });
                      }}
                      onBlur={() => validateField('applicationType', applicationType)}
                      required
                      error={fieldErrors.applicationType}
                      sx={{ 
                        borderRadius: 2,
                        '& .MuiSelect-select': {
                          paddingLeft: 2
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>選択してください</em>
                      </MenuItem>
                      <MenuItem value="運営申請">運営申請</MenuItem>
                      <MenuItem value="クリエイティブ申請">クリエイティブ申請</MenuItem>
                      <MenuItem value="会社申請">入社申請</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>

                {/* Minecraftゲームタグ */}
                <Tooltip
                  title={getErrorMessage('minecraftTag')}
                  open={fieldErrors.minecraftTag}
                  placement="top"
                  arrow
                  disableFocusListener
                  disableHoverListener
                  disableTouchListener
                >
                  <TextField
                    label="Minecraftゲームタグ *"
                    value={minecraftTag}
                    onChange={(e) => {
                      setMinecraftTag(e.target.value);
                      if (fieldErrors.minecraftTag) {
                        setFieldErrors(prev => ({ ...prev, minecraftTag: false }));
                      }
                    }}
                    onBlur={() => validateField('minecraftTag', minecraftTag)}
                    fullWidth
                    required
                    error={fieldErrors.minecraftTag}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: '#666' }} />
                    }}
                    sx={{ mb: 3, borderRadius: 2 }}
                  />
                </Tooltip>

                {/* 条件分岐フィールド */}
                {applicationType && (
                  <>
                    {/* 年齢（運営申請のみ） */}
                    {applicationType === "運営申請" && (
                      <Tooltip
                        title={getErrorMessage('age')}
                        open={fieldErrors.age}
                        placement="top"
                        arrow
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                      >
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel id="age-label">年齢 *</InputLabel>
                          <Select
                            labelId="age-label"
                            id="age-select"
                            value={age}
                            label="年齢 *"
                            onChange={(e) => {
                              setAge(e.target.value);
                              if (fieldErrors.age) {
                                setFieldErrors(prev => ({ ...prev, age: false }));
                              }
                            }}
                            onBlur={() => validateField('age', age)}
                            required
                            error={fieldErrors.age}
                            sx={{ borderRadius: 2 }}
                          >
                            {ageOptions.map((ageOption) => (
                              <MenuItem key={ageOption} value={ageOption.toString()}>
                                {ageOption}{typeof ageOption === 'number' ? '歳' : ''}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Tooltip>
                    )}

                    {/* メールアドレス（運営申請・クリエイティブ申請） */}
                    {(applicationType === "運営申請" || applicationType === "クリエイティブ申請") && (
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
                          onBlur={() => validateField('email', email)}
                          fullWidth
                          required
                          error={fieldErrors.email}
                          InputProps={{
                            startAdornment: <Email sx={{ mr: 1, color: '#666' }} />
                          }}
                          sx={{ mb: 3, borderRadius: 2 }}
                        />
                      </Tooltip>
                    )}

                    {/* 住まい（運営申請のみ） */}
                    {applicationType === "運営申請" && (
                      <Tooltip
                        title={getErrorMessage('prefecture')}
                        open={fieldErrors.prefecture}
                        placement="top"
                        arrow
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                      >
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel id="prefecture-label">お住まいの都道府県 *</InputLabel>
                          <Select
                            labelId="prefecture-label"
                            id="prefecture-select"
                            value={prefecture}
                            label="お住まいの都道府県 *"
                            onChange={(e) => {
                              setPrefecture(e.target.value);
                              if (fieldErrors.prefecture) {
                                setFieldErrors(prev => ({ ...prev, prefecture: false }));
                              }
                            }}
                            onBlur={() => validateField('prefecture', prefecture)}
                            required
                            error={fieldErrors.prefecture}
                            sx={{ borderRadius: 2 }}
                          >
                            {prefectures.map((pref) => (
                              <MenuItem key={pref} value={pref}>
                                {pref}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Tooltip>
                    )}

                    {/* 使用端末（運営申請・クリエイティブ申請） */}
                    {(applicationType === "運営申請" || applicationType === "クリエイティブ申請") && (
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
                          onBlur={() => validateField('device', device)}
                          fullWidth
                          required
                          error={fieldErrors.device}
                          placeholder="例：PC、スマートフォン、タブレットなど"
                          InputProps={{
                            startAdornment: <Devices sx={{ mr: 1, color: '#666' }} />
                          }}
                          sx={{ mb: 3, borderRadius: 2 }}
                        />
                      </Tooltip>
                    )}

                    {/* 会社名（入社申請のみ） */}
                    {applicationType === "会社申請" && (
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
                          label="入社したい会社名 *"
                          value={device}
                          onChange={(e) => {
                            setDevice(e.target.value);
                            if (fieldErrors.device) {
                              setFieldErrors(prev => ({ ...prev, device: false }));
                            }
                          }}
                          onBlur={() => validateField('device', device)}
                          fullWidth
                          required
                          error={fieldErrors.device}
                          placeholder="例：AOIRO株式会社"
                          InputProps={{
                            startAdornment: <Business sx={{ mr: 1, color: '#666' }} />
                          }}
                          sx={{ mb: 3, borderRadius: 2 }}
                        />
                      </Tooltip>
                    )}

                    {/* 意志表明（運営申請・会社申請） */}
                    {(applicationType === "運営申請" || applicationType === "会社申請") && (
                      <Tooltip
                        title={getErrorMessage('motivation')}
                        open={fieldErrors.motivation}
                        placement="top"
                        arrow
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                      >
                        <TextField
                          label="意志表明 *"
                          multiline
                          rows={4}
                          value={motivation}
                          onChange={(e) => {
                            setMotivation(e.target.value);
                            if (fieldErrors.motivation) {
                              setFieldErrors(prev => ({ ...prev, motivation: false }));
                            }
                          }}
                          onBlur={() => validateField('motivation', motivation)}
                          fullWidth
                          required
                          error={fieldErrors.motivation}
                          placeholder="志望理由や自己紹介、今後の目標などを詳しくお聞かせください..."
                          InputProps={{
                            startAdornment: <Description sx={{ mr: 1, color: '#666', alignSelf: 'flex-start', mt: 1 }} />
                          }}
                          sx={{ mb: 3, borderRadius: 2 }}
                        />
                      </Tooltip>
                    )}

                    {/* 過去の実績（条件分岐） */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
                        過去の実績
                        {applicationType === "クリエイティブ申請" ? (
                          <span style={{ color: '#d32f2f' }}> *</span>
                        ) : (
                          <span style={{ color: '#666' }}> （任意・画像/動画ファイルを添付）</span>
                        )}
                      </Typography>
                      
                      {!portfolioPreview ? (
                        <Box>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handlePortfolioSelect}
                            style={{ display: 'none' }}
                            id="portfolio-upload"
                          />
                          <label htmlFor="portfolio-upload">
                            <Tooltip
                              title={getErrorMessage('portfolio')}
                              open={fieldErrors.portfolio}
                              placement="top"
                              arrow
                              disableFocusListener
                              disableHoverListener
                              disableTouchListener
                            >
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CameraAlt />}
                                fullWidth
                                sx={{
                                  py: 2,
                                  borderStyle: 'dashed',
                                  borderWidth: 2,
                                  borderColor: fieldErrors.portfolio ? '#d32f2f' : 'grey.300',
                                  color: fieldErrors.portfolio ? '#d32f2f' : 'text.secondary',
                                  '&:hover': {
                                    borderColor: fieldErrors.portfolio ? '#d32f2f' : '#667eea',
                                    backgroundColor: fieldErrors.portfolio ? 'rgba(211, 47, 47, 0.1)' : 'rgba(103, 126, 234, 0.08)',
                                  },
                                }}
                              >
                                ファイルを選択（最大5MB）
                              </Button>
                            </Tooltip>
                          </label>
                        </Box>
                      ) : (
                        <Box sx={{ position: 'relative' }}>
                          {portfolio?.type.startsWith('image/') ? (
                            <Box
                              sx={{
                                width: '100%',
                                maxHeight: 300,
                                border: '2px solid #667eea',
                                borderRadius: 2,
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <img
                                src={portfolioPreview}
                                alt="ポートフォリオプレビュー"
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block',
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                height: 200,
                                border: '2px solid #667eea',
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 1,
                                backgroundColor: 'rgba(103, 126, 234, 0.05)',
                              }}
                            >
                              <PhotoCamera sx={{ fontSize: 48, color: '#667eea' }} />
                              <Typography sx={{ color: '#667eea', fontWeight: 600 }}>
                                {portfolio?.name}
                              </Typography>
                              <Typography sx={{ color: 'text.secondary', fontSize: '14px' }}>
                                動画ファイル
                              </Typography>
                            </Box>
                          )}
                          <IconButton
                            onClick={handlePortfolioRemove}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(244, 67, 54, 0.8)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.9)',
                              },
                            }}
                          >
                            <Delete />
                          </IconButton>
                          <Typography sx={{ mt: 1, color: '#666', fontSize: '14px' }}>
                            ファイル: {portfolio?.name} ({((portfolio?.size || 0) / 1024 / 1024).toFixed(1)}MB)
                          </Typography>
                        </Box>
                      )}
                      
                      {!portfolio && applicationType === "クリエイティブ申請" && fieldErrors.portfolio && (
                        <Typography sx={{ mt: 1, color: '#d32f2f', fontSize: '12px' }}>
                          クリエイティブ申請では証明画像・証明動画のアップロードが必須です
                        </Typography>
                      )}
                    </Box>
                  </>
                )}

                {/* 利用規約および同意事項 */}
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
                  
                  <Typography variant="h6" sx={{ color: '#333', mb: 2, fontSize: '18px', fontWeight: 'bold' }}>
                    1. 実施の目的
                  </Typography>
                  <Typography sx={{ color: '#666', mb: 3, fontSize: '15px', lineHeight: 1.6 }}>
                    AOIROSERVERでは、運営メンバーおよび社員の募集にあたり、信頼性と安全性を確保するため、エントリーシート（ES）の提出およびバックグラウンドチェック（BC）を実施しています。
                    インターネット上では虚偽の情報を用いて活動する例も多く見られるため、応募者の情報が事実に基づいているかを確認し、安心して協力できる環境づくりを目的としています。
                  </Typography>

                  <Typography variant="h6" sx={{ color: '#333', mb: 2, fontSize: '18px', fontWeight: 'bold' }}>
                    2. 実施内容
                  </Typography>
                  <Typography sx={{ color: '#666', mb: 2, fontSize: '15px', lineHeight: 1.6 }}>
                    応募の際には、以下の情報をご提出いただきます：
                  </Typography>
                  <Box component="ul" sx={{ color: '#666', pl: 3, mb: 3, fontSize: '15px', lineHeight: 1.5 }}>
                    <li>Minecraftゲームタグ（ユーザー名）</li>
                    <li>年齢</li>
                    <li>メールアドレス</li>
                    <li>住まい（都道府県）</li>
                    <li>使用端末（例：PC、スマホなど）</li>
                    <li>意志表明（志望理由や自己紹介など）</li>
                    <li>過去の実績（運営歴、スキル、活動内容など）</li>
                  </Box>

                  <Typography variant="h6" sx={{ color: '#333', mb: 2, fontSize: '18px', fontWeight: 'bold' }}>
                    3. 同意事項
                  </Typography>
                  <Box component="ul" sx={{ color: '#666', pl: 3, mb: 3, fontSize: '15px', lineHeight: 1.5 }}>
                    <li>提出した情報が正確かつ事実に基づくものであること</li>
                    <li>提出された情報に基づいて選考・確認を行うこと</li>
                    <li>バックグラウンドチェックの結果により、選考結果が左右される可能性があること</li>
                    <li>提出された情報は選考以外の目的には使用されないこと</li>
                  </Box>

                  <Typography variant="h6" sx={{ color: '#333', mb: 2, fontSize: '18px', fontWeight: 'bold' }}>
                    4. プライバシーについて
                  </Typography>
                  <Typography sx={{ color: '#666', mb: 3, fontSize: '15px', lineHeight: 1.6 }}>
                    提出いただいたすべての情報は、AOIROSERVERが責任を持って適切に管理します。情報は外部に開示されることはなく、選考終了後は一定期間を経て安全に削除または廃棄されます。
                  </Typography>

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
                          onBlur={() => validateField('agreement', agreement)}
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
                      backgroundColor: fieldErrors.agreement ? 'rgba(211, 47, 47, 0.1)' : 'transparent',
                      '& .MuiFormControlLabel-label': {
                        fontSize: '15px',
                        fontWeight: 500
                      }
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
                    onClick={() => router.back()}
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
                    onClick={handleSubmit}
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
                    {loading ? '送信中...' : '提出'}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>


      </Box>
    </Box>
  );
}
