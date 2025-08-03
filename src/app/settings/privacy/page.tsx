"use client";
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import React, { useState } from "react";
import { ArrowBack, Shield } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function PrivacySettingsPage() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const handleDelete = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleConfirm = () => {
    setOpen(false);
    alert("データ削除リクエストを送信しました（ダミー）");
  };
  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 2,
        background: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <IconButton onClick={() => router.back()}>
          <ArrowBack sx={{ color: '#1a237e' }} />
        </IconButton>
        <Shield sx={{ color: '#1a237e', fontSize: 28, ml: 1 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20, ml: 1 }}>
          プライバシー設定
        </Typography>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ p: 3, maxWidth: 480, mx: "auto", backgroundColor: '#fff' }}>
        <Typography mb={2} color="#222">
          このアプリは、ユーザーのメールアドレス・通知設定など最小限の情報のみを安全に管理します。第三者への無断提供は行いません。
        </Typography>
        <Button variant="outlined" color="error" onClick={handleDelete}>
          アカウントとデータを削除リクエスト
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>本当に削除しますか？</DialogTitle>
          <DialogContent>
            <Typography color="#222">この操作は取り消せません。本当にアカウントと全データを削除しますか？</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button onClick={handleConfirm} color="error">削除リクエスト</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
} 