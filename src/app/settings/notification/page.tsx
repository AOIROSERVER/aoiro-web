"use client";
import { Box, Typography, Switch, FormControlLabel, Button, Divider } from "@mui/material";
import React, { useState } from "react";

export default function NotificationSettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [train, setTrain] = useState(true);
  const [road, setRoad] = useState(false);
  const [news, setNews] = useState(true);

  const handleSave = () => {
    alert("通知設定を保存しました（ダミー）");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">通知設定</Typography>
      <Divider sx={{ mb: 2 }} />
      <FormControlLabel
        control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} color="primary" />}
        label={<span style={{ color: '#222' }}>通知を受け取る</span>}
      />
      <Box sx={{ pl: 3, opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
        <FormControlLabel
          control={<Switch checked={train} onChange={e => setTrain(e.target.checked)} color="primary" />}
          label={<span style={{ color: '#222' }}>運行情報の通知</span>}
        />
        <FormControlLabel
          control={<Switch checked={road} onChange={e => setRoad(e.target.checked)} color="primary" />}
          label={<span style={{ color: '#222' }}>道路情報の通知</span>}
        />
        <FormControlLabel
          control={<Switch checked={news} onChange={e => setNews(e.target.checked)} color="primary" />}
          label={<span style={{ color: '#222' }}>お知らせの通知</span>}
        />
      </Box>
      <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleSave}>
        保存
      </Button>
    </Box>
  );
} 