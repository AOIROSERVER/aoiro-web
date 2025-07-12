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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase, user, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 認証状態の確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking auth status...');
      console.log('User:', user);
      console.log('Session:', session);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current session:', currentSession);
      
      if (currentSession?.user) {
        console.log('✅ User is authenticated:', currentSession.user.email);
        console.log('User metadata:', currentSession.user.user_metadata);
        console.log('App metadata:', currentSession.user.app_metadata);
      } else {
        console.log('❌ No active session found');
      }
    };
    
    checkAuthStatus();
  }, [supabase, user, session]);

  // URLパラメータからエラーとメッセージを取得
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      switch (errorParam) {
        case 'session_error':
          setError('セッションの設定に失敗しました。再度ログインしてください。');
          break;
        case 'auth_error':
          setError('認証に失敗しました。再度お試しください。');
          break;
        case 'pkce_error':
          setError('認証セッションに問題があります。ブラウザを再読み込みして再度お試しください。');
          break;
        default:
          setError('ログインに失敗しました。再度お試しください。');
      }
    } else if (messageParam === 'registration_success') {
      setError(null);
      setSuccessMessage('アカウントが正常に作成されました。確認メールをご確認ください。');
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
      console.log(`🔄 Starting ${provider} OAuth login...`);
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectUrl);
      
      // セッションをクリアしてから新しい認証を開始
      console.log('🧹 Clearing existing session...');
      await supabase.auth.signOut();
      
      // プロバイダーごとに適切な設定を分ける
      const oauthOptions: any = {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      };
      
      // Discordのみにresponse_type: 'code'を追加
      if (provider === 'discord') {
        oauthOptions.queryParams = {
          response_type: 'code',
        };
      }
      
      console.log(`📡 Initiating ${provider} OAuth with options:`, oauthOptions);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });
      
      if (error) {
        console.error(`❌ ${provider} OAuth error:`, error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        throw error;
      }
      
      console.log(`✅ ${provider} OAuth initiated successfully`);
      console.log('OAuth data:', data);
      console.log('Provider:', provider);
      console.log('Redirect URL used:', redirectUrl);
      
      // ブラウザリダイレクトが自動的に行われる
      console.log('🔄 Waiting for browser redirect...');
      
    } catch (err: any) {
      console.error(`❌ ${provider} login error:`, err);
      console.error('Full error object:', err);
      console.error('Error type:', typeof err);
      console.error('Error keys:', Object.keys(err || {}));
      
      let errorMessage = err.error_description || err.message || '認証に失敗しました';
      
      // プロバイダー別のエラーメッセージ
      if (provider === 'discord') {
        if (err.message?.includes('redirect_uri')) {
          errorMessage = 'DiscordのリダイレクトURI設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('client_id')) {
          errorMessage = 'DiscordのクライアントID設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('scope')) {
          errorMessage = 'Discordのスコープ設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('invalid_grant')) {
          errorMessage = 'Discordの認証コードが無効です。再度お試しください。';
        } else if (err.message?.includes('unauthorized_client')) {
          errorMessage = 'Discordのクライアント認証に失敗しました。設定を確認してください。';
        } else if (err.message?.includes('bad_code_verifier')) {
          errorMessage = '認証セッションに問題があります。ブラウザを再読み込みして再度お試しください。';
        }
      } else if (provider === 'google') {
        console.error('Google OAuth詳細エラー:', {
          message: err.message,
          status: err.status,
          name: err.name,
          stack: err.stack
        });
        
        if (err.message?.includes('redirect_uri')) {
          errorMessage = 'GoogleのリダイレクトURI設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('client_id')) {
          errorMessage = 'GoogleのクライアントID設定に問題があります。管理者にお問い合わせください。';
        } else if (err.message?.includes('invalid_grant')) {
          errorMessage = 'Googleの認証コードが無効です。再度お試しください。';
        } else if (err.message?.includes('unauthorized_client')) {
          errorMessage = 'Googleのクライアント認証に失敗しました。設定を確認してください。';
        } else if (err.message?.includes('access_denied')) {
          errorMessage = 'Googleログインがキャンセルされました。再度お試しください。';
        } else if (err.message?.includes('popup_closed')) {
          errorMessage = 'Googleログインのポップアップが閉じられました。再度お試しください。';
        } else if (err.message?.includes('network')) {
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        } else if (err.message?.includes('auth_error')) {
          errorMessage = 'Google認証でエラーが発生しました。ブラウザのキャッシュをクリアして再度お試しください。';
        } else {
          errorMessage = `Googleログインエラー: ${err.message || '不明なエラーが発生しました'}`;
        }
      }
      
      console.error(`Final error message for ${provider}:`, errorMessage);
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
            AOIROidにログイン
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            アカウントにアクセスします
          </Typography>

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2" component="div">
                {error}
              </Typography>
              {error.includes('Google') && (
                <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                  詳細なエラー情報を確認するには、ブラウザの開発者ツール（F12）のコンソールを確認してください。
                </Typography>
              )}
            </Alert>
          )}
          
          {/* 成功メッセージ表示 */}
          {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{successMessage}</Alert>}

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
            <Link href="/reset-password" variant="body2">
              パスワードを忘れましたか？
            </Link>
            <Link href="/register" variant="body2">
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