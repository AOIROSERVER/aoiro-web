"use client";
import React, { useState, useEffect, Suspense } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";

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
const DiscordIcon = () => (
  <img
    src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/discord.svg"
    alt="Discord"
    width={20}
    height={20}
    style={{ filter: 'grayscale(0%)' }}
  />
);

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータからエラーを取得
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'session_error':
          setError('セッションの設定に失敗しました。再度ログインしてください。');
          break;
        case 'auth_error':
          setError('認証に失敗しました。再度お試しください。');
          break;
        default:
          setError('ログインに失敗しました。再度お試しください。');
      }
    }
  }, [searchParams]);

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

  const handleSocialLogin = async (provider: 'google' | 'azure' | 'discord') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            response_type: 'code',
          },
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
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleSocialLogin('discord')}
            disabled={loading}
            startIcon={<DiscordIcon />}
            sx={{ mt: 1.5 }}
          >
            Discordでログイン
          </Button>
          {/* 管理者ログインボタン */}
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ mt: 1, mb: 2 }}
            onClick={() => router.push('/admin-login')}
          >
            管理者ログイン
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
} 