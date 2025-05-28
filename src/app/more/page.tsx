"use client";
import { Box, Card, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton, Avatar, ListItemButton } from "@mui/material";
import { Settings, AccountCircle, Info, Link as LinkIcon, ExitToApp } from "@mui/icons-material";

export default function MorePage() {
  return (
    <Box sx={{ p: 2, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Settings sx={{ color: '#ff9800', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">その他</Typography>
      </Box>
      {/* アカウント情報 */}
      <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>A</Avatar>
          <Box>
            <Typography variant="h6">管理者</Typography>
            <Typography variant="body2" color="text.secondary">admin@example.com</Typography>
          </Box>
        </Box>
      </Card>
      {/* メニューリスト */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <List>
          <ListItemButton>
            <ListItemIcon><AccountCircle /></ListItemIcon>
            <ListItemText primary="アカウント設定" />
          </ListItemButton>
          <Divider />
          <ListItemButton component="a" href="https://discord.gg/xxxx" target="_blank">
            <ListItemIcon><LinkIcon /></ListItemIcon>
            <ListItemText primary="公式Discord" />
          </ListItemButton>
          <ListItemButton component="a" href="https://github.com/xxxx" target="_blank">
            <ListItemIcon><LinkIcon /></ListItemIcon>
            <ListItemText primary="GitHub" />
          </ListItemButton>
          <Divider />
          <ListItemButton>
            <ListItemIcon><Info /></ListItemIcon>
            <ListItemText primary="バージョン情報" secondary="v1.0.0" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon><ExitToApp /></ListItemIcon>
            <ListItemText primary="ログアウト" />
          </ListItemButton>
        </List>
      </Card>
      {/* フッター */}
      <Box textAlign="center" color="text.secondary" mt={4}>
        <Typography variant="body2">© 2024 AOIRO SERVER</Typography>
      </Box>
    </Box>
  );
} 