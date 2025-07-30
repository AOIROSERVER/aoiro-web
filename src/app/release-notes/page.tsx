"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Container,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";
import { ArrowBack, Info, Add, NewReleases, Update, BugReport } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// リリースノート型
type ReleaseNote = {
  id: number;
  title: { rendered: string };
  date: string;
  content: { rendered: string };
};

export default function ReleaseNotesPage() {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { user, isAdmin: authIsAdmin } = useAuth();

  // リリースノートを取得する関数
  const fetchReleaseNotes = async () => {
    setLoading(true);
    try {
      // まずAPIからリリースノートを取得
      const res = await fetch('/api/release-notes');
      
      if (res.ok) {
        const data = await res.json();
        console.log('APIからリリースノート取得:', data);
        
        // APIデータを既存の形式に変換
        const formattedData = data.map((note: any) => ({
          id: note.id,
          title: { rendered: note.title },
          date: note.date,
          content: { rendered: note.content }
        }));
        
        setReleaseNotes(formattedData);
      } else {
        // APIが失敗した場合はWordPressから取得
        const wpRes = await fetch(
          `https://aoiroserver.tokyo/wp-json/wp/v2/posts?categories=release-notes&per_page=10&orderby=date&order=desc&_=${Date.now()}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        
        if (wpRes.ok) {
          const wpData = await wpRes.json();
          console.log('WordPressからリリースノート取得:', wpData);
          setReleaseNotes(wpData);
        } else {
          // フォールバックデータ
          setReleaseNotes([
            {
              id: 1,
              title: { rendered: 'AOIROSERVER v1.2.0 リリース' },
              date: '2025-01-15T10:00:00',
              content: { rendered: '<p>• 新機能: リアルタイム列車位置表示<br>• 改善: 通知システムの最適化<br>• 修正: ログイン時の安定性向上</p>' }
            },
            {
              id: 2,
              title: { rendered: 'AOIROSERVER v1.1.5 リリース' },
              date: '2025-01-10T10:00:00',
              content: { rendered: '<p>• 新機能: Discord連携機能<br>• 改善: UI/UXの向上<br>• 修正: バグ修正</p>' }
            },
            {
              id: 3,
              title: { rendered: 'AOIROSERVER v1.1.0 リリース' },
              date: '2025-01-05T10:00:00',
              content: { rendered: '<p>• 新機能: プッシュ通知<br>• 改善: パフォーマンス最適化<br>• 修正: セキュリティ強化</p>' }
            }
          ]);
        }
      }
    } catch (error) {
      console.error('リリースノート取得エラー:', error);
      // フォールバックデータ
      setReleaseNotes([
        {
          id: 1,
          title: { rendered: 'AOIROSERVER v1.2.0 リリース' },
          date: '2025-01-15T10:00:00',
          content: { rendered: '<p>• 新機能: リアルタイム列車位置表示<br>• 改善: 通知システムの最適化<br>• 修正: ログイン時の安定性向上</p>' }
        },
        {
          id: 2,
          title: { rendered: 'AOIROSERVER v1.1.5 リリース' },
          date: '2025-01-10T10:00:00',
          content: { rendered: '<p>• 新機能: Discord連携機能<br>• 改善: UI/UXの向上<br>• 修正: バグ修正</p>' }
        },
        {
          id: 3,
          title: { rendered: 'AOIROSERVER v1.1.0 リリース' },
          date: '2025-01-05T10:00:00',
          content: { rendered: '<p>• 新機能: プッシュ通知<br>• 改善: パフォーマンス最適化<br>• 修正: セキュリティ強化</p>' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseNotes();
  }, []);

  useEffect(() => {
    // 管理者権限のチェック
    const checkAdminStatus = () => {
      const isSupabaseAdmin = user?.email === 'aoiroserver.m@gmail.com';
      const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
      const adminStatus = isSupabaseAdmin || isLocalAdmin || authIsAdmin;
      
      setIsAdmin(adminStatus);
    };

    checkAdminStatus();
  }, [user, authIsAdmin]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between', 
          mb: 2,
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.back()}
              sx={{ 
                color: '#666',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                minWidth: 'auto'
              }}
            >
              戻る
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <NewReleases sx={{ color: '#4A90E2', fontSize: { xs: 24, sm: 32 } }} />
              <Typography variant="h4" fontWeight="bold" color="#212529" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2.125rem' },
                wordBreak: 'keep-all',
                lineHeight: 1.2
              }}>
                リリースノート
              </Typography>
            </Box>
          </Box>
          
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/release-notes/create')}
              sx={{ 
                backgroundColor: '#4A90E2',
                '&:hover': { backgroundColor: '#357ABD' },
                borderRadius: 2,
                px: 3,
                py: 1,
                boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                alignSelf: { xs: 'stretch', sm: 'auto' },
                whiteSpace: 'nowrap'
              }}
            >
              新しいリリースノート作成
            </Button>
          )}
        </Box>
        
        <Typography variant="body1" color="#666" sx={{ 
          ml: { xs: 0, sm: 7 },
          wordBreak: 'keep-all',
          lineHeight: 1.4
        }}>
          最新の機能追加、改善、修正情報をお届けします
        </Typography>
      </Box>

      {/* リリースノート一覧 */}
      {loading ? (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress size={60} sx={{ color: '#4A90E2', mb: 2 }} />
          <Typography variant="h6" color="#666" sx={{ mt: 2 }}>
            リリースノートを読み込み中...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {releaseNotes.map((note, index) => (
            <Grid item xs={12} key={note.id}>
              <Card 
                sx={{ 
                  p: 0, 
                  borderRadius: 4, 
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
                  }
                }}
              >
                {/* ヘッダー部分 */}
                <Box sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  p: { xs: 2, sm: 3 },
                  color: 'white'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    justifyContent: 'space-between', 
                    mb: 1,
                    gap: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        width: { xs: 32, sm: 40 }, 
                        height: { xs: 32, sm: 40 } 
                      }}>
                        <NewReleases sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ 
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                          wordBreak: 'keep-all',
                          lineHeight: 1.2
                        }}>
                          {note.title.rendered}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {new Date(note.date).toLocaleDateString("ja-JP", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* バージョンチップ */}
                    <Chip 
                      label={`v${note.title.rendered.match(/v(\d+\.\d+\.\d+)/)?.[1] || '1.0.0'}`}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        alignSelf: { xs: 'flex-start', sm: 'auto' },
                        whiteSpace: 'nowrap'
                      }}
                    />
                  </Box>
                </Box>
                
                {/* コンテンツ部分 */}
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box 
                    dangerouslySetInnerHTML={{ __html: note.content.rendered }}
                    sx={{
                      '& p': { 
                        mb: 1.5, 
                        lineHeight: 1.8, 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        color: '#333'
                      },
                      '& br': { 
                        display: 'block', 
                        content: '""', 
                        marginTop: '0.5em' 
                      },
                      '& strong': {
                        color: '#4A90E2',
                        fontWeight: 'bold'
                      },
                      '& ul': {
                        pl: { xs: 1, sm: 2 }
                      },
                      '& li': {
                        mb: 0.5
                      }
                    }}
                  />
                  
                  {/* タグ表示 */}
                  <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {note.content.rendered.includes('新機能') && (
                      <Chip 
                        icon={<NewReleases />} 
                        label="新機能" 
                        size="small"
                        sx={{ 
                          bgcolor: '#e3f2fd', 
                          color: '#1976d2',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                        }}
                      />
                    )}
                    {note.content.rendered.includes('改善') && (
                      <Chip 
                        icon={<Update />} 
                        label="改善" 
                        size="small"
                        sx={{ 
                          bgcolor: '#f3e5f5', 
                          color: '#7b1fa2',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                        }}
                      />
                    )}
                    {note.content.rendered.includes('修正') && (
                      <Chip 
                        icon={<BugReport />} 
                        label="修正" 
                        size="small"
                        sx={{ 
                          bgcolor: '#fff3e0', 
                          color: '#f57c00',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* リリースノートがない場合 */}
      {!loading && releaseNotes.length === 0 && (
        <Box textAlign="center" py={8}>
          <NewReleases sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="#666" mb={2}>
            リリースノートはありません
          </Typography>
          <Typography variant="body2" color="#999">
            新しいバージョンがリリースされると、ここに表示されます。
          </Typography>
        </Box>
      )}
    </Container>
  );
} 