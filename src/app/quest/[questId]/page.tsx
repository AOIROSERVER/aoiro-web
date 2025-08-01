"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Container,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  RadioButtonUnchecked,
  Star,
  Schedule,
  Assignment,
  PlayArrow,
  EmojiEvents,
  CameraAlt,
  Image,
  Close,
  Send,
  Login,
} from '@mui/icons-material';
import { getQuestById } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type QuestItem = {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  category: 'daily' | 'weekly' | 'special';
  icon: string;
  background_image?: string;
  tasks?: { id: string; title: string; completed: boolean; }[];
  detailedDescription?: string;
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  start_date?: string;
  end_date?: string;
  created_at?: string;
};

export default function QuestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params.questId as string;
  const [quest, setQuest] = useState<QuestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // 画像選択処理
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください');
        return;
      }

      // 画像ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }

      setSelectedImage(file);

      // プレビュー用のBase64データURL作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像削除処理
  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // クエスト報告送信処理
  const handleSubmitReport = async () => {
    if (!reportMessage.trim()) {
      alert('報告内容を入力してください');
      return;
    }

    if (!user?.email || !user?.user_metadata?.name) {
      alert('ユーザー情報が不足しています');
      return;
    }

    setIsSubmitting(true);

    try {
      // 画像をBase64に変換（必要に応じて）
      let imageData = null;
      let imageFileName = null;

      if (selectedImage) {
        const reader = new FileReader();
        imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedImage);
        });
        imageFileName = selectedImage.name;
      }

      // APIエンドポイントに送信
      const response = await fetch('/api/quest-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questId: questId,
          questTitle: quest?.title || 'Unknown Quest',
          userName: user.user_metadata.name,
          userEmail: user.email,
          reportMessage: reportMessage,
          imageData: imageData,
          imageFileName: imageFileName,
        }),
      });

      if (response.ok) {
        alert('クエスト報告を送信しました！');
        setShowReportDialog(false);
        setReportMessage('');
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        const errorData = await response.json();
        alert(`送信に失敗しました: ${errorData.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('クエスト報告送信エラー:', error);
      alert('送信に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchQuest = async () => {
      try {
        console.log('🔍 クエスト詳細を取得中:', questId);
        
        // 実際のSupabaseからクエストを取得
        const questData = await getQuestById(questId);
        
        if (questData) {
          console.log('✅ クエスト詳細取得成功:', {
            title: questData.title,
            background_image: questData.background_image || 'なし'
          });
          
          // 期限切れチェック（More画面と統一）
          const isQuestExpired = (quest: any) => {
            if (!quest?.end_date) return false; // 期限が設定されていない場合は期限切れではない
            
            const now = new Date();
            const endDate = new Date(quest.end_date);
            
            // 終了日は23:59:59まで有効（秒単位での正確な判定）
            endDate.setHours(23, 59, 59, 999);
            
            return now > endDate;
          };
          
          const isExpired = isQuestExpired(questData);

          if (isExpired) {
            console.log('⏰ クエスト詳細: 期限切れクエストです:', questData.title, '期限:', questData.end_date);
            console.log('🔄 More画面にリダイレクト中...');
            router.push('/more');
            return;
          }

          // QuestItemに変換
          const questItem: QuestItem = {
            id: questData.id,
            title: questData.title,
            description: questData.description,
            reward: questData.reward,
            progress: 0, // TODO: ユーザーの進行状況を取得
            maxProgress: questData.tasks?.length || 1,
            completed: false, // TODO: ユーザーの完了状況を取得
            category: questData.category as any,
            icon: questData.icon || 'assignment',
            background_image: questData.background_image,
            tasks: questData.tasks?.map(task => ({
              id: task.id,
              title: task.title,
              completed: false, // TODO: ユーザーのタスク完了状況を取得
            })),
            detailedDescription: questData.detailed_description,
            estimatedTime: questData.estimated_time,
            difficulty: questData.difficulty as any,
            start_date: questData.start_date,
            end_date: questData.end_date,
            created_at: questData.created_at,
          };
          
          setQuest(questItem);
        } else {
          console.log('❌ クエストが見つかりません:', questId);
        }
      } catch (error) {
        console.error('❌ クエスト詳細取得エラー:', error);
        
        // フォールバック: モッククエストデータ
        console.log('🔄 フォールバック: モッククエストデータを使用');
        const mockQuests: QuestItem[] = [
      {
        id: '1',
        title: '初回ログイン',
        description: 'システムに初めてログインしよう',
        detailedDescription: 'アプリケーションにアカウントを作成して初回ログインを完了することで、システムの基本機能にアクセスできるようになります。この重要な第一歩を踏み出しましょう！',
        reward: '100ポイント',
        progress: 1,
        maxProgress: 1,
        completed: true,
        category: 'daily',
        icon: 'login',
        estimatedTime: '5分',
        difficulty: 'easy',
        background_image: 'https://picsum.photos/800/400?random=login',
        tasks: [
          { id: '1-1', title: 'アカウント作成', completed: true },
          { id: '1-2', title: 'ログイン完了', completed: true },
        ]
      },
      {
        id: '2',
        title: '路線情報チェック',
        description: '電車の運行状況を3回確認しよう',
        detailedDescription: '電車の運行状況を定期的にチェックすることで、遅延や運休の情報をいち早くキャッチできます。通勤・通学の効率化に役立てましょう。',
        reward: '50ポイント',
        progress: 2,
        maxProgress: 3,
        completed: false,
        category: 'daily',
        icon: 'train',
        estimatedTime: '10分',
        difficulty: 'easy',
        background_image: 'https://picsum.photos/800/400?random=train',
        tasks: [
          { id: '2-1', title: '運行状況を確認 (1回目)', completed: true },
          { id: '2-2', title: '運行状況を確認 (2回目)', completed: true },
          { id: '2-3', title: '運行状況を確認 (3回目)', completed: false },
        ]
      },
      {
        id: '3',
        title: 'プロフィール設定',
        description: 'プロフィール情報を完成させよう',
        detailedDescription: 'プロフィール情報を設定することで、パーソナライズされたサービスを受けることができます。お好みの設定でカスタマイズしましょう。',
        reward: '200ポイント',
        progress: 0,
        maxProgress: 1,
        completed: false,
        category: 'special',
        icon: 'person',
        estimatedTime: '15分',
        difficulty: 'medium',
        background_image: 'https://picsum.photos/800/400?random=profile',
        tasks: [
          { id: '3-1', title: 'プロフィール画像設定', completed: false },
          { id: '3-2', title: '基本情報入力', completed: false },
          { id: '3-3', title: '設定保存', completed: false },
        ]
      },
        ];

        const foundQuest = mockQuests.find(q => q.id === questId);
        console.log('🔍 フォールバック クエスト詳細:', {
          questId,
          foundQuest: foundQuest ? foundQuest.title : 'なし',
          background_image: foundQuest?.background_image || 'なし'
        });
        setQuest(foundQuest || null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuest();
  }, [questId, router]);

  // リアルタイムで期限切れをチェック
  useEffect(() => {
    if (!quest) return;

    const checkExpired = () => {
      const isQuestExpired = (quest: any) => {
        if (!quest?.end_date) return false;
        
        const now = new Date();
        const endDate = new Date(quest.end_date);
        endDate.setHours(23, 59, 59, 999);
        
        return now > endDate;
      };

      if (isQuestExpired(quest)) {
        console.log('⏰ リアルタイム: クエストが期限切れになりました:', quest.title);
        router.push('/more');
      }
    };

    // 初回チェック
    checkExpired();

    // 1分ごとにチェック
    const intervalId = setInterval(() => {
      console.log('🔍 リアルタイム期限チェック実行中...');
      checkExpired();
    }, 60 * 1000);

    // ページフォーカス時にもチェック
    const handleFocus = () => {
      console.log('👁️ ページフォーカス復帰 - 期限チェック');
      checkExpired();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus();
      }
    });

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [quest, router]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily':
        return '#4A90E2';
      case 'weekly':
        return '#7B68EE';
      case 'special':
        return '#FF6B6B';
      default:
        return '#4A90E2';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#4CAF50';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '簡単';
      case 'medium':
        return '普通';
      case 'hard':
        return '難しい';
      default:
        return '簡単';
    }
  };

  const getQuestIcon = (iconType: string) => {
    switch (iconType) {
      case 'login':
        return <Assignment />;
      case 'train':
        return <Assignment />;
      case 'person':
        return <Assignment />;
      default:
        return <Assignment />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            クエスト詳細
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!quest) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            クエスト詳細
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            クエストが見つかりません
          </Typography>
        </Box>
      </Container>
    );
  }

  const categoryColor = getCategoryColor(quest.category);
  
  // 期限ベースの進行率を計算するヘルパー関数（More画面と統一）
  const calculateDeadlineProgress = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) {
      console.log('⚠️ 期限情報なし - デフォルト値を使用');
      return { progress: 0, isExpired: false, timeLeft: '', endDate: new Date() };
    }

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 終了日は23:59:59まで有効
    
    // 日付の妥当性チェック
    if (start >= end) {
      return { progress: 0, isExpired: false, timeLeft: '期限設定エラー', endDate: end };
    }

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    console.log('📅 詳細画面: 期限データを使用:', {
      startDate: start.toLocaleDateString(),
      endDate: end.toLocaleDateString(),
      progress: Math.round((elapsed / totalDuration) * 100)
    });
    
    // 開始前の場合
    if (elapsed < 0) {
      const timeUntilStart = Math.abs(elapsed);
      const daysUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60 * 24));
      return { 
        progress: 0, 
        isExpired: false, 
        timeLeft: `開始まであと${daysUntilStart}日`,
        endDate: end
      };
    }
    
    // 期限後の場合
    if (now > end) {
      const overdue = now.getTime() - end.getTime();
      const daysOverdue = Math.floor(overdue / (1000 * 60 * 60 * 24));
      return { 
        progress: 100, 
        isExpired: true, 
        timeLeft: `期限切れ（${daysOverdue}日経過）`,
        endDate: end
      };
    }
    
    // 期間中の場合
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const remaining = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(remaining / (1000 * 60 * 60));
    
    let timeLeftText = '';
    if (daysLeft > 1) {
      timeLeftText = `あと${daysLeft}日`;
    } else if (daysLeft === 1) {
      timeLeftText = `あと1日`;
    } else if (hoursLeft > 1) {
      timeLeftText = `あと${hoursLeft}時間`;
    } else {
      timeLeftText = `まもなく期限`;
    }
    
    return { 
      progress: progressPercent, 
      isExpired: false, 
      timeLeft: timeLeftText,
      endDate: end
    };
  };
  
  const deadlineInfo = calculateDeadlineProgress(quest.start_date, quest.end_date);
  const deadlineProgressPercentage = deadlineInfo.progress;
  
  // 日付フォーマット関数
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* ヘッダー */}
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" color="#212529">
            クエスト詳細
          </Typography>
        </Box>
      </Container>

      {/* ヒーロー画像セクション */}
      {quest.background_image && (
        <Box
          sx={{
            height: 400,
            backgroundImage: `url(${quest.background_image})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#f0f0f0',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            mb: 3,
          }}
        >
          {/* グラデーションオーバーレイ */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
            }}
          />
          
          {/* ヒーロー情報 */}
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                label={quest.category.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: categoryColor,
                  color: 'white',
                  fontWeight: 'bold',
                  mr: 2,
                }}
              />
              <Chip
                label={getDifficultyLabel(quest.difficulty || 'easy')}
                size="small"
                sx={{
                  backgroundColor: getDifficultyColor(quest.difficulty || 'easy'),
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
              {quest.completed && (
                <Box
                  sx={{
                    ml: 2,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                </Box>
              )}
            </Box>
            
            <Typography
              variant="h3"
              fontWeight="bold"
              color="white"
              sx={{
                textShadow: '0px 0px 8px rgba(0,0,0,0.8), 0px 2px 4px rgba(0,0,0,0.6)',
                mb: 1,
                lineHeight: 1.2,
              }}
            >
              {quest.title}
            </Typography>
            
            <Typography
              variant="h6"
              color="rgba(255,255,255,0.9)"
              sx={{
                textShadow: '0px 0px 6px rgba(0,0,0,0.7), 0px 1px 3px rgba(0,0,0,0.5)',
                mb: 2,
              }}
            >
              {quest.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star sx={{ color: '#FFD700', fontSize: 20, mr: 1 }} />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="white"
                  sx={{
                    textShadow: '0px 0px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {quest.reward}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 20, mr: 1 }} />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="white"
                  sx={{
                    textShadow: '0px 0px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  約{quest.estimatedTime}
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      <Container maxWidth="md" sx={{ pb: 8 }}>
        {/* メインカード */}
        {/* ヒーロー画像がない場合のヘッダー */}
        {!quest.background_image && (
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%)`,
              border: `3px solid ${categoryColor}30`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <Box
              sx={{
                height: 6,
                backgroundColor: categoryColor,
              }}
            />
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 3,
                    backgroundColor: categoryColor,
                    fontSize: 32,
                  }}
                >
                  {getQuestIcon(quest.icon)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Chip
                      label={quest.category.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: categoryColor,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    <Chip
                      label={getDifficultyLabel(quest.difficulty || 'easy')}
                      size="small"
                      sx={{
                        backgroundColor: getDifficultyColor(quest.difficulty || 'easy'),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    {quest.completed && (
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          ml: 1,
                        }}
                      >
                        <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    )}
                  </Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="#1f2937"
                    sx={{ lineHeight: 1.2 }}
                  >
                    {quest.title}
                  </Typography>
                </Box>
              </Box>
              
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                {quest.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Star sx={{ color: '#FFD700', fontSize: 20, mr: 1 }} />
                  <Typography variant="body2" fontWeight="bold" color="#374151">
                    {quest.reward}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ color: '#666', fontSize: 20, mr: 1 }} />
                  <Typography variant="body2" fontWeight="bold" color="#374151">
                    約{quest.estimatedTime}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        )}

        {/* 詳細カード */}
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ p: 4 }}>
            {/* 詳細説明 */}
            <Typography
              variant="h6"
              fontWeight="bold"
              color="#374151"
              sx={{ mb: 2 }}
            >
              詳細説明
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 3,
                lineHeight: 1.6,
                fontSize: 16,
              }}
            >
              {quest.detailedDescription || quest.description}
            </Typography>

          {/* 期限進行度セクション */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="#374151"
                sx={{
                  ...(quest.background_image && {
                    textShadow: '0px 0px 3px rgba(255,255,255,0.9)',
                  }),
                }}
              >
                期限進行度
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color={deadlineProgressPercentage >= 100 ? '#F44336' : categoryColor}
                sx={{
                  ...(quest.background_image && {
                    textShadow: '0px 0px 3px rgba(255,255,255,0.9)',
                  }),
                }}
              >
                {Math.round(deadlineProgressPercentage)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(deadlineProgressPercentage, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: quest.background_image ? 'rgba(229, 231, 235, 0.7)' : '#e5e7eb',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: deadlineProgressPercentage >= 100 ? '#F44336' : categoryColor,
                  borderRadius: 4,
                },
                ...(quest.background_image && {
                  boxShadow: '0px 0px 4px rgba(0,0,0,0.2)',
                }),
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 0.5,
                display: 'block',
                textAlign: 'right',
                ...(quest.background_image && {
                  textShadow: '0px 0px 3px rgba(255,255,255,0.9)',
                }),
              }}
            >
              {deadlineProgressPercentage >= 100 ? '期限切れ' : `期限まで残り${Math.round(100 - deadlineProgressPercentage)}%`}
            </Typography>
          </Box>

          {/* 期限終了日表示 */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="#374151"
              sx={{
                mb: 1,
                ...(quest.background_image && {
                  textShadow: '0px 0px 3px rgba(255,255,255,0.9)',
                }),
              }}
            >
              期限終了日
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: deadlineInfo.isExpired ? '#FFEBEE' : '#F3F4F6',
              border: deadlineInfo.isExpired ? '1px solid #FFCDD2' : '1px solid #E5E7EB'
            }}>
              <Schedule sx={{ 
                color: deadlineInfo.isExpired ? '#F44336' : '#666', 
                fontSize: 20, 
                mr: 1 
              }} />
              <Typography
                variant="body2"
                fontWeight="bold"
                color={deadlineInfo.isExpired ? '#F44336' : '#374151'}
              >
                {formatDate(deadlineInfo.endDate)}
                {deadlineInfo.isExpired && (
                  <Typography 
                    component="span" 
                    color="#F44336" 
                    sx={{ ml: 1, fontSize: '0.8em' }}
                  >
                    (期限切れ)
                  </Typography>
                )}
              </Typography>
            </Box>
          </Box>

          {/* 詳細情報 */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Star sx={{ color: '#FFD700', fontSize: 20, mr: 1 }} />
              <Typography
                variant="body2"
                fontWeight="bold"
                color="#374151"
                sx={{
                  ...(quest.background_image && {
                    textShadow: '0px 0px 3px rgba(255,255,255,0.9)',
                  }),
                }}
              >
                {quest.reward}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Schedule sx={{ color: '#666', fontSize: 20, mr: 1 }} />
              <Typography
                variant="body2"
                fontWeight="bold"
                color="#374151"
                sx={{
                  ...(quest.background_image && {
                    textShadow: '0px 0px 3px rgba(255,255,255,0.9)',
                  }),
                }}
              >
                約{quest.estimatedTime}
              </Typography>
            </Box>
            <Chip
              label={getDifficultyLabel(quest.difficulty || 'easy')}
              size="small"
              sx={{
                backgroundColor: getDifficultyColor(quest.difficulty || 'easy'),
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* タスクリスト */}
      {quest.tasks && quest.tasks.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="#374151" sx={{ mb: 2 }}>
              タスクリスト
            </Typography>
            <List sx={{ p: 0 }}>
              {quest.tasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {task.completed ? (
                        <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                      ) : (
                        <RadioButtonUnchecked sx={{ color: '#ccc', fontSize: 20 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      primaryTypographyProps={{
                        style: {
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? '#666' : '#374151',
                          fontWeight: 500,
                        },
                      }}
                    />
                  </ListItem>
                  {index < quest.tasks.length - 1 && (
                    <Divider sx={{ ml: 4 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Card>
      )}

      {/* アクションボタン */}
      <Box sx={{ textAlign: 'center' }}>
        {quest.completed ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<EmojiEvents />}
            sx={{
              backgroundColor: '#4CAF50',
              px: 4,
              py: 1.5,
              borderRadius: 3,
              fontSize: 16,
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                backgroundColor: '#45a049',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
              },
            }}
          >
            完了済み
          </Button>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={user ? <Send /> : <Login />}
            disabled={!user}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: user ? categoryColor : '#ccc',
              color: 'white',
              boxShadow: user ? `0 8px 20px ${categoryColor}30` : '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: user ? categoryColor : '#ccc',
                filter: user ? 'brightness(0.9)' : 'none',
                transform: user ? 'translateY(-2px)' : 'none',
                boxShadow: user ? `0 6px 16px ${categoryColor}40` : '0 4px 12px rgba(0,0,0,0.1)',
              },
              '&:active': {
                filter: user ? 'brightness(0.9)' : 'none',
                transform: user ? 'translateY(-2px)' : 'none',
                boxShadow: user ? `0 6px 16px ${categoryColor}40` : '0 4px 12px rgba(0,0,0,0.1)',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                color: 'white',
                cursor: 'not-allowed',
              },
            }}
            onClick={() => {
              if (user) {
                setShowReportDialog(true);
              }
            }}
          >
            {user ? 'クエストを報告' : 'ログインして報告'}
          </Button>
        )}
      </Box>
      </Container>

      {/* クエスト報告ダイアログ */}
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Send sx={{ mr: 1, color: categoryColor }} />
              <Typography variant="h6" fontWeight="bold">
                クエスト報告
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowReportDialog(false)}
              sx={{ p: 1 }}
            >
              <Close />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            「{quest?.title}」の完了を報告します
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 報告内容入力 */}
            <TextField
              label="完了報告内容"
              multiline
              rows={4}
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="クエストを完了しました。証拠画像も添付します。"
              required
              fullWidth
              variant="outlined"
            />

            {/* 画像選択 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                証拠画像（任意）
              </Typography>
              
              {!imagePreview ? (
                <Box>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CameraAlt />}
                      fullWidth
                      sx={{
                        py: 2,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: 'grey.300',
                        color: 'text.secondary',
                        '&:hover': {
                          borderColor: categoryColor,
                          backgroundColor: `${categoryColor}08`,
                        },
                      }}
                    >
                      画像を選択（最大5MB）
                    </Button>
                  </label>
                </Box>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      backgroundImage: `url(${imagePreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 2,
                      border: `2px solid ${categoryColor}40`,
                    }}
                  />
                  <IconButton
                    onClick={handleImageRemove}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                      },
                    }}
                  >
                    <Close />
                  </IconButton>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                    }}
                  >
                    <Image sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {selectedImage?.name}
                  </Box>
                </Box>
              )}
            </Box>

            {/* 注意事項 */}
            <Alert severity="info">
              報告内容と画像は管理者に送信され、確認後にポイントが付与されます。
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowReportDialog(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmitReport}
            variant="contained"
            disabled={isSubmitting || !reportMessage.trim()}
            sx={{
              backgroundColor: categoryColor,
              '&:hover': {
                backgroundColor: categoryColor,
                filter: 'brightness(0.9)',
              },
            }}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )
            }
          >
            {isSubmitting ? '送信中...' : '報告を送信'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}