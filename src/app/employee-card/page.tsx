"use client";
import React, { useState } from "react";
import { Box, Container, Typography, Button, Paper, Grid, Avatar } from "@mui/material";
import { Print, Download, QrCode, CreditCard, ContactlessOutlined, Security, VerifiedUser, Business, Person } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

export default function EmployeeCardPage() {
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const { user } = useAuth();
  const toggleCard = () => setIsCardFlipped(!isCardFlipped);

  // ユーザーのアバター画像を取得（デフォルトはユーザーアイコン）
  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    if (user?.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    return null;
  };

  // ユーザーの表示名を取得
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "ユーザー";
  };

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography component="h1" variant="h4" fontWeight="bold" mb={3} sx={{ 
          color: "#0a1a0a",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          letterSpacing: "1px"
        }}>
          社員証明書
        </Typography>
        <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
          カードをタップすると表裏が反転します
        </Typography>
        
        {/* 反転可能なカード */}
        <Box
          sx={{
            perspective: "1200px",
            width: "100%",
            maxWidth: 420,
            mx: "auto",
            mb: 4
          }}
        >
          <Box
            onClick={toggleCard}
            sx={{
              position: "relative",
              width: "100%",
              height: 260,
              cursor: "pointer",
              transformStyle: "preserve-3d",
              transition: "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              "&:hover": {
                transform: isCardFlipped ? "rotateY(180deg) scale(1.02)" : "rotateY(0deg) scale(1.02)",
              }
            }}
          >
            {/* カードの表側 */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                borderRadius: 6,
                background: "linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 25%, #2a3a2a 50%, #1a2a1a 75%, #0a1a0a 100%)",
                color: "white",
                p: 3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 60px rgba(10, 26, 10, 0.4), 0 8px 32px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    conic-gradient(from 0deg at 70% 40%, transparent 0deg, rgba(255,255,255,0.08) 60deg, transparent 120deg),
                    radial-gradient(circle at 70% 40%, rgba(255,255,255,0.15) 0%, transparent 50%),
                    linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)
                  `,
                  zIndex: 1
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: "-50%",
                  left: "-50%",
                  right: "-50%",
                  bottom: "-50%",
                  background: `
                    linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%),
                    linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)
                  `,
                  zIndex: 0
                }
              }}
            >
              {/* 白い幾何学的形状 - メインアクセント */}
              <Box sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "30%",
                  left: "60%",
                  width: "80%",
                  height: "80%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                  clipPath: "polygon(0 0, 100% 0, 60% 100%, 0 100%)",
                  transform: "rotate(45deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* 白い幾何学的形状 - サブアクセント */}
              <Box sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "20%",
                  right: "20%",
                  width: "40%",
                  height: "40%",
                  background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 100%)",
                  clipPath: "polygon(100% 0, 100% 100%, 0 100%, 0 0)",
                  transform: "rotate(-25deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* カードの上部 */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ 
                    width: 0, 
                    height: 0, 
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "10px solid white",
                    opacity: 0.9
                  }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    fontSize: "1.1rem",
                    letterSpacing: "0.5px",
                    color: "#ffffff",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                  }}>
                    AOIROSERVER
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: 40, 
                  height: 28, 
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <ContactlessOutlined sx={{ fontSize: 18, color: "white" }} />
                </Box>
              </Box>

              {/* カードの中央 */}
              <Box sx={{ textAlign: "center", my: 3, position: "relative", zIndex: 2 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ 
                  mb: 1.5,
                  letterSpacing: "1px",
                  color: "#ffffff",
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                }}>
                  社員証
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.8,
                  fontWeight: 400,
                  letterSpacing: "0.5px",
                  color: "#e0e0e0"
                }}>
                  Employee ID Card
                </Typography>
              </Box>

              {/* カードの左側 - ユーザーアバターと名前 */}
              <Box sx={{ 
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5
              }}>
                <Avatar
                  src={getUserAvatar() || undefined}
                  alt={getUserDisplayName()}
                  sx={{
                    width: 50,
                    height: 50,
                    border: "2px solid rgba(255,255,255,0.3)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    background: getUserAvatar() ? "transparent" : "rgba(255,255,255,0.2)"
                  }}
                >
                  {!getUserAvatar() && <Person sx={{ fontSize: 25, color: "white" }} />}
                </Avatar>
                <Typography variant="body2" fontWeight="bold" sx={{ 
                  color: "#ffffff",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  maxWidth: 60,
                  lineHeight: 1.2
                }}>
                  {getUserDisplayName()}
                </Typography>
              </Box>

              {/* カードの下部 */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.2)"
                  }}>
                    <CreditCard sx={{ fontSize: 14, color: "white" }} />
                  </Box>
                  <Typography variant="caption" sx={{ 
                    opacity: 0.7,
                    fontWeight: 400,
                    letterSpacing: "0.5px",
                    color: "#cccccc"
                  }}>
                    タップで反転
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1.5,
                  background: "rgba(255,255,255,0.1)",
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <VerifiedUser sx={{ fontSize: 16, color: "white" }} />
                  <Typography variant="caption" fontWeight="bold" sx={{ 
                    letterSpacing: "0.5px",
                    color: "white"
                  }}>
                    VERIFIED
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* カードの裏側 */}
            <Box
              sx={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: 6,
                background: "linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 25%, #2a3a2a 50%, #1a2a1a 75%, #0a1a0a 100%)",
                color: "white",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 20px 60px rgba(10, 26, 10, 0.4), 0 8px 32px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    conic-gradient(from 180deg at 30% 60%, transparent 0deg, rgba(255,255,255,0.05) 60deg, transparent 120deg),
                    radial-gradient(circle at 30% 60%, rgba(255,255,255,0.08) 0%, transparent 50%)
                  `,
                  zIndex: 1
                }
              }}
            >
              {/* 白い幾何学的形状 - メインアクセント（裏側） */}
              <Box sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "25%",
                  left: "55%",
                  width: "70%",
                  height: "70%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                  clipPath: "polygon(0 0, 100% 0, 65% 100%, 0 100%)",
                  transform: "rotate(40deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* 白い幾何学的形状 - サブアクセント（裏側） */}
              <Box sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "15%",
                  right: "25%",
                  width: "35%",
                  height: "35%",
                  background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 100%)",
                  clipPath: "polygon(100% 0, 100% 100%, 0 100%, 0 0)",
                  transform: "rotate(-30deg)",
                  transformOrigin: "center"
                }
              }} />

              {/* 上部 - 会社情報 */}
              <Box sx={{ position: "relative", zIndex: 2, mb: 1 }}>
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start",
                  p: 0.8,
                  borderRadius: 1.5,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}>
                  <Box>
                    <Typography variant="caption" sx={{ 
                      display: "block", 
                      color: "#ffffff",
                      fontWeight: 500,
                      fontSize: "0.6rem",
                      lineHeight: 1.1
                    }}>
                      AOIROSERVER
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      display: "block", 
                      color: "#cccccc",
                      fontSize: "0.5rem",
                      lineHeight: 1.1
                    }}>
                      東京都渋谷区○○○○
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ 
                      display: "block", 
                      color: "#ffffff",
                      fontWeight: 500,
                      fontSize: "0.6rem"
                    }}>
                      EMP001
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      display: "block", 
                      color: "#cccccc",
                      fontSize: "0.5rem"
                    }}>
                      発行日: 2024/01/15
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* 中央 - 署名欄と説明 */}
              <Box sx={{ 
                position: "relative", 
                zIndex: 2, 
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 1
              }}>
                <Box sx={{ 
                  p: 1.2,
                  borderRadius: 1.5,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <Typography variant="caption" sx={{ 
                    display: "block", 
                    color: "#cccccc",
                    fontSize: "0.6rem",
                    mb: 0.8,
                    lineHeight: 1.1
                  }}>
                    このカードはAOIROSERVERが発行する社員証です
                  </Typography>
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 1.2,
                    mt: 0.8
                  }}>
                    <Box sx={{ 
                      width: 28, 
                      height: 28, 
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.2)"
                    }}>
                      <VerifiedUser sx={{ fontSize: 14, color: "white" }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        display: "block", 
                        color: "#ffffff",
                        fontWeight: 500,
                        fontSize: "0.65rem"
                      }}>
                        署名 AUTHORIZED SIGNATURE
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: "block", 
                        color: "#cccccc",
                        fontSize: "0.5rem"
                      }}>
                        Not Valid Unless Signed
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* 下部 - カード番号と有効期限 */}
              <Box sx={{ position: "relative", zIndex: 2 }}>
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-end",
                  p: 1.2,
                  borderRadius: 1.5,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      display: "block", 
                      color: "#cccccc",
                      fontSize: "0.6rem",
                      mb: 0.4
                    }}>
                      カード番号
                    </Typography>
                    <Typography variant="h6" fontFamily="monospace" sx={{ 
                      letterSpacing: 0.3,
                      fontWeight: "bold",
                      color: "#ffffff",
                      fontSize: "0.8rem",
                      mb: 0.8
                    }}>
                      1234 5678 9012 3456
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ 
                          display: "block", 
                          color: "#cccccc",
                          fontSize: "0.6rem"
                        }}>
                          有効期限
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ 
                          color: "#ffffff",
                          fontSize: "0.75rem"
                        }}>
                          12/26
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ 
                          display: "block", 
                          color: "#cccccc",
                          fontSize: "0.6rem"
                        }}>
                          社員番号
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ 
                          color: "#ffffff",
                          fontSize: "0.75rem"
                        }}>
                          EMP001
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.2)",
                    flexShrink: 0,
                    ml: 1.2
                  }}>
                    <QrCode sx={{ fontSize: 28, color: "white" }} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* カード操作ボタン */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            sx={{ 
              borderColor: "#1a2a1a",
              color: "#1a2a1a",
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: "500",
              borderWidth: 1.5,
              "&:hover": {
                borderColor: "#0a1a0a",
                bgcolor: "rgba(26, 42, 26, 0.05)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(10, 26, 10, 0.15)"
              },
              transition: "all 0.3s ease"
            }}
          >
            印刷
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ 
              borderColor: "#1a2a1a",
              color: "#1a2a1a",
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: "500",
              borderWidth: 1.5,
              "&:hover": {
                borderColor: "#0a1a0a",
                bgcolor: "rgba(26, 42, 26, 0.05)",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(10, 26, 10, 0.15)"
              },
              transition: "all 0.3s ease"
            }}
          >
            PDF保存
          </Button>
        </Box>

        {/* カード情報サマリー */}
        <Paper sx={{ 
          p: 4, 
          bgcolor: "#fafafa", 
          borderRadius: 3, 
          mb: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <Typography variant="h6" mb={4} sx={{ 
            color: "#0a1a0a", 
            fontWeight: "600", 
            textAlign: "center",
            letterSpacing: "0.5px"
          }}>
            カード情報
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                textAlign: "center", 
                p: 3, 
                bgcolor: "white", 
                borderRadius: 3, 
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
                }
              }}>
                <Typography variant="body2" color="textSecondary" mb={2} sx={{ fontWeight: 500, color: "#666" }}>社員番号</Typography>
                <Typography variant="h6" sx={{ 
                  color: "#0a1a0a", 
                  fontWeight: "600"
                }}>
                  EMP001
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                textAlign: "center", 
                p: 3, 
                bgcolor: "white", 
                borderRadius: 3, 
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
                }
              }}>
                <Typography variant="body2" color="textSecondary" mb={2} sx={{ fontWeight: 500, color: "#666" }}>発行日</Typography>
                <Typography variant="h6" sx={{ 
                  color: "#0a1a0a", 
                  fontWeight: "600"
                }}>
                  2024年1月15日
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                textAlign: "center", 
                p: 3, 
                bgcolor: "white", 
                borderRadius: 3, 
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
                }
              }}>
                <Typography variant="body2" color="textSecondary" mb={2} sx={{ fontWeight: 500, color: "#666" }}>有効期限</Typography>
                <Typography variant="h6" sx={{ 
                  color: "#0a1a0a", 
                  fontWeight: "600"
                }}>
                  2026年12月31日
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}
