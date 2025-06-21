"use client";
import { Box, Typography, Card } from "@mui/material";
import TrainIcon from "@mui/icons-material/Train";
import { useEffect, useState } from "react";

// 路線ごとの駅データを定義（主要駅一覧に合わせる）
const LINE_STATIONS: Record<string, Array<{ name: string; code: string }>> = {
  // 山手線（内回り）
  JY1: [
    { name: '東京', code: 'JY01' },
    { name: '秋葉原', code: 'JY02' },
    { name: '高輪ゲートウェイ', code: 'JY03' },
    { name: '新宿', code: 'JY04' },
    { name: '渋谷', code: 'JY05' },
    { name: '大崎', code: 'JY06' },
    { name: '浜松', code: 'JY07' },
    { name: '有楽町', code: 'JY08' }
  ],
  // 山手線（外回り）
  JY2: [
    { name: '東京', code: 'JY01' },
    { name: '有楽町', code: 'JY02' },
    { name: '浜松', code: 'JY03' },
    { name: '大崎', code: 'JY04' },
    { name: '渋谷', code: 'JY05' },
    { name: '新宿', code: 'JY06' },
    { name: '高輪ゲートウェイ', code: 'JY07' },
    { name: '秋葉原', code: 'JY08' }
  ],
  // 京浜東北線
  JK: [
    { name: '大井町', code: 'JK01' },
    { name: '浜松', code: 'JK02' },
    { name: '有楽町', code: 'JK03' },
    { name: '東京', code: 'JK04' },
    { name: '秋葉原', code: 'JK05' },
    { name: '上野', code: 'JK06' }
  ],
  // 東海道新幹線
  CA: [
    { name: '武蔵小杉', code: 'CA01' },
    { name: '浜松', code: 'CA02' },
    { name: '東京', code: 'CA03' },
    { name: '上野', code: 'CA04' }
  ],
  // 総武線
  JB: [
    { name: '秋葉原', code: 'JB01' },
    { name: '御茶ノ水', code: 'JB02' },
    { name: '新宿', code: 'JB03' }
  ],
  // 中央線
  JC: [
    { name: '東京', code: 'JC01' },
    { name: '御茶ノ水', code: 'JC02' },
    { name: '新宿', code: 'JC03' }
  ]
};

// 路線ごとの色を定義
const LINE_COLORS: Record<string, string> = {
  JY1: '#9acd32', // 山手線
  JY2: '#9acd32', // 山手線
  JK: '#00b2e5',  // 京浜東北線
  CA: '#0072bc',  // 東海道新幹線
  JB: '#ffd400',  // 総武線
  JC: '#ff4500'   // 中央線
};

// 路線コードを取得
const getLineCode = (lineName: string): string => {
  if (lineName.includes('山手線（内回り）')) {
    return 'JY1';
  } else if (lineName.includes('山手線（外回り）')) {
    return 'JY2';
  } else if (lineName.includes('山手線')) {
    return 'JY1';
  } else if (lineName.includes('京浜東北線')) {
    return 'JK';
  } else if (lineName.includes('総武線')) {
    return 'JB';
  } else if (lineName.includes('中央線')) {
    return 'JC';
  } else if (lineName.includes('東海道新幹線')) {
    return 'CA';
  }
  return 'JY1'; // デフォルト
};

// 駅名の正規化関数
function normalizeStationName(name: string): string {
  return name
    .replace(/\s/g, '') // 空白除去
    .replace(/[駅]/g, '') // 「駅」除去
    .toLowerCase() // 小文字化
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); // 全角→半角
}

export default function TrainPositionPage() {
  const [lineName, setLineName] = useState<string>('');
  const [lineCode, setLineCode] = useState<string>('JY1');
  const [direction, setDirection] = useState<string>('外回り');
  const [trainStation, setTrainStation] = useState<string | null>(null);

  // line名・方向の正規化関数
  function normalizeLineAndDirection(rawLine: string): { line: string, direction: string } {
    // 例: "山手線（外回り）" → line: "山手線", direction: "外回り"
    const match = rawLine.match(/^(.*?)(?:[（(](.*?)[)）])?$/);
    if (match) {
      const line = match[1].replace(/\s/g, '');
      const direction = match[2] ? match[2].replace(/\s/g, '') : (line.includes('外回り') ? '外回り' : '内回り');
      return { line, direction };
    }
    return { line: rawLine, direction: '外回り' };
  }

  useEffect(() => {
    console.log('列車位置情報画面が読み込まれました');
    console.log('現在のURL:', window.location.href);
    
    // URLから路線名・方向を取得
    const urlParams = new URLSearchParams(window.location.search);
    const rawLine = urlParams.get('line') || '山手線（外回り）';
    const { line, direction } = normalizeLineAndDirection(rawLine);
    console.log('取得した路線名:', line);
    setLineName(line);
    setDirection(direction);
    const code = getLineCode(line);
    console.log('路線コード:', code);
    setLineCode(code);

    // 列車位置情報APIを取得する関数
    const fetchTrainPosition = () => {
      fetch(`/api/train-position?line=${encodeURIComponent(line)}&direction=${encodeURIComponent(direction)}`)
        .then(res => res.json())
        .then(data => {
          if (data.station) {
            setTrainStation(data.station);
          } else {
            setTrainStation(null);
          }
        })
        .catch(() => setTrainStation(null));
    };

    fetchTrainPosition(); // 初回取得
    const interval = setInterval(fetchTrainPosition, 5000); // 5秒ごとに再取得
    return () => clearInterval(interval);
  }, []);

  const stations = LINE_STATIONS[lineCode] || LINE_STATIONS.JY1;
  const lineColor = LINE_COLORS[lineCode] || '#666';

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', backgroundColor: 'white', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '15%',
            backgroundColor: 'white',
            border: `3px solid ${lineColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#0d2a70'
          }}
        >
          {lineCode === 'JY1' || lineCode === 'JY2' ? 'JY' : 
           lineCode === 'JK' ? 'JK' :
           lineCode === 'CA' ? 'CA' :
           lineCode === 'JB' ? 'JB' :
           lineCode === 'JC' ? 'JC' : 'JY'}
        </Box>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', textAlign: 'center', color: 'black' }}>
            {lineName} 列車位置情報
          </Typography>
        </Box>
      </Box>

      {/* 路線図 */}
      <Box sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {/* 縦線（中央配置） */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: lineColor,
              borderRadius: 2,
              zIndex: 1
            }}
          />
          
          {/* 駅と列車 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {stations.map((station, index) => (
              <Box
                key={station.code}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 4,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                {/* 駅名枠と電車マークを完全分離して横並び */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      display: 'block',
                      backgroundColor: 'white',
                      border: `2px solid ${lineColor}`,
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      width: 140,
                      textAlign: 'center',
                      overflow: 'visible',
                      zIndex: 10,
                      ...(trainStation && station.name && normalizeStationName(station.name) === normalizeStationName(trainStation)
                        ? {} : { transform: 'translateX(-16px)' })
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#222',
                        fontSize: '1rem'
                      }}
                    >
                      {station.name}
                    </Typography>
                  </Box>
                  {/* 電車マークは駅名枠の外側に余白をつけて表示 */}
                  {trainStation && station.name &&
                    normalizeStationName(station.name) === normalizeStationName(trainStation) && (
                    <TrainIcon sx={{ color: lineColor, fontSize: 28, ml: 2 }} />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 