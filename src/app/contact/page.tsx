"use client";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";
import React, { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!name || !email || !message) {
      setError("全ての項目を入力してください");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 480, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">お問い合わせ</Typography>
      {sent ? (
        <Alert severity="success">お問い合わせを送信しました。ご連絡ありがとうございました！</Alert>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField label="お名前" fullWidth sx={{ mb: 2 }} value={name} onChange={e => setName(e.target.value)} />
          <TextField label="メールアドレス" fullWidth sx={{ mb: 2 }} value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="お問い合わせ内容" fullWidth multiline rows={4} sx={{ mb: 2 }} value={message} onChange={e => setMessage(e.target.value)} />
          <Button variant="contained" color="primary" onClick={handleSend}>送信</Button>
        </>
      )}
    </Box>
  );
} 