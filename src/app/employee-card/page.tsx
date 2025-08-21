'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Print, 
  Download, 
  QrCode, 
  CreditCard, 
  ContactlessOutlined, 
  Security, 
  VerifiedUser, 
  Business, 
  Person,
  Login,
  Info
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface EmployeeCard {
  id: string;
  user_id: string;
  section_name: string;
  card_number: string;
  issue_date: string;
  expiry_date: string;
  employee_number: string;
  created_at: string;
  updated_at: string;
}

export default function EmployeeCardPage() {
  const router = useRouter();
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [employeeCard, setEmployeeCard] = useState<EmployeeCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkUserAuthorization();
    checkMobileDevice();
  }, []);

  const checkMobileDevice = () => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
  };

  const checkUserAuthorization = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 認証チェック開始...');
      
      // 現在のユーザーを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('❌ ユーザーがログインしていません:', userError);
        setError('AOIRO IDでログインしてください。');
        setLoading(false);
        return;
      }

      if (!user.email) {
        console.log('❌ ユーザーのメールアドレスが取得できません');
        setError('ユーザー情報の取得に失敗しました。');
        setLoading(false);
        return;
      }

      console.log('✅ ユーザー認証成功:', user.email);
      setUser(user);

      // データベース接続テスト
      console.log('🔍 データベース接続テスト開始...');
      
      try {
        // テーブルの存在確認（シンプルな方法）
        const { data: tableCheck, error: tableError } = await supabase
          .from('employee_cards')
          .select('id')
          .limit(1);
        
        console.log('📊 テーブル存在確認:', { tableCheck, tableError });
        
        if (tableError) {
          console.error('❌ テーブルアクセスエラー:', tableError);
          // 権限エラーの場合は、テーブルが存在することを確認
          if (tableError.message.includes('permission denied')) {
            console.log('⚠️ 権限エラー - テーブルは存在するがアクセス権限なし');
            // 権限エラーの場合は処理を続行（テーブルは存在する）
          } else {
            setError(`データベース接続エラー: ${tableError.message}`);
            setLoading(false);
            return;
          }
        }
        
        console.log('✅ テーブルアクセス確認完了');
        
      } catch (dbError) {
        console.error('❌ データベース接続エラー:', dbError);
        setError('データベースに接続できません。');
        setLoading(false);
        return;
      }

      // 既存のAOIRO IDカードを確認
      console.log('🔍 既存のAOIRO IDカードを確認中...');
      
      // 既存のテーブル構造に合わせて、user_idで検索
      const { data: existingCard, error: cardError } = await supabase
        .from('employee_cards')
        .select('*')
        .eq('user_id', user.id)  // user_emailの代わりにuser.idを使用
        .eq('is_active', true)
        .single();

      console.log('📋 社員証明書確認結果:', { existingCard, cardError });

      if (cardError && cardError.code !== 'PGRST116') {
        // PGRST116は「結果が見つからない」エラー（正常）
        console.error('❌ 社員証明書確認エラー:', cardError);
        setError(`社員証明書の確認に失敗しました: ${cardError.message}`);
        setLoading(false);
        return;
      }

      if (existingCard) {
        console.log('✅ 既存のAOIRO IDカードを発見:', existingCard);
        setEmployeeCard(existingCard);
        setLoading(false);
        return;
      }

      // AOIRO IDカードが存在しない場合は自動生成
      console.log('🔄 AOIRO IDカードが存在しません。自動生成を開始...');
      await autoGenerateEmployeeCard(user.id);

    } catch (error) {
      console.error('❌ 認証チェックエラー:', error);
      setError(`認証の確認に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setLoading(false);
    }
  };

  const autoGenerateEmployeeCard = async (userId: string) => {
    try {
      setIsCreating(true);
      console.log('🔧 AOIRO IDカード自動生成開始:', userId);

      // 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('セッションの取得に失敗しました');
      }

      // 自動生成用のデータを準備
      const today = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(today.getFullYear() + 2); // 2年後

      const cardData = {
        user_id: userId,
        section_name: 'メンバー',
        employee_number: `EMP${Date.now().toString().slice(-6)}`, // タイムスタンプベース
        card_number: Date.now().toString().padStart(16, '0'), // 16桁の数字のみ
        issue_date: today.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0]
      };

      console.log('📋 生成するカードデータ:', cardData);

      // APIを呼び出してカードを作成
      const response = await fetch('/api/employee-card/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'カードの生成に失敗しました');
      }

      const result = await response.json();
      console.log('✅ AOIRO IDカード自動生成成功:', result);

      // 生成されたカードを設定
      setEmployeeCard(result.employeeCard);
      setError(null);

    } catch (error) {
      console.error('❌ 自動生成エラー:', error);
      setError(error instanceof Error ? error.message : 'AOIRO IDカードの自動生成に失敗しました。');
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  };

  const toggleCard = () => {
    setIsCardFlipped(!isCardFlipped);
  };

  // ユーザーのアバター画像を取得（デフォルトはユーザーアイコン）
  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    if (user?.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    return null;
  };

  // ユーザーの表示名を取得
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "ユーザー";
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  // 期限切れチェック関数
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          {isCreating ? 'AOIRO IDカードを生成中...' : '読み込み中...'}
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          {/* モダンなアイコン */}
          <Box
            sx={{
              width: 120,
              height: 120,
              mx: 'auto',
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: 0.2,
                zIndex: -1,
                animation: 'pulse 2s infinite'
              }
            }}
          >
            <Security sx={{ fontSize: 60, color: 'white' }} />
          </Box>
          
          {/* タイトル */}
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            AOIRO ID ログインが必要です
          </Typography>
          
          {/* 説明文 */}
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              mb: 4, 
              maxWidth: 500, 
              mx: 'auto',
              lineHeight: 1.6,
              opacity: 0.8
            }}
          >
            AIC（AOIRO ID Card）を表示するには、AOIRO IDでログインしてください。
          </Typography>
          
          {/* アクションボタン */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => router.push('/login')}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '25px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              startIcon={<Login sx={{ fontSize: 24 }} />}
            >
              ログイン
            </Button>
            
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => router.push('/register')}
              sx={{ 
                borderColor: '#667eea',
                color: '#667eea',
                borderRadius: '25px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              startIcon={<Person sx={{ fontSize: 24 }} />}
            >
              新規登録
            </Button>
          </Box>
          
          {/* 追加情報 */}
          <Box sx={{ mt: 6, p: 3, background: 'rgba(102, 126, 234, 0.05)', borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', opacity: 0.8 }}>
              <Info sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
              AICは、AOIROコミュニティのメンバーシップを証明する公式カードです
            </Typography>
          </Box>
        </Box>
        
        {/* CSS アニメーション */}
        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.1); opacity: 0.1; }
            100% { transform: scale(1); opacity: 0.2; }
          }
        `}</style>
      </Container>
    );
  }

  if (!employeeCard) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          証明証
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AOIRO IDカードの生成に失敗しました。
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 3 }}
        >
          再試行
        </Button>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography component="h1" variant="h4" fontWeight="bold" mb={3} sx={{ 
          color: "#0a1a0a",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          letterSpacing: "1px"
        }}>
          証明証
        </Typography>
        <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
          カードをタップすると表裏が反転します
        </Typography>
        
        {/* 反転可能なカード */}
        <Box
          className="card-container"
                      sx={{
              perspective: "1200px",
              width: "100%",
              maxWidth: {
                xs: 320,    // スマホ（320px以上）- より適切なサイズ
                sm: 380,    // 小タブレット（600px以上）
                md: 420,    // 中タブレット（900px以上）
                lg: 420     // PC（1200px以上）
              },
              mx: "auto",
              mb: 4,
              // モバイル端末での3D変換の最適化
              ...(isMobile && {
                perspective: "1000px",
                transformStyle: "preserve-3d",
              })
            }}
        >
          <Box
            onClick={toggleCard}
            sx={{
              position: "relative",
              width: "100%",
              height: {
                xs: 220,    // スマホ（320px以上）
                sm: 240,    // 小タブレット（600px以上）
                md: 260,    // 中タブレット（900px以上）
                lg: 260     // PC（1200px以上）
              },
              cursor: "pointer",
              transformStyle: "preserve-3d",
              transition: "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              "&:hover": {
                transform: isCardFlipped ? "rotateY(180deg) scale(1.02)" : "rotateY(0deg) scale(1.02)",
              },
              // モバイル端末での3D変換の最適化
              ...(isMobile && {
                transformStyle: "preserve-3d",
                willChange: "transform",
              })
            }}
          >
            {/* カードの表側 */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
                borderRadius: 6,
                background: "linear-gradient(135deg, #060146 0%, #0a0a5a 25%, #1a1a6a 50%, #0a0a5a 75%, #060146 100%)",
                color: "white",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 60px rgba(6, 1, 70, 0.4), 0 8px 32px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    conic-gradient(from 180deg at 30% 60%, transparent 0deg, rgba(255,255,255,0.05) 60deg, transparent 120deg),
                    radial-gradient(circle at 30% 60%, rgba(255,255,255,0.08) 0%, transparent 50%),
                    linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.02) 25%, transparent 50%, rgba(255,255,255,0.02) 75%, transparent 100%)
                  `,
                  zIndex: 1
                }
              }}
            >
              {/* 白い幾何学的形状 - メインアクセント */}
              <Box sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "25%",
                  left: "60%",
                  width: "80%",
                  height: "80%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                  clipPath: "polygon(0 0, 100% 0, 60% 100%, 0 100%)",
                  transform: "rotate(45deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* 白い幾何学的形状 - サブアクセント */}
              <Box sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "20%",
                  right: "20%",
                  width: "40%",
                  height: "40%",
                  background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 100%)",
                  clipPath: "polygon(100% 0, 100% 100%, 0 100%, 0 0)",
                  transform: "rotate(-25deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* カードの上部 */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ 
                    width: 0, 
                    height: 0, 
                    borderRight: "10px solid white",
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    opacity: 0.9
                  }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    fontSize: "1.1rem",
                    letterSpacing: "0.5px",
                    color: "#ffffff",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                  }}>
                    AOIRO ID Card
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: 40, 
                  height: 28, 
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <ContactlessOutlined sx={{ fontSize: 18, color: "white" }} />
                </Box>
              </Box>

              {/* カードの中央 */}
              <Box sx={{ textAlign: "center", my: 2, position: "relative", zIndex: 2 }}>
                <Typography variant="body1" sx={{ 
                  opacity: 0.8,
                  fontWeight: 400,
                  letterSpacing: "0.5px",
                  color: "#e0e0e0",
                  mb: 1.5,
                  fontSize: "0.85rem"
                }}>
                  Employee ID Card
                </Typography>
                
                {/* セクション情報 */}
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ 
                    color: "#ffffff",
                    textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                    fontSize: {
                      xs: "1.4rem",    // スマホ（320px以上）
                      sm: "1.6rem",    // 小タブレット（600px以上）
                      md: "1.8rem",    // 中タブレット（900px以上）
                      lg: "1.8rem"     // PC（1200px以上）
                    },
                    opacity: 0.95,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    display: "block",
                    mb: 0.5
                  }}>
                    {employeeCard?.section_name || 'メンバー'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: "#ffffff",
                    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                    fontSize: "0.9rem",
                    opacity: 0.9,
                    letterSpacing: "0.3px",
                    display: "block"
                  }}>
                    セクション
                  </Typography>
                </Box>
              </Box>

              {/* カードの左側 - ユーザーアバターと名前 */}
              <Box sx={{ 
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5
              }}>
                <Avatar
                  src={getUserAvatar() || undefined}
                  alt={getUserDisplayName()}
                  sx={{
                    width: 50,
                    height: 50,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    background: getUserAvatar() ? "transparent" : "rgba(255,255,255,0.2)"
                  }}
                >
                  {!getUserAvatar() && <Person sx={{ fontSize: 25, color: "white" }} />}
                </Avatar>
                <Typography variant="body2" fontWeight="bold" sx={{ 
                  color: "#ffffff",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  maxWidth: 60,
                  lineHeight: 1.2
                }}>
                  {getUserDisplayName()}
                </Typography>
              </Box>

              {/* カードの下部 */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.2)"
                  }}>
                    <CreditCard sx={{ fontSize: 14, color: "white" }} />
                  </Box>
                  <Typography variant="caption" sx={{ 
                    opacity: 0.7,
                    fontWeight: 400,
                    letterSpacing: "0.5px",
                    color: "#cccccc"
                  }}>
                    タップで反転
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  fontWeight="900" 
                  className="aic-text"
                  sx={{ 
                    letterSpacing: "1.2px",
                    color: "white",
                    fontSize: "2.2rem",    // 基本サイズ
                    fontFamily: "'Arial Black', 'Helvetica Black', sans-serif",
                    textShadow: "0 3px 6px rgba(0,0,0,0.6), 0 0 25px rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    zIndex: 1,
                    position: "relative",
                    lineHeight: 1,
                    WebkitTextStroke: "0.8px rgba(255,255,255,0.9)",
                    transform: "skew(-5deg)",
                    fontStyle: "italic",
                    textAlign: "right",
                    // スマホ版での強制サイズ指定
                    "@media (max-width: 600px)": {
                      fontSize: "3.5rem !important"
                    },
                    "@media (max-width: 480px)": {
                      fontSize: "3.8rem !important"
                    },
                    "@media (max-width: 360px)": {
                      fontSize: "4.0rem !important"
                    }
                  }}
                >
                  AIC
                </Typography>
              </Box>
            </Box>

            {/* カードの裏側 */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: 6,
                background: "linear-gradient(135deg, #060146 0%, #0a0a5a 25%, #1a1a6a 50%, #0a0a5a 75%, #060146 100%)",
                color: "white",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 60px rgba(6, 1, 70, 0.4), 0 8px 32px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    conic-gradient(from 180deg at 30% 60%, transparent 0deg, rgba(255,255,255,0.05) 60deg, transparent 120deg),
                    radial-gradient(circle at 30% 60%, rgba(255,255,255,0.08) 0%, transparent 50%),
                    linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.02) 25%, transparent 50%, rgba(255,255,255,0.02) 75%, transparent 100%)
                  `,
                  zIndex: 1
                }
              }}
            >
              {/* 白い幾何学的形状 - メインアクセント（裏側） */}
              <Box sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "25%",
                  left: "55%",
                  width: "70%",
                  height: "70%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                  clipPath: "polygon(0 0, 100% 0, 65% 100%, 0 100%)",
                  transform: "rotate(40deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* 白い幾何学的形状 - サブアクセント（裏側） */}
              <Box sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "15%",
                  right: "25%",
                  width: "35%",
                  height: "35%",
                  background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 100%)",
                  clipPath: "polygon(100% 0, 100% 100%, 0 100%, 0 0)",
                  transform: "rotate(-30deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* 上側 - セクション情報とカード番号 */}
              <Box sx={{ 
                position: "relative", 
                zIndex: 1, 
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 1,
                pt: 1
              }}>
                {/* セクション情報、カード番号、社員番号、有効期限を一つのボックスにまとめる */}
                <Box sx={{ 
                  p: {
                    xs: 1.0,    // スマホ版ではパディングを小さく
                    sm: 1.2,    // 小タブレット
                    md: 1.5,    // 中タブレット以上
                    lg: 1.5     // PC
                  },
                  borderRadius: 3,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  textAlign: "center",
                  width: "90%"
                }}>
                  {/* カード番号を大きく表示 */}
                  <Box sx={{ 
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: {
                      xs: 1.0,    // スマホ版ではマージンを小さく
                      sm: 1.2,    // 小タブレット
                      md: 1.5,    // 中タブレット以上
                      lg: 1.5     // PC
                    }
                  }}>
                    {/* 左側 - カード番号とユーザー名 */}
                    <Box sx={{ flex: 1, textAlign: "center" }}>
                      <Typography variant="caption" sx={{ 
                        display: "block", 
                        color: "#cccccc",
                        fontSize: "0.6rem",
                        opacity: 0.9,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        mb: 0.8,
                        fontWeight: "500"
                      }}>
                        カード番号
                      </Typography>
                      <Typography variant="h6" fontFamily="monospace" sx={{ 
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        lineHeight: 1.3,
                        textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                        letterSpacing: "0.5px",
                        mb: {
                          xs: 0.5,    // スマホ版ではマージンを小さく
                          sm: 0.6,    // 小タブレット
                          md: 0.8,    // 中タブレット以上
                          lg: 0.8     // PC
                        }
                      }}>
                        {employeeCard?.card_number ? 
                          employeeCard.card_number.replace(/(.{4})/g, '$1 ').trim() : 
                          '未設定'
                        }
                      </Typography>
                      
                      {/* 署名欄（白い背景にユーザー名を表示） */}
                      <Box sx={{ 
                        width: "100%",
                        height: {
                          xs: 18,     // スマホ版では高さを小さく
                          sm: 20,     // 小タブレット
                          md: 22,     // 中タブレット以上
                          lg: 22      // PC
                        },
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: 1,
                        border: "1px solid rgba(255,255,255,0.3)",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: {
                          xs: 0.6,    // スマホ版ではパディングを小さく
                          sm: 0.7,    // 小タブレット
                          md: 0.8,    // 中タブレット以上
                          lg: 0.8     // PC
                        }
                      }}>
                        {/* 左辺に「署名」ラベル */}
                        <Typography variant="caption" sx={{ 
                          color: "#060146",
                          fontSize: "0.55rem",
                          fontWeight: "500",
                          letterSpacing: "0.2px"
                        }}>
                          署名
                        </Typography>
                        
                        {/* 中心にユーザー名 */}
                        <Typography variant="body2" sx={{ 
                          color: "#060146",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          letterSpacing: "0.3px",
                          textAlign: "center",
                          flex: 1,
                          fontFamily: "'Segoe UI', 'Yu Gothic', 'Meiryo', 'Hiragino Sans', sans-serif",
                          fontStyle: "italic",
                          transform: "skew(-5deg)",
                          transformOrigin: "center"
                        }}>
                          {getUserDisplayName()}
                        </Typography>
                        
                        {/* 右側のスペーサー（バランス調整用） */}
                        <Box sx={{ width: "18px" }} />
                      </Box>
                    </Box>

                    {/* 右側 - QRコード */}
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid rgba(255,255,255,0.3)",
                      flexShrink: 0,
                      ml: 1,
                      boxShadow: "0 3px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)",
                        zIndex: 0
                      }
                    }}>
                      <QrCode sx={{ 
                        fontSize: 22, 
                        color: "white",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                        zIndex: 1,
                        position: "relative"
                      }} />
                    </Box>
                  </Box>

                  {/* 社員番号、有効期限、セクションを横並びで配置 */}
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    gap: 1.2
                  }}>
                    {/* 社員番号 */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        display: "block", 
                        color: "#cccccc",
                        fontSize: "0.55rem",
                        opacity: 0.9,
                        textTransform: "uppercase",
                        letterSpacing: "0.2px",
                        mb: 0.5,
                        fontWeight: "500"
                      }}>
                        社員番号
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" sx={{ 
                        color: "#ffffff",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        lineHeight: 1.2,
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                      }}>
                        {employeeCard?.employee_number || '未設定'}
                      </Typography>
                    </Box>

                    {/* 有効期限 */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        display: "block", 
                        color: "#cccccc",
                        fontSize: "0.55rem",
                        opacity: 0.9,
                        textTransform: "uppercase",
                        letterSpacing: "0.2px",
                        mb: 0.5,
                        fontWeight: "500"
                      }}>
                        有効期限
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: "#ffffff",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        lineHeight: 1.2,
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                      }}>
                        {employeeCard?.expiry_date ? 
                          new Date(employeeCard.expiry_date).toLocaleDateString('ja-JP', { 
                            month: '2-digit', 
                            year: '2-digit' 
                          }).replace('/', '/') : 
                          '期限未設定'
                        }
                      </Typography>
                    </Box>

                    {/* セクション */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        display: "block", 
                        color: "#cccccc",
                        fontSize: "0.55rem",
                        opacity: 0.9,
                        textTransform: "uppercase",
                        letterSpacing: "0.2px",
                        mb: 0.5,
                        fontWeight: "500"
                      }}>
                        セクション
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: "#ffffff",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        lineHeight: 1.2,
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                      }}>
                        {employeeCard?.section_name || 'メンバー'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* 下側 - 注意事項と連絡先 */}
              <Box sx={{ 
                position: "relative", 
                zIndex: 1,
                mt: {
                  xs: 0.5,    // スマホ版ではマージンを小さく
                  sm: 0.8,    // 小タブレット
                  md: 1,      // 中タブレット以上
                  lg: 1       // PC
                }
              }}>
                {/* 注意事項 */}
                <Box sx={{ 
                  p: {
                    xs: 0.8,    // スマホ版ではパディングを小さく
                    sm: 1.0,    // 小タブレット
                    md: 1.2,    // 中タブレット以上
                    lg: 1.2     // PC
                  },
                  borderRadius: 2,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.06) 100%)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  mb: {
                    xs: 0.8,    // スマホ版ではマージンを小さく
                    sm: 1.0,    // 小タブレット
                    md: 1.2,    // 中タブレット以上
                    lg: 1.2     // PC
                  }
                }}>
                  <Typography variant="caption" sx={{ 
                    display: "block", 
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.55rem",
                    lineHeight: 1.2,
                    textAlign: "center"
                  }}>
                    <strong>注意事項:</strong> 本人以外の使用禁止・有効期限の確認・適切な保管・管理
                  </Typography>
                </Box>

                {/* 連絡先情報 */}
                <Box sx={{ 
                  p: {
                    xs: 0.8,    // スマホ版ではパディングを小さく
                    sm: 1.0,    // 小タブレット
                    md: 1.2,    // 中タブレット以上
                    lg: 1.2     // PC
                  },
                  borderRadius: 2,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  textAlign: "center"
                }}>
                  <Typography variant="caption" sx={{ 
                    display: "block", 
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.55rem",
                    lineHeight: 1.2
                  }}>
                    <strong>お問い合わせ:</strong> AOIROSERVER サポートセンター<br />
                    aoiroserver@gmail.com
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* カード操作ボタン */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            sx={{ 
              borderColor: "#1a2a1a",
              color: "#1a2a1a",
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: "500",
              borderWidth: 1.5,
              "&:hover": {
                borderColor: "#0a1a0a",
                bgcolor: "rgba(26, 42, 26, 0.05)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(10, 26, 10, 0.15)"
              },
              transition: "all 0.3s ease"
            }}
          >
            印刷
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ 
              borderColor: "#1a2a1a",
              color: "#1a2a1a",
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: "500",
              borderWidth: 1.5,
              "&:hover": {
                borderColor: "#0a1a0a",
                bgcolor: "rgba(26, 42, 26, 0.05)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(10, 26, 10, 0.15)"
              },
              transition: "all 0.3s ease"
            }}
          >
            PDF保存
          </Button>
        </Box>

        {/* カード情報サマリー */}
        <Paper sx={{ 
          p: 4, 
          bgcolor: "#fafafa", 
          borderRadius: 3, 
          mb: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <Typography variant="h6" mb={4} sx={{ 
            color: "#0a1a0a", 
            fontWeight: "600", 
            textAlign: "center",
            letterSpacing: "0.5px"
          }}>
            AORO IDカード情報
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                textAlign: "center", 
                p: 3, 
                bgcolor: "white", 
                borderRadius: 3, 
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
                }
              }}>
                <Typography variant="body2" color="textSecondary" mb={2} sx={{ fontWeight: 500, color: "#666" }}>社員番号</Typography>
                <Typography variant="h6" sx={{ 
                  color: "#0a1a0a", 
                  fontWeight: "600"
                }}>
                  {employeeCard?.employee_number || '未設定'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                textAlign: "center", 
                p: 3, 
                bgcolor: "white", 
                borderRadius: 3, 
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
                }
              }}>
                <Typography variant="body2" color="textSecondary" mb={2} sx={{ fontWeight: 500, color: "#666" }}>発行日</Typography>
                <Typography variant="h6" sx={{ 
                  color: "#0a1a0a", 
                  fontWeight: "600"
                }}>
                  {employeeCard?.issue_date ? 
                    new Date(employeeCard.issue_date).toLocaleDateString('ja-JP', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 
                    '未設定'
                  }
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                textAlign: "center", 
                p: 3, 
                bgcolor: "white", 
                borderRadius: 3, 
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
                }
              }}>
                <Typography variant="body2" color="textSecondary" mb={2} sx={{ fontWeight: 500, color: "#666" }}>有効期限</Typography>
                <Typography variant="h6" sx={{ 
                  color: "#0a1a0a", 
                  fontWeight: "600"
                }}>
                  {employeeCard?.expiry_date ? 
                    new Date(employeeCard.expiry_date).toLocaleDateString('ja-JP', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 
                    '未設定'
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}
