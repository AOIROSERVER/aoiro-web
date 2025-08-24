"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Typography, IconButton, Card, Chip } from '@mui/material';
import { ArrowBack, Edit, Save, Cancel, Delete } from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';
import { detectAndConvertLinks } from '../../../../lib/linkDetector';

// お知らせの型定義
interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

export default function AnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        if (!params?.id) return;
        
        const response = await fetch(`/api/announcements/${params.id}`);
        if (!response.ok) throw new Error('お知らせの取得に失敗しました');
        const data = await response.json();
        setAnnouncement(data);
        setEditTitle(data.title);
        setEditContent(data.content);
        setEditTags(data.tags ? data.tags.join(', ') : '');
      } catch (error) {
        console.error('お知らせの取得エラー:', error);
      }
    };

    if (params?.id) {
      fetchAnnouncement();
    }
  }, [params?.id]);

  const handleSave = () => {
    if (announcement) {
      const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setAnnouncement({
        ...announcement,
        title: editTitle,
        content: editContent,
        tags
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (announcement) {
      setEditTitle(announcement.title);
      setEditContent(announcement.content);
      setEditTags(announcement.tags.join(', '));
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!announcement || !confirm('このお知らせを削除しますか？')) return;
    
    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('お知らせの削除に失敗しました');

      // 削除後は一覧ページに戻る
      router.push('/train-status');
    } catch (error) {
      console.error('お知らせの削除エラー:', error);
    }
  };

  if (!announcement) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6">お知らせが見つかりません</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box className="page-header">
        <Box className="page-title">
          <IconButton onClick={() => router.back()} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography className="page-title-text">お知らせ詳細</Typography>
        </Box>
        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={() => setIsEditing(!isEditing)}
              sx={{ color: isEditing ? '#4caf50' : '#666' }}
            >
              <Edit />
            </IconButton>
            <IconButton 
              onClick={handleDelete}
              sx={{ color: '#d32f2f' }}
            >
              <Delete />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        <Card sx={{ 
          p: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
          border: '1px solid #ffcc02'
        }}>
          {/* 日付 */}
          <Typography variant="caption" sx={{ 
            color: '#e65100', 
            fontWeight: 600,
            display: 'block',
            mb: 1
          }}>
            {announcement.date}
          </Typography>

          {/* タイトル */}
          {isEditing ? (
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              mb: 2,
              color: '#e65100'
            }}>
              {editTitle}
            </Typography>
          ) : (
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              mb: 2,
              color: '#e65100'
            }}>
              {announcement.title}
            </Typography>
          )}

          {/* タグ */}
          {announcement.tags && announcement.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {announcement.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
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
                />
              ))}
            </Box>
          )}

          {/* 内容 */}
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  border: '1px solid #ffcc02',
                  borderRadius: '8px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <IconButton
                  onClick={handleSave}
                  sx={{ 
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.9)' }
                  }}
                >
                  <Save />
                </IconButton>
                <IconButton
                  onClick={handleCancel}
                  sx={{ 
                    backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.9)' }
                  }}
                >
                  <Cancel />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ 
              lineHeight: 1.8,
              color: '#e65100',
              whiteSpace: 'pre-line'
            }}>
              {detectAndConvertLinks(announcement.content)}
            </Typography>
          )}
        </Card>
      </Box>
    </Box>
  );
} 