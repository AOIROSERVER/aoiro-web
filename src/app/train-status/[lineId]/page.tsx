"use client";
import { Box, Typography, Card, Chip, Stack, Divider, IconButton } from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TrainIcon from '@mui/icons-material/Train';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DirectionsRailwayFilledIcon from '@mui/icons-material/DirectionsRailwayFilled';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WcIcon from '@mui/icons-material/Wc';
import ElevatorIcon from '@mui/icons-material/Elevator';
import WifiIcon from '@mui/icons-material/Wifi';
import PeopleIcon from '@mui/icons-material/People';
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 路線ごとの主要駅・情報データ
const lineData = {
  JY1: {
    name: '山手線(内回り)',
    status: '平常運転',
    statusColor: '#43a047',
    statusIcon: <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />,
    stations: [
      { name: '東京', type: '普通', transfer: ['JK'], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '1分' },
      { name: '秋葉原', type: '普通', transfer: ['JB'], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '2分' },
      { name: '高輪ゲートウェイ', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '3分' },
      { name: '新宿', type: '混雑', transfer: ['JC'], icons: [<RestaurantIcon fontSize="small" />, <WcIcon fontSize="small" />], congestion: '混雑', congestionColor: '#ffa000', time: '4分' },
      { name: '渋谷', type: '普通', transfer: ['Z'], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '5分' },
      { name: '大崎', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '6分' },
      { name: '浜松', type: '普通', transfer: ['JT'], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '7分' },
      { name: '有楽町', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '8分' },
    ]
  },
  JY2: {
    name: '山手線(外回り)',
    status: '平常運転',
    statusColor: '#43a047',
    statusIcon: <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />,
    stations: [
      { name: '東京', type: '普通', transfer: ['JK'], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '1分' },
      { name: '有楽町', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '2分' },
      { name: '浜松', type: '普通', transfer: ['JT'], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '3分' },
      { name: '大崎', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '4分' },
      { name: '渋谷', type: '普通', transfer: ['Z'], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '5分' },
      { name: '新宿', type: '混雑', transfer: ['JC'], icons: [<RestaurantIcon fontSize="small" />, <WcIcon fontSize="small" />], congestion: '混雑', congestionColor: '#ffa000', time: '6分' },
      { name: '高輪ゲートウェイ', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '7分' },
      { name: '秋葉原', type: '普通', transfer: ['JB'], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '8分' },
    ]
  },
  JK: {
    name: '京浜東北線',
    status: '平常運転',
    statusColor: '#43a047',
    statusIcon: <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />,
    stations: [
      { name: '大井町', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '1分' },
      { name: '浜松', type: '普通', transfer: [], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '2分' },
      { name: '有楽町', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '3分' },
      { name: '東京', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '4分' },
      { name: '秋葉原', type: '普通', transfer: [], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '5分' },
      { name: '上野', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '6分' },
    ]
  },
  CA: {
    name: '東海道新幹線',
    status: '平常運転',
    statusColor: '#43a047',
    statusIcon: <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />,
    stations: [
      { name: '武蔵小杉', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '1分' },
      { name: '浜松', type: '普通', transfer: [], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '2分' },
      { name: '東京', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '3分' },
      { name: '上野', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '4分' },
    ]
  },
  JB: {
    name: '総武線',
    status: '平常運転',
    statusColor: '#43a047',
    statusIcon: <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />,
    stations: [
      { name: '秋葉原', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '1分' },
      { name: '御茶ノ水', type: '普通', transfer: [], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '2分' },
      { name: '新宿', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '3分' },
    ]
  },
  JC: {
    name: '中央線',
    status: '平常運転',
    statusColor: '#43a047',
    statusIcon: <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />,
    stations: [
      { name: '東京', type: '普通', transfer: [], icons: [<RestaurantIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '1分' },
      { name: '御茶ノ水', type: '普通', transfer: [], icons: [<WcIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '2分' },
      { name: '新宿', type: '普通', transfer: [], icons: [<ElevatorIcon fontSize="small" />], congestion: '普通', congestionColor: '#43a047', time: '3分' },
    ]
  },
  // 他の路線も同様に追加可能
};

const lineColors = {
  JY1: '#9acd32', // 山手線
  JY2: '#9acd32', // 山手線
  JK: '#00b2e5',  // 京浜東北線
  JB: '#ffd400',  // 総武線
  JC: '#ff0000',  // 中央線
  CA: '#0072bc',  // 東海道新幹線
};

export default function TrainLineDetail() {
  const params = useParams();
  const router = useRouter();
  const lineId = params.lineId as keyof typeof lineData;
  const [statusInfo, setStatusInfo] = useState<{ status?: string; detail?: string; section?: string }>({});

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch("/api/train-status");
      const data = await res.json();
      const found = (Array.isArray(data) ? data : data.lines).find((l: any) => l.id === lineId);
      if (found) setStatusInfo({ status: found.status, detail: found.detail, section: found.section });
    };
    fetchStatus();
  }, [lineId]);

  const line = lineData[lineId];
  if (!line) return <div>路線データが見つかりません</div>;

  // ステータス・詳細・区間はAPI優先で表示
  const status = statusInfo.status || line.status;
  const detail = statusInfo.detail || '';
  const section = statusInfo.section || '';
  const lineColor = lineColors[lineId] || '#43a047'; // デフォルトカラーを設定

  // ステータスに応じた色とアイコン
  let statusColor = '#43a047';
  let statusIcon = <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #43a047', display: 'inline-block', mr: 1 }} />;
  if (status === '遅延') {
    statusColor = '#ffa000';
    statusIcon = (
      <Box sx={{ width: 24, height: 24, display: 'inline-block', mr: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <polygon points="12,4 22,20 2,20" fill="none" stroke="#ffa000" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </Box>
    );
  } else if (status === '運転見合わせ') {
    statusColor = '#e53935';
    statusIcon = (
      <Box sx={{ width: 24, height: 24, display: 'inline-block', mr: 1, position: 'relative' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute', top: 0, left: 0 }}>
          <line x1="5" y1="5" x2="19" y2="19" stroke="#e53935" strokeWidth="4" strokeLinecap="round" />
          <line x1="19" y1="5" x2="5" y2="19" stroke="#e53935" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </Box>
    );
  }

  const handleTrainPositionClick = () => {
    console.log('列車位置情報ボタンがクリックされました');
    console.log('lineId:', lineId);
    console.log('line.name:', line.name);
    const url = `/train-status/${lineId}/train-position?line=${encodeURIComponent(line.name)}`;
    console.log('遷移先URL:', url);
    router.push(url);
  };

  return (
    <Box sx={{ background: '#fafbfc', minHeight: '100vh', pb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', fontSize: 22 }}>{line.name}</Typography>
      </Box>
      {/* 運行情報詳細 */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <ErrorOutlineIcon sx={{ color: '#e53935', mr: 1 }} />
          <Typography sx={{ fontWeight: 700, color: '#222', fontSize: 16 }}>運行情報詳細</Typography>
        </Box>
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', mb: 2 }}>
          {/* ステータス */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: status !== '平常運転' ? 2 : 0 }}>
            {statusIcon}
            <Typography sx={{ color: statusColor, fontWeight: 800, fontSize: 20 }}>{status}</Typography>
          </Box>
          {/* 影響区間・詳細情報は平常運転以外の時のみ絶対に表示しない */}
          {status !== '平常運転' && (
            <>
              <Divider sx={{ my: 1.5 }} />
              {/* 影響区間 */}
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: '#888', fontWeight: 600, fontSize: 15, mb: 0.5 }}>影響区間</Typography>
                <Typography sx={{ color: '#222', fontSize: 16 }}>{section ? section : '情報なし'}</Typography>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              {/* 詳細情報 */}
              <Box>
                <Typography sx={{ color: '#888', fontWeight: 600, fontSize: 15, mb: 0.5 }}>詳細情報</Typography>
                <Typography sx={{ color: '#222', fontSize: 15 }}>{detail ? detail : '情報なし'}</Typography>
              </Box>
            </>
          )}
        </Card>
      </Box>
      {/* 列車位置情報 */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TrainIcon sx={{ color: '#2962ff', mr: 1 }} />
          <Typography sx={{ fontWeight: 700, color: '#222', fontSize: 16 }}>列車位置情報</Typography>
        </Box>
        <Card 
          sx={{ 
            p: 2, 
            borderRadius: 3, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}
          onClick={handleTrainPositionClick}
        >
          <Typography sx={{ color: '#757575', fontWeight: 500, fontSize: 15 }}>リアルタイムで列車の位置を確認</Typography>
          <ArrowForwardIosIcon sx={{ color: '#bdbdbd', fontSize: 18 }} />
        </Card>
      </Box>
      {/* 主要駅一覧 */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DirectionsRailwayFilledIcon sx={{ color: '#2962ff', mr: 1 }} />
          <Typography sx={{ fontWeight: 700, color: '#222', fontSize: 16 }}>主要駅一覧</Typography>
        </Box>
        <Stack spacing={2} direction="column" sx={{ position: 'relative' }}>
          {/* 縦線（Stack全体で1本） */}
          <Box sx={{
            position: 'absolute',
            left: 14,
            top: 0,
            bottom: 0,
            width: 4,
            background: lineColor,
            zIndex: 0,
            borderRadius: 2,
          }} />
          {line.stations.map((station, idx) => (
            <Box key={station.name} sx={{ display: 'flex', alignItems: 'center', minHeight: 48, position: 'relative', zIndex: 1 }}>
              {/* 丸 */}
              <Box sx={{ width: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 48 }}>
                <Box sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: `4px solid ${lineColor}`,
                  background: '#fff',
                  boxSizing: 'border-box',
                  position: 'relative',
                  zIndex: 2,
                }} />
              </Box>
              {/* 駅カード */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', p: 2, display: 'flex', alignItems: 'center', mb: 0, position: 'relative', flex: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#222', fontSize: 17 }}>{station.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                    <Typography sx={{ color: station.congestionColor, fontWeight: 700, fontSize: 14, mr: 1 }}>{station.type}</Typography>
                    {station.transfer.map((tr) => (
                      <Chip key={tr} label={tr} size="small" sx={{ background: tr === 'JY' ? '#8bc34a' : tr === 'JK' ? '#29b6f6' : '#ab47bc', color: '#fff', fontWeight: 700, fontSize: 13, ml: 0.5 }} />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                    {station.icons.map((icon, i) => (
                      <Box key={i} sx={{ color: '#757575', mr: 0.5 }}>{icon}</Box>
                    ))}
                    {station.name === '東京' && <WifiIcon fontSize="small" sx={{ color: '#757575', ml: 0.5 }} />}
                  </Box>
                </Box>
                <Box sx={{ minWidth: 40, textAlign: 'right' }}>
                  <Typography sx={{ color: '#757575', fontWeight: 500, fontSize: 15 }}>{station.time}</Typography>
                </Box>
              </Card>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
} 