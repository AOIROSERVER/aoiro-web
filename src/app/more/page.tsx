"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Avatar,
  Grid,
  Button,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Settings,
  AccountCircle,
  Info,
  NotificationsNone,
  Palette,
  Shield,
  HelpOutline,
  Email,
  InfoOutlined,
  Login,
  Logout,
  Cloud,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

// ニュース記事型
type NewsItem = {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  url: string;
};

export default function MorePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();

  const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || null;

  // localStorageのadminフラグ取得
  const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';

  useEffect(() => {
    fetch(
      "https://aoiroserver.tokyo/wp-json/wp/v2/posts?_embed&per_page=3&orderby=date&order=desc"
    )
      .then((res) => res.json())
      .then((data) => {
        const items = data.map((post: any) => {
          let imageUrl = "";
          if (post._embedded && post._embedded["wp:featuredmedia"]) {
            const media = post._embedded["wp:featuredmedia"][0];
            imageUrl =
              media.media_details?.sizes?.medium_large?.source_url ||
              media.media_details?.sizes?.medium?.source_url ||
              media.media_details?.sizes?.full?.source_url ||
              media.source_url ||
              "";
          }
          return {
            id: post.id.toString(),
            title: post.title.rendered,
            date: new Date(post.date).toLocaleDateString("ja-JP"),
            imageUrl,
            url: post.link,
          };
        });
        setNews(items);
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 2, background: "#f7f8fa", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Settings sx={{ color: "#4A90E2", fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#212529' }}>
          その他
        </Typography>
      </Box>

      {/* アカウント欄 */}
      <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: "#4A90E2", color: "#fff", fontWeight: "bold" }}
            src={avatarUrl || undefined}
          >
            {!avatarUrl && (user ? (user.email?.charAt(0).toUpperCase() || 'A') : isLocalAdmin ? '最' : <Login />)}
          </Avatar>
          <Box flex={1}>
            {loading ? (
              <Typography variant="body2" color="text.secondary">認証確認中...</Typography>
            ) : user ? (
              <>
                <Typography variant="h6">{user.email}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ログイン済み
                </Typography>
              </>
            ) : isLocalAdmin ? (
              <>
                <Typography variant="h6">最高権限者様</Typography>
                <Typography variant="body2" color="text.secondary">
                  ログイン済み
                </Typography>
              </>
            ) : (
              <Box onClick={() => router.push("/login")} sx={{ cursor: "pointer" }}>
                <Typography variant="h6" color="#050045">
                  AOIROidにログイン
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  アカウントを作成して、より便利に
                </Typography>
                <Typography variant="body2" color="error.main">
                  ※ログインしてください
                </Typography>
              </Box>
            )}
          </Box>
          {(user || isLocalAdmin) && !loading && (
            <IconButton onClick={signOut}>
              <Logout />
            </IconButton>
          )}
        </Box>
      </Card>

      {/* 最新情報 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1} sx={{ color: '#212529' }}>
        最新情報
      </Typography>
      <Box mb={3}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : news.length > 0 ? (
          <Grid container spacing={2}>
            {news.map((item) => (
              <Grid item xs={12} key={item.id}>
                <Card
                  sx={{ display: "flex", alignItems: "center", p: 1.5, borderRadius: 2, cursor: "pointer" }}
                  onClick={() => window.open(item.url, "_blank")}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      overflow: "hidden",
                      bgcolor: "#eee",
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        width="100%"
                        height="100%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="#aaa"
                      >
                        <InfoOutlined fontSize="large" />
                      </Box>
                    )}
                  </Box>
                  <Box flex={1}>
                    <Typography fontWeight="bold" fontSize={15} color="#050045" noWrap>
                      {item.title}
                    </Typography>
                    <Typography fontSize={13} color="#666">
                      {item.date}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="text.secondary">最新情報はありません</Typography>
        )}
      </Box>

      {/* 設定 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1} sx={{ color: '#212529' }}>
        設定
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<NotificationsNone sx={{ color: "#4A90E2" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/settings/notification')}
          >
            通知設定
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<Palette sx={{ color: "#50C878" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/settings/display')}
          >
            表示設定
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<Shield sx={{ color: "#FF6B6B" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/settings/privacy')}
          >
            プライバシー
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<AccountCircle sx={{ color: "#4A90E2" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/profile')}
          >
            プロフィール
          </Button>
        </Grid>
      </Grid>

      {/* その他 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1} sx={{ color: '#212529' }}>
        その他
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<HelpOutline sx={{ color: "#9B59B6" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/help')}
          >
            ヘルプ
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<Email sx={{ color: "#F1C40F" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/contact')}
          >
            お問い合わせ
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<Info sx={{ color: "#3498DB" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/about')}
          >
            アプリについて
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button fullWidth variant="outlined" startIcon={<Cloud sx={{ color: "#4A90E2" }} />} sx={{ borderRadius: 2 }}
            onClick={() => router.push('/status')}
          >
            稼働状況
          </Button>
        </Grid>

      </Grid>

    </Box>
  );
} 