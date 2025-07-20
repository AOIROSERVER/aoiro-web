"use client";
import React, { useState, useEffect } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Email,
  Settings,
  Help,
  Refresh,
  ExpandMore,
  BugReport,
  Info,
} from "@mui/icons-material";
import { useSearchParams } from "next/navigation";

export default function DebugEmailConfirmationPage() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // URLパラメータからデバッグ情報を取得
    const urlParams = Object.fromEntries(searchParams.entries());
    if (Object.keys(urlParams).length > 0) {
      setDebugInfo({
        url: window.location.href,
        params: urlParams,
        timestamp: new Date().toISOString(),
      });
    }
  }, [searchParams]);

  const runDebugTest = async () => {
    setLoading(true);
    setError(null);

    try {
      // 現在のURLパラメータを取得
      const currentParams = Object.fromEntries(searchParams.entries());
      
      // デバッグ情報を収集
      const debugData = {
        url: window.location.href,
        params: currentParams,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        hasCode: !!currentParams.code,
        hasType: !!currentParams.type,
        hasError: !!currentParams.error,
        codeLength: currentParams.code?.length || 0,
        type: currentParams.type || 'unknown',
      };

      setDebugInfo(debugData);
    } catch (err) {
      setError("デバッグ情報の収集に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendations = () => {
    if (!debugInfo) return [];

    const recommendations = [];

    // コードが存在しない場合
    if (!debugInfo.hasCode) {
      recommendations.push("確認メールのリンクが正しくない可能性があります");
      recommendations.push("メールのリンクを再度クリックしてください");
    }

    // エラーが存在する場合
    if (debugInfo.hasError) {
      recommendations.push("認証エラーが発生しています");
      recommendations.push("Supabaseの設定を確認してください");
    }

    // タイプが不明な場合
    if (debugInfo.type === 'unknown') {
      recommendations.push("メール確認の種類が不明です");
      recommendations.push("新しい確認メールを送信してください");
    }

    // コードの長さが異常な場合
    if (debugInfo.codeLength < 10) {
      recommendations.push("認証コードが短すぎます");
      recommendations.push("新しい確認メールを送信してください");
    }

    return recommendations;
  };

  const getCommonIssues = () => [
    {
      title: "メール確認リンクが無効",
      description: "確認メールのリンクが期限切れまたは無効になっている",
      solution: "新しい確認メールを送信するか、アカウントを再作成してください"
    },
    {
      title: "Supabase設定の問題",
      description: "SupabaseのEmail Auth設定が正しくない",
      solution: "SupabaseダッシュボードでEmail Auth設定を確認してください"
    },
    {
      title: "リダイレクトURL設定の問題",
      description: "確認メールのリダイレクトURLが正しくない",
      solution: "SupabaseでリダイレクトURLを正しく設定してください"
    },
    {
      title: "セッション処理の問題",
      description: "メール確認後のセッション作成に失敗している",
      solution: "ブラウザのキャッシュをクリアして再度試してください"
    },
    {
      title: "ネットワークの問題",
      description: "ネットワーク接続に問題がある",
      solution: "インターネット接続を確認して再度試してください"
    }
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Card sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            メール確認デバッグ
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            メール確認の問題を詳細に診断します
          </Typography>

          {/* デバッグ実行ボタン */}
          <Box sx={{ mb: 4 }}>
            <Button
              variant="contained"
              onClick={runDebugTest}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <BugReport />}
              sx={{ mb: 2 }}
            >
              {loading ? "診断中..." : "デバッグ情報を収集"}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Box>

          {/* デバッグ情報表示 */}
          {debugInfo && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                デバッグ情報
              </Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>詳細情報を表示</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="pre" sx={{ 
                    backgroundColor: '#f5f5f5', 
                    p: 2, 
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.875rem'
                  }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {/* 推奨事項 */}
          {debugInfo && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                推奨事項
              </Typography>
              <List>
                {getRecommendations().map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Info color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* よくある問題 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              よくある問題と解決方法
            </Typography>
            {getCommonIssues().map((issue, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" color="error">
                    {issue.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>問題:</strong> {issue.description}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      <strong>解決方法:</strong> {issue.solution}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* 手動確認手順 */}
          <Box>
            <Typography variant="h6" gutterBottom>
              手動確認手順
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>1. ブラウザの開発者ツールを開く</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • F12キーを押す
                <br />
                • Consoleタブを選択
                <br />
                • メール確認リンクをクリック
                <br />
                • エラーメッセージを確認
              </Typography>
            </Alert>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>2. Supabaseダッシュボードの確認</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • Authentication → Providers → Email が有効
                <br />
                • Authentication → Configuration → URL Configuration
                <br />
                • Site URL と Redirect URLs が正しく設定
              </Typography>
            </Alert>

            <Alert severity="info">
              <Typography variant="body2" gutterBottom>
                <strong>3. メール設定の確認</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • 確認メールが正しく送信されているか
                <br />
                • リンクが正しく機能しているか
                <br />
                • スパムフォルダを確認
              </Typography>
            </Alert>
          </Box>
        </Card>
      </Container>
    </Box>
  );
} 