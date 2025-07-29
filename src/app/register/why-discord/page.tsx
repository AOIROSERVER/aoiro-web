"use client";
import React from 'react';
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Fade,
  Slide,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { 
  Security, 
  Speed, 
  VerifiedUser, 
  Group, 
  ArrowBack,
  CheckCircle 
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function WhyDiscordPage() {
  const router = useRouter();

  const benefits = [
    {
      icon: <Security sx={{ color: '#7289DA' }} />,
      title: 'セキュリティ',
      description: 'Discordの安全な認証システムを利用して、アカウントの安全性を確保します。'
    },
    {
      icon: <Speed sx={{ color: '#7289DA' }} />,
      title: '簡単登録',
      description: '複雑な情報入力が不要で、ワンクリックでアカウント作成が完了します。'
    },
    {
      icon: <VerifiedUser sx={{ color: '#7289DA' }} />,
      title: '本人確認',
      description: 'Discordアカウントによる本人確認により、信頼性の高いコミュニティを構築します。'
    },
    {
      icon: <Group sx={{ color: '#7289DA' }} />,
      title: 'コミュニティ連携',
      description: 'AOIROSERVERのDiscordサーバーと連携して、より豊かな体験を提供します。'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
          zIndex: 0,
        }
      }}
    >
      <Container component="main" maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Slide direction="up" in={true} timeout={800}>
          <Card 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
              }
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Fade in={true} timeout={1000}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    component="h1" 
                    variant="h4" 
                    fontWeight="bold" 
                    mb={1}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.75rem', sm: '2.125rem' }
                    }}
                  >
                    なぜDiscord連携が必要？
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '1.1rem',
                      opacity: 0.8
                    }}
                  >
                    AOIRO IDの安全性と利便性を向上させるため
                  </Typography>
                </Box>
              </Fade>

              {/* 説明 */}
              <Fade in={true} timeout={1200}>
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      mb: 3,
                      textAlign: 'center'
                    }}
                  >
                    AOIRO IDでは、ユーザーの安全性と利便性を最優先に考えています。
                    <br />
                    Discordアカウントとの連携により、以下のメリットを提供しています。
                  </Typography>
                </Box>
              </Fade>

              {/* メリットリスト */}
              <Fade in={true} timeout={1400}>
                <Box sx={{ width: '100%', mb: 4 }}>
                  <List>
                    {benefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ mb: 2 }}>
                        <ListItemIcon>
                          {benefit.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography 
                              variant="h6" 
                              fontWeight="bold"
                              sx={{ color: '#667eea', mb: 1 }}
                            >
                              {benefit.title}
                            </Typography>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ lineHeight: 1.6 }}
                            >
                              {benefit.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Fade>

              {/* 注意事項 */}
              <Fade in={true} timeout={1600}>
                <Box sx={{ 
                  width: '100%', 
                  p: 3, 
                  bgcolor: 'rgba(114, 137, 218, 0.1)', 
                  borderRadius: 2,
                  mb: 4
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      textAlign: 'center'
                    }}
                  >
                    <strong>注意：</strong>Discordアカウントをお持ちでない場合は、
                    <br />
                    先にDiscordでアカウントを作成してからAOIRO IDを作成してください。
                    <br />
                    Discordアカウントの作成は無料で、数分で完了します。
                  </Typography>
                </Box>
              </Fade>

              {/* ボタン */}
              <Fade in={true} timeout={1800}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => router.push('/register')}
                    startIcon={<CheckCircle />}
                    sx={{ 
                      py: 2, 
                      px: 4,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #7289DA 0%, #5b6eae 100%)',
                      boxShadow: '0 8px 25px rgba(114, 137, 218, 0.3)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5b6eae 0%, #4a5a8f 100%)',
                        boxShadow: '0 12px 35px rgba(114, 137, 218, 0.5)',
                        transform: 'translateY(-3px)',
                      },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    AOIRO ID作成に進む
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/login')}
                    startIcon={<ArrowBack />}
                    sx={{ 
                      py: 2, 
                      px: 4,
                      borderRadius: 3,
                      border: '2px solid #667eea',
                      color: '#667eea',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      textTransform: 'none',
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderColor: '#5a6fd8',
                        color: '#5a6fd8',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                      },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    ログインページに戻る
                  </Button>
                </Box>
              </Fade>
            </Box>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
} 