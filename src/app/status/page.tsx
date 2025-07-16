"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Cloud,
  Storage,
  Api,
  Web,
  PhoneAndroid,
  Notifications,
  Security,
  Speed,
} from "@mui/icons-material";
import { useServerStatus } from "../../contexts/ServerStatusContext";

// サービスステータス型
type ServiceStatus = {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  responseTime?: number;
  lastChecked: string;
  description: string;
  icon: React.ReactNode;
  url?: string;
  playerCount?: number;
  maxPlayers?: number;
  version?: string;
};

// ステータス表示用のコンポーネント
const StatusIndicator = ({ status }: { status: ServiceStatus['status'] }) => {
  const getStatusConfig = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return { color: '#4CAF50', icon: <CheckCircle />, label: '正常' };
      case 'degraded':
        return { color: '#FF9800', icon: <Warning />, label: '一部障害' };
      case 'outage':
        return { color: '#F44336', icon: <Error />, label: '障害' };
      case 'maintenance':
        return { color: '#2196F3', icon: <Warning />, label: 'メンテナンス' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      sx={{
        backgroundColor: config.color,
        color: 'white',
        fontWeight: 'bold',
        '& .MuiChip-icon': { color: 'white' },
      }}
      size="small"
    />
  );
};

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { serverStatus } = useServerStatus();

  // サービス定義（実際のサービスのみ）
  const serviceDefinitions: ServiceStatus[] = [
    {
      name: 'AOIROSERVER',
      status: 'operational',
      responseTime: 120,
      lastChecked: new Date().toISOString(),
      description: 'Minecraft Bedrockサーバー',
      icon: <Cloud />,
      playerCount: 0,
      maxPlayers: 20,
      version: '1.20.0'
    },
    {
      name: 'AOIROSERVER公式サイト',
      status: 'operational',
      responseTime: 85,
      lastChecked: new Date().toISOString(),
      description: 'AOIROSERVER公式サイト',
      icon: <Web />,
      url: 'https://aoiroserver.tokyo'
    },
    {
      name: 'AOIROSERVER アプリ',
      status: 'operational',
      responseTime: 95,
      lastChecked: new Date().toISOString(),
      description: 'AOIROSERVERアプリサイト',
      icon: <Web />,
      url: 'https://aoiroserver.site'
    },
    {
      name: 'データベース',
      status: 'operational',
      responseTime: 45,
      lastChecked: new Date().toISOString(),
      description: 'Supabase データベース',
      icon: <Storage />
    },
    {
      name: '認証サービス',
      status: 'operational',
      responseTime: 75,
      lastChecked: new Date().toISOString(),
      description: 'Supabase Auth',
      icon: <Security />
    },
    {
      name: '通知サービス',
      status: 'operational',
      responseTime: 150,
      lastChecked: new Date().toISOString(),
      description: 'プッシュ通知・メール通知',
      icon: <Notifications />
    }
  ];

  // ローカルストレージから最後の更新時間を読み込む
  useEffect(() => {
    const savedLastUpdated = localStorage.getItem('status-page-last-updated');
    if (savedLastUpdated) {
      setLastUpdated(savedLastUpdated);
    }
  }, []);

  const checkServiceStatus = async () => {
    console.log('🔄 ステータスページ: サービスステータスを更新中...', new Date().toLocaleString('ja-JP'));
    setLoading(true);
    
    // 実際のAPIエンドポイントからステータスを取得
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ ステータスページ: API更新完了', new Date().toLocaleString('ja-JP'));
        
        // AOIROSERVERのステータスを共有コンテキストから取得
        const updatedServices = data.services.map((service: ServiceStatus) => {
          if (service.name === 'AOIROSERVER') {
            return {
              ...service,
              status: serverStatus.online ? 'operational' : 'outage',
              responseTime: serverStatus.responseTime || service.responseTime,
              playerCount: serverStatus.playerCount || 0,
              maxPlayers: serverStatus.maxPlayers || 0,
              version: serverStatus.version || service.version,
              lastChecked: serverStatus.lastUpdated || service.lastChecked
            };
          }
          return service;
        });
        
        setServices(updatedServices || serviceDefinitions);
        
        // APIから取得したlastUpdatedを使用
        if (data.lastUpdated) {
          const apiLastUpdated = new Date(data.lastUpdated).toLocaleString('ja-JP');
          setLastUpdated(apiLastUpdated);
          localStorage.setItem('status-page-last-updated', apiLastUpdated);
        } else {
          const currentTime = new Date().toLocaleString('ja-JP');
          setLastUpdated(currentTime);
          localStorage.setItem('status-page-last-updated', currentTime);
        }
      } else {
        console.log('❌ ステータスページ: API更新失敗', new Date().toLocaleString('ja-JP'));
        setServices(serviceDefinitions);
        const currentTime = new Date().toLocaleString('ja-JP');
        setLastUpdated(currentTime);
        localStorage.setItem('status-page-last-updated', currentTime);
      }
    } catch (error) {
      console.error('ステータス取得エラー:', error);
      setServices(serviceDefinitions);
      const currentTime = new Date().toLocaleString('ja-JP');
      setLastUpdated(currentTime);
      localStorage.setItem('status-page-last-updated', currentTime);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    console.log('🚀 ステータスページ: 初回読み込み開始', new Date().toLocaleString('ja-JP'));
    checkServiceStatus();
    
    // 5分ごとに自動更新
    const interval = setInterval(() => {
      console.log('⏰ ステータスページ: 5分間隔での自動更新実行', new Date().toLocaleString('ja-JP'));
      checkServiceStatus();
    }, 5 * 60 * 1000);
    
    console.log('📅 ステータスページ: 5分間隔タイマー設定完了', new Date().toLocaleString('ja-JP'));
    
    return () => {
      console.log('🧹 ステータスページ: タイマークリーンアップ', new Date().toLocaleString('ja-JP'));
      clearInterval(interval);
    };
  }, [serverStatus]); // serverStatusが変更されたら再実行

  const overallStatus = services.length > 0 
    ? services.every(s => s.status === 'operational') ? 'operational' : 'degraded'
    : 'operational';

  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'operational':
        return 'すべてのサービスが正常に稼働しています';
      case 'degraded':
        return '一部のサービスで問題が発生しています';
      default:
        return 'ステータスを確認中です';
    }
  };

  return (
    <Box sx={{ p: 2, background: "#f7f8fa", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Cloud sx={{ color: "#4A90E2", fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#212529' }}>
            稼働状況
          </Typography>
        </Box>
        <Tooltip title="更新">
          <IconButton 
            onClick={checkServiceStatus} 
            disabled={loading}
            sx={{ color: '#4A90E2' }}
          >
            <Refresh sx={{ transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 1s' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 全体ステータス */}
      <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#212529' }}>
              全体ステータス
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getOverallStatusText()}
            </Typography>
          </Box>
          <StatusIndicator status={overallStatus} />
        </Box>
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            最終更新: {lastUpdated}
          </Typography>
        )}
      </Card>

      {/* サービス一覧 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ color: '#212529' }}>
        サービス詳細
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {services.map((service, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ color: '#4A90E2' }}>
                      {service.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#212529' }}>
                      {service.name}
                    </Typography>
                  </Box>
                  <StatusIndicator status={service.status} />
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {service.description}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    応答時間: {service.responseTime}ms
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(service.lastChecked).toLocaleTimeString('ja-JP')}
                  </Typography>
                </Box>
                
                {/* Minecraftサーバー情報 */}
                {service.name === 'AOIROSERVER' && service.playerCount !== undefined && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      プレイヤー: {service.playerCount}/{service.maxPlayers}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      バージョン: {service.version}
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 情報 */}
      <Card sx={{ mt: 3, borderRadius: 3, p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" mb={1} sx={{ color: '#212529' }}>
          ステータスについて
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          • 正常: サービスが正常に稼働しています
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          • 一部障害: 一部の機能に問題があります
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          • 障害: サービスが利用できません
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • メンテナンス: 計画的なメンテナンス中です
        </Typography>
      </Card>
    </Box>
  );
} 