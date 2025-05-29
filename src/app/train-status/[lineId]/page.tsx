import ClientLineDetail from "./ClientLineDetail";
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
import dynamic from 'next/dynamic';

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

const LineDetailPage = ({ params }: { params: { lineId: string } }) => {
  const line = lineData[params.lineId as keyof typeof lineData];
  return <ClientLineDetail line={line} stationData={stationData} params={params} />;
};

export function generateStaticParams() {
  const lineIds = [
    "CA", "JK", "JY", "JY_OUT", "JB", "JC", "JT"
  ];
  return lineIds.map(lineId => ({ lineId }));
}

export default LineDetailPage; 