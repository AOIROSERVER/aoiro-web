"use client";
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Divider, 
  IconButton,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { 
  ArrowBack, 
  HelpOutline, 
  QuestionAnswer,
  Security,
  Notifications,
  Settings,
  Train,
  DirectionsCar,
  Person,
  CheckCircle
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function HelpPage() {
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
          <HelpOutline sx={{ color: 'white', fontSize: 32, mr: 2 }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
            ヘルプ・よくある質問
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
            {/* よくある質問 */}
            <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#333' }}>
              よくある質問
            </Typography>
            
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  background: 'rgba(103, 126, 234, 0.1)',
                  borderRadius: 2,
                  '&:hover': { background: 'rgba(103, 126, 234, 0.15)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <QuestionAnswer sx={{ color: '#667eea', mr: 2 }} />
                  <Typography sx={{ color: '#333', fontWeight: 500 }}>
                    Q. ログインしないと使えませんか？
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                  A. 一部機能（通知・管理）はログインが必要ですが、運行状況や道路状況などは未ログインでも閲覧できます。
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  background: 'rgba(103, 126, 234, 0.1)',
                  borderRadius: 2,
                  '&:hover': { background: 'rgba(103, 126, 234, 0.15)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Notifications sx={{ color: '#667eea', mr: 2 }} />
                  <Typography sx={{ color: '#333', fontWeight: 500 }}>
                    Q. 通知はどんな時に届きますか？
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                  A. 運行情報・道路情報・お知らせの更新時に通知が届きます。通知設定でON/OFFを切り替えられます。
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  background: 'rgba(103, 126, 234, 0.1)',
                  borderRadius: 2,
                  '&:hover': { background: 'rgba(103, 126, 234, 0.15)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Security sx={{ color: '#667eea', mr: 2 }} />
                  <Typography sx={{ color: '#333', fontWeight: 500 }}>
                    Q. データはどこに保存されていますか？
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                  A. データはSupabaseクラウド上で安全に管理されています。
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 4 }} />

            {/* 使い方ガイド */}
            <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#333' }}>
              使い方ガイド
            </Typography>

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
                      運行状況確認
                    </Typography>
                    <Typography variant="body2">
                      ホーム画面から運行状況を確認できます
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
                      道路状況確認
                    </Typography>
                    <Typography variant="body2">
                      道路の混雑状況を確認できます
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 設定方法 */}
            <Box sx={{ 
              background: 'rgba(103, 126, 234, 0.1)', 
              borderRadius: 3, 
              p: 3, 
              mb: 3 
            }}>
              <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#333' }}>
                設定方法
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#667eea' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="通知設定"
                    secondary="「その他」→「設定」から通知のON/OFFを変更できます"
                    sx={{ 
                      '& .MuiListItemText-primary': { color: '#333', fontWeight: 500 },
                      '& .MuiListItemText-secondary': { color: '#666' }
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#667eea' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="個人設定"
                    secondary="プロフィールやアカウント情報の管理ができます"
                    sx={{ 
                      '& .MuiListItemText-primary': { color: '#333', fontWeight: 500 },
                      '& .MuiListItemText-secondary': { color: '#666' }
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#667eea' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="管理者機能"
                    secondary="管理者は運行・道路情報の管理ページにアクセスできます"
                    sx={{ 
                      '& .MuiListItemText-primary': { color: '#333', fontWeight: 500 },
                      '& .MuiListItemText-secondary': { color: '#666' }
                    }}
                  />
                </ListItem>
              </List>
            </Box>


          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 