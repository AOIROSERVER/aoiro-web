"use client";
import { Box, Typography, Switch, FormControlLabel, Button, Divider, Paper } from "@mui/material";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Email, Notifications } from "@mui/icons-material";

export default function NotificationSettingsPage() {
  const [enabled, setEnabled] = useState(true);
  const [train, setTrain] = useState(true);
  const [road, setRoad] = useState(false);
  const [news, setNews] = useState(true);
  const router = useRouter();

  const handleSave = () => {
    alert("通知設定を保存しました（ダミー）");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">通知設定</Typography>
      
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="body2" color="text.secondary">
          列車の遅延や運転見合わせなどの情報をメールで受け取ることができます。
          メールアドレスを登録するだけで簡単に設定できます。
        </Typography>
        <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
          💡 推奨: 上のボタンからメールアドレスを登録してください
        </Typography>
      </Paper>
      
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
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" fontWeight="bold" mb={2} color="#222">通知方法の設定</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Email />}
          onClick={() => router.push('/settings/anonymous-email-notification')}
          sx={{ justifyContent: 'flex-start', p: 2 }}
        >
          📧 メールアドレスを登録して遅延情報を受け取る
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Notifications />}
          onClick={() => router.push('/train-status/management')}
          sx={{ justifyContent: 'flex-start', p: 2 }}
        >
          プッシュ通知設定（ログイン必要）
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Notifications />}
          onClick={() => router.push('/settings/anonymous-push-notification')}
          sx={{ justifyContent: 'flex-start', p: 2 }}
        >
          プッシュ通知設定（ログイン不要）
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Email />}
          onClick={() => router.push('/settings/email-notification')}
          sx={{ justifyContent: 'flex-start', p: 2 }}
        >
          メール通知設定（ログイン必要）
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Notifications />}
          onClick={() => router.push('/settings/anonymous-notification-management')}
          sx={{ justifyContent: 'flex-start', p: 2 }}
        >
          匿名通知設定管理
        </Button>
      </Box>
      
      <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleSave}>
        保存
      </Button>
    </Box>
  );
} 