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
  Star,
  Launch,
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
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [bonusReceivedToday, setBonusReceivedToday] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || null;

  // localStorageのadminフラグ取得
  const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('admin') === 'true';

  // 画像読み込み状態を管理する関数
  const setImageLoading = (imageId: string, isLoading: boolean) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [imageId]: isLoading
    }));
  };



  // 最新情報を取得する関数
  const fetchLatestNews = async () => {
    console.log('📡 Fetching latest news from AOIROSERVER...');
    try {
      const res = await fetch(
        `https://aoiroserver.tokyo/wp-json/wp/v2/posts?_embed&per_page=3&orderby=date&order=desc&_=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('AOIROSERVER公式サイトからの最新情報:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        const items = await Promise.all(data.map(async (post: any) => {
          let imageUrl = "";
          
          // デバッグ用：投稿データの構造を確認
          console.log('投稿データ:', {
            id: post.id,
            title: post.title.rendered,
            featured_media: post.featured_media,
            _embedded: post._embedded ? '存在' : 'なし'
          });
          
          // 方法1: _embeddedから画像を取得
          if (post._embedded && post._embedded["wp:featuredmedia"] && post._embedded["wp:featuredmedia"].length > 0) {
            const media = post._embedded["wp:featuredmedia"][0];
            console.log('埋め込みメディアデータ:', media);
            
            // 複数のサイズから最適な画像を選択
            if (media.media_details && media.media_details.sizes) {
              imageUrl = 
                media.media_details.sizes.medium_large?.source_url ||
                media.media_details.sizes.medium?.source_url ||
                media.media_details.sizes.thumbnail?.source_url ||
                media.media_details.sizes.full?.source_url ||
                "";
            } else {
              imageUrl = media.source_url || "";
            }
            
            // URLが相対パスの場合は絶対パスに変換
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `https://aoiroserver.tokyo${imageUrl}`;
            }
            
            console.log('取得した画像URL:', imageUrl);
          }
          
          // 方法2: featured_media IDから直接画像を取得（_embeddedが失敗した場合）
          if (!imageUrl && post.featured_media) {
            console.log('featured_media IDから画像を取得:', post.featured_media);
            try {
              const mediaRes = await fetch(
                `https://aoiroserver.tokyo/wp-json/wp/v2/media/${post.featured_media}?_=${Date.now()}`,
                {
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                }
              );
              
              if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                console.log('個別メディアデータ:', mediaData);
                
                if (mediaData.media_details && mediaData.media_details.sizes) {
                  imageUrl = 
                    mediaData.media_details.sizes.medium_large?.source_url ||
                    mediaData.media_details.sizes.medium?.source_url ||
                    mediaData.media_details.sizes.thumbnail?.source_url ||
                    mediaData.media_details.sizes.full?.source_url ||
                    mediaData.source_url ||
                    "";
                } else {
                  imageUrl = mediaData.source_url || "";
                }
                
                // URLが相対パスの場合は絶対パスに変換
                if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = `https://aoiroserver.tokyo${imageUrl}`;
                }
                
                console.log('個別取得した画像URL:', imageUrl);
              }
            } catch (error) {
              console.error('個別メディア取得エラー:', error);
            }
          }
          
          // 方法3: 投稿の内容から画像を探す（featured_mediaがない場合）
          if (!imageUrl) {
            console.log('投稿内容から画像を探す');
            const content = post.content?.rendered || "";
            const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
            if (imgMatch) {
              imageUrl = imgMatch[1];
              // URLが相対パスの場合は絶対パスに変換
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `https://aoiroserver.tokyo${imageUrl}`;
              }
              console.log('投稿内容から取得した画像URL:', imageUrl);
            }
          }
          
          // 方法4: デフォルト画像を設定（必ず画像を表示）
          if (!imageUrl || imageUrl === "") {
            imageUrl = "https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png";
            console.log('デフォルト画像を使用');
          }
          
          // 画像URLの検証と修正
          console.log('最終的な画像URL:', imageUrl);
          console.log('投稿の個別URL:', post.link);
          
          // 画像URLが有効かチェック
          if (imageUrl && imageUrl !== "https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png") {
            try {
              const imgCheck = await fetch(imageUrl, { method: 'HEAD' });
              if (!imgCheck.ok) {
                console.log('画像URLが無効です。デフォルト画像を使用:', imageUrl);
                imageUrl = "https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png";
              }
            } catch (error) {
              console.log('画像URLチェックエラー。デフォルト画像を使用:', error);
              imageUrl = "https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png";
            }
          } else if (!imageUrl) {
            // imageUrlが空の場合はデフォルト画像を設定
            imageUrl = "https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png";
            console.log('imageUrlが空のため、デフォルト画像を使用');
          }
          
          return {
            id: post.id.toString(),
            title: post.title.rendered,
            date: new Date(post.date).toLocaleDateString("ja-JP"),
            imageUrl,
            url: post.link, // 各投稿の個別ページURL
          };
        }));
        
        setNews(items);
        console.log('✅ Latest news updated successfully');
      } else {
        // 公式サイトからデータが取得できない場合のフォールバック
        console.log('AOIROSERVER公式サイトからデータが取得できません。フォールバックデータを表示します。');
        setNews([
          {
            id: '1',
            title: '【🚨注意喚起】Discordグループ「OZEU」によるAOIROSERVER Discordの荒らし行為について',
            date: '2025.07.16',
            imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
            url: 'https://aoiroserver.tokyo/2025/07/16/%e3%80%90%f0%9f%9a%a8%e6%b3%a8%e6%84%8f%e5%96%9a%e8%b5%b7%e3%80%91discord%e3%82%b0%e3%83%ab%e3%83%bc%e3%83%97%e3%80%8cozeu%e3%80%8d%e3%81%ab%e3%82%88%e3%82%8baoiroserver%e3%81%ae%e8%8d%92%e3%82%89/',
          },
          {
            id: '2',
            title: '浜松駅完成',
            date: '2025.06.07',
            imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
            url: 'https://aoiroserver.tokyo/2025/06/07/%e6%b5%9c%e6%9d%be%e9%a7%85%e5%ae%8c%e6%88%90/',
          },
          {
            id: '3',
            title: '新宿駅作成過程',
            date: '2025.05.10',
            imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
            url: 'https://aoiroserver.tokyo/2025/05/10/%e6%96%b0%e5%ae%bf%e9%a7%85%e4%bd%9c%e6%88%90%e9%81%8e%e7%a8%8b/',
          }
        ]);
      }
    } catch (error) {
      console.error('❌ Error fetching latest news:', error);
      // エラー時もフォールバックデータを表示
      setNews([
        {
          id: '1',
          title: '【🚨注意喚起】Discordグループ「OZEU」によるAOIROSERVER Discordの荒らし行為について',
          date: '2025.07.16',
          imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
          url: 'https://aoiroserver.tokyo/2025/07/16/%e3%80%90%f0%9f%9a%a8%e6%b3%a8%e6%84%8f%e5%96%9a%e8%b5%b7%e3%80%91discord%e3%82%b0%e3%83%ab%e3%83%bc%e3%83%97%e3%80%8cozeu%e3%80%8d%e3%81%ab%e3%82%88%e3%82%8baoiroserver%e3%81%ae%e8%8d%92%e3%82%89/',
        },
        {
          id: '2',
          title: '浜松駅完成',
          date: '2025.06.07',
          imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
          url: 'https://aoiroserver.tokyo/2025/06/07/%e6%b5%9c%e6%9d%be%e9%a7%85%e5%ae%8c%e6%88%90/',
        },
        {
          id: '3',
          title: '新宿駅作成過程',
          date: '2025.05.10',
          imageUrl: 'https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png',
          url: 'https://aoiroserver.tokyo/2025/05/10/%e6%96%b0%e5%ae%bf%e9%a7%85%e4%bd%9c%e6%88%90%e9%81%8e%e7%a8%8b/',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ボーナス受け取り状況を初回取得（GETリクエストで状態確認）
  useEffect(() => {
    const checkBonus = async () => {
      if (!user) {
        console.log('❌ No user available for bonus check');
        setBonusMessage(null);
        setUserPoints(null);
        setBonusLoading(false);
        return;
      }
      
      // 今日の日付を確認（デバッグ用）
      const today = new Date().toLocaleDateString('ja-JP', { 
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      console.log('📅 Today\'s date (JST):', today);
      
      console.log('🔍 Checking bonus status for user:', user.email);
      
      try {
        const res = await fetch("/api/login-bonus-fallback", { 
          method: "GET",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        
        if (!res.ok) {
          console.error('❌ Initial bonus check error:', data);
          return;
        }
        
        if (data.received) {
          setBonusReceivedToday(true);
          console.log('✅ Bonus already received today');
        } else {
          setBonusReceivedToday(false);
          console.log('✅ Bonus available for today');
        }
        
        // ボーナスメッセージも設定
        if (data.message) {
          setBonusMessage(data.message);
        }
        
        console.log('📋 Final bonus state:', {
          receivedToday: data.received,
          message: data.message
        });
      } catch (error) {
        console.error('❌ Initial bonus check fetch error:', error);
      }
    };
    checkBonus();
  }, [user]);

  // ページがフォーカスされた時にボーナス状態を再確認（GETリクエスト）
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('🔄 Page focused, rechecking bonus status...');
        const checkBonus = async () => {
          try {
            // 今日の日付を確認（デバッグ用）
            const today = new Date().toLocaleDateString('ja-JP', { 
              timeZone: 'Asia/Tokyo',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\//g, '-');
            console.log('📅 Today\'s date (JST) on focus:', today);
            
            const res = await fetch("/api/login-bonus-fallback", { 
              method: "GET",
              credentials: "include",
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            const data = await res.json();
            
            if (res.ok) {
              if (data.received) {
                setBonusReceivedToday(true);
                console.log('✅ Bonus status updated: already received');
              } else {
                setBonusReceivedToday(false);
                console.log('✅ Bonus status updated: available');
              }
              
              if (data.message) {
                setBonusMessage(data.message);
              }
            }
          } catch (error) {
            console.error('❌ Error rechecking bonus status:', error);
          }
        };
        checkBonus();
      }
      
      // 最新情報も再取得
      console.log('🔄 Page focused, rechecking latest news...');
      fetchLatestNews();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // ユーザープロフィール取得
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      console.log('🔍 Fetching user profile for:', user.email);
      
      try {
        const res = await fetch("/api/user-profile-secure");
        const data = await res.json();
        
        console.log('📋 Profile response:', {
          hasProfile: !!data.profile,
          points: data.profile?.points,
          error: data.error
        });
        
        if (!res.ok) {
          console.error('❌ Profile fetch error:', data);
          return;
        }
        
        if (data.profile) {
          if (typeof data.profile.points === 'number') {
            setUserPoints(data.profile.points);
            console.log('✅ Points updated:', data.profile.points);
          } else {
            console.log('⚠️ No points column in profile, setting to 0');
            setUserPoints(0);
          }
        } else {
          console.log('⚠️ No profile found');
          setUserPoints(null);
        }
      } catch (error) {
        console.error('❌ Profile fetch error:', error);
        setUserPoints(null);
      }
    };
    fetchProfile();
  }, [user, bonusReceivedToday]);

  useEffect(() => {
    // 初回読み込み時に最新情報を取得
    fetchLatestNews();
    
    // 10分ごとに最新情報を更新
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing latest news...');
      fetchLatestNews();
    }, 10 * 60 * 1000); // 10分間隔
    
    return () => {
      clearInterval(intervalId);
    };
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
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3, 
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              {/* ボーナスボタン */}
              <Box sx={{ 
                flex: 1, 
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: 280 }
              }}>
                <Button
                  variant="contained"
                  disabled={bonusReceivedToday || bonusLoading}
                  onClick={async () => {
                    setBonusLoading(true);
                    try {
                      const res = await fetch("/api/login-bonus-fallback", { 
                        method: "POST", 
                        credentials: "include",
                        headers: {
                          'Content-Type': 'application/json',
                          'Cache-Control': 'no-cache',
                          'Pragma': 'no-cache'
                        }
                      });
                      const data = await res.json();
                      
                      if (!res.ok) {
                        console.error('❌ Login bonus API error:', data);
                        const errorMessage = data.error || 'ログインボーナスの取得に失敗しました';
                        const details = data.details ? ` (${data.details})` : '';
                        const suggestion = data.suggestion ? `\n\n対処法: ${data.suggestion}` : '';
                        setBonusMessage(`エラー: ${errorMessage}${details}${suggestion}`);
                        return;
                      }
                      
                      if (data.received) {
                        setBonusMessage(data.message || "本日のログインボーナスはすでに受け取り済みです (+100P)");
                        setBonusReceivedToday(true);
                        // プロフィールを再取得してポイントを更新
                        const profileRes = await fetch("/api/user-profile-secure");
                        const profileData = await profileRes.json();
                        if (profileData.profile && typeof profileData.profile.points === 'number') {
                          setUserPoints(profileData.profile.points);
                        }
                      } else if (data.message) {
                        setBonusMessage(data.message);
                        setBonusReceivedToday(true);
                        // プロフィールを再取得してポイントを更新
                        console.log('🔄 Refreshing user profile after bonus...');
                        const profileRes = await fetch("/api/user-profile-secure");
                        const profileData = await profileRes.json();
                        console.log('📋 Profile refresh result:', profileData);
                        if (profileData.profile && typeof profileData.profile.points === 'number') {
                          setUserPoints(profileData.profile.points);
                          console.log('✅ Points updated after bonus:', profileData.profile.points);
                        } else {
                          console.log('⚠️ No points found in refreshed profile');
                        }
                      } else {
                        setBonusMessage("ログインボーナスの取得に失敗しました");
                      }
                    } catch (error) {
                      console.error('❌ Login bonus fetch error:', error);
                      setBonusMessage("ログインボーナスの取得中にエラーが発生しました");
                    } finally {
                      setBonusLoading(false);
                    }
                  }}
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    py: { xs: 2, sm: 2.5 },
                    px: { xs: 3, sm: 4 },
                    borderRadius: 2.5,
                    background: bonusReceivedToday 
                      ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
                      : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#333',
                    transition: 'all 0.3s ease',
                    boxShadow: bonusReceivedToday 
                      ? '0 2px 8px rgba(108, 117, 125, 0.3)'
                      : '0 8px 24px rgba(255, 215, 0, 0.4)',
                    minWidth: { xs: '100%', sm: 280 },
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': {
                      background: bonusReceivedToday 
                        ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
                        : 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
                      boxShadow: bonusReceivedToday 
                        ? '0 2px 8px rgba(108, 117, 125, 0.3)'
                        : '0 12px 32px rgba(255, 215, 0, 0.5)',
                      transform: bonusReceivedToday ? 'none' : 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: bonusReceivedToday ? 'none' : 'translateY(0)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                      color: '#fff',
                      cursor: 'not-allowed',
                    }
                  }}
                  startIcon={
                    bonusLoading ? (
                      <CircularProgress size={20} sx={{ color: '#333' }} />
                    ) : (
                      <Star 
                        sx={{ 
                          color: '#333', 
                          fontSize: { xs: 20, sm: 22 },
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                        }} 
                      />
                    )
                  }
                >
                  {bonusReceivedToday 
                    ? "本日分は受け取り済み" 
                    : bonusLoading 
                      ? "取得中..." 
                      : "ログインボーナスをゲット (+100P)"
                  }
                </Button>
              </Box>

              {/* ポイント表示 */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2.5,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  minWidth: { xs: '100%', sm: 120 },
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: 'center'
                }}
              >
                <Star 
                  sx={{ 
                    color: '#FFD700', 
                    fontSize: { xs: 20, sm: 22 },
                    filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.5))'
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#fff',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' }
                  }}
                >
                  {userPoints !== null ? userPoints : "-"}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }}
                >
                  P
                </Typography>
              </Box>
            </Box>
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
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative"
                      }}
                    >
                      {item.imageUrl && item.imageUrl !== "https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png" ? (
                        <>
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover",
                              minWidth: "100%",
                              minHeight: "100%",
                              transition: "opacity 0.3s ease"
                            }}
                            onError={e => {
                              console.log('画像読み込みエラー:', e.currentTarget?.src);
                              if (e.currentTarget) {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://aoiroserver.tokyo/wp-content/uploads/2025/01/aoiroserver-logo.png";
                              }
                              setImageLoading(item.id, false);
                            }}
                            onLoad={(e) => {
                              console.log('画像読み込み成功:', item.title, 'URL:', e.currentTarget?.src);
                              setImageLoading(item.id, false);
                            }}
                            onLoadStart={() => {
                              console.log('画像読み込み開始:', item.title);
                              setImageLoading(item.id, true);
                              
                              // 5秒後にタイムアウト
                              setTimeout(() => {
                                setImageLoading(item.id, false);
                              }, 5000);
                            }}
                          />
                          {/* 画像読み込み中のインジケーター */}
                          {imageLoadingStates[item.id] && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "rgba(0,0,0,0.1)"
                              }}
                            >
                              <CircularProgress size={20} />
                            </Box>
                          )}
                        </>
                      ) : (
                        // サムネイル画像がない場合はInfoOutlinedを表示
                        <InfoOutlined 
                          sx={{ 
                            fontSize: 40, 
                            color: '#666',
                            opacity: 0.7
                          }} 
                        />
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
              onClick={() => router.push('/release-notes')}
            >
              リリースノート
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

        {/* Discordコミュニティ */}
        <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ color: '#212529', mt: 4 }}>
          Discordコミュニティ
        </Typography>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
          color: 'white',
          borderRadius: 4,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': { 
            transform: 'translateY(-4px)', 
            boxShadow: '0 12px 40px rgba(88, 101, 242, 0.4)',
            '& .discord-glow': {
              opacity: 1,
              transform: 'scale(1.1)'
            }
          },
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* 装飾的な光の効果 */}
          <Box className="discord-glow" sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            opacity: 0,
            transition: 'all 0.4s ease'
          }} />
          
          <Box sx={{ 
            p: { xs: 3, sm: 4 }, 
            textAlign: 'center', 
            position: 'relative', 
            zIndex: 1 
          }}>
            <Box sx={{ 
              width: { xs: 50, sm: 60 }, 
              height: { xs: 50, sm: 60 }, 
              mb: { xs: 2, sm: 3 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              backdropFilter: 'blur(10px)'
            }}>
              <svg width={40} height={40} viewBox="0 0 24 24" fill="white" style={{ width: '60%', height: '60%' }}>
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
              </svg>
            </Box>
            <Typography variant="h5" fontWeight="bold" mb={2} sx={{ 
              background: 'linear-gradient(45deg, #fff, #e3f2fd)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            }}>
              Discord
            </Typography>
            <Typography variant="body1" sx={{ 
              mb: { xs: 2, sm: 3 }, 
              opacity: 0.9, 
              fontWeight: 500,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}>
              コミュニティに参加して、他のユーザーや開発者と交流しましょう
            </Typography>
            
            {/* オシャレな参加ボタン */}
            <Button
              variant="contained"
              onClick={() => window.open('https://discord.com/invite/U9DVtc2y5J', '_blank')}
              sx={{
                background: 'linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '25px',
                px: { xs: 3, sm: 4 },
                py: { xs: 1, sm: 1.5 },
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                textTransform: 'none',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2))',
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 25px rgba(255,255,255,0.3)'
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s'
                },
                '&:hover:before': {
                  left: '100%'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              startIcon={<Launch sx={{ fontSize: { xs: 16, sm: 18 } }} />}
            >
              サーバーに参加
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
} 