"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
  Paper,
  Chip,
} from "@mui/material";
import { ArrowBack, Save, NewReleases, Edit, Preview } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateReleaseNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const { user, isAdmin: authIsAdmin } = useAuth();

  useEffect(() => {
    // 管理者権限のチェック
    const checkAdminStatus = () => {
      const isSupabaseAdmin = user?.email === 'aoiroserver.m@gmail.com';
      const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';
      const adminStatus = isSupabaseAdmin || isLocalAdmin || authIsAdmin;
      
      setIsAdmin(adminStatus);
      setCheckingAuth(false);
      
      if (!adminStatus) {
        router.push('/release-notes');
      }
    };

    checkAdminStatus();
  }, [user, authIsAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !version.trim()) {
      setError("すべての項目を入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // リリースノートのデータを作成
      const releaseNoteData = {
        title: title,
        content: content,
        version: version,
        author: user?.email || '管理者'
      };

      // APIエンドポイントにPOSTリクエストを送信
      const response = await fetch('/api/release-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin' // 簡易的な認証
        },
        body: JSON.stringify(releaseNoteData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'リリースノートの作成に失敗しました');
      }

      const result = await response.json();
      console.log('リリースノート作成成功:', result);

      // 成功メッセージを表示
      setSuccess("リリースノートが正常に作成されました");
      
      // 3秒後にリリースノート一覧ページに戻る
      setTimeout(() => {
        router.push('/release-notes');
      }, 3000);

    } catch (error) {
      console.error('リリースノート作成エラー:', error);
      setError("リリースノートの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          管理者権限が必要です
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
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
              新しいリリースノート作成
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" color="#666" sx={{ 
          ml: { xs: 0, sm: 7 },
          wordBreak: 'keep-all',
          lineHeight: 1.4
        }}>
          新しいバージョンのリリースノートを作成します
        </Typography>
      </Box>

      {/* フォーム */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 4 
      }}>
        {/* 入力フォーム */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ 
            p: { xs: 2, sm: 4 }, 
            borderRadius: 4, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="#333" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  <Edit sx={{ color: '#4A90E2' }} />
                  基本情報
                </Typography>
                <TextField
                  label="タイトル"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: AOIROSERVER 新機能追加"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#4A90E2',
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  label="バージョン"
                  fullWidth
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="例: 1.2.0"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#4A90E2',
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="#333" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  <Preview sx={{ color: '#4A90E2' }} />
                  リリースノート内容
                </Typography>
                <TextField
                  label="内容"
                  fullWidth
                  multiline
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="• 新機能: 〇〇機能を追加&#10;• 改善: 〇〇の最適化&#10;• 修正: 〇〇のバグ修正"
                  required
                  helperText="HTMLタグも使用できます（例: &lt;br&gt;, &lt;strong&gt;）"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#4A90E2',
                      },
                    },
                    '& .MuiInputBase-root': {
                      minHeight: { xs: '200px', sm: '300px' }
                    }
                  }}
                />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2, 
                justifyContent: 'flex-end',
                mt: 3
              }}>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={loading}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    order: { xs: 2, sm: 1 }
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  disabled={loading}
                  sx={{ 
                    backgroundColor: '#4A90E2',
                    '&:hover': { backgroundColor: '#357ABD' },
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                    order: { xs: 1, sm: 2 }
                  }}
                >
                  {loading ? '作成中...' : 'リリースノート作成'}
                </Button>
              </Box>
            </form>
          </Card>
        </Box>
        
        {/* プレビュー */}
        <Box sx={{ flex: 1, display: { xs: 'none', lg: 'block' } }}>
          <Paper sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 4, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: 'fit-content'
          }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Preview />
              プレビュー
            </Typography>
            
            {title && version && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ 
                  mb: 1,
                  wordBreak: 'keep-all',
                  lineHeight: 1.2
                }}>
                  {title} v{version}
                </Typography>
                <Chip 
                  label={`v${version}`}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                />
              </Box>
            )}
            
            {content && (
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)', 
                p: 2, 
                borderRadius: 2,
                mt: 2
              }}>
                <Box 
                  dangerouslySetInnerHTML={{ __html: content }}
                  sx={{
                    '& p': { 
                      mb: 1, 
                      lineHeight: 1.6, 
                      fontSize: '0.9rem'
                    },
                    '& br': { 
                      display: 'block', 
                      content: '""', 
                      marginTop: '0.5em' 
                    },
                    '& strong': {
                      fontWeight: 'bold'
                    }
                  }}
                />
              </Box>
            )}
            
            {!title && !version && !content && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                フォームに入力すると、ここにプレビューが表示されます
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}