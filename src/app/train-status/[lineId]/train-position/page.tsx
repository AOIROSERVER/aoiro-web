"use client";
import { Box } from "@mui/material";
import TrainIcon from "@mui/icons-material/Train";
import { useEffect, useState } from "react";

// 山手線主要駅リスト
const stations = [
  { name: "東京" },
  { name: "秋葉原" },
  { name: "高輪ゲートウェイ" },
  { name: "新宿" },
  { name: "渋谷" },
  { name: "大崎" },
  { name: "浜松" },
  { name: "有楽町" },
];
const lineColor = "#8fd400"; // 山手線内回りの色

const API_URL = "/api/train-position?line=山手線";

const TrainPositionVertical = ({ stations, currentTrainIndex, lineColor }: { stations: { name: string }[]; currentTrainIndex: number; lineColor: string }) => {
  return (
    <>
      <div className="font-bold text-lg mb-2" style={{ color: lineColor, marginLeft: 16, marginTop: 16 }}>列車位置情報</div>
      <div className="flex flex-col">
        {stations.map((station, idx) => (
          <div key={station.name} className={`flex items-center h-20 px-2 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
            {/* 線＋丸（駅ノード） */}
            <div className="flex flex-col items-center mr-4" style={{ width: 24 }}>
              {/* 上の線 or 空スペース（z-index: 1） */}
              <div
                className="w-1"
                style={{
                  background: idx > 0 ? lineColor : 'transparent',
                  height: 32,
                  marginBottom: -8,
                  zIndex: 1,
                }}
              />
              {/* 駅ノード（z-index: 2） */}
              <div
                className="w-4 h-4 rounded-full border-4"
                style={{
                  borderColor: lineColor,
                  background: '#fff',
                  zIndex: 2,
                }}
              />
              {/* 下の線 or 空スペース（z-index: 1） */}
              <div
                className="w-1"
                style={{
                  background: idx < stations.length - 1 ? lineColor : 'transparent',
                  height: 32,
                  marginTop: -8,
                  zIndex: 1,
                }}
              />
            </div>
            {/* 駅名 */}
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
    </>
  );
};

export default function TrainPositionPage() {
  const [currentTrainIndex, setCurrentTrainIndex] = useState(0);

  // 10秒ごとにAPIから列車位置情報を取得
  useEffect(() => {
    let timer: any;
    const fetchPosition = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        // 外回り優先で駅インデックスを特定
        const yamanoteStations = stations.map(s => s.name);
        let foundIndex = 0;
        if (data["外回り"] && yamanoteStations.includes(data["外回り"].station)) {
          foundIndex = yamanoteStations.indexOf(data["外回り"].station);
        } else if (data["内回り"] && yamanoteStations.includes(data["内回り"].station)) {
          foundIndex = yamanoteStations.indexOf(data["内回り"].station);
        }
        setCurrentTrainIndex(foundIndex);
      } catch (e) {
        // エラー時は何もしない
      }
      timer = setTimeout(fetchPosition, 10000);
    };
    fetchPosition();
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ background: '#fff', minHeight: '100vh' }}>
      <TrainPositionVertical stations={stations} currentTrainIndex={currentTrainIndex} lineColor={lineColor} />
    </Box>
  );
} 