"use client";
import React, { useState } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Email,
  Settings,
  Help,
  Refresh,
} from "@mui/icons-material";

export default function TestEmailConfirmationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    if (!email) {
      setError("メールアドレスを入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult(result);
      } else {
        setError(result.error || "テストに失敗しました");
      }
    } catch (err) {
      setError("テストの実行中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const checkListItems = [
    {
      title: "Supabase Email Auth設定",
      description: "SupabaseダッシュボードでEmail Authが有効になっているか確認",
      status: "pending",
    },
    {
      title: "メールテンプレート設定",
      description: "確認メールのテンプレートが正しく設定されているか確認",
      status: "pending",
    },
    {
      title: "SMTP設定",
      description: "メール送信のためのSMTP設定が正しいか確認",
      status: "pending",
    },
    {
      title: "リダイレクトURL設定",
      description: "確認メールのリダイレクトURLが正しく設定されているか確認",
      status: "pending",
    },
    {
      title: "スパムフォルダ確認",
      description: "確認メールがスパムフォルダに入っていないか確認",
      status: "pending",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            メール確認問題診断
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            アカウント作成時のメール確認が来ない問題を診断します
          </Typography>

          {/* テスト実行セクション */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              テスト実行
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="テスト用メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
              <Button
                variant="contained"
                onClick={runTest}
                disabled={loading || !email}
                startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
              >
                {loading ? "テスト中..." : "テスト実行"}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {testResult && (
              <Alert severity={testResult.testResult?.registrationSuccess ? "success" : "warning"} sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  テスト結果
                </Typography>
                <Typography variant="body2" gutterBottom>
                  登録成功: {testResult.testResult?.registrationSuccess ? "✅" : "❌"}
                </Typography>
                {testResult.testResult?.error && (
                  <Typography variant="body2" color="error">
                    エラー: {testResult.testResult.error}
                  </Typography>
                )}
                <Typography variant="body2" gutterBottom>
                  メール確認状態: {testResult.testResult?.emailConfirmed ? "✅ 確認済み" : "⏳ 確認待ち"}
                </Typography>
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* チェックリスト */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              確認チェックリスト
            </Typography>
            <List>
              {checkListItems.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <Help color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                    />
                  </ListItem>
                  {index < checkListItems.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>

          {/* 推奨事項 */}
          {testResult && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                推奨事項
              </Typography>
              <List>
                {testResult.recommendations?.map((rec: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Settings color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* 手動確認手順 */}
          <Box>
            <Typography variant="h6" gutterBottom>
              手動確認手順
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>1. Supabaseダッシュボードの確認</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • Authentication → Providers → Email が有効になっているか確認
                <br />
                • Authentication → Configuration → Email Auth の設定を確認
                <br />
                • Site URL と Redirect URLs が正しく設定されているか確認
              </Typography>
            </Alert>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>2. メール設定の確認</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • スパムフォルダを確認
                <br />
                • メールアドレスの入力ミスがないか確認
                <br />
                • メールプロバイダーの設定を確認
              </Typography>
            </Alert>

            <Alert severity="info">
              <Typography variant="body2" gutterBottom>
                <strong>3. 開発者ツールでの確認</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • F12キーで開発者ツールを開く
                <br />
                • Consoleタブでエラーメッセージを確認
                <br />
                • NetworkタブでAPIリクエストを確認
              </Typography>
            </Alert>
          </Box>
        </Card>
      </Container>
    </Box>
  );
} 