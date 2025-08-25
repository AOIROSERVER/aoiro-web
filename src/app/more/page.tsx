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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
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
  Send,
  Close,
  LocalActivity,
  Schedule,
  EmojiEvents,
  CheckCircle,
  Assignment,
  Train,
  ChevronRight,
  ShoppingCart,
  Inventory,
  CreditCard,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { vibrateActions, createVibrateOnClick, VIBRATION_PATTERNS } from "@/lib/vibration";
import { getActiveQuests, getQuestsWithProgress, type QuestWithTasks, type QuestWithProgress } from "@/lib/supabase";

// ニュース記事型
type NewsItem = {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  url: string;
};

// クエスト型（Supabaseの型を拡張）
type QuestItem = QuestWithProgress & {
  progress: number;
  maxProgress: number;
  completed: boolean;
};

export default function MorePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [isSupremeAdmin, setIsSupremeAdmin] = useState(false);
  const [showPointSendDialog, setShowPointSendDialog] = useState(false);
  const [pointSendForm, setPointSendForm] = useState({
    email: '',
    points: '',
    reason: ''
  });
  const [isSendingPoints, setIsSendingPoints] = useState(false);
  const [minecraftAuthStatus, setMinecraftAuthStatus] = useState<'unknown' | 'completed' | 'in-progress' | 'not-started'>('unknown');
  const router = useRouter();
  const { user, signOut, loading: authLoading, isAdmin } = useAuth();

  // ポイント送信処理
  const handleSendPoints = async () => {
    if (!pointSendForm.email.trim() || !pointSendForm.points.trim()) {
      alert('メールアドレスとポイント数を入力してください');
      return;
    }

    const points = parseInt(pointSendForm.points);
    if (isNaN(points) || points <= 0) {
      alert('有効なポイント数を入力してください');
      return;
    }

    if (points > 10000) {
      alert('一度に送信できるポイントは10,000ポイントまでです');
      return;
    }

    setIsSendingPoints(true);

    try {
      console.log('🚀 ポイント送信開始:', {
        targetEmail: pointSendForm.email.trim(),
        points: points,
        reason: pointSendForm.reason.trim() || '管理者からのポイント送信',
        adminEmail: user?.email || 'unknown',
      });

      const response = await fetch('/api/send-points-unified/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetEmail: pointSendForm.email.trim(),
          points: points,
          reason: pointSendForm.reason.trim() || '管理者からのポイント送信',
          adminEmail: user?.email || 'unknown',
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 送信成功:', result);
        alert(`${pointSendForm.email} に ${points} ポイントを送信しました！`);
        setShowPointSendDialog(false);
        setPointSendForm({ email: '', points: '', reason: '' });
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP エラー:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        try {
          const errorData = JSON.parse(errorText);
          alert(`送信に失敗しました: ${errorData.error || '不明なエラー'}`);
        } catch {
          alert(`送信に失敗しました: HTTP ${response.status} - ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('❌ ネットワークエラー:', error);
      console.error('❌ エラー詳細:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      alert(`送信に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSendingPoints(false);
    }
  };

  // 最高権限者チェック（クライアントサイドでのみ実行）
  useEffect(() => {
    const checkSupremeAdmin = () => {
      if (typeof window !== 'undefined') {
        setIsSupremeAdmin(localStorage.getItem('admin') === 'true');
      }
    };
    
    checkSupremeAdmin();
  }, []);

  // デバッグ: 管理者権限の状況をログ出力
  useEffect(() => {
    console.log('🔍 More画面 - 管理者権限状況:', {
      isAdmin,
      user: user ? {
        email: user.email,
        id: user.id
      } : null,
      localStorage_admin: typeof window !== 'undefined' ? localStorage.getItem('admin') : 'undefined',
      authLoading,
      isSupremeAdmin,
      shouldShowCreateButton: isAdmin || isSupremeAdmin
    });
  }, [isAdmin, user, authLoading, isSupremeAdmin]);

  // リアルタイムで管理者権限をチェック
  useEffect(() => {
    const interval = setInterval(() => {
      const localAdminFlag = typeof window !== 'undefined' ? localStorage.getItem('admin') : null;
      console.log('⏰ 定期チェック - 管理者権限状況:', {
        isAdmin,
        localStorageAdmin: localAdminFlag,
        userEmail: user?.email || 'null',
        timestamp: new Date().toLocaleTimeString()
      });
    }, 5000); // 5秒ごとにチェック

    return () => clearInterval(interval);
  }, [isAdmin, user]);

  // ページロード時にlocalStorageを強制チェック
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminFlag = localStorage.getItem('admin');
      console.log('📱 More画面ロード時 - localStorage admin flag:', adminFlag);
      
      // adminフラグがあるがisAdminがfalseの場合、強制的にtrueにする
      if (adminFlag === 'true' && !isAdmin) {
        console.log('🔧 管理者フラグが検出されました。AuthContextに再通知します。');
        // localStorage change イベントを発火させて、AuthContextに通知
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'admin',
          newValue: 'true',
          oldValue: null
        }));
      }
    }
  }, [isAdmin]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [bonusReceivedToday, setBonusReceivedToday] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || null;

  // クエストアイコンを取得するヘルパー関数
  const getQuestIcon = (iconType: string) => {
    switch (iconType) {
      case 'login':
        return <Login sx={{ fontSize: 24 }} />;
      case 'train':
        return <Train sx={{ fontSize: 24 }} />;
      case 'profile':
        return <Person sx={{ fontSize: 24 }} />;
      case 'notification':
        return <NotificationsNone sx={{ fontSize: 24 }} />;
      case 'explore':
        return <Info sx={{ fontSize: 24 }} />;
      default:
        return <Assignment sx={{ fontSize: 24 }} />;
    }
  };

  // クエストカテゴリの色を取得するヘルパー関数
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily':
        return '#4A90E2';
      case 'weekly':
        return '#7B68EE';
      case 'special':
        return '#FF6B6B';
      default:
        return '#4A90E2';
    }
  };

  // クエストカテゴリの洗練されたデザインを取得するヘルパー関数
  const getCategoryDesign = (category: string, difficulty: string) => {
    const baseColor = getCategoryColor(category);
    
    switch (category) {
      case 'daily':
        return {
          background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
          borderColor: '#667eea',
          accentColor: '#667eea'
        };
      case 'weekly':
        return {
          background: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`,
          borderColor: '#f093fb',
          accentColor: '#f093fb'
        };
      case 'special':
        return {
          background: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`,
          borderColor: '#4facfe',
          accentColor: '#4facfe'
        };
      default:
        return {
          background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
          borderColor: '#667eea',
          accentColor: '#667eea'
        };
    }
  };

  // 難易度に応じたアクセントを取得
  const getDifficultyAccent = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { color: '#10b981', label: '簡単' };
      case 'medium':
        return { color: '#f59e0b', label: '普通' };
      case 'hard':
        return { color: '#ef4444', label: '難しい' };
      default:
        return { color: '#10b981', label: '簡単' };
    }
  };

  // 期限ベースの進行率を計算するヘルパー関数
  const calculateDeadlineProgress = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) {
      return { progress: 0, isExpired: false, timeLeft: '' };
    }

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 終了日は23:59:59まで有効（isQuestExpiredと統一）
    end.setHours(23, 59, 59, 999);
    
    // 日付の妥当性チェック
    if (start >= end) {
      return { progress: 0, isExpired: false, timeLeft: '期限設定エラー' };
    }

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    // 開始前の場合
    if (elapsed < 0) {
      const timeUntilStart = Math.abs(elapsed);
      const daysUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60 * 24));
      return { 
        progress: 0, 
        isExpired: false, 
        timeLeft: `開始まであと${daysUntilStart}日` 
      };
    }
    
    // 期限後の場合
    if (now > end) {
      const overdue = now.getTime() - end.getTime();
      const daysOverdue = Math.floor(overdue / (1000 * 60 * 60 * 24));
      return { 
        progress: 100, 
        isExpired: true, 
        timeLeft: `期限切れ（${daysOverdue}日経過）` 
      };
    }
    
    // 期間中の場合
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const remaining = end.getTime() - now.getTime();
    const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(remaining / (1000 * 60 * 60));
    
    let timeLeftText = '';
    if (daysLeft > 1) {
      timeLeftText = `あと${daysLeft}日`;
    } else if (daysLeft === 1) {
      timeLeftText = `あと1日`;
    } else if (hoursLeft > 1) {
      timeLeftText = `あと${hoursLeft}時間`;
    } else {
      timeLeftText = `まもなく期限`;
    }
    
    return { 
      progress: progressPercent, 
      isExpired: false, 
      timeLeft: timeLeftText 
    };
  };



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
              console.error('個別メディア取得エラー:', error instanceof Error ? error.message : String(error));
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
              console.log('画像URLチェックエラー。デフォルト画像を使用:', error instanceof Error ? error.message : String(error));
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
      console.error('❌ Error fetching latest news:', error instanceof Error ? error.message : String(error));
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

  // ログインボーナス処理関数
  const handleLoginBonus = async () => {
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
      console.error('❌ Login bonus fetch error:', error instanceof Error ? error.message : String(error));
      setBonusMessage("ログインボーナスの取得中にエラーが発生しました");
    } finally {
      setBonusLoading(false);
    }
  };

  // 強制クエスト表示（最高権限者用）
    // 管理者用デバッグクエストを生成する関数
  const generateDebugQuests = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return [
      {
        id: 'debug-admin-' + Date.now(),
        title: '🔧 デバッグ用クエスト',
        description: 'Supabaseからデータが取得できない場合の緊急表示',
                      detailed_description: 'これは管理者用のデバッグクエストです。',
        reward: '999ポイント',
        progress: 1,
        maxProgress: 1,
        completed: true,
        category: 'special',
        icon: 'assignment',
        estimatedTime: '即座に',
        difficulty: 'easy',
        tasks: [],
        start_date: today.toISOString().split('T')[0],
        end_date: tomorrow.toISOString().split('T')[0],
        background_image: 'https://picsum.photos/320/220?random=debug' // デバッグ用背景画像
      }
    ];
  };

  // クエスト初期化（メイン処理）
  useEffect(() => {
    const initializeQuests = async () => {
      console.log('🎮 クエスト初期化開始...');
      
      try {
        console.log('📊 Supabaseからクエストデータを取得中...');
        let questsData: any[]; // 一時的に any 型を使用して型エラーを回避
        
        if (user) {
          // ログイン済み: 進行状況付きでクエスト取得
          console.log('👤 ログイン済みユーザー - 進行状況付きクエスト取得');
          questsData = await getQuestsWithProgress(user.id);
        } else {
          // 未ログイン: 基本的なクエスト一覧を取得
          console.log('👤 未ログインユーザー - 基本クエスト取得');
          questsData = await getActiveQuests();
        }
        console.log('✅ クエスト取得完了:', questsData.length, '件');
        
        // デバッグ: 取得したクエストの詳細をログ出力
        questsData.forEach((quest, index) => {
          console.log(`📋 クエスト ${index + 1}:`, {
            id: quest.id,
            title: quest.title,
            category: quest.category,
            difficulty: quest.difficulty,
            is_active: quest.is_active,
            start_date: quest.start_date,
            end_date: quest.end_date,
            tasks_count: quest.tasks?.length || 0
          });
        });

        // 期限切れクエストを除外する関数（より正確な時間判定）
        const isQuestExpired = (quest: any) => {
          if (!quest.end_date) return false; // 期限が設定されていない場合は期限切れではない
          
          const now = new Date();
          const endDate = new Date(quest.end_date);
          
          // 終了日は23:59:59まで有効（秒単位での正確な判定）
          endDate.setHours(23, 59, 59, 999);
          
          return now > endDate;
        };

        // 期限切れクエストを除外
        const activeQuestsData = questsData.filter(quest => {
          const expired = isQuestExpired(quest);
          if (expired) {
            console.log('⏰ 期限切れクエストを除外:', quest.title, '期限:', quest.end_date);
          }
          return !expired;
        });

        // QuestItemに変換（安全なプロパティアクセス）
        const questItems: QuestItem[] = activeQuestsData.map((quest: any) => {
          // user_progress プロパティの存在を安全にチェック
          const userProgress = quest.user_progress || null;
          
          return {
            ...quest,
            progress: userProgress?.progress || 0,
            maxProgress: userProgress?.max_progress || quest.tasks?.length || 1,
            completed: userProgress?.completed || false
          };
        });

        console.log('🎯 期限切れ除外後のクエスト:', questItems.length, '件');
        console.log('📝 クエスト詳細:', questItems.map(q => ({ 
          id: q.id, 
          title: q.title, 
          category: q.category,
          background_image: q.background_image || 'なし',
          created_at: q.created_at
        })));
        
        if (questItems.length > 0) {
          // 実際のクエストデータが存在する場合
          console.log('✅ 実際のクエストデータを表示:', questItems.length, '件');
          setQuests(questItems);
        } else {
          // クエストが0件の場合、デバッグ用クエストを表示
          console.log('⚠️ クエストが0件 - デバッグ用クエストを表示');
          
          // 期限付きのテストデータを生成
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          const mockQuests: QuestItem[] = [
            {
              id: 'admin-1',
              title: '🔑 最高権限者ログイン完了',
              description: '管理者としてシステムに正常にアクセスしました',
              detailed_description: '最高権限者アカウントでのログインが完了し、全ての機能にアクセス可能です。',
              reward: '999ポイント',
              progress: 1,
              maxProgress: 1,
              completed: true,
              category: 'special',
              icon: 'assignment',
              estimated_time: '即座に',
              difficulty: 'easy',
              tasks: [],
              start_date: yesterday.toISOString().split('T')[0],
              end_date: tomorrow.toISOString().split('T')[0],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'admin-2',
              title: '🎮 クエストシステム動作確認',
              description: 'クエスト機能が正常に動作していることを確認',
              detailed_description: 'クエストの表示、作成、管理機能が正常に動作しています。',
              reward: '500ポイント',
              progress: 2,
              maxProgress: 3,
              completed: false,
              category: 'daily',
              icon: 'star',
              estimated_time: '5分',
              difficulty: 'easy',
              tasks: [],
              start_date: today.toISOString().split('T')[0],
              end_date: tomorrow.toISOString().split('T')[0],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'admin-3',
              title: '⚙️ システム管理権限テスト',
              description: '管理者権限でシステム機能をテストする',
              detailed_description: 'システム管理機能、ユーザー管理、データベース操作等の権限を確認します。',
              reward: '1000ポイント',
              progress: 0,
              maxProgress: 1,
              completed: false,
              category: 'special',
              icon: 'emoji_events',
              estimated_time: '30分',
              difficulty: 'medium',
              tasks: [],
              start_date: today.toISOString().split('T')[0],
              end_date: nextMonth.toISOString().split('T')[0],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'admin-4',
              title: '🚀 新機能開発',
              description: 'システムの新機能開発とテストを実行',
              detailed_description: '新しい機能の開発、テスト、デプロイを管理者権限で実行します。',
              reward: '750ポイント',
              progress: 1,
              maxProgress: 5,
              completed: false,
              category: 'weekly',
              icon: 'star',
              estimated_time: '2時間',
              difficulty: 'hard',
              tasks: [],
              start_date: today.toISOString().split('T')[0],
              end_date: nextWeek.toISOString().split('T')[0],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setQuests(mockQuests);
        }
      } catch (error) {
        console.error('❌ クエスト取得エラー:', error instanceof Error ? error.message : String(error));
        console.error('🔍 エラー詳細:', error instanceof Error ? error.message : 'Unknown error');
        
        // 管理者の場合はエラー時でもモックデータを表示
        if (isAdmin) {
          console.log('🔧 管理者アカウント - エラー時でもモックデータを表示');
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          const emergencyQuests: QuestItem[] = [
            {
              id: 'emergency-1',
              title: '🚨 緊急管理者クエスト',
              description: 'データベース接続エラーのため緊急表示中',
              detailed_description: 'システム管理者用の緊急クエストです',
              reward: '999ポイント',
              progress: 0,
              maxProgress: 1,
              completed: false,
              category: 'special',
              icon: 'assignment',
              estimated_time: '即座に',
              difficulty: 'easy',
              tasks: [],
              start_date: today.toISOString().split('T')[0],
              end_date: tomorrow.toISOString().split('T')[0],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'emergency-2',
              title: '🔧 システム復旧クエスト',
              description: 'クエストシステムの復旧を行う',
              detailed_description: 'システム復旧用のテストクエストです',
              reward: '500ポイント',
              progress: 0,
              maxProgress: 3,
              completed: false,
              category: 'weekly',
              icon: 'star',
              estimated_time: '30分',
              difficulty: 'medium',
              tasks: [],
              start_date: today.toISOString().split('T')[0],
              end_date: nextWeek.toISOString().split('T')[0],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          setQuests(emergencyQuests);
        } else {
          // 一般ユーザーはエラー時はクエストを非表示
          setQuests([]);
        }
      }
    };

    initializeQuests();
  }, [user]);

  // 最終フォールバック: 無効化（実際のクエストデータを優先表示するため）
  // useEffect(() => {
  //   const checkQuests = () => {
  //     if (user && quests.length === 0) {
  //       console.log('🚨 最終フォールバック: クエストが空です - 緊急表示');
  //       
  //       const today = new Date();
  //       const emergencyQuests: QuestItem[] = [
  //         {
  //           id: 'emergency-' + Date.now(),
  //           title: '⚡ 緊急クエスト復旧',
  //           description: '最高権限者として緊急アクセス中',
  //           detailedDescription: 'システム復旧中につき緊急表示されています。',
  //           reward: '∞ポイント',
  //           progress: 1,
  //           maxProgress: 1,
  //           completed: true,
  //           category: 'special',
  //           icon: 'assignment',
  //           estimatedTime: '即座に',
  //           difficulty: 'easy',
  //           tasks: [],
  //           start_date: today.toISOString().split('T')[0],
  //           end_date: today.toISOString().split('T')[0]
  //         }
  //       ];
  //       
  //       setQuests(emergencyQuests);
  //       console.log('✅ 緊急クエストを設定しました');
  //     }
  //   };
  //   
  //   // 3秒後にチェック実行
  //   const timeoutId = setTimeout(checkQuests, 3000);
  //   return () => clearTimeout(timeoutId);
  // }, [user, quests.length]);

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
        console.error('❌ Initial bonus check fetch error:', error instanceof Error ? error.message : String(error));
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
            console.error('❌ Error rechecking bonus status:', error instanceof Error ? error.message : String(error));
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
        console.error('❌ Profile fetch error:', error instanceof Error ? error.message : String(error));
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

  // 期限切れクエストの即座削除機能
  useEffect(() => {
    if (!user || quests.length === 0) return;

    // 期限切れクエストをチェックする関数
    const checkExpiredQuests = () => {
      const now = new Date();
      const expiredQuestIds: string[] = [];
      
      const activeQuests = quests.filter(quest => {
        // end_dateがない場合は期限なしとして保持
        if (!quest.end_date) return true;
        
        const endDate = new Date(quest.end_date);
        endDate.setHours(23, 59, 59, 999);
        
        const isExpired = now > endDate;
        if (isExpired) {
          expiredQuestIds.push(quest.id);
          console.log('⏰ 期限切れクエストを即座削除:', quest.title, '期限:', quest.end_date);
        }
        
        return !isExpired;
      });

      // 期限切れクエストがあった場合、即座に状態を更新
      if (expiredQuestIds.length > 0) {
        console.log('🗑️ 期限切れクエストを削除中:', expiredQuestIds.length, '件');
        setQuests(activeQuests);
        
        // ユーザーに通知（オプション）
        console.log('✅ 期限切れクエストを削除しました:', expiredQuestIds.length, '件');
      }
    };

    // 初回チェック
    checkExpiredQuests();

    // 1分ごとに期限切れクエストをチェック
    const intervalId = setInterval(() => {
      console.log('🔍 期限切れクエストの定期チェック実行中...');
      checkExpiredQuests();
    }, 60 * 1000); // 1分間隔

    // ページがフォーカスされたときも即座にチェック
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ ページフォーカス復帰 - 期限切れクエストチェック');
        checkExpiredQuests();
      }
    };

    // MCID認証状態の監視
    const checkMinecraftAuthStatus = () => {
      const isCompleted = sessionStorage.getItem('minecraft-auth-completed') === 'true';
      const isInProgress = sessionStorage.getItem('minecraft-auth-flow') === 'true';
      
      console.log('🎮 MCID認証状態チェック:', {
        isCompleted,
        isInProgress,
        timestamp: new Date().toISOString()
      });
      
      // 状態を更新
      if (isCompleted) {
        setMinecraftAuthStatus('completed');
      } else if (isInProgress) {
        setMinecraftAuthStatus('in-progress');
      } else {
        setMinecraftAuthStatus('not-started');
      }
      
      // 状態が変更された場合、ページを再レンダリング
      if (isCompleted || isInProgress) {
        console.log('🔄 MCID認証状態が変更されました');
        // 強制的に再レンダリング
        window.dispatchEvent(new Event('storage'));
      }
    };

    // 初回チェック
    checkMinecraftAuthStatus();

    // 5分ごとにMCID認証状態をチェック
    const minecraftAuthInterval = setInterval(() => {
      checkMinecraftAuthStatus();
    }, 5 * 60 * 1000); // 5分間隔

    // ページがフォーカスされたときもMCID認証状態をチェック
    const handleMinecraftAuthFocus = () => {
      if (!document.hidden) {
        console.log('👁️ ページフォーカス復帰 - MCID認証状態チェック');
        checkMinecraftAuthStatus();
      }
    };

    window.addEventListener('focus', handleMinecraftAuthFocus);
    window.addEventListener('storage', checkMinecraftAuthStatus);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      clearInterval(minecraftAuthInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('focus', handleMinecraftAuthFocus);
      window.removeEventListener('storage', checkMinecraftAuthStatus);
    };
  }, [user, quests]);

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
              ) : isAdmin ? (
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
            {(user || isAdmin) && !loading && (
              <IconButton onClick={createVibrateOnClick(signOut, VIBRATION_PATTERNS.TAP)}>
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
                  onClick={createVibrateOnClick(handleLoginBonus, VIBRATION_PATTERNS.SUCCESS)}
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



        {/* クエスト（常に表示、ただし報告はログイン必須） */}
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#212529' }}>
              クエスト
            </Typography>
            {(isAdmin || isSupremeAdmin) && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Star />}
                  sx={{
                    borderColor: '#4A90E2',
                    color: '#4A90E2',
                    '&:hover': {
                      backgroundColor: '#4A90E2',
                      color: 'white',
                    },
                    borderRadius: 2,
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                  onClick={() => {
                    console.log('🔍 クエスト作成ボタンクリック時 (最高権限者):', {
                      isAdmin,
                      localStorage_admin: localStorage.getItem('admin'),
                      user: user?.email || 'null',
                      isSupabaseAdmin: user?.email === 'aoiroserver.m@gmail.com',
                      showingAsSupremeAdmin: true
                    });
                    router.push('/quest/create');
                  }}
                >
                  クエスト作成
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MonetizationOn />}
                  sx={{
                    borderColor: '#FFA726',
                    color: '#FFA726',
                    '&:hover': {
                      backgroundColor: '#FFA726',
                      color: 'white',
                    },
                    borderRadius: 2,
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                  onClick={() => setShowPointSendDialog(true)}
                >
                  ポイント送信
                </Button>
              </Box>
            )}
          </Box>
        <Box 
          mb={3}
          sx={{
            overflow: 'visible', // 親コンテナも縦方向のオーバーフローを許可
          }}
        >
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'visible', // 縦方向のオーバーフローを表示
              gap: 2,
              pt: 4, // さらに上側のパディングを増やす
              pb: 4, // 下側も増やす
              px: 1,
              mx: -1,
              mt: -2, // 上のパディング分をオフセット
              '::-webkit-scrollbar': {
                height: 8,
              },
              '::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: 4,
              },
              '::-webkit-scrollbar-thumb': {
                backgroundColor: '#c1c1c1',
                borderRadius: 4,
                '&:hover': {
                  backgroundColor: '#a8a8a8',
                },
              },
              // 最初と最後のアイテムにパディングを追加
              '& > *:first-of-type': {
                ml: 1,
              },
              '& > *:last-of-type': {
                mr: 1,
              },
            }}
          >
            {quests.map((quest) => {
              console.log(`🖼️ クエストカード表示: ${quest.title}`, {
                background_image: quest.background_image || 'デフォルト',
                hasBackgroundImage: !!quest.background_image,
                willUseBackgroundImage: !!quest.background_image,
                backgroundImageURL: quest.background_image
              });
              
              return (
              <Card
                key={quest.id}
                sx={{
                  minWidth: 320,
                  maxWidth: 320,
                  height: 220,
                  flexShrink: 0,
                  borderRadius: 3,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  // 背景画像がある場合は使用、ない場合はデフォルトグラデーション
                  ...(quest.background_image ? {
                    backgroundImage: `url(${quest.background_image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#f0f0f0', // フォールバック色
                    backgroundClip: 'border-box', // 背景をボーダーボックス内に制限
                  } : {
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  }),
                  border: `2px solid ${getCategoryDesign(quest.category, quest.difficulty || 'easy').borderColor}20`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  zIndex: 1,
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 20px 40px rgba(0,0,0,0.15)`,
                    zIndex: 10,
                    border: `2px solid ${getCategoryDesign(quest.category, quest.difficulty || 'easy').borderColor}40`,
                  },
                  '&:active': {
                    transform: 'translateY(-2px)',
                    zIndex: 10,
                  },
                }}
                onClick={() => {
                  router.push(`/quest/${quest.id}`);
                }}
              >
                {/* カテゴリバー */}
                <Box
                  sx={{
                    height: 4,
                    background: getCategoryDesign(quest.category, quest.difficulty || 'easy').background,
                    borderTopLeftRadius: 'inherit', // 親要素の角丸を継承
                    borderTopRightRadius: 'inherit', // 親要素の角丸を継承
                  }}
                />

                {/* 完了バッジ */}
                {quest.completed && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <CheckCircle sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                )}
                
                {/* 背景画像の場合のオーバーレイ */}
                {quest.background_image && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.3) 100%)',
                      borderRadius: 'inherit', // 親要素のborderRadiusを継承
                    }}
                  />
                )}

                <Box sx={{ 
                  p: 3, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  position: 'relative',
                  zIndex: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box
                      sx={{
                        background: getCategoryDesign(quest.category, quest.difficulty || 'easy').background,
                        borderRadius: 2,
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {React.cloneElement(getQuestIcon(quest.icon), {
                        sx: { fontSize: 24, color: 'white' }
                      })}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          background: getCategoryDesign(quest.category, quest.difficulty || 'easy').accentColor,
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: 10,
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {quest.category}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          background: getDifficultyAccent(quest.difficulty || 'easy').color,
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: 10,
                          fontWeight: 'bold',
                        }}
                      >
                        {getDifficultyAccent(quest.difficulty || 'easy').label}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      color="#1f2937"
                      sx={{ 
                        fontSize: 18,
                        lineHeight: 1.3,
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        textShadow: quest.background_image ? '0px 0px 4px rgba(255,255,255,0.8), 0px 1px 2px rgba(0,0,0,0.3)' : 'none',
                        fontWeight: quest.background_image ? 'bold' : 'bold'
                      }}
                    >
                      {quest.title}
                    </Typography>
                    
                    <Typography 
                      fontSize={13} 
                      color="#6b7280" 
                      sx={{ 
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 2,
                        textShadow: quest.background_image ? '0px 0px 4px rgba(255,255,255,0.9), 0px 1px 2px rgba(0,0,0,0.2)' : 'none',
                        color: quest.background_image ? '#374151' : '#6b7280'
                      }}
                    >
                      {quest.description}
                    </Typography>
                  </Box>
                  
                  {/* プログレスバー（期限ベース） */}
                  <Box sx={{ mb: 2 }}>
                    {(() => {
                      const deadlineInfo = calculateDeadlineProgress(quest.start_date, quest.end_date);
                      return (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                fontSize={12} 
                                fontWeight="600" 
                                color="#6b7280"
                                sx={{
                                  textShadow: quest.background_image ? '0px 0px 3px rgba(255,255,255,0.9)' : 'none'
                                }}
                              >
                                期限進行度
                              </Typography>
                              {/* 小さなインラインプログレスバー */}
                              <Box
                                sx={{
                                  width: 60,
                                  height: 4,
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${deadlineInfo.progress}%`,
                                    height: '100%',
                                    background: deadlineInfo.isExpired 
                                      ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                                      : deadlineInfo.progress > 80
                                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                      : getCategoryDesign(quest.category, quest.difficulty || 'easy').background,
                                    borderRadius: 2,
                                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                                />
                              </Box>
                            </Box>
                            <Typography 
                              fontSize={12} 
                              fontWeight="bold" 
                              color={deadlineInfo.isExpired ? "#ef4444" : "#374151"}
                              sx={{
                                textShadow: quest.background_image ? '0px 0px 3px rgba(255,255,255,0.9)' : 'none'
                              }}
                            >
                              {deadlineInfo.timeLeft}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: '100%',
                              height: 6,
                              backgroundColor: quest.background_image ? 'rgba(229, 231, 235, 0.7)' : '#e5e7eb',
                              borderRadius: 3,
                              overflow: 'hidden',
                              position: 'relative',
                              boxShadow: quest.background_image ? '0px 0px 4px rgba(0,0,0,0.2)' : 'none'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${deadlineInfo.progress}%`,
                                height: '100%',
                                background: deadlineInfo.isExpired 
                                  ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                                  : deadlineInfo.progress > 80
                                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                  : getCategoryDesign(quest.category, quest.difficulty || 'easy').background,
                                borderRadius: 3,
                                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" color="#9ca3af" sx={{ mt: 0.5, fontSize: 11 }}>
                            {Math.round(deadlineInfo.progress)}% 経過
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                  
                  {/* 報酬 */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: '#f9fafb',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid #e5e7eb',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                        }}
                      >
                        <Star sx={{ fontSize: 14, color: 'white' }} />
                      </Box>
                      <Typography fontSize={13} fontWeight="bold" color="#374151">
                        {quest.reward}
                      </Typography>
                    </Box>
                    <ChevronRight sx={{ fontSize: 18, color: getCategoryDesign(quest.category, quest.difficulty || 'easy').accentColor }} />
                  </Box>
                </Box>
              </Card>
              );
            })}
          </Box>
        </Box>
        </>

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
              startIcon={<CreditCard sx={{ color: "#FF6B35", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 },
                borderColor: '#FF6B35',
                '&:hover': {
                  borderColor: '#FF6B35',
                  backgroundColor: 'rgba(255, 107, 53, 0.04)'
                }
              }}
              onClick={() => router.push('/employee-card')}
            >
              AIC
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Train sx={{ color: "#4CAF50", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 },
                borderColor: '#4CAF50',
                '&:hover': {
                  borderColor: '#4CAF50',
                  backgroundColor: 'rgba(76, 175, 80, 0.04)'
                }
              }}
              onClick={() => router.push('/minecraft-auth')}
            >
              MCID認証
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

        {/* ポイント関連 */}
        <Typography variant="subtitle1" fontWeight="bold" mb={1} sx={{ color: '#212529' }}>
          ポイント
        </Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<ShoppingCart sx={{ color: "#FF6B35", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/point-shop')}
            >
              ポイントショップ
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<Inventory sx={{ color: "#4CAF50", fontSize: { xs: 18, sm: 20 } }} />} 
              sx={{ 
                borderRadius: 2,
                height: { xs: 48, sm: 56 },
                fontSize: { xs: 12, sm: 14 }
              }}
              onClick={() => router.push('/my-items')}
            >
              マイアイテム
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

        {/* MCID認証状態 */}
        <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ color: '#212529', mt: 4 }}>
          MCID認証状態
        </Typography>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
          color: 'white',
          borderRadius: 4,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': { 
            transform: 'translateY(-4px)', 
            boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
            '& .minecraft-glow': {
              opacity: 1,
              transform: 'scale(1.1)'
            }
          },
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* 装飾的な光の効果 */}
          <Box className="minecraft-glow" sx={{
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
              <Train sx={{ 
                fontSize: { xs: 30, sm: 36 }, 
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" mb={2} sx={{ 
              background: 'linear-gradient(45deg, #fff, #e8f5e8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            }}>
              MCID認証
            </Typography>
            <Typography variant="body1" sx={{ 
              mb: { xs: 2, sm: 3 }, 
              opacity: 0.9, 
              fontWeight: 500,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}>
              AOIROSERVERの認定メンバーになるためのMinecraft ID認証を行いましょう
            </Typography>
            
            {/* 認証状態に応じたボタン */}
            <Button
              variant="contained"
              onClick={() => router.push('/minecraft-auth')}
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
              {minecraftAuthStatus === 'completed' ? '認証完了済み' : 
               minecraftAuthStatus === 'in-progress' ? '認証中...' : '認証を開始'}
            </Button>
            
            {/* 認証状態の表示 */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {minecraftAuthStatus === 'completed' ? (
                <>
                  <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    認証完了済み
                  </Typography>
                </>
              ) : minecraftAuthStatus === 'in-progress' ? (
                <>
                  <CircularProgress sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    認証中...
                  </Typography>
                </>
              ) : (
                <>
                  <Info sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    未認証
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Card>

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

      {/* ポイント送信ダイアログ */}
      <Dialog
        open={showPointSendDialog}
        onClose={() => setShowPointSendDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOn sx={{ mr: 1, color: '#FFA726' }} />
              <Typography variant="h6" fontWeight="bold">
                ポイント送信
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowPointSendDialog(false)}
              sx={{ p: 1 }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="送信先メールアドレス"
              type="email"
              value={pointSendForm.email}
              onChange={(e) => setPointSendForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              required
              fullWidth
              variant="outlined"
            />

            <TextField
              label="送信ポイント数"
              type="number"
              value={pointSendForm.points}
              onChange={(e) => setPointSendForm(prev => ({ ...prev, points: e.target.value }))}
              placeholder="100"
              required
              fullWidth
              variant="outlined"
              inputProps={{ min: 1, max: 10000 }}
            />

            <TextField
              label="送信理由（任意）"
              multiline
              rows={3}
              value={pointSendForm.reason}
              onChange={(e) => setPointSendForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="ポイント送信の理由を入力してください"
              fullWidth
              variant="outlined"
            />

            <Alert severity="info">
              指定したメールアドレスのユーザーにポイントが送信されます。<br />
              送信後はキャンセルできませんので、内容をよく確認してください。
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowPointSendDialog(false)}
            disabled={isSendingPoints}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSendPoints}
            variant="contained"
            disabled={isSendingPoints || !pointSendForm.email.trim() || !pointSendForm.points.trim()}
            sx={{
              backgroundColor: '#FFA726',
              '&:hover': {
                backgroundColor: '#FF9800',
              },
            }}
            startIcon={
              isSendingPoints ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )
            }
          >
            {isSendingPoints ? '送信中...' : 'ポイント送信'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 