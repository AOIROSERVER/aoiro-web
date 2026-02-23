'use client';

import React, { useState, useEffect, useRef } from 'react';
import { keyframes } from '@emotion/react';
import { QRCodeSVG } from 'qrcode.react';

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

// アニメーション用のkeyframes
const pulseKeyframe = keyframes`
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.05); 
  }
`;

const shimmerKeyframe = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

interface EmployeeCard {
  id: string;
  user_id: string;
  user_email?: string; // オプショナルに変更（後方互換性のため）
  section_name: string;
  card_number: string;
  issue_date: string;
  expiry_date: string;
  employee_number: string;
  discord_user_id?: string;
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
  const [progress, setProgress] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  /** GAS（入社申請許可）から取得した所属会社名。あればカードの section 表示に優先使用 */
  const [aicCompanyName, setAicCompanyName] = useState<string | null>(null);

  useEffect(() => {
    checkUserAuthorization();
    checkMobileDevice();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/aic-company', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { companyName?: string | null }) => setAicCompanyName(d.companyName ?? null))
      .catch(() => setAicCompanyName(null));
  }, [user?.id]);

  // プログレスバーの自動更新
  useEffect(() => {
    if (isCreating && progress < 100) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return Math.min(prev + Math.random() * 15, 100);
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isCreating, progress]);

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

      console.log('✅ ユーザー認証成功:', user.id);
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
      const { data: existingCards, error: cardError } = await supabase
        .from('employee_cards')
        .select('*')
        .eq('user_id', user.id)  // user_emailの代わりにuser.idを使用
        .eq('is_active', true);

      const existingCard = existingCards && existingCards.length > 0 ? existingCards[0] : null;

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
        setError(null);
        // 既存カードがある場合は直接カード表示
        setShowCard(true);
        setLoading(false);
        return;
      }

      // AOIRO IDカードが存在しない場合は自動生成
      console.log('🔄 AOIRO IDカードが存在しません。自動生成を開始...');
      // エラー状態をクリアしてからカード生成を開始
      setError(null);
      await autoGenerateEmployeeCard(user.id);

    } catch (error) {
      console.error('❌ 認証チェックエラー:', error);
      setError(`認証の確認に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setLoading(false);
    }
  };

  const autoGenerateEmployeeCard = async (userId: string) => {
    try {
      console.log('🔧 AOIRO IDカード自動生成開始:', userId);
      setIsCreating(true);
      setError(null); // エラー状態をクリア
      setProgress(0); // プログレスをリセット

      // 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('セッションの取得に失敗しました');
      }

      // 自動生成用のデータを準備
      const today = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(today.getFullYear() + 2); // 2年後

      // DiscordユーザーIDを取得
      console.log('🔍 =======[ Discord ID取得プロセス開始 ]=======');
      const discordUserId = await getDiscordUserId(user);
      console.log('🔍 最終的に取得されたDiscordユーザーID:', {
        discordUserId,
        type: typeof discordUserId,
        isNull: discordUserId === null,
        isUndefined: discordUserId === undefined,
        isEmpty: discordUserId === '',
        length: discordUserId ? discordUserId.length : 'N/A'
      });
      console.log('🔍 =======[ Discord ID取得プロセス終了 ]=======');

      const cardData = {
        user_id: userId,
        section_name: 'メンバー',
        employee_number: `EMP${Date.now().toString().slice(-6)}`, // タイムスタンプベース
        card_number: Date.now().toString().padStart(16, '0'), // 16桁の数字のみ
        issue_date: today.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        discord_user_id: discordUserId || null
      };

      console.log('📋 =======[ 送信カードデータ詳細 ]=======');
      console.log('📋 生成するカードデータ:', JSON.stringify(cardData, null, 2));
      console.log('📋 discord_user_id の詳細:', {
        value: cardData.discord_user_id,
        type: typeof cardData.discord_user_id,
        isNull: cardData.discord_user_id === null,
        isUndefined: cardData.discord_user_id === undefined,
        isEmpty: cardData.discord_user_id === ''
      });
      console.log('📋 =======[ 送信カードデータ詳細終了 ]=======');

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
        console.error('❌ API詳細エラー:', errorData);
        const errorMessage = errorData.details 
          ? `${errorData.error}\n詳細: ${errorData.details}\nコード: ${errorData.code || 'N/A'}`
          : errorData.error || 'カードの生成に失敗しました';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ AOIRO IDカード自動生成成功:', result);

      // 生成されたカードを設定
      console.log('✅ カード生成成功 - 状態を更新中:', result.employeeCard);
      setEmployeeCard(result.employeeCard);
      setError(null);
      
      // プログレスバーを100%にしてから、1秒後にカード表示
      setProgress(100);
      console.log('🎯 プログレスバー100%到達 - 1秒後にカード表示開始');
      setTimeout(() => {
        console.log('🎯 カード表示開始');
        setShowCard(true);
        // カード表示後はローディング状態をfalseにして、カード表示画面に移行
        setLoading(false);
        console.log('🎯 ローディング完了 - カード表示画面に移行');
      }, 1000);

    } catch (error) {
      console.error('❌ 自動生成エラー:', error);
      setError(error instanceof Error ? error.message : 'AOIRO IDカードの自動生成に失敗しました。');
      // エラーの場合は直接エラー画面に移行
      setLoading(false);
      setIsCreating(false);
      setShowCard(false);
    } finally {
      console.log('🏁 autoGenerateEmployeeCard完了');
      setIsCreating(false);
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
    if (user?.user_metadata?.username) {
      return user.user_metadata.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return `User_${user?.id?.slice(-6) || 'Unknown'}`;
  };

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  // 期限切れチェック関数
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  // QRコード用のデータを生成
  const generateQRData = () => {
    if (!employeeCard || !user) return '';
    
    // 人が読みやすい形式でQRコードデータを生成
    const qrData = `AIC情報
カード番号: ${employeeCard.card_number || '未設定'}
社員番号: ${employeeCard.employee_number || '未設定'}
発行日: ${formatDate(employeeCard.issue_date)}
有効期限: ${formatDate(employeeCard.expiry_date)}`;
    
    return qrData;
  };

  // DiscordユーザーIDを取得
  const getDiscordUserId = async (user: any): Promise<string | null> => {
    try {
      console.log('🔍 DiscordユーザーID取得開始 - 完全なユーザー情報:', {
        user: user,
        user_metadata: user?.user_metadata,
        app_metadata: user?.app_metadata,
        provider: user?.user_metadata?.provider,
        providers: user?.app_metadata?.providers,
        discord_id: user?.user_metadata?.discord_id,
        discord_username: user?.user_metadata?.discord_username,
        provider_id: user?.user_metadata?.provider_id,
        sub: user?.user_metadata?.sub,
        id: user?.user_metadata?.id,
        username: user?.user_metadata?.username,
        name: user?.user_metadata?.name
      });
      
      // 1. provider_idを最優先でチェック（Discordの実際のユーザーID）
      if (user?.user_metadata?.provider_id) {
        console.log('✅ provider_idからDiscord IDを発見:', user.user_metadata.provider_id);
        return user.user_metadata.provider_id;
      }
      
      // 2. subフィールドをチェック（OAuth標準）
      if (user?.user_metadata?.sub) {
        console.log('✅ subフィールドからDiscord IDを発見:', user.user_metadata.sub);
        return user.user_metadata.sub;
      }
      
      // 3. discord_idフィールドをチェック
      if (user?.user_metadata?.discord_id) {
        console.log('✅ discord_idフィールドからDiscord IDを発見:', user.user_metadata.discord_id);
        return user.user_metadata.discord_id;
      }
      
      // 4. usernameフィールドをチェック（ユーザー名＋識別子形式）
      if (user?.user_metadata?.username) {
        console.log('✅ usernameからDiscord IDを発見:', user.user_metadata.username);
        return user.user_metadata.username;
      }
      
      // 5. nameフィールドをチェック（表示名＋識別子形式）
      if (user?.user_metadata?.name) {
        console.log('✅ nameからDiscord IDを発見:', user.user_metadata.name);
        return user.user_metadata.name;
      }
      
      // 6. Discordプロバイダーで認証されているかチェック
      if (user?.app_metadata?.providers?.includes('discord')) {
        // app_metadataでDiscordプロバイダーが確認された場合の追加チェック
        const possibleId = user?.user_metadata?.id || user?.user_metadata?.user_id;
        if (possibleId) {
          console.log('✅ Discordプロバイダー確認後、IDを発見:', possibleId);
          return possibleId;
        }
      }
      
      console.log('⚠️ DiscordユーザーIDが見つかりません');
      return null;
    } catch (error) {
      console.error('❌ DiscordユーザーID取得エラー:', error);
      return null;
    }
  };





  // デバッグ用のログ出力
  console.log('🔍 現在の状態:', {
    loading,
    error,
    employeeCard: !!employeeCard,
    user: !!user,
    isCreating,
    showCard,
    progress
  });

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          {/* シンプルなアイコン */}
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: '50%',
              boxShadow: '0 8px 24px rgba(26, 26, 46, 0.2)',
              border: '2px solid rgba(255,215,0,0.2)'
            }}
          >
            <CreditCard sx={{ 
              fontSize: 40, 
              color: 'rgba(255,215,0,0.8)'
            }} />
          </Box>
          
          {/* タイトル */}
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 400,
              color: '#1a1a2e',
              mb: 3,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              letterSpacing: '0.05em'
            }}
          >
            {isCreating ? 'AIC カード生成中' : '読み込み中'}
          </Typography>
          
          {/* 説明文 */}
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              mb: 5, 
              maxWidth: 500, 
              mx: 'auto',
              lineHeight: 1.6,
              opacity: 0.7,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 300
            }}
          >
            {isCreating 
              ? 'AOIRO IDカードを生成しています。しばらくお待ちください。'
              : 'データを読み込んでいます。'
            }
          </Typography>
          
          {/* メインプログレスバー */}
          <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', mb: 6 }}>
            <Box
              sx={{
                width: '100%',
                height: 8,
                background: 'rgba(26, 26, 46, 0.1)',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(26, 26, 46, 0.1)'
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #1a1a2e 0%, #533483 50%, #7209b7 100%)',
                  borderRadius: 3,
                  width: `${progress}%`,
                  transition: 'width 0.8s ease-in-out',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '30%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                                              animation: `${shimmerKeyframe} 2s ease-in-out infinite`
                  }
                }}
              />
            </Box>
            
            {/* プログレステキスト */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 2, 
                opacity: 0.7,
                fontSize: '0.9rem',
                fontWeight: 300
              }}
            >
              {progress}% 完了
            </Typography>
          </Box>
          
          {/* ステップインジケーター */}
          {isCreating && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 3, 
              mb: 4,
              opacity: 0.8
            }}>
              {['認証確認', 'データ生成', 'カード作成', '完了'].map((step, index) => {
                const stepProgress = index === 0 ? 25 : index === 1 ? 50 : index === 2 ? 75 : 100;
                const isCompleted = progress >= stepProgress;
                const isCurrent = progress >= stepProgress - 25 && progress < stepProgress;
                const isActive = progress >= stepProgress - 12.5 && progress < stepProgress + 12.5;
                
                return (
                  <Box key={step} sx={{ textAlign: 'center', position: 'relative' }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: isCompleted 
                          ? 'linear-gradient(135deg, #1a1a2e 0%, #533483 100%)' 
                          : isActive 
                            ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.4) 0%, rgba(83, 52, 131, 0.4) 100%)'
                            : 'rgba(26, 26, 46, 0.1)',
                        border: '2px solid',
                        borderColor: isCompleted 
                          ? 'rgba(255,215,0,0.5)' 
                          : isActive 
                            ? 'rgba(255,215,0,0.2)'
                            : 'rgba(26, 26, 46, 0.1)',
                        mb: 1.5,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isCurrent ? 'scale(1.3)' : isActive ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isCurrent 
                          ? '0 0 12px rgba(255,215,0,0.4), 0 0 20px rgba(255,215,0,0.2)' 
                          : isActive 
                            ? '0 0 8px rgba(255,215,0,0.2)'
                            : 'none',
                        ...(isCompleted && {
                          animation: `${pulseKeyframe} 2s ease-in-out infinite`
                        }),
                        ...(isActive && {
                          animation: `${pulseKeyframe} 2s ease-in-out infinite`
                        }),
                        position: 'relative',

                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          borderRadius: '50%',
                          background: isCompleted 
                            ? 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)'
                            : isActive 
                              ? 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)'
                              : 'transparent',
                          zIndex: -1
                        }
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.8rem',
                        color: isCompleted 
                          ? '#1a1a2e' 
                          : isActive 
                            ? '#533483'
                            : 'text.secondary',
                        opacity: isCompleted ? 1 : isActive ? 0.8 : 0.5,
                        fontWeight: isCompleted ? 600 : isActive ? 500 : 300,
                        transition: 'all 0.3s ease',
                        textShadow: isCompleted ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {step}
                    </Typography>
                    
                    {/* 進行中のステップの場合は光る効果を追加 */}
                    {isCurrent && (
                      <Box
                        sx={{
                          position: 'absolute',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
                          animation: `${pulseKeyframe} 1.5s ease-in-out infinite`,
                          zIndex: -1,
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
        
        {/* CSS アニメーション */}
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1); 
            }
            50% { 
              transform: scale(1.05); 
            }
          }
        `}</style>
      </Container>
    );
  }

  if (error) {
    console.log('❌ エラー状態でログイン画面を表示:', { error, user: !!user, employeeCard: !!employeeCard });
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          {/* 高級感のあるアイコン */}
          <Box
            sx={{
              width: 140,
              height: 140,
              mx: 'auto',
              mb: 6,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -20,
                left: -20,
                right: -20,
                bottom: -20,
                background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'golden-glow 3s ease-in-out infinite'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                background: 'conic-gradient(from 0deg, rgba(255,215,0,0.05) 0deg, rgba(192,192,192,0.05) 90deg, rgba(255,215,0,0.05) 180deg, rgba(192,192,192,0.05) 270deg, rgba(255,215,0,0.05) 360deg)',
                borderRadius: '50%',
                animation: 'rotate-slow 8s linear infinite'
              }
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 25px 50px rgba(26, 26, 46, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,215,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,215,0,0.1) 0%, transparent 50%)',
                  animation: 'shimmer-gold 2s ease-in-out infinite'
                }}
              />
              <Security sx={{ 
                fontSize: 70, 
                color: 'rgba(255,215,0,0.9)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }} />
            </Box>
          </Box>
          
          {/* 高級感のあるタイトル */}
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 300,
              color: '#1a1a2e',
              mb: 3,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 2,
                background: 'linear-gradient(90deg, transparent 0%, #7209b7 50%, transparent 100%)',
                borderRadius: 1
              }
            }}
          >
            AOIRO ID
          </Typography>
          
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            sx={{ 
              fontWeight: 400,
              color: '#533483',
              mb: 4,
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              letterSpacing: '0.05em'
            }}
          >
            ログインが必要です
          </Typography>
          
          {/* 上品な説明文 */}
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              mb: 6, 
              maxWidth: 600, 
              mx: 'auto',
              lineHeight: 1.8,
              opacity: 0.7,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 300,
              fontStyle: 'italic'
            }}
          >
            AIC（AOIRO ID Card）を表示するには、<br />
            AOIRO IDでログインしてください。<br />
            <small style={{ color: '#f44336', fontSize: '0.8rem' }}>
              エラー詳細: {error}
            </small>
          </Typography>
          
          {/* 高級感のあるアクションボタン */}
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => router.push('/login')}
              sx={{ 
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '30px',
                px: 5,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 400,
                textTransform: 'none',
                boxShadow: '0 15px 35px rgba(26, 26, 46, 0.3)',
                border: '1px solid rgba(255,215,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)',
                  transition: 'left 0.5s'
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)',
                  boxShadow: '0 20px 45px rgba(26, 26, 46, 0.4)',
                  transform: 'translateY(-3px)',
                  '&::before': {
                    left: '100%'
                  }
                },
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              startIcon={<Login sx={{ fontSize: 26, color: 'rgba(255,215,0,0.9)' }} />}
            >
              ログイン
            </Button>
            
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => router.push('/register')}
              sx={{ 
                borderColor: 'rgba(255,215,0,0.5)',
                color: '#533483',
                borderRadius: '30px',
                px: 5,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 400,
                textTransform: 'none',
                borderWidth: 2,
                background: 'rgba(255,215,0,0.02)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: 'rgba(255,215,0,0.8)',
                  backgroundColor: 'rgba(255,215,0,0.05)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 15px 35px rgba(255,215,0,0.2)'
                },
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              startIcon={<Person sx={{ fontSize: 26 }} />}
            >
              新規登録
            </Button>
          </Box>
          
          {/* 高級感のある追加情報 */}
          <Box sx={{ 
            mt: 8, 
            p: 4, 
            background: 'linear-gradient(135deg, rgba(26,26,46,0.03) 0%, rgba(83,52,131,0.03) 100%)',
            borderRadius: 4,
            maxWidth: 700,
            mx: 'auto',
            border: '1px solid rgba(255,215,0,0.1)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)'
            }
          }}>
            <Typography variant="body1" color="text.secondary" sx={{ 
              textAlign: 'center', 
              opacity: 0.8,
              fontWeight: 300,
              fontSize: '1rem',
              lineHeight: 1.6
            }}>
              <Info sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1.5, color: 'rgba(255,215,0,0.7)' }} />
              AICは、AOIROコミュニティのメンバーシップを証明する公式カードです
            </Typography>
          </Box>
        </Box>
        
        {/* CSS アニメーション */}
        <style jsx>{`
          @keyframes golden-glow {
            0%, 100% { 
              transform: scale(1); 
              opacity: 0.1; 
            }
            50% { 
              transform: scale(1.2); 
              opacity: 0.2; 
            }
          }
          
          @keyframes rotate-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes shimmer-gold {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.2; }
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
          ref={cardRef}
          className="card-container"
                      sx={{
              perspective: "1200px",
              width: "100%",
              maxWidth: {
                xs: 340,    // スマホ（320px以上）- AIC文字との比率を保つ
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
                xs: 235,    // スマホ（320px以上）- AIC文字との比率を保つ
                sm: 250,    // 小タブレット（600px以上）
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
                      xs: "1.6rem",    // スマホ（320px以上）- より大きく
                      sm: "1.8rem",    // 小タブレット（600px以上）- より大きく
                      md: "2.0rem",    // 中タブレット（900px以上）- より大きく
                      lg: "2.2rem"     // PC（1200px以上）- より大きく
                    },
                    opacity: 0.95,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    display: "block",
                    mb: 0.5
                  }}>
                    {aicCompanyName ?? employeeCard?.section_name ?? 'メンバー'}
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



              {/* カードの下部 */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    src={getUserAvatar() || undefined}
                    alt={getUserDisplayName()}
                    sx={{
                      width: 32,
                      height: 32,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      background: getUserAvatar() ? "transparent" : "rgba(255,255,255,0.2)"
                    }}
                  >
                    {!getUserAvatar() && <Person sx={{ fontSize: 18, color: "white" }} />}
                  </Avatar>
                  <Typography variant="body2" fontWeight="bold" sx={{ 
                    color: "#ffffff",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                    fontSize: "0.85rem",
                    lineHeight: 1.2
                  }}>
                    {getUserDisplayName()}
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  fontWeight="900" 
                  className="aic-text"
                  sx={{ 
                    letterSpacing: "1.2px",
                    color: "white",
                    fontSize: "2.8rem",    // 基本サイズを大きく
                    fontFamily: "'Arial Black', 'Helvetica Black', sans-serif",
                    textShadow: "0 3px 6px rgba(0,0,0,0.6), 0 0 25px rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    zIndex: 1,
                    position: "relative",
                    lineHeight: 1,
                    WebkitTextStroke: "0.8px rgba(255,255,255,0.9)",
                    fontStyle: "italic",
                    textAlign: "right",
                    // スマホ版での文字サイズ調整（PC版との比率を保持）
                    "@media (max-width: 600px)": {
                      fontSize: "2.8rem !important",  // スマホ版でより大きく
                      marginRight: "0px !important",  // スマホ版で右に戻す
                      transform: "skew(-5deg) translateY(20px) !important"  // スマホ版でさらに下に移動
                    },
                    "@media (max-width: 480px)": {
                      fontSize: "2.6rem !important",  // より小さな画面でも大きく
                      marginRight: "0px !important",  // 小さな画面でも右に戻す
                      transform: "skew(-5deg) translateY(18px) !important"  // 小さな画面でもさらに下に移動
                    },
                    "@media (max-width: 360px)": {
                      fontSize: "2.4rem !important",  // 最小画面でも大きく
                      marginRight: "0px !important",  // 最小画面でも右に戻す
                      transform: "skew(-5deg) translateY(16px) !important"  // 最小画面でもさらに下に移動
                    },
                    // PC版でもskewを適用
                    "@media (min-width: 601px)": {
                      transform: "skew(-5deg) !important"
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
                      background: "rgba(255,255,255,0.95)",
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
                      p: 0.5
                    }}>
                      {employeeCard && user ? (
                        <QRCodeSVG
                          value={generateQRData()}
                          size={32}
                          level="M"
                          includeMargin={false}
                          bgColor="transparent"
                          fgColor="#1a1a2e"
                        />
                      ) : (
                        <QrCode sx={{ 
                          fontSize: 22, 
                          color: "#1a1a2e",
                          opacity: 0.5
                        }} />
                      )}
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
                        mb: 0.2,
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
                        {aicCompanyName ?? employeeCard?.section_name ?? 'メンバー'}
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

                {/* 指定された画像を表示 */}
                <Box sx={{ 
                  position: "absolute",
                  bottom: {
                    xs: "25%",    // スマホ版でさらに下に移動
                    sm: "25%",    // 小タブレット
                    md: "25%",    // 中タブレット以上（元の位置）
                    lg: "25%"     // PC（元の位置）
                  },
                  left: {
                    xs: 15,       // スマホ版では少し内側に
                    sm: 18,       // 小タブレット
                    md: 20,       // 中タブレット以上（元の位置）
                    lg: 20        // PC（元の位置）
                  },
                  width: {
                    xs: 28,       // スマホ版では少し小さく
                    sm: 36,       // 小タブレット
                    md: 40,       // 中タブレット以上（元のサイズ）
                    lg: 40        // PC（元のサイズ）
                  },
                  height: {
                    xs: 21,       // スマホ版では少し小さく
                    sm: 27,       // 小タブレット
                    md: 30,       // 中タブレット以上（元のサイズ）
                    lg: 30        // PC（元のサイズ）
                  },
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.2)",
                  zIndex: 10,
                  transform: "translateY(50%)"
                }}>
                  <img 
                    src="https://i.imgur.com/jcTripl.png" 
                    alt="AOIRO ID Card"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
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
            AIC情報
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
