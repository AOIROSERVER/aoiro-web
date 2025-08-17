"use client";
import React, { useState } from "react";
import { Box, Container, Typography, Button, Paper, Grid } from "@mui/material";
import { Print, Download, QrCode, CreditCard, ContactlessOutlined, Security } from "@mui/icons-material";

export default function EmployeeCardPage() {
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const toggleCard = () => setIsCardFlipped(!isCardFlipped);

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography component="h1" variant="h4" fontWeight="bold" mb={3} sx={{ color: "#333" }}>
          社員証明書
        </Typography>
        <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
          カードをタップすると表裏が反転します
        </Typography>
        
        {/* 反転可能なカード */}
        <Box
          sx={{
            perspective: "1000px",
            width: "100%",
            maxWidth: 400,
            mx: "auto",
            mb: 4
          }}
        >
          <Box
            onClick={toggleCard}
            sx={{
              position: "relative",
              width: "100%",
              height: 250,
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
                borderRadius: 4,
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                color: "white",
                p: 3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 32px rgba(30, 60, 114, 0.3)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              {/* カードの上部 */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: "50%", 
                    bgcolor: "white",
                    opacity: 0.8
                  }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1.2rem" }}>
                    AOIRO株式会社
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: 40, 
                  height: 30, 
                  bgcolor: "#FFD700", 
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <CreditCard sx={{ fontSize: 20, color: "#333" }} />
                </Box>
              </Box>

              {/* カードの中央 */}
              <Box sx={{ textAlign: "center", my: 2 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  社員証
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Employee ID Card
                </Typography>
              </Box>

              {/* カードの下部 */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ContactlessOutlined sx={{ fontSize: 24, opacity: 0.8 }} />
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    タップで反転
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  bgcolor: "rgba(255,255,255,0.1)",
                  px: 2,
                  py: 1,
                  borderRadius: 2
                }}>
                  <Security sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight="bold">
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
                borderRadius: 4,
                background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                color: "white",
                p: 3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 32px rgba(44, 62, 80, 0.3)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              {/* カード番号 */}
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mb: 1 }}>
                  カード番号
                </Typography>
                <Typography variant="h6" fontFamily="monospace" sx={{ letterSpacing: 2 }}>
                  1234-5678-9012-3456
                </Typography>
              </Box>

              {/* 社員情報 */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>社員番号</Typography>
                  <Typography variant="body1" fontWeight="bold">EMP001</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>氏名</Typography>
                  <Typography variant="body1" fontWeight="bold">社員名</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>部署</Typography>
                  <Typography variant="body1" fontWeight="bold">開発部</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>役職</Typography>
                  <Typography variant="body1" fontWeight="bold">ソフトウェアエンジニア</Typography>
                </Box>
              </Box>

              {/* 有効期限とQRコード */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mb: 0.5 }}>
                    有効期限
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    2026年12月31日
                  </Typography>
                </Box>
                <Box sx={{ 
                  width: 50, 
                  height: 50, 
                  bgcolor: "white", 
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <QrCode sx={{ fontSize: 30, color: "#333" }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* カード操作ボタン */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            sx={{ 
              borderColor: "#1e3c72",
              color: "#1e3c72",
              "&:hover": {
                borderColor: "#2a5298",
                bgcolor: "rgba(30, 60, 114, 0.1)"
              }
            }}
          >
            印刷
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ 
              borderColor: "#1e3c72",
              color: "#1e3c72",
              "&:hover": {
                borderColor: "#2a5298",
                bgcolor: "rgba(30, 60, 114, 0.1)"
              }
            }}
          >
            PDF保存
          </Button>
        </Box>

        {/* カード情報サマリー */}
        <Paper sx={{ p: 3, bgcolor: "#f8f9fa", borderRadius: 3, mb: 4 }}>
          <Typography variant="h6" mb={3} sx={{ color: "#333", fontWeight: "bold", textAlign: "center" }}>
            カード情報
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "white", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <Typography variant="body2" color="textSecondary" mb={1}>社員番号</Typography>
                <Typography variant="h6" sx={{ color: "#1e3c72", fontWeight: "bold" }}>
                  EMP001
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "white", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <Typography variant="body2" color="textSecondary" mb={1}>発行日</Typography>
                <Typography variant="h6" sx={{ color: "#1e3c72", fontWeight: "bold" }}>
                  2024年1月15日
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center", p: 2, bgcolor: "white", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <Typography variant="body2" color="textSecondary" mb={1}>有効期限</Typography>
                <Typography variant="h6" sx={{ color: "#1e3c72", fontWeight: "bold" }}>
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
