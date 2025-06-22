"use client";
import { Box, Typography, IconButton, Chip } from "@mui/material";
import { DirectionsCar, ArrowBack, AccessTime, LocationOn } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";

const roadIcons: { [key: string]: string } = {
  'C1_INNER': 'https://i.imgur.com/UVf9Maf.jpg',
  'C1_OUTER': 'https://i.imgur.com/hNGM318.jpg',
  'C2_INNER': 'https://i.imgur.com/kz6mMV4.jpg',
  'C2_OUTER': 'https://i.imgur.com/rNSUCiD.jpg',
  'YE': 'https://i.imgur.com/1fFb12y.jpg',
  'KK': 'https://i.imgur.com/KU8qTpt.jpg',
};

// 道路ごとのデフォルト色を定義
const defaultRoadColors: { [key: string]: string } = {
  C1_INNER: '#ff6b35',   // 首都高速都心環状線（内回り）
  C1_OUTER: '#ff6b35',   // 首都高速都心環状線（外回り）
  C2_INNER: '#4ecdc4',   // 首都高速中央循環線（内回り）
  C2_OUTER: '#4ecdc4',   // 首都高速中央循環線（外回り）
  YE: '#45b7d1',         // 首都高速八重洲線
  KK: '#96ceb4'          // 東京高速道路KK線
};

// 道路の基本情報
const roadInfo = {
  C1_INNER: { 
    name: '首都高速都心環状線（内回り）', 
    color: '#ff6b35',
    description: '都心部を環状に走る首都高速道路の内回り線です。',
    length: '約14.3km',
    startPoint: '浜崎橋JCT',
    endPoint: '浜崎橋JCT'
  },
  C1_OUTER: { 
    name: '首都高速都心環状線（外回り）', 
    color: '#ff6b35',
    description: '都心部を環状に走る首都高速道路の外回り線です。',
    length: '約14.3km',
    startPoint: '浜崎橋JCT',
    endPoint: '浜崎橋JCT'
  },
  C2_INNER: { 
    name: '首都高速中央循環線（内回り）', 
    color: '#4ecdc4',
    description: '中央部を環状に走る首都高速道路の内回り線です。',
    length: '約47.0km',
    startPoint: '大橋JCT',
    endPoint: '大橋JCT'
  },
  C2_OUTER: { 
    name: '首都高速中央循環線（外回り）', 
    color: '#4ecdc4',
    description: '中央部を環状に走る首都高速道路の外回り線です。',
    length: '約47.0km',
    startPoint: '大橋JCT',
    endPoint: '大橋JCT'
  },
  YE: { 
    name: '首都高速八重洲線', 
    color: '#45b7d1',
    description: '八重洲方面へ向かう首都高速道路です。',
    length: '約2.2km',
    startPoint: '八重洲JCT',
    endPoint: '八重洲出入口'
  },
  KK: { 
    name: '東京高速道路KK線', 
    color: '#96ceb4',
    description: '東京高速道路のKK線です。',
    length: '約1.8km',
    startPoint: 'KK線起点',
    endPoint: 'KK線終点'
  }
};

const HelmetSVG = (props: any) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <ellipse cx="12" cy="17" rx="8" ry="3" fill="#1976d2"/>
    <path d="M4 17V13C4 8.58 7.58 5 12 5C16.42 5 20 8.58 20 13V17" fill="#ffc107"/>
    <rect x="11" y="8" width="2" height="5" fill="#1976d2"/>
  </svg>
);

function StatusIcon({ status }: { status: string }) {
  if (status === '平常通行' || status === '通常') {
    return (
      <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />
    );
  } else if (status === '渋滞') {
    return (
      <Box sx={{ width: 24, height: 24, display: 'inline-block', mr: 1 }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <polygon
            points="12,4 22,20 2,20"
            fill="none"
            stroke="#ffa000"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
    );
  } else if (status === '工事') {
    return (
      <Box sx={{ width: 24, height: 24, display: 'inline-block', mr: 1 }}>
        <HelmetSVG />
      </Box>
    );
  } else if (status === '事故' || status === '通行止め') {
    return (
      <Box sx={{ width: 24, height: 24, display: 'inline-block', mr: 1, position: 'relative' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute', top: 0, left: 0 }}>
          <line x1="5" y1="5" x2="19" y2="19" stroke="#e53935" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="19" y1="5" x2="5" y2="19" stroke="#e53935" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </Box>
    );
  }
  return null;
}

const RoadDetailPage = ({ params }: { params: { roadId: string } }) => {
  const router = useRouter();
  const [road, setRoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadDetail = async () => {
      try {
        const res = await fetch("/api/road-status");
        const data = await res.json();
        const roadsData = Array.isArray(data) ? data : data.roads;
        
        const roadData = roadsData.find((r: any) => r.id === params.roadId);
        
        if (roadData) {
          setRoad(roadData);
        } else {
          // データが見つからない場合は基本情報から作成
          const roadInfoData = roadInfo[params.roadId as keyof typeof roadInfo];
          if (roadInfoData) {
            setRoad({
              id: params.roadId,
              name: roadInfoData.name,
              color: roadInfoData.color,
              status: '平常通行',
              congestion: '軽微',
              description: roadInfoData.description,
              length: roadInfoData.length,
              startPoint: roadInfoData.startPoint,
              endPoint: roadInfoData.endPoint,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('道路詳細の取得に失敗しました:', error);
        // エラー時は基本情報から作成
        const roadInfoData = roadInfo[params.roadId as keyof typeof roadInfo];
        if (roadInfoData) {
          setRoad({
            id: params.roadId,
            name: roadInfoData.name,
            color: roadInfoData.color,
            status: '平常通行',
            congestion: '軽微',
            description: roadInfoData.description,
            length: roadInfoData.length,
            startPoint: roadInfoData.startPoint,
            endPoint: roadInfoData.endPoint,
            updatedAt: new Date().toISOString()
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoadDetail();
  }, [params.roadId]);

  if (loading) {
    return (
      <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (!road) {
    return (
      <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>道路が見つかりません</Typography>
      </Box>
    );
  }

  const finalColor = road.color || defaultRoadColors[road.id] || '#1a237e';

  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 2, background: '#fff', borderBottom: '1px solid #e0e0e0', mb: 0.5
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => router.push('/road-status')}>
            <ArrowBack sx={{ color: '#1a237e' }} />
          </IconButton>
          <DirectionsCar sx={{ color: '#1a237e', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20 }}>道路詳細</Typography>
        </Box>
      </Box>

      {/* 道路情報カード */}
      <Box sx={{ px: 2, mt: 2, mb: 2 }}>
        <Box sx={{
          background: '#fff',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          p: 2,
        }}>
          <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src={roadIcons[road.id as keyof typeof roadIcons]} alt={road.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: '#1a237e', fontWeight: 700, fontSize: 22 }}>{road.name}</Typography>
              <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                <StatusIcon status={road.status} />
                <Typography sx={{ 
                  color: road.status === '平常通行' ? '#43a047' : 
                         road.status === '渋滞' ? '#ffa000' : '#e53935', 
                  fontWeight: 700, 
                  fontSize: 18 
                }}>
                  {road.status}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography variant="body1" sx={{ color: '#666', mb: 2, lineHeight: 1.6 }}>
            {road.description}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              icon={<LocationOn />} 
              label={`距離: ${road.length}`} 
              sx={{ bgcolor: '#f0f8ff', color: '#1a237e' }} 
            />
            <Chip 
              icon={<AccessTime />} 
              label={`渋滞: ${road.congestion}`} 
              sx={{ 
                bgcolor: road.congestion === '軽微' ? '#e8f5e8' : 
                        road.congestion === '中程度' ? '#fff3e0' : '#ffebee',
                color: road.congestion === '軽微' ? '#43a047' : 
                       road.congestion === '中程度' ? '#ffa000' : '#e53935'
              }} 
            />
          </Box>

          <Box sx={{ 
            background: '#f8f9fa', 
            borderRadius: 2, 
            p: 2, 
            border: '1px solid #e9ecef' 
          }}>
            <Typography variant="subtitle2" sx={{ color: '#495057', fontWeight: 600, mb: 1 }}>
              路線情報
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ color: '#6c757d', fontSize: 14 }}>起点:</Typography>
                <Typography sx={{ color: '#495057', fontSize: 14, fontWeight: 500 }}>{road.startPoint}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ color: '#6c757d', fontSize: 14 }}>終点:</Typography>
                <Typography sx={{ color: '#495057', fontSize: 14, fontWeight: 500 }}>{road.endPoint}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ color: '#6c757d', fontSize: 14 }}>更新時刻:</Typography>
                <Typography sx={{ color: '#495057', fontSize: 14, fontWeight: 500 }}>
                  {road.updatedAt ? new Date(road.updatedAt).toLocaleString('ja-JP') : '不明'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 道路図カード */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box sx={{
          background: '#fff',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          p: 2,
        }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#3c2e67', mb: 1 }}>
            {road.name}の道路図
          </Typography>
          <Box sx={{
            width: '100%',
            textAlign: 'center',
            background: '#f8f9fa',
            borderRadius: 2,
            p: 2,
            border: '1px solid #e9ecef'
          }}>
            <Box sx={{
              width: '100%',
              height: 200,
              background: `linear-gradient(135deg, ${finalColor}20 0%, ${finalColor}40 100%)`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: finalColor,
              fontSize: 18,
              fontWeight: 'bold',
              border: `2px dashed ${finalColor}60`
            }}>
              {road.name}の道路図
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default dynamic(() => Promise.resolve(RoadDetailPage), { ssr: false }); 