"use client";
import { 
  Box, 
  Typography, 
  Link, 
  Divider, 
  Card, 
  CardContent, 
  Avatar, 
  Chip,
  Grid,
  IconButton
} from "@mui/material";
import { 
  Info, 
  Train, 
  DirectionsCar, 
  Notifications, 
  Security,
  Code,
  Launch,
  ArrowBack
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 装飾的な背景要素 */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        zIndex: 0
      }} />

      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={() => router.back()}
            sx={{ color: 'white', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Info sx={{ color: 'white', fontSize: 32, mr: 2 }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', wordBreak: 'break-word', whiteSpace: 'normal', margin: 0 }}>
            アプリについて
          </Typography>
        </Box>

        {/* メインコンテンツ */}
        <Card sx={{ 
          borderRadius: 4, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          mb: 3
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#333' }}>
            AOIROSERVERアプリ
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3, lineHeight: 1.8 }}>
              このアプリは鉄道運行情報・道路状況・通知などを提供するPWA（Progressive Web App）です。
              最新の運行・道路情報をどこでも手軽に確認でき、ネイティブアプリのような体験を提供します。
            </Typography>

            {/* 機能カード */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Train sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      鉄道運行情報
                    </Typography>
                    <Typography variant="body2">
                      リアルタイムの運行状況を確認できます
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <DirectionsCar sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      道路状況
                    </Typography>
                    <Typography variant="body2">
                      道路の混雑状況を確認できます
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Notifications sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      プッシュ通知
                    </Typography>
                    <Typography variant="body2">
                      重要な情報をリアルタイムで通知
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Security sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      セキュリティ
                    </Typography>
                    <Typography variant="body2">
                      安全で信頼できるデータ管理
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* アプリ情報 */}
            <Box sx={{ 
              background: 'rgba(103, 126, 234, 0.1)', 
              borderRadius: 3, 
              p: 3, 
              mb: 3 
            }}>
              <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#333' }}>
                アプリ情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>バージョン:</strong>
                  </Typography>
                  <Chip label="1.0.0" color="primary" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>開発者:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333' }}>
                    AOIROSERVER Project
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* リンク */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Link 
                href="/terms" 
                target="_blank" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#667eea', 
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                利用規約
                <Launch sx={{ fontSize: 16, ml: 0.5 }} />
              </Link>
              <Link 
                href="/privacy" 
                target="_blank" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#667eea', 
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                プライバシーポリシー
                <Launch sx={{ fontSize: 16, ml: 0.5 }} />
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 