"use client";
import React, { useState } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  Alert,
} from "@mui/material";
import { Email, Lock, Login as LoginIcon } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// 仮のソーシャルアイコン
const GoogleIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
    alt="Google"
    width={20}
    height={20}
  />
);
const MicrosoftIcon = () => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
    alt="Microsoft"
    width={20}
    height={20}
  />
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/more"); // ログイン成功後、その他ページへ
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
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
            AOIROidにログイン
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            アカウントにアクセスします
          </Typography>

          {/* エラー表示 */}
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          {/* メール・パスワード入力 */}
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
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="パスワード"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <Lock sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* ログインボタン */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            startIcon={<LoginIcon />}
            sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: "#4A90E2" }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>

          {/* ソーシャルログイン */}
          <Divider sx={{ width: "100%", my: 2 }}>または</Divider>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            startIcon={<GoogleIcon />}
            sx={{ mb: 1.5 }}
          >
            Googleでログイン
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleSocialLogin('azure')}
            disabled={loading}
            startIcon={<MicrosoftIcon />}
          >
            Microsoftでログイン
          </Button>

          {/* リンク */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              mt: 2,
            }}
          >
            <Link href="#" variant="body2">
              パスワードを忘れましたか？
            </Link>
            <Link href="#" variant="body2">
              新規登録はこちら
            </Link>
          </Box>
        </Box>
      </Card>
    </Container>
  );
} 