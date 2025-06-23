"use client";
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import React, { useState } from "react";

export default function PrivacySettingsPage() {
  const [open, setOpen] = useState(false);
  const handleDelete = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleConfirm = () => {
    setOpen(false);
    alert("データ削除リクエストを送信しました（ダミー）");
  };
  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">プライバシー設定</Typography>
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
  );
} 