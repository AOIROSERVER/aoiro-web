"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  MonetizationOn,
  TrendingUp,
  CalendarToday,
  EmojiEvents,
  Refresh,
} from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface PointHistoryItem {
  id: string;
  type: string;
  typeName: string;
  points: number;
  description: string;
  date: string;
  created_at: string;
  icon: string;
}

interface PointStatistics {
  totalLoginBonus: number;
  totalPoints: number;
  estimatedTotalEarned: number;
  averagePointsPerDay: number;
}

interface PointHistoryData {
  user: {
    email: string;
    currentPoints: number;
  };
  history: PointHistoryItem[];
  statistics: PointStatistics;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function PointHistoryPage() {
  const [data, setData] = useState<PointHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchPointHistory = async () => {
    try {
      setLoading(true);
      console.log('📊 ポイント履歴取得中...');

      const response = await fetch('/api/point-history/', {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ ポイント履歴取得完了:', result);
        setData(result);
        setError(null);
      } else {
        const errorData = await response.json();
        console.error('❌ ポイント履歴取得エラー:', errorData);
        setError(errorData.error || '履歴の取得に失敗しました');
      }
    } catch (error) {
      console.error('❌ ネットワークエラー:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPointHistory();
  }, [user, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'login_bonus':
        return '#4CAF50';
      case 'quest_reward':
        return '#2196F3';
      case 'admin_grant':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => router.back()}>
          戻る
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
        >
          戻る
        </Button>
        <Typography variant="h4" fontWeight="bold" flex={1}>
          ポイント履歴
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={fetchPointHistory}
          variant="outlined"
          size="small"
        >
          更新
        </Button>
      </Box>

      {data && (
        <>
          {/* 統計情報 */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <MonetizationOn sx={{ fontSize: 40, color: '#FFA726', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {data.user.currentPoints.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  現在のポイント
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {data.statistics.totalLoginBonus}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ログイン日数
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {data.statistics.estimatedTotalEarned.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  獲得ポイント
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CalendarToday sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {data.statistics.averagePointsPerDay}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  1日平均
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 履歴リスト */}
          <Card>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" fontWeight="bold">
                ポイント取得履歴
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.history.length}件の履歴
              </Typography>
            </Box>

            {data.history.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  まだポイント履歴がありません
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  ログインボーナスやクエストでポイントを獲得しましょう！
                </Typography>
              </Box>
            ) : (
              <List>
                {data.history.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: getTypeColor(item.type),
                            width: 40,
                            height: 40,
                          }}
                        >
                          {item.icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="medium">
                              {item.typeName}
                            </Typography>
                            <Chip
                              label={`+${item.points}P`}
                              size="small"
                              sx={{
                                bgcolor: getTypeColor(item.type),
                                color: 'white',
                                fontWeight: 'bold',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(item.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < data.history.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>

          {/* フッター */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ポイントを使って様々なアイテムと交換できます
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
}