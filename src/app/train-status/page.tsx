"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, IconButton, CircularProgress, Accordion, AccordionSummary, AccordionDetails, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { Train, Settings, ExpandMore, Edit, Save, Cancel, Add, Announcement, Delete } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useServerStatus } from '../../contexts/ServerStatusContext';
import { detectAndConvertLinks } from '../../lib/linkDetector.tsx';

// スマホ版かどうかを判定する関数
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// 路線の表示順序を定義
const lineOrder = [
  'CA',   // 東海道新幹線
  'JK',   // 京浜東北線
  'JY1',  // 山手線（内回り）
  'JY2',  // 山手線（外回り）
  'JB',   // 総武線
  'JC',   // 中央線
  'JT',   // 東海道線
  'JO',   // 横須賀線
  'M',    // 丸の内線
  'Z',    // 半蔵門線
  'C',    // 千代田線
  'H',    // 日比谷線
  'G',    // 銀座線
  'AK',   // あきが丘線
  'AU'    // あおうみ線
];

// 路線ごとのデフォルト色を定義
const defaultLineColors: { [key: string]: string } = {
  CA: '#0033cb',   // 東海道新幹線
  JK: '#00b2e5',   // 京浜東北線
  JY1: '#8fd400',  // 山手線（内回り）
  JY2: '#8fd400',  // 山手線（外回り）
  JB: '#ffd400',   // 総武線
  JC: '#f15a22',   // 中央線
  JT: '#f68b1e',   // 東海道線
  JO: '#1069b4',   // 横須賀線
  M: '#f62e36',    // 丸の内線
  Z: '#8f76d6',    // 半蔵門線
  C: '#00bb86',    // 千代田線
  H: '#b5b5ac',    // 日比谷線
  G: '#f39700',    // 銀座線
  AK: '#e37e40',   // あきが丘線
  AU: '#15206b'    // あおうみ線
};

function StatusIcon({ status }: { status: string }) {
  if (status === '平常運転') {
    return (
      <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />
    );
  } else if (status === '遅延') {
    return (
      <Box sx={{ width: 24, height: 24, display: 'inline-block', mr: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <polygon
            points="12,4 22,20 2,20"
            fill="none"
            stroke="#ffa000"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
    );
  } else if (status === '運転見合わせ') {
    return (
      <Box sx={{ width: 24, height: 24, display: 'inline-block', mr: 1, position: 'relative' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute', top: 0, left: 0 }}>
          <line x1="5" y1="5" x2="19" y2="19" stroke="#e53935" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="19" y1="5" x2="5" y2="19" stroke="#e53935" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </Box>
    );
  }
  return null;
}

export default function TrainStatusPage() {
  const router = useRouter();
  const [lines, setLines] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<{ 
    online: boolean; 
    responseTime: number | null;
    playerCount?: number;
    maxPlayers?: number;
    version?: string | null;
    motd?: string | null;
    gamemode?: string | null;
    map?: string | null;
  }>({ online: false, responseTime: null });
  const [expanded, setExpanded] = useState<string | false>(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    tags: ''
  });
  const { loading, isAdmin, user, session } = useAuth();

  // サーバー状況をチェックする関数
  const checkServerStatus = async () => {
    const startTime = Date.now();
    try {
      // プロキシAPIを使用してMinecraft Bedrockサーバーのステータスをチェック
      const response = await fetch(`/api/minecraft-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // タイムアウトを10秒に設定（Minecraftサーバーは応答が遅い場合がある）
        signal: AbortSignal.timeout(10000)
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log('MinecraftサーバーAPIレスポンス:', data);
        
        // Minecraftサーバーがオンラインかどうかをチェック
        if (data.online) {
          console.log('✅ サーバーはオンラインです');
          setServerStatus({ 
            online: true, 
            responseTime,
            playerCount: data.players?.online || 0,
            maxPlayers: data.players?.max || 0,
            version: data.version || 'Unknown',
            motd: data.motd?.clean?.[0] || 'AOIROSERVER',
            gamemode: data.gamemode || 'Unknown',
            map: data.map?.clean || 'Unknown'
          });
        } else {
          console.log('❌ サーバーはオフラインです');
          setServerStatus({ 
            online: false, 
            responseTime: null,
            playerCount: 0,
            maxPlayers: 0,
            version: null,
            motd: null,
            gamemode: null,
            map: null
          });
        }
      } else {
        console.log('❌ APIレスポンスが正常ではありません');
        setServerStatus({ 
          online: false, 
          responseTime: null,
          playerCount: 0,
          maxPlayers: 0,
          version: null,
          motd: null,
          gamemode: null,
          map: null
        });
      }
    } catch (error) {
      console.error('Minecraftサーバー接続エラー:', error);
      setServerStatus({ 
        online: false, 
        responseTime: null,
        playerCount: 0,
        maxPlayers: 0,
        version: null,
        motd: null,
        gamemode: null,
        map: null
      });
    }
  };

  // 認証状態の確認（デバッグ用に一時的に無効化）
  useEffect(() => {
    console.log('🔍 Train Status Page - Auth Check:');
    console.log('Loading:', loading);
    console.log('User:', user);
    console.log('Session:', session);
    console.log('Is Admin:', isAdmin);
    console.log('Current pathname:', window.location.pathname);
    console.log('Current URL:', window.location.href);
    
    // デバッグ用：認証チェックを一時的に無効化
    console.log('🚧 DEBUG MODE: Authentication check disabled for testing');
    console.log('✅ Proceeding to show train status page regardless of auth state');
    
    // 元の認証チェック（コメントアウト）
    /*
    // ローディング中は待機
    if (loading) {
      console.log('⏳ Still loading, waiting...');
      return;
    }
    
    // ユーザーが認証されていない場合
    if (!user) {
      console.log('❌ User not authenticated, redirecting to login');
      console.log('User check details:', {
        userExists: !!user,
        userEmail: user ? (user as any).email : 'undefined',
        userID: user ? (user as any).id : 'undefined',
        sessionExists: !!session,
        sessionUser: session?.user?.email || 'undefined'
      });
      router.push('/login');
      return;
    }
    
    // ユーザーが認証されている場合
    console.log('✅ User authenticated:', user.email);
    console.log('User metadata:', user.user_metadata);
    console.log('App metadata:', user.app_metadata);
    
    // セッションの詳細確認
    if (session) {
      console.log('Session details:', {
        access_token: session.access_token ? 'present' : 'missing',
        refresh_token: session.refresh_token ? 'present' : 'missing',
        expires_at: session.expires_at,
        user_id: session.user?.id,
        user_email: session.user?.email
      });
    } else {
      console.log('⚠️ No session found but user exists');
    }
    
    console.log('✅ Auth check completed successfully');
    */
  }, [loading, user, session, isAdmin, router]);

  useEffect(() => {
    const fetchLines = async () => {
      try {
        console.log('🚂 運行情報を取得中...');
        const res = await fetch("/api/train-status");
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        const linesData = Array.isArray(data) ? data : data.lines;
        
        // デバッグ用：東海道新幹線のデータを確認
        const caLine = linesData.find((line: any) => line.id === 'CA');
        console.log('東海道新幹線のデータ:', caLine);
        
        // 路線を定義された順序でソート
        const sortedLines = linesData.sort((a: any, b: any) => {
          const aIndex = lineOrder.indexOf(a.id);
          const bIndex = lineOrder.indexOf(b.id);
          
          // 定義されていない路線は最後に配置
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          
          return aIndex - bIndex;
        });
        
        setLines(sortedLines);
        console.log('✅ 運行情報の取得に成功');
      } catch (error) {
        console.error('❌ APIからの運行情報取得に失敗:', error);
        console.log('🔄 ローカルデータを使用します...');
        
        // フォールバック: ローカルデータを使用
        try {
          const localData = [
            {
              "id": "CA",
              "name": "東海道新幹線",
              "status": "遅延",
              "color": "#0033cb",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "JK",
              "name": "京浜東北線",
              "status": "平常運転",
              "color": "#00b2e5",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "JY1",
              "name": "山手線（内回り）",
              "status": "平常運転",
              "color": "#8fd400",
              "updatedAt": "2025-06-15T00:09:11.469Z",
              "section": "浜松〜有楽町",
              "detail": "テストテキスト"
            },
            {
              "id": "JY2",
              "name": "山手線（外回り）",
              "status": "平常運転",
              "color": "#8fd400",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "JB",
              "name": "総武線",
              "status": "平常運転",
              "color": "#ffd400",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "JC",
              "name": "中央線",
              "status": "平常運転",
              "color": "#f15a22",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "JT",
              "name": "東海道線",
              "status": "平常運転",
              "color": "#f68b1e",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "JO",
              "name": "横須賀線",
              "status": "平常運転",
              "color": "#1069b4",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "M",
              "name": "丸の内線",
              "status": "平常運転",
              "color": "#f62e36",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "Z",
              "name": "半蔵門線",
              "status": "平常運転",
              "color": "#8f76d6",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "C",
              "name": "千代田線",
              "status": "平常運転",
              "color": "#00bb86",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "H",
              "name": "日比谷線",
              "status": "平常運転",
              "color": "#b5b5ac",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "G",
              "name": "銀座線",
              "status": "平常運転",
              "color": "#f39700",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "AK",
              "name": "あきが丘線",
              "status": "平常運転",
              "color": "#e37e40",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            },
            {
              "id": "AU",
              "name": "あおうみ線 (空港アクセス線)",
              "status": "平常運転",
              "color": "#15206b",
              "updatedAt": "2025-06-15T00:09:11.469Z"
            }
          ];
          
          // 路線を定義された順序でソート
          const sortedLines = localData.sort((a: any, b: any) => {
            const aIndex = lineOrder.indexOf(a.id);
            const bIndex = lineOrder.indexOf(b.id);
            
            // 定義されていない路線は最後に配置
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            
            return aIndex - bIndex;
          });
          
          setLines(sortedLines);
          console.log('✅ ローカルデータの読み込みに成功');
        } catch (localError) {
          console.error('❌ ローカルデータの読み込みにも失敗:', localError);
          // 最後の手段として空の配列を設定
          setLines([]);
        }
      }
    };
    fetchLines();
  }, []);

  // お知らせを取得する関数
  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      if (!response.ok) throw new Error('お知らせの取得に失敗しました');
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error('お知らせの取得エラー:', error);
    }
  };

  // お知らせを取得
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // 新しいお知らせを追加する関数
  const handleAddAnnouncement = async () => {
    try {
      const tags = newAnnouncement.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          date: newAnnouncement.date,
          tags
        }),
      });

      if (!response.ok) throw new Error('お知らせの作成に失敗しました');

      // お知らせを再取得
      await fetchAnnouncements();
      setIsAddDialogOpen(false);
      setNewAnnouncement({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: ''
      });
    } catch (error) {
      console.error('お知らせの作成エラー:', error);
    }
  };

  // お知らせを削除する関数
  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!confirm('このお知らせを削除しますか？')) return;
    
    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('お知らせの削除に失敗しました');

      // お知らせを再取得
      await fetchAnnouncements();
    } catch (error) {
      console.error('お知らせの削除エラー:', error);
    }
  };

  // サーバー状況を定期的にチェック
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 300000); // 5分（300秒）ごとにチェック
    return () => clearInterval(interval);
  }, []);

  // デバッグ用：ローディング状態も一時的に無効化
  /*
  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /><Typography mt={2}>認証確認中...</Typography></Box>;
  }
  */

  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box className="page-header">
        <Box className="page-title">
          <Train className="page-title-icon" />
          <Typography className="page-title-text">運行状況</Typography>
        </Box>
        {!loading && isAdmin && (
          <IconButton onClick={() => router.push('/train-status/management')} className="page-header-action">
            <Settings />
          </IconButton>
        )}
      </Box>

      {/* お知らせアコーディオン */}
      <Box sx={{ px: 2, mt: 2, mb: 2 }}>
        <Accordion 
          expanded={expanded === 'panel1'} 
          onChange={(event, isExpanded) => setExpanded(isExpanded ? 'panel1' : false)}
          sx={{
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            color: '#e65100',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            border: '1px solid #ffcc02',
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              margin: 0,
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: '#e65100' }} />}
            sx={{
              '& .MuiAccordionSummary-content': {
                margin: 0,
              },
              '&.Mui-expanded': {
                minHeight: '48px',
              }
            }}
          >
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flex: 1
            }}>
              <span style={{ fontSize: '1.1rem' }}>📢</span>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                fontSize: '1rem'
              }}>
                お知らせ ({announcements.length}件)
              </Typography>
              {isAdmin && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddDialogOpen(true);
                  }}
                  sx={{ 
                    ml: 'auto',
                    color: '#e65100',
                    '&:hover': { backgroundColor: 'rgba(230, 81, 0, 0.1)' }
                  }}
                >
                  <Add />
                </IconButton>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, pb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {announcements.map((announcement) => (
                <Box key={announcement.id} sx={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => router.push(`/train-status/announcement/${announcement.id}`)}>
                  {editingAnnouncement === announcement.id ? (
                    // 編集モード
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 193, 7, 0.5)',
                            },
                          }
                        }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 193, 7, 0.5)',
                            },
                          }
                        }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="タグをカンマ区切りで入力（例: 重要,工事,運行変更）"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 193, 7, 0.5)',
                            },
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<Save />}
                          onClick={async () => {
                            try {
                              const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                              const response = await fetch(`/api/announcements/${announcement.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  title: editTitle,
                                  content: editContent,
                                  date: announcement.date,
                                  tags
                                }),
                              });

                              if (!response.ok) throw new Error('お知らせの更新に失敗しました');

                              // 更新されたお知らせを再取得
                              await fetchAnnouncements();
                              setEditingAnnouncement(null);
                              setEditTitle('');
                              setEditContent('');
                              setEditTags('');
                            } catch (error) {
                              console.error('お知らせの更新エラー:', error);
                            }
                          }}
                          sx={{ 
                            backgroundColor: 'rgba(76, 175, 80, 0.8)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.9)' }
                          }}
                        >
                          保存
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => {
                            setEditingAnnouncement(null);
                            setEditTitle('');
                            setEditContent('');
                            setEditTags('');
                          }}
                          sx={{ 
                            backgroundColor: 'rgba(244, 67, 54, 0.8)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.9)' }
                          }}
                        >
                          キャンセル
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    // 表示モード
                    <>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        fontSize: '0.9rem',
                        color: '#e65100'
                      }}>
                        {announcement.title}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        opacity: 0.8,
                        color: '#e65100',
                        mb: 1
                      }}>
                        {detectAndConvertLinks(announcement.content)}
                      </Typography>
                      {announcement.tags && announcement.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {announcement.tags.map((tag, index) => (
                            <Box
                              key={index}
                              sx={{
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: tag === '重要' ? 'rgba(244, 67, 54, 0.2)' : 
                                               tag === '工事' ? 'rgba(255, 152, 0, 0.2)' :
                                               tag === '運行変更' ? 'rgba(156, 39, 176, 0.2)' :
                                               'rgba(76, 175, 80, 0.2)',
                                color: tag === '重要' ? '#d32f2f' : 
                                       tag === '工事' ? '#f57c00' :
                                       tag === '運行変更' ? '#7b1fa2' :
                                       '#2e7d32',
                                border: `1px solid ${tag === '重要' ? 'rgba(244, 67, 54, 0.3)' : 
                                                   tag === '工事' ? 'rgba(255, 152, 0, 0.3)' :
                                                   tag === '運行変更' ? 'rgba(156, 39, 176, 0.3)' :
                                                   'rgba(76, 175, 80, 0.3)'}`
                              }}
                            >
                              {tag}
                            </Box>
                          ))}
                        </Box>
                      )}
                                              {isAdmin && (
                        <Box sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 0.5
                        }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // 親要素のクリックイベントを停止
                              setEditingAnnouncement(announcement.id);
                              setEditTitle(announcement.title);
                              setEditContent(announcement.content);
                              setEditTags(announcement.tags ? announcement.tags.join(', ') : '');
                            }}
                            sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
                            }}
                          >
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // 親要素のクリックイベントを停止
                              handleDeleteAnnouncement(announcement.id);
                            }}
                            sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              color: '#d32f2f',
                              '&:hover': { 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: '#b71c1c'
                              }
                            }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* 路線図カード */}
      <Box sx={{ px: 2, mt: 2, mb: 2 }}>
        <Box sx={{
          background: '#f6f3fb',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          p: 2,
        }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#3c2e67', mb: 1 }}>路線図</Typography>
          <Box sx={{
            width: '100%',
            textAlign: 'center',
            mb: 1.5,
            background: '#fff',
            borderRadius: 2,
            p: 1
          }}>
            <img
              src="https://i.imgur.com/wfJtm8g.jpg"
              alt="路線図"
              style={{
                width: '100%',
                maxWidth: 500,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}
            />
          </Box>
          {!isMobile() && (
            <Box display="flex" justifyContent="center" alignItems="center" gap={3}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <StatusIcon status="平常運転" />
                <Typography sx={{ color: '#43a047', fontWeight: 600, fontSize: 15 }}>平常運転</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <StatusIcon status="遅延" />
                <Typography sx={{ color: '#ffa000', fontWeight: 600, fontSize: 15 }}>遅延</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <StatusIcon status="運転見合わせ" />
                <Typography sx={{ color: '#e53935', fontWeight: 600, fontSize: 15 }}>運転見合わせ</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* 注意書きカード */}
      <Box sx={{ px: 2, mt: 2, mb: 2 }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 50%, #c8e6c9 100%)',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(76, 175, 80, 0.15)',
          p: 3,
          border: '1px solid rgba(76, 175, 80, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 装飾的な背景要素 */}
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 60,
            height: 60,
            background: 'rgba(76, 175, 80, 0.1)',
            borderRadius: '50%',
            zIndex: 0
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -15,
            left: -15,
            width: 40,
            height: 40,
            background: 'rgba(76, 175, 80, 0.08)',
            borderRadius: '50%',
            zIndex: 0
          }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>

            <Typography variant="body2" sx={{ 
              color: '#2e7d32', 
              textAlign: 'center',
              fontSize: '1rem',
              lineHeight: 1.6,
              opacity: 0.9,
              fontWeight: 500
            }}>
              AOIROSERVERはJRと一切関係がありません
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#2e7d32', 
              textAlign: 'center',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              opacity: 0.8,
              fontWeight: 400,
              mt: 1
            }}>
              ここに書かれている路線や駅、列車走行位置などは全てAOIROSERVER内にあるものを表示しています
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 路線リスト */}
      <Box sx={{ px: 2, pb: 2, flex: 1 }}>
        {lines.map((line, idx) => {
          // デバッグ用：色の値を計算
          let finalColor = line.color || defaultLineColors[line.id] || '#1a237e';
          
          // 東海道新幹線の場合は強制的に色を設定
          if (line.id === 'CA') {
            finalColor = '#0033cb';
            console.log('東海道新幹線の色を強制設定:', finalColor);
          }
          
          // 京浜東北線の場合は強制的に色を設定
          if (line.id === 'JK') {
            finalColor = '#00b2e5';
            console.log('京浜東北線の色を強制設定:', finalColor);
          }
          
          console.log(`路線 ${line.id} (${line.name}):`, {
            lineColor: line.color,
            defaultColor: defaultLineColors[line.id],
            finalColor: finalColor
          });
          
          return (
          <Box
            key={line.id + idx}
            sx={{
              background: '#fff',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              mb: 2,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.13)'
              }
            }}
            onClick={() => router.push(`/train-status/${line.id}`)}
          >
            <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: ['M', 'Z', 'C', 'H', 'G'].includes(line.id) ? '50%' : 2,
                  border: ['M', 'Z', 'C', 'H', 'G'].includes(line.id) ? `8px solid ${finalColor}` : `2.8px solid ${finalColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#1a237e',
                  background: '#fff',
                  mr: 1,
                  ...(line.id === 'CA' && {
                    border: '2.8px solid #0033cb'
                  })
                }}
                style={line.id === 'CA' ? { border: '2.8px solid #0033cb' } : {}}
              >
                {(line.id === 'JY1' || line.id === 'JY2') ? 'JY' : line.id}
              </Box>
              <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 700, fontSize: 18, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset', flex: 1, minWidth: 0, lineHeight: 1.3, wordBreak: 'break-word' }}>{line.name}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <StatusIcon status={line.status} />
                <Typography sx={{ color: line.status === '平常運転' ? '#43a047' : line.status === '遅延' ? '#ffa000' : '#e53935', fontWeight: 700, fontSize: 17, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset', minWidth: 0, lineHeight: 1.3, wordBreak: 'break-word', textAlign: { xs: 'center', sm: 'left' } }}>{line.status}</Typography>
              </Box>
            </Box>
          </Box>
          );
        })}
      </Box>

      {/* お知らせ追加ダイアログ */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
          color: '#e65100',
          fontWeight: 600
        }}>
          新しいお知らせを追加
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="タイトル"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="日付"
              type="date"
              value={newAnnouncement.date}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, date: e.target.value})}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="タグ（カンマ区切り）"
              value={newAnnouncement.tags}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, tags: e.target.value})}
              fullWidth
              placeholder="例: 重要, 工事, 運行変更"
            />
            <TextField
              label="内容"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
              fullWidth
              multiline
              rows={6}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setIsAddDialogOpen(false)}
            variant="outlined"
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleAddAnnouncement}
            variant="contained"
            disabled={!newAnnouncement.title || !newAnnouncement.content || !newAnnouncement.date}
            sx={{
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)'
              }
            }}
          >
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 