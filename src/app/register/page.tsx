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
import { Email, Lock, Person, Login as RegisterIcon, Tag } from "@mui/icons-material";
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

function RegisterContent() {
  const [username, setUsername] = useState("");
  const [gameTag, setGameTag] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          setError('セッションの設定に失敗しました。再度登録してください。');
          break;
        case 'auth_error':
          setError('認証に失敗しました。再度お試しください。');
          break;
        default:
          setError('登録に失敗しました。再度お試しください。');
      }
    }
  }, [searchParams]);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    // バリデーション
    if (!username || !gameTag || !email || !password || !confirmPassword) {
      setError('すべての項目を入力してください');
      setLoading(false);
      return;
    }

    // ゲームタグのバリデーション
    if (gameTag.length < 3) {
      setError('ゲームタグは3文字以上で入力してください');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(gameTag)) {
      setError('ゲームタグは英数字、ハイフン、アンダースコアのみ使用できます');
      setLoading(false);
      return;
    }

    // ゲームタグの重複チェック
    try {
      const { data: existingGameTag, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('game_tag', gameTag)
        .single();

      if (existingGameTag) {
        setError('このゲームタグは既に使用されています');
        setLoading(false);
        return;
      }
    } catch (error) {
      // エラーが発生した場合（レコードが見つからない場合）は重複していない
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            game_tag: gameTag,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      // 登録成功後、確認メール送信の案内
      router.push("/login?message=registration_success");
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
      console.log(`🔄 Starting ${provider} OAuth registration...`);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            response_type: 'code',
          },
        },
      });
      
      if (error) {
        console.error(`❌ ${provider} OAuth error:`, error);
        throw error;
      }
      
      console.log(`✅ ${provider} OAuth initiated successfully`);
      console.log('OAuth data:', data);
    } catch (err: any) {
      console.error(`❌ ${provider} registration error:`, err);
      let errorMessage = err.error_description || err.message;
      
      // Discord特有のエラーメッセージ
      if (provider === 'discord') {
        if (err.message?.includes('redirect_uri')) {
          errorMessage = 'DiscordのリダイレクトURI設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('client_id')) {
          errorMessage = 'DiscordのクライアントID設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('scope')) {
          errorMessage = 'Discordのスコープ設定に問題があります。管理者にお問い合わせください。';
        }
      }
      
      setError(errorMessage);
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
            AOIROidアカウント作成
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            新しいアカウントを作成します
          </Typography>

          {/* エラー表示 */}
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          {/* ユーザー名入力 */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="ユーザー名"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <Person sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* ゲームタグ入力 */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="gameTag"
            label="ゲームタグ"
            name="gameTag"
            autoComplete="off"
            value={gameTag}
            onChange={(e) => setGameTag(e.target.value)}
            disabled={loading}
            helperText="英数字、ハイフン、アンダースコアのみ使用可能（3文字以上）"
            InputProps={{
              startAdornment: <Tag sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* メールアドレス入力 */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="メールアドレス"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <Email sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* パスワード入力 */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="パスワード"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <Lock sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* パスワード確認入力 */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="パスワード確認"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <Lock sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* 登録ボタン */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={handleRegister}
            disabled={loading}
            startIcon={<RegisterIcon />}
            sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: "#4A90E2" }}
          >
            {loading ? '登録中...' : 'アカウント作成'}
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
            Googleで登録
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleSocialLogin('azure')}
            disabled={loading}
            startIcon={<MicrosoftIcon />}
          >
            Microsoftで登録
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => handleSocialLogin('discord')}
            disabled={loading}
            startIcon={<DiscordIcon />}
            sx={{ mt: 1.5 }}
          >
            Discordで登録
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
            <Link href="/login" variant="body2">
              すでにアカウントをお持ちの方はこちら
            </Link>
          </Box>
        </Box>
      </Card>
    </Container>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
} 