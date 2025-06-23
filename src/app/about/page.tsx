"use client";
import { Box, Typography, Link, Divider } from "@mui/material";

export default function AboutPage() {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">アプリについて</Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography mb={2} color="#222">このアプリは鉄道運行情報・道路状況・通知などを提供するWebアプリです。<br/>最新の運行・道路情報をどこでも手軽に確認できます。</Typography>
      <Typography mb={2} color="#222"><b>バージョン:</b> 1.0.0</Typography>
      <Typography mb={2} color="#222"><b>開発者:</b> AOIROSERVER Project</Typography>
      <Link href="/terms" target="_blank" sx={{ mr: 2 }}>利用規約</Link>
      <Link href="/privacy" target="_blank">プライバシーポリシー</Link>
    </Box>
  );
} 