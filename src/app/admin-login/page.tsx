"use client";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import BearAvatar from "@/components/BearAvatar";

// 仮の管理者情報（本番は.envで管理）
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminLoginPage() {
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeField, setActiveField] = useState<string | undefined>(undefined);
  const router = useRouter();

  const handleSecret = () => {
    if (secret === ADMIN_SECRET) {
      setError("");
      setStep(2);
    } else {
      setError("合言葉が正しくありません");
    }
  };
  const handleEmail = () => {
    if (email === ADMIN_EMAIL) {
      setError("");
      setStep(3);
    } else {
      setError("メールアドレスが正しくありません");
    }
  };
  const handlePassword = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin", "true");
      setError("");
      router.push("/train-status");
    } else {
      setError("パスワードが正しくありません");
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400, mx: "auto", backgroundColor: '#fff', minHeight: '100vh' }}>
      <BearAvatar focus={activeField} />
      <Typography variant="h5" fontWeight="bold" mb={2} color="#222">管理者ログイン</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {step === 1 && (
        <>
          <TextField label="合言葉" fullWidth sx={{ mb: 2 }} value={secret} onChange={e => setSecret(e.target.value)} autoFocus 
            onFocus={() => setActiveField('secret')} onBlur={() => setActiveField(undefined)}
          />
          <Button variant="contained" color="primary" fullWidth onClick={handleSecret}>次へ</Button>
        </>
      )}
      {step === 2 && (
        <>
          <TextField label="メールアドレス" fullWidth sx={{ mb: 2 }} value={email} onChange={e => setEmail(e.target.value)} autoFocus 
            onFocus={() => setActiveField('email')} onBlur={() => setActiveField(undefined)}
          />
          <Button variant="contained" color="primary" fullWidth onClick={handleEmail}>次へ</Button>
        </>
      )}
      {step === 3 && (
        <>
          <TextField label="パスワード" type="password" fullWidth sx={{ mb: 2 }} value={password} onChange={e => setPassword(e.target.value)} autoFocus 
            onFocus={() => setActiveField('password')} onBlur={() => setActiveField(undefined)}
          />
          <Button variant="contained" color="primary" fullWidth onClick={handlePassword}>ログイン</Button>
        </>
      )}
    </Box>
  );
} 