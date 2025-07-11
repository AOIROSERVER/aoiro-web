"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Divider,
} from "@mui/material";
import { Person, Tag, Edit, Save, Cancel } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  username: string;
  game_tag: string;
  created_at: string;
  updated_at: string;
}

function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [gameTag, setGameTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user-profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setUsername(data.profile.username);
        setGameTag(data.profile.game_tag);
      } else {
        setError('プロフィールの取得に失敗しました');
      }
    } catch (error) {
      setError('プロフィールの取得に失敗しました');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setUsername(profile.username);
      setGameTag(profile.game_tag);
    }
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // バリデーション
    if (!username || !gameTag) {
      setError('すべての項目を入力してください');
      setLoading(false);
      return;
    }

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

    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          game_tag: gameTag,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsEditing(false);
        setSuccessMessage('プロフィールを更新しました');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      setError('プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ pt: 8 }}>
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: "#4A90E2" }}>
            <Person sx={{ fontSize: 40 }} />
          </Avatar>

          <Typography component="h1" variant="h5" fontWeight="bold" mb={1}>
            プロフィール
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            アカウント情報を管理します
          </Typography>

          {/* エラー表示 */}
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          
          {/* 成功メッセージ表示 */}
          {successMessage && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{successMessage}</Alert>}

          {/* メールアドレス表示（編集不可） */}
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="メールアドレス"
            value={user.email || ''}
            disabled
            sx={{ mb: 2 }}
          />

          {/* ユーザー名入力 */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="ユーザー名"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!isEditing || loading}
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
            value={gameTag}
            onChange={(e) => setGameTag(e.target.value)}
            disabled={!isEditing || loading}
            helperText={isEditing ? "英数字、ハイフン、アンダースコアのみ使用可能（3文字以上）" : ""}
            InputProps={{
              startAdornment: <Tag sx={{ color: "text.disabled", mr: 1 }} />,
            }}
          />

          {/* 編集ボタン */}
          {!isEditing ? (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleEdit}
              startIcon={<Edit />}
              sx={{ mt: 3, mb: 2 }}
            >
              プロフィールを編集
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, width: '100%', mt: 3, mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={<Save />}
                sx={{ bgcolor: "#4A90E2" }}
              >
                {loading ? '保存中...' : '保存'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
                startIcon={<Cancel />}
              >
                キャンセル
              </Button>
            </Box>
          )}

          <Divider sx={{ width: '100%', my: 2 }} />

          {/* ログアウトボタン */}
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={handleSignOut}
            sx={{ mt: 2 }}
          >
            ログアウト
          </Button>
        </Box>
      </Card>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
} 