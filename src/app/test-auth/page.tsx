"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

export default function TestAuthPage() {
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testPassword, setTestPassword] = useState("testpassword123");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { supabase, user } = useAuth();

  const testSignUp = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: 'testuser',
            game_tag: 'testuser123',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setResult(`エラー: ${error.message}`);
      } else {
        setResult(`成功: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setResult(`例外エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (error) {
        setResult(`エラー: ${error.message}`);
      } else {
        setResult(`成功: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setResult(`例外エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testResetPassword = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      
      if (error) {
        setResult(`エラー: ${error.message}`);
      } else {
        setResult(`成功: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setResult(`例外エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthSettings = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // 現在のユーザーを取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      let resultText = "認証設定チェック結果:\n";
      resultText += `セッション: ${session ? 'あり' : 'なし'}\n`;
      resultText += `ユーザー: ${user ? 'あり' : 'なし'}\n`;
      
      if (sessionError) {
        resultText += `セッションエラー: ${sessionError.message}\n`;
      }
      
      if (userError) {
        resultText += `ユーザーエラー: ${userError.message}\n`;
      }
      
      if (user) {
        resultText += `ユーザーID: ${user.id}\n`;
        resultText += `メール: ${user.email}\n`;
        resultText += `メール確認済み: ${user.email_confirmed_at ? 'はい' : 'いいえ'}\n`;
        resultText += `作成日時: ${user.created_at}\n`;
      }
      
      setResult(resultText);
    } catch (error: any) {
      setResult(`チェックエラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ pt: 8 }}>
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography component="h1" variant="h5" fontWeight="bold" mb={3}>
          Supabase認証テスト
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          このページではSupabaseのEmail Auth設定をテストできます。
        </Alert>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="テスト用メールアドレス"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="テスト用パスワード"
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={testSignUp}
            disabled={loading}
            sx={{ bgcolor: "#4A90E2" }}
          >
            新規登録テスト
          </Button>
          <Button
            variant="contained"
            onClick={testSignIn}
            disabled={loading}
            sx={{ bgcolor: "#50C878" }}
          >
            ログインテスト
          </Button>
          <Button
            variant="contained"
            onClick={testResetPassword}
            disabled={loading}
            sx={{ bgcolor: "#FF6B6B" }}
          >
            パスワードリセットテスト
          </Button>
          <Button
            variant="outlined"
            onClick={checkAuthSettings}
            disabled={loading}
          >
            認証設定チェック
          </Button>
        </Box>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" mb={2}>結果:</Typography>
            <Alert severity={result.includes('エラー') ? 'error' : 'success'} sx={{ mb: 2 }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {result}
              </pre>
            </Alert>
          </Box>
        )}

        {user && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" mb={2}>現在のユーザー情報:</Typography>
            <Alert severity="info">
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {JSON.stringify(user, null, 2)}
              </pre>
            </Alert>
          </Box>
        )}
      </Card>
    </Container>
  );
} 