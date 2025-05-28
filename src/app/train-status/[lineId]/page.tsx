"use client";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography, IconButton, Button, Paper } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TrainIcon from "@mui/icons-material/Train";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WifiIcon from "@mui/icons-material/Wifi";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import WcIcon from "@mui/icons-material/Wc";
import ChairIcon from "@mui/icons-material/Chair";
import DirectionsSubwayIcon from "@mui/icons-material/DirectionsSubway";
import { ReactNode } from "react";
import { useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// 路線データ例
const lineData: Record<string, { name: string; color: string; status: string; statusColor: string; statusText: string; detail: string }> = {
  CA: {
    name: "東海道新幹線",
    color: "#0033cb",
    status: "平常運転",
    statusColor: "#43a047",
    statusText: "現在、平常通り運転しています。",
    detail: "特に遅延や運転見合わせはありません。",
  },
  JK: {
    name: "京浜東北線",
    color: "#00b2e5",
    status: "平常運転",
    statusColor: "#43a047",
    statusText: "現在、平常通り運転しています。",
    detail: "特に遅延や運転見合わせはありません。",
  },
  JY: {
    name: "山手線（内回り）",
    color: "#8fd400",
    status: "平常運転",
    statusColor: "#43a047",
    statusText: "現在、平常通り運転しています。",
    detail: "特に遅延や運転見合わせはありません。",
  },
  JY_OUT: {
    name: "山手線（外回り）",
    color: "#8fd400",
    status: "平常運転",
    statusColor: "#43a047",
    statusText: "現在、平常通り運転しています。",
    detail: "特に遅延や運転見合わせはありません。",
  },
  JB: {
    name: "総武線",
    color: "#ffd400",
    status: "平常運転",
    statusColor: "#43a047",
    statusText: "現在、平常通り運転しています。",
    detail: "特に遅延や運転見合わせはありません。",
  },
  JC: {
    name: "中央線",
    color: "#f15a22",
    status: "平常運転",
    statusColor: "#43a047",
    statusText: "現在、平常通り運転しています。",
    detail: "特に遅延や運転見合わせはありません。",
  },
  JT: {
    name: "東海道線",
    color: "#f68b1e",
    status: "平常運転",
    statusColor: "#43a047",
    statusText: "現在、平常通り運転しています。",
    detail: "特に遅延や運転見合わせはありません。",
  },
  // ...他の路線も同様に追加
};

// 路線ごとの駅データ
const stationData: Record<string, Array<{
  name: string;
  congestion: string;
  congestionColor: string;
  transfers: Array<{ id: string; color: string }>;
  icons: ReactNode[];
  time: string;
  highlight?: boolean;
}>> = {
  CA: [
    {
      name: "武蔵小杉",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [
        { id: "JK", color: "#00B2E5" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "3分",
    },
    {
      name: "浜松",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "4分",
    },
    {
      name: "東京",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JY", color: "#9ACD32" },
        { id: "JK", color: "#00B2E5" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "5分",
      highlight: true,
    },
    {
      name: "上野",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JY", color: "#9ACD32" },
        { id: "JK", color: "#00B2E5" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "6分",
    }
  ],
  JK: [
    {
      name: "大井町",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "3分",
    },
    {
      name: "浜松",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "4分",
    },
    {
      name: "有楽町",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JY", color: "#9ACD32" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "5分",
    },
    {
      name: "東京",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JY", color: "#9ACD32" },
        { id: "CA", color: "#0000FF" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "6分",
      highlight: true,
    },
    {
      name: "秋葉原",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JB", color: "#FFD400" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "7分",
    },
    {
      name: "上野",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JY", color: "#9ACD32" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "8分",
    }
  ],
  JY: [
    {
      name: "東京",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JK", color: "#00B2E5" },
        { id: "CA", color: "#0000FF" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "3分",
      highlight: true,
    },
    {
      name: "秋葉原",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JB", color: "#FFD400" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "4分",
    },
    {
      name: "高輪ゲートウェイ",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "5分",
    },
    {
      name: "新宿",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JB", color: "#FFD400" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "6分",
    },
    {
      name: "渋谷",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "7分",
    },
    {
      name: "大崎",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "8分",
    },
    {
      name: "浜松",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "9分",
    },
    {
      name: "有楽町",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JK", color: "#00B2E5" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "10分",
    }
  ],
  JY_OUT: [
    {
      name: "東京",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JK", color: "#00B2E5" },
        { id: "CA", color: "#0000FF" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "3分",
      highlight: true,
    },
    {
      name: "有楽町",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JK", color: "#00B2E5" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "4分",
    },
    {
      name: "浜松",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "5分",
    },
    {
      name: "大崎",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "6分",
    },
    {
      name: "渋谷",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "7分",
    },
    {
      name: "新宿",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JB", color: "#FFD400" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "8分",
    },
    {
      name: "高輪ゲートウェイ",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "9分",
    },
    {
      name: "秋葉原",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JB", color: "#FFD400" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "10分",
    }
  ],
  JB: [
    {
      name: "秋葉原",
      congestion: "混雑",
      congestionColor: "#ff9800",
      transfers: [
        { id: "JY", color: "#9ACD32" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "3分",
    },
    {
      name: "御茶ノ水",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [
        { id: "JC", color: "#FF6600" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "4分",
    },
    {
      name: "新宿",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JY", color: "#9ACD32" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "5分",
    }
  ],
  JC: [
    {
      name: "東京",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JY", color: "#9ACD32" },
        { id: "JK", color: "#00B2E5" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "4分",
      highlight: true,
    },
    {
      name: "御茶ノ水",
      congestion: "普通",
      congestionColor: "#43a047",
      transfers: [
        { id: "JB", color: "#FFD400" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />],
      time: "4分",
    },
    {
      name: "新宿",
      congestion: "非常に混雑",
      congestionColor: "#e53935",
      transfers: [
        { id: "JY", color: "#9ACD32" },
        { id: "JB", color: "#FFD400" }
      ],
      icons: [<RestaurantIcon key="r" />, <WcIcon key="w" />, <ChairIcon key="c" />, <WifiIcon key="wf" />],
      time: "5分",
    }
  ]
};

function StatusIcon({ color }: { color: string }) {
  return <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: `2.5px solid ${color}`, display: 'inline-block', mr: 1 }} />;
}

// 列車位置情報（新UI）
const TrainPositionVertical = ({ stations, currentTrainIndex, lineColor }: { stations: { name: string }[]; currentTrainIndex: number; lineColor: string }) => {
  return (
    <Box className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="font-bold text-lg mb-2" style={{ color: lineColor }}>列車位置情報</div>
      <div className="flex">
        {/* 路線ライン */}
        <div className="flex flex-col items-center mr-4">
          {stations.map((_, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {/* 駅ノード */}
              <div className="w-4 h-4 rounded-full border-4" style={{ borderColor: lineColor, background: '#fff', zIndex: 10 }} />
              {/* ライン（最後の駅以外） */}
              {idx < stations.length - 1 && (
                <div className="w-1" style={{ background: lineColor, height: 64 }} />
              )}
            </div>
          ))}
        </div>
        {/* 駅名＋列車アイコン */}
        <div className="flex-1 flex flex-col">
          {stations.map((station, idx) => (
            <div
              key={station.name}
              className={`flex items-center h-20 px-2 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <span className="text-lg font-semibold text-gray-800 w-24">{station.name}</span>
              {/* 列車アイコン（現在位置のみ表示） */}
              {idx === currentTrainIndex && (
                <div className="ml-auto shadow-lg rounded-2xl bg-white p-2 flex items-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.13)' }}>
                  <TrainIcon sx={{ color: lineColor, fontSize: 36 }} />
                  {/* 進行方向の矢印（例） */}
                  <span className="ml-1" style={{ color: lineColor, fontSize: 28, fontWeight: 700 }}>↑</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
};

export default function TrainLineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lineId = typeof params.lineId === 'string' ? params.lineId : Array.isArray(params.lineId) ? params.lineId[0] : '';
  const line = lineData[lineId] || {
    name: "不明な路線",
    color: "#ccc",
    status: "情報なし",
    statusColor: "#aaa",
    statusText: "情報が見つかりません。",
    detail: "",
  };
  const stations = stationData[lineId] || [];

  return (
    <Box sx={{ background: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      {/* 路線カード（最上部に移動） */}
      <Box sx={{ px: 2, pt: 3, pb: 2 }}>
        <Box sx={{
          background: '#f6f3fb',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          p: 2,
          display: 'flex', alignItems: 'center', gap: 2
        }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, border: `2.5px solid ${line.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, color: '#1a237e', background: '#fff', mr: 2
          }}>{lineId}</Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20 }}>{line.name}</Typography>
        </Box>
      </Box>
      {/* 運行情報詳細 */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <ErrorOutlineIcon sx={{ color: '#e53935', mr: 1 }} />
          <Typography sx={{ color: '#222', fontWeight: 700, fontSize: 16 }}>運行情報詳細</Typography>
        </Box>
        <Box sx={{
          background: '#fff',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          p: 2,
          display: 'flex', alignItems: 'center', gap: 2
        }}>
          <Typography sx={{ color: '#222', fontWeight: 600, fontSize: 16, mr: 2 }}>状況：</Typography>
          <StatusIcon color={line.statusColor} />
          <Typography sx={{ color: line.statusColor, fontWeight: 700, fontSize: 18 }}>{line.status}</Typography>
        </Box>
      </Box>
      {/* 列車位置情報カード型ボタン（状況の下に移動） */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Paper
          elevation={3}
          sx={{
            display: 'flex', alignItems: 'center', borderRadius: 3, p: 2, mb: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer',
            background: '#fff',
            transition: 'box-shadow 0.2s',
            '&:active': { boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }
          }}
          onClick={() => router.push(`/train-status/${lineId}/train-position`)}
        >
          <TrainIcon sx={{ color: '#2196f3', fontSize: 32, mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#222' }}>列車位置情報</Typography>
            <Typography sx={{ fontSize: 13, color: '#888', mt: 0.2 }}>リアルタイムで列車の位置を確認</Typography>
          </Box>
          <ChevronRightIcon sx={{ color: '#888', fontSize: 28 }} />
        </Paper>
      </Box>
      {/* 列車位置情報 */}
      {/* TrainPositionVerticalコンポーネントの呼び出しを削除 */}
      {/* 主要駅一覧 */}
      <Box sx={{ px: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <TrainIcon sx={{ color: '#1976d2' }} />
          <Typography sx={{ color: '#1976d2', fontWeight: 700, fontSize: 16 }}>主要駅一覧</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          {/* 縦ライン */}
          <Box sx={{ width: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
            {stations.map((_, idx) => (
              <Box key={idx} sx={{ width: 6, height: idx === stations.length - 1 ? 24 : 64, background: line.color, borderRadius: 3, mb: idx === stations.length - 1 ? 0 : -1 }} />
            ))}
          </Box>
          {/* 駅カードリスト */}
          <Box sx={{ flex: 1 }}>
            {stations.map((station, idx) => (
              <Box key={station.name} sx={{
                background: '#fff',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                p: 2,
                mb: 2,
                ml: 1,
                position: 'relative'
              }}>
                <Typography sx={{ color: '#222', fontWeight: 700, fontSize: 17 }}>{station.name}</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5} mb={0.5}>
                  <Typography sx={{ color: station.congestionColor, fontWeight: 600, fontSize: 14 }}>{station.congestion}</Typography>
                  {station.transfers.length > 0 && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography sx={{ color: '#888', fontSize: 13 }}>乗換:</Typography>
                      {station.transfers.map((tr) => (
                        <Box key={tr.id} sx={{
                          display: 'inline-block',
                          px: 1.2,
                          py: 0.2,
                          borderRadius: 1,
                          background: tr.color,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 13,
                          mr: 0.5
                        }}>{tr.id}</Box>
                      ))}
                    </Box>
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  {station.icons.map((icon, i) => (
                    <Box key={i} sx={{ color: '#888' }}>{icon}</Box>
                  ))}
                </Box>
                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ color: '#888', fontSize: 13 }}>{station.time}</Typography>
                  <ChevronRightIcon sx={{ color: '#888', fontSize: 18 }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 