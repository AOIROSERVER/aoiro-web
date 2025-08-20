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
  Person 
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

  useEffect(() => {
    checkUserAuthorization();
  }, []);

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

  const toggleCard = () => setIsCardFlipped(!isCardFlipped);

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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mr: 2 }}
        >
          再試行
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/login')}
        >
          ログイン画面へ
        </Button>
      </Container>
    );
  }

  if (!employeeCard) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          証明書
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
          証明書
        </Typography>
        <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
          カードをタップすると表裏が反転します
        </Typography>
        
        {/* 反転可能なカード */}
        <Box
          sx={{
            perspective: "1200px",
            width: "100%",
            maxWidth: 420,
            mx: "auto",
            mb: 4
          }}
        >
          <Box
            onClick={toggleCard}
            sx={{
              position: "relative",
              width: "100%",
              height: 260,
              cursor: "pointer",
              transformStyle: "preserve-3d",
              transition: "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              "&:hover": {
                transform: isCardFlipped ? "rotateY(180deg) scale(1.02)" : "rotateY(0deg) scale(1.02)",
              }
            }}
          >
            {/* カードの表側 */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                borderRadius: 6,
                background: "linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 25%, #2a3a2a 50%, #1a2a1a 75%, #0a1a0a 100%)",
                color: "white",
                p: 3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 60px rgba(10, 26, 10, 0.4), 0 8px 32px rgba(0,0,0,0.3)",
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
                    conic-gradient(from 0deg at 70% 40%, transparent 0deg, rgba(255,255,255,0.08) 60deg, transparent 120deg),
                    radial-gradient(circle at 70% 40%, rgba(255,255,255,0.15) 0%, transparent 50%),
                    linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)
                  `,
                  zIndex: 1
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  right: "-50%",
                  bottom: "-50%",
                  background: `
                    linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%),
                    linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)
                  `,
                  zIndex: 0
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
                zIndex: 1,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "30%",
                  left: "60%",
                  width: "80%",
                  height: "80%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
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
                  background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 100%)",
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
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "10px solid white",
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
                    fontSize: "1.8rem",
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
                    :セクション
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
                    border: "2px solid rgba(255,255,255,0.3)",
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
                  sx={{ 
                    letterSpacing: "1.2px",
                    color: "white",
                    fontSize: "2.2rem",
                    fontFamily: "'Arial Black', 'Helvetica Black', sans-serif",
                    textShadow: "0 3px 6px rgba(0,0,0,0.6), 0 0 25px rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    zIndex: 1,
                    position: "relative",
                    lineHeight: 1,
                    WebkitTextStroke: "0.8px rgba(255,255,255,0.9)",
                    transform: "skew(-5deg)",
                    fontStyle: "italic",
                    textAlign: "right"
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
                background: "linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 25%, #2a3a2a 50%, #1a2a1a 75%, #0a1a0a 100%)",
                color: "white",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 60px rgba(10, 26, 10, 0.4), 0 8px 32px rgba(0,0,0,0.3)",
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
                    radial-gradient(circle at 30% 60%, rgba(255,255,255,0.08) 0%, transparent 50%)
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
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
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

              {/* 中央 - セクション情報 */}
              <Box sx={{ 
                position: "relative", 
                zIndex: 1, 
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 1
              }}>
                <Box sx={{ 
                  p: 1.5,
                  borderRadius: 1.5,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  textAlign: "center",
                  width: "90%"
                }}>
                  <Typography variant="caption" sx={{ 
                    display: "block", 
                    color: "#cccccc",
                    fontSize: "0.65rem",
                    mb: 1,
                    lineHeight: 1.1
                  }}>
                    このカードはAOIROSERVERが発行するAOIRO IDカードです
                  </Typography>
                  
                  {/* セクション情報 - より目立つデザイン */}
                  <Box sx={{ 
                    p: 1,
                    borderRadius: 1.5,
                    background: "rgba(255,255,255,0.15)",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                  }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ 
                      color: "#ffffff",
                      fontSize: "0.9rem",
                      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                      letterSpacing: "0.3px"
                    }}>
                      {employeeCard?.section_name || 'セクション未設定'}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      display: "block", 
                      color: "#e0e0e0",
                      fontSize: "0.6rem",
                      mt: 0.3,
                      opacity: 0.9
                    }}>
                      {employeeCard?.section_name ? 'Section' : 'Not Set'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* 下部 - カード番号と有効期限 */}
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-end",
                  p: 1.2,
                  borderRadius: 1.5,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      display: "block", 
                      color: "#cccccc",
                      fontSize: "0.6rem",
                      mb: 0.4
                    }}>
                      カード番号
                    </Typography>
                    <Typography variant="h6" fontFamily="monospace" sx={{ 
                      letterSpacing: 0.3,
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: "0.8rem",
                      mb: 0.8
                    }}>
                      {employeeCard?.card_number || 'カード番号未設定'}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ 
                          display: "block", 
                          color: "#cccccc",
                          fontSize: "0.6rem"
                        }}>
                          有効期限
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ 
                          color: "#ffffff",
                          fontSize: "0.75rem"
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
                      <Box>
                        <Typography variant="caption" sx={{ 
                          display: "block", 
                          color: "#cccccc",
                          fontSize: "0.6rem"
                        }}>
                          社員番号
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ 
                          color: "#ffffff",
                          fontSize: "0.75rem"
                        }}>
                          {employeeCard?.employee_number || '社員番号未設定'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.2)",
                    flexShrink: 0,
                    ml: 1.2
                  }}>
                    <QrCode sx={{ fontSize: 28, color: "white" }} />
                  </Box>
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
