"use client";
import React, { useState, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from "@mui/material";
import { Email, ArrowBack } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

function ResetPasswordContent() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase } = useAuth();
  const router = useRouter();

  const handleResetPassword = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError('メールアドレスを入力してください');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      
      if (error) throw error;
      
      setSuccessMessage('パスワードリセットメールを送信しました。メールをご確認ください。');
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ pt: 8 }}>
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5" fontWeight="bold" mb={1}>
            パスワードリセット
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            メールアドレスを入力してパスワードリセットメールを送信します
          </Typography>

          {/* エラー表示 */}
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          
          {/* 成功メッセージ表示 */}
          {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{successMessage}</Alert>}

          {/* メールアドレス入力 */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="メールアドレス"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <Email sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* リセットボタン */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={handleResetPassword}
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: "#4A90E2" }}
          >
            {loading ? '送信中...' : 'パスワードリセットメールを送信'}
          </Button>

          {/* リンク */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              mt: 2,
            }}
          >
            <Link href="/login" variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <ArrowBack sx={{ mr: 1, fontSize: 16 }} />
              ログインページに戻る
            </Link>
          </Box>
        </Box>
      </Card>
    </Container>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
} 