"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  IconButton,
  Container,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack,
  Add,
  Delete,
  Save,
  Preview,
  Star,
  Schedule,
  Assignment,
  CloudUpload,
  Image,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { createQuest, checkDatabaseTables } from "@/lib/supabase";
// DatePickerパッケージがインストールされていない場合はコメントアウト
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { ja } from 'date-fns/locale';

type TaskItem = {
  id: string;
  title: string;
};

type QuestFormData = {
  title: string;
  subtitle: string;
  description: string;
  detailedDescription: string;
  category: 'daily' | 'weekly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard';
  reward: string;
  estimatedTime: string;
  startDate: Date | null;
  endDate: Date | null;
  tasks: TaskItem[];
  icon: string;
  backgroundImage: string | undefined;
};

const iconOptions = [
  { value: 'login', label: 'ログイン', icon: '🔑' },
  { value: 'train', label: '電車', icon: '🚆' },
  { value: 'profile', label: 'プロフィール', icon: '👤' },
  { value: 'notification', label: '通知', icon: '🔔' },
  { value: 'explore', label: '探索', icon: 'ℹ️' },
  { value: 'assignment', label: 'タスク', icon: '📝' },
];

export default function QuestCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<QuestFormData>({
    title: '',
    subtitle: '',
    description: '',
    detailedDescription: '',
    category: 'daily',
    difficulty: 'easy',
    reward: '',
    estimatedTime: '',
    startDate: null,
    endDate: null,
    tasks: [],
    icon: 'assignment',
    backgroundImage: undefined,
  });
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSupremeAdmin, setIsSupremeAdmin] = useState(false);

  // カテゴリの色を取得
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

  // 難易度の色を取得
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

  // タスクを追加
  // 最高権限者チェック（クライアントサイドでのみ実行）
  useEffect(() => {
    const checkSupremeAdmin = () => {
      if (typeof window !== 'undefined') {
        setIsSupremeAdmin(localStorage.getItem('admin') === 'true');
      }
    };
    
    checkSupremeAdmin();
  }, []);

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: TaskItem = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
      };
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
      setNewTaskTitle('');
    }
  };

  // タスクを削除
  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  };

  // フォームデータを更新
  const updateFormData = (field: keyof QuestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 画像ファイルを選択
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズは10MB以下にしてください');
        return;
      }

      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }

      setImageFile(file);

      // プレビュー用のDataURLを作成
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        updateFormData('backgroundImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像を削除
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    updateFormData('backgroundImage', undefined);
  };

  // データベース状況をチェック
  const checkDatabaseStatus = async () => {
    try {
      console.log('🔍 データベース状況チェック開始...');
      const result = await checkDatabaseTables();
      
      let message = '📊 データベース状況:\n\n';
      message += `• questsテーブル: ${result.questsTable ? '✅ 正常' : '❌ エラー'}\n`;
      message += `• quest_tasksテーブル: ${result.tasksTable ? '✅ 正常' : '❌ エラー'}\n\n`;
      
      if (!result.questsTable || !result.tasksTable) {
        message += '❌ 問題が見つかりました:\n';
        if (result.errors.questsError) {
          message += `• questsエラー: ${result.errors.questsError.message}\n`;
        }
        if (result.errors.tasksError) {
          message += `• tasksエラー: ${result.errors.tasksError.message}\n`;
        }
        message += '\n対策: SQL migrationを適用してください。';
      } else {
        message += '✅ 全て正常です！';
      }
      
      alert(message);
    } catch (error) {
      console.error('データベースチェックエラー:', error);
      alert(`データベースチェック中にエラーが発生しました:\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // クエストを保存
  const saveQuest = async () => {
    // バリデーション
    if (!formData.title || !formData.description || !formData.reward) {
      alert('必須項目を入力してください');
      return;
    }

    try {
      // Supabaseにクエストを保存
      const questData = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        detailed_description: formData.detailedDescription,
        category: formData.category,
        difficulty: formData.difficulty,
        reward: formData.reward,
        estimated_time: formData.estimatedTime,
        icon: formData.icon,
        background_image: formData.backgroundImage,
        start_date: formData.startDate ? formData.startDate.toISOString().split('T')[0] : null,
        end_date: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
        tasks: formData.tasks.map(task => ({ title: task.title }))
      };

      console.log('🎮 クエスト作成データ:', {
        ...questData,
        background_image: questData.background_image ? 'あり' : 'なし'
      });

      const result = await createQuest(questData);
      
      if (result) {
        console.log('✅ クエストが作成されました:', result);
        console.log('📷 背景画像:', result.background_image ? 'あり' : 'なし');
        
        // 成功メッセージを表示
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          router.push('/more');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ クエスト作成エラー:', error);
      console.error('📋 エラー詳細:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      // より詳細なエラーメッセージを表示
      let errorMessage = 'クエストの作成に失敗しました。';
      if (error instanceof Error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage += '\n\nデータベーステーブルが存在しません。管理者にお問い合わせください。';
        } else if (error.message.includes('permission denied')) {
          errorMessage += '\n\n権限がありません。管理者権限が必要です。';
        } else if (error.message.includes('violates')) {
          errorMessage += '\n\nデータの形式に問題があります。入力内容を確認してください。';
        } else {
          errorMessage += `\n\nエラー詳細: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 2, pb: 8 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" color="#212529" sx={{ flex: 1 }}>
            クエスト作成
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 最高権限者表示 */}
            {isSupremeAdmin && (
              <Chip
                label="最高権限者"
                color="error"
                size="small"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              />
            )}
            <Button
              variant="outlined"
              size="small"
              color="info"
              onClick={checkDatabaseStatus}
              sx={{ ml: 1 }}
            >
              DB確認
            </Button>
          </Box>
        </Box>

        {/* 成功メッセージ */}
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            クエストが正常に作成されました！
          </Alert>
        )}

        {/* メインフォーム */}
        <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3}>
            {/* 基本情報 */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="bold" color="#050045" mb={2}>
                基本情報
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="クエストタイトル *"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>アイコン</InputLabel>
                <Select
                  value={formData.icon}
                  onChange={(e) => updateFormData('icon', e.target.value)}
                  label="アイコン"
                >
                  {iconOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="サブタイトル（説明）*"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="詳細説明文"
                value={formData.detailedDescription}
                onChange={(e) => updateFormData('detailedDescription', e.target.value)}
                multiline
                rows={4}
                helperText="クエスト詳細画面で表示される詳しい説明文"
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* カテゴリと難易度 */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="bold" color="#050045" mb={2}>
                設定
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>カテゴリ *</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  label="カテゴリ *"
                >
                  <MenuItem value="daily">デイリー</MenuItem>
                  <MenuItem value="weekly">ウィークリー</MenuItem>
                  <MenuItem value="special">スペシャル</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>難易度 *</InputLabel>
                <Select
                  value={formData.difficulty}
                  onChange={(e) => updateFormData('difficulty', e.target.value)}
                  label="難易度 *"
                >
                  <MenuItem value="easy">簡単</MenuItem>
                  <MenuItem value="medium">普通</MenuItem>
                  <MenuItem value="hard">難しい</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="所要時間"
                value={formData.estimatedTime}
                onChange={(e) => updateFormData('estimatedTime', e.target.value)}
                placeholder="例: 10分"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="報酬 *"
                value={formData.reward}
                onChange={(e) => updateFormData('reward', e.target.value)}
                placeholder="例: 100ポイント"
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* 背景画像設定 */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="bold" color="#050045" mb={2}>
                背景画像設定
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="background-image-upload"
                  type="file"
                  onChange={handleImageSelect}
                />
                <label htmlFor="background-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{
                      mr: 2,
                      borderColor: '#4A90E2',
                      color: '#4A90E2',
                      '&:hover': {
                        backgroundColor: '#4A90E2',
                        color: 'white',
                      },
                    }}
                  >
                    画像を選択
                  </Button>
                </label>
                
                {imagePreview && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={removeImage}
                    sx={{ ml: 1 }}
                  >
                    画像を削除
                  </Button>
                )}
              </Box>

              {/* 画像プレビュー */}
              {imagePreview && (
                <Card 
                  sx={{ 
                    mb: 2, 
                    maxWidth: 400,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 200,
                      backgroundImage: `url(${imagePreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 1,
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Image sx={{ fontSize: 16, color: '#4A90E2' }} />
                      <Typography variant="caption" fontWeight="bold" color="#4A90E2">
                        背景画像プレビュー
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                クエストカードの背景に使用される画像です。推奨サイズ: 320x220px、最大ファイルサイズ: 10MB
              </Typography>
            </Grid>

            {/* 期間設定 */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="bold" color="#050045" mb={2}>
                期間設定
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="開始日"
                type="date"
                value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => updateFormData('startDate', e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="終了日"
                type="date"
                value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => updateFormData('endDate', e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* タスクリスト */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="bold" color="#050045" mb={2}>
                タスクリスト
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="新しいタスク"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <Button
                  variant="outlined"
                  onClick={addTask}
                  startIcon={<Add />}
                  sx={{ minWidth: 120 }}
                >
                  追加
                </Button>
              </Box>

              {formData.tasks.length > 0 && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <List>
                    {formData.tasks.map((task, index) => (
                      <React.Fragment key={task.id}>
                        <ListItem>
                          <ListItemText
                            primary={task.title}
                            secondary={`タスク ${index + 1}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => removeTask(task.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < formData.tasks.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Card>
              )}
            </Grid>
          </Grid>
        </Card>

        {/* プレビューエリア */}
        <Card sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6" fontWeight="bold" color="#050045" mb={2}>
            プレビュー
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={formData.category.toUpperCase()}
              sx={{
                backgroundColor: getCategoryColor(formData.category),
                color: 'white',
                fontWeight: 'bold',
              }}
            />
            <Chip
              label={formData.difficulty}
              sx={{
                backgroundColor: getDifficultyColor(formData.difficulty),
                color: 'white',
                fontWeight: 'bold',
              }}
            />
            {formData.reward && (
              <Chip
                icon={<Star sx={{ color: 'white' }} />}
                label={formData.reward}
                sx={{
                  backgroundColor: '#FFD700',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            )}
            {formData.estimatedTime && (
              <Chip
                icon={<Schedule sx={{ color: '#666' }} />}
                label={`約${formData.estimatedTime}`}
                variant="outlined"
              />
            )}
          </Box>

          <Typography variant="h6" fontWeight="bold" color="#050045" mb={1}>
            {formData.title || 'クエストタイトル'}
          </Typography>
          
          <Typography variant="body2" color="#666" mb={2}>
            {formData.description || 'クエストの説明'}
          </Typography>

          {formData.tasks.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" color="#050045" mb={1}>
                タスク一覧 ({formData.tasks.length}個)
              </Typography>
              {formData.tasks.map((task, index) => (
                <Typography key={task.id} variant="body2" color="#666" sx={{ ml: 1 }}>
                  {index + 1}. {task.title}
                </Typography>
              ))}
            </Box>
          )}
        </Card>

        {/* アクションボタン */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Preview />}
            onClick={() => setPreviewOpen(true)}
            sx={{ minWidth: 140 }}
          >
            詳細プレビュー
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveQuest}
            sx={{
              backgroundColor: '#4A90E2',
              '&:hover': { backgroundColor: '#357ABD' },
              minWidth: 140,
            }}
          >
            保存
          </Button>
        </Box>

        {/* 詳細プレビューダイアログ */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>クエスト詳細プレビュー</DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <Typography variant="h5" fontWeight="bold" color="#050045" mb={2}>
                {formData.title || 'クエストタイトル'}
              </Typography>
              
              <Typography variant="body1" color="#666" mb={3}>
                {formData.detailedDescription || formData.description || 'クエストの詳細説明'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip
                  label={formData.category.toUpperCase()}
                  sx={{
                    backgroundColor: getCategoryColor(formData.category),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                <Chip
                  label={formData.difficulty}
                  sx={{
                    backgroundColor: getDifficultyColor(formData.difficulty),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                {formData.reward && (
                  <Chip
                    icon={<Star sx={{ color: 'white' }} />}
                    label={formData.reward}
                    sx={{
                      backgroundColor: '#FFD700',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </Box>

              {formData.tasks.length > 0 && (
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="#050045" mb={2}>
                    タスクリスト
                  </Typography>
                  <List>
                    {formData.tasks.map((task, index) => (
                      <ListItem key={task.id} sx={{ py: 0.5 }}>
                        <Assignment sx={{ mr: 2, color: '#666' }} />
                        <ListItemText primary={task.title} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>
      </Container>
  );
}