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
  Snackbar,
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
  Person,
  MonetizationOn,
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
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [bonusReceivedToday, setBonusReceivedToday] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || null;

  // localStorageのadminフラグ取得
  const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';

  // ボーナス受け取り状況を初回取得
  useEffect(() => {
    const checkBonus = async () => {
      if (!user) return;
      const res = await fetch("/api/login-bonus", { method: "POST" });
      const data = await res.json();
      if (data.received) setBonusReceivedToday(true);
    };
    checkBonus();
  }, [user]);

  // ユーザープロフィール取得
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const res = await fetch("/api/user-profile");
      const data = await res.json();
      if (data.profile && typeof data.profile.points === 'number') {
        setUserPoints(data.profile.points);
      }
    };
    fetchProfile();
  }, [user, bonusReceivedToday]);

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
    <Box sx={{ p: 0, background: "#f7f8fa", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <Box className="page-header">
        <Box className="page-title">
          <Settings className="page-title-icon" />
          <Typography className="page-title-text">その他</Typography>
        </Box>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ p: 2 }}>
        {/* アカウント欄 */}
        <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "#4A90E2", color: "#fff", fontWeight: "bold" }}
              src={avatarUrl || undefined}
            >
              {!avatarUrl && <Person sx={{ fontSize: 32 }} />}
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
                <Box 
                  onClick={() => router.push("/login")} 
                  sx={{ 
                    cursor: "pointer",
                    p: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    }
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      letterSpacing: '0.3px',
                      mb: 0.5
                    }}
                  >
                    AOIRO IDにログイン
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.9rem',
                      letterSpacing: '0.2px'
                    }}
                  >
                    アカウントを作成して、より便利に
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

        {/* ログインボーナスボタン */}
        {user && !authLoading && (
          <Card sx={{ mb: 3, borderRadius: 3, p: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<MonetizationOn sx={{ color: '#FFD700', fontSize: 28 }} />}
              disabled={bonusReceivedToday || bonusLoading}
              onClick={async () => {
                setBonusLoading(true);
                const res = await fetch("/api/login-bonus", { method: "POST", credentials: "include" });
                const data = await res.json();
                if (!data.received && data.message) {
                  setBonusMessage(data.message);
                  setBonusReceivedToday(true);
                } else if (data.received) {
                  setBonusMessage("本日のログインボーナスはすでに受け取り済みです");
                } else {
                  setBonusMessage("ログインボーナスの取得に失敗しました");
                }
                setBonusLoading(false);
              }}
              sx={{
                fontWeight: 700,
                fontSize: '1.2rem',
                py: 2,
                px: 4,
                borderRadius: 4,
                boxShadow: '0 4px 24px rgba(255, 215, 0, 0.15)',
                background: 'linear-gradient(90deg, #FFD700 0%, #FFB300 100%)',
                color: '#333',
                letterSpacing: '0.05em',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #FFB300 0%, #FFD700 100%)',
                  boxShadow: '0 8px 32px rgba(255, 215, 0, 0.25)',
                  transform: 'translateY(-2px) scale(1.04)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                minWidth: 220,
              }}
            >
              {bonusReceivedToday ? "本日分は受け取り済み" : bonusLoading ? "取得中..." : "ログインボーナスをゲット"}
            </Button>
            <Typography variant="h6" sx={{ ml: 2, minWidth: 60, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MonetizationOn sx={{ color: '#FFD700', fontSize: 28, verticalAlign: 'middle' }} />
              {userPoints !== null ? userPoints : "-"}
            </Typography>
          </Card>
        )}

        <Snackbar
          open={!!bonusMessage}
          autoHideDuration={6000}
          onClose={() => setBonusMessage(null)}
          message={bonusMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />

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
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<NotificationsNone sx={{ color: "#4A90E2", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/settings/notification')}
            >
              通知設定
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Palette sx={{ color: "#50C878", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/settings/display')}
            >
              表示設定
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Shield sx={{ color: "#FF6B6B", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/settings/privacy')}
            >
              プライバシー
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<AccountCircle sx={{ color: "#4A90E2", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
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
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<HelpOutline sx={{ color: "#9B59B6", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/help')}
            >
              ヘルプ
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Email sx={{ color: "#F1C40F", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/contact')}
            >
              お問い合わせ
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Info sx={{ color: "#3498DB", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/about')}
            >
              アプリについて
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Cloud sx={{ color: "#4A90E2", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/status')}
            >
              稼働状況
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 