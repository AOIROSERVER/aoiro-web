"use client";
import { Box, Typography, Button, Divider, ToggleButton, ToggleButtonGroup } from "@mui/material";
import React, { useState } from "react";

export default function DisplaySettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  const handleSave = () => {
    alert("表示設定を保存しました（ダミー）");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">表示設定</Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography fontWeight="bold" mb={1} color="#222">テーマ</Typography>
      <ToggleButtonGroup
        value={theme}
        exclusive
        onChange={(_, val) => val && setTheme(val)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="light">ライト</ToggleButton>
        <ToggleButton value="dark">ダーク</ToggleButton>
      </ToggleButtonGroup>
      <Typography fontWeight="bold" mb={1} color="#222">フォントサイズ</Typography>
      <ToggleButtonGroup
        value={fontSize}
        exclusive
        onChange={(_, val) => val && setFontSize(val)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="small">小</ToggleButton>
        <ToggleButton value="medium">標準</ToggleButton>
        <ToggleButton value="large">大</ToggleButton>
      </ToggleButtonGroup>
      <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleSave}>
        保存
      </Button>
    </Box>
  );
} 