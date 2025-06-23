"use client";
import { Box, Card, Typography, IconButton } from "@mui/material";
import {
  DirectionsCar,
  Settings,
  WarningAmber,
  CheckCircleOutline,
  Build,
  ReportProblem,
  Business,
  Apartment
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

// 道路の表示順序を定義
const roadOrder = [
  'C1_INNER',   // 首都高速都心環状線（内回り）
  'C1_OUTER',   // 首都高速都心環状線（外回り）
  'C2_INNER',   // 首都高速中央循環線（内回り）
  'C2_OUTER',   // 首都高速中央循環線（外回り）
  'YE',         // 首都高速八重洲線
  'KK'          // 東京高速道路KK線
];

// 道路ごとのデフォルト色を定義
const defaultRoadColors: { [key: string]: string } = {
  C1_INNER: '#ff6b35',   // 首都高速都心環状線（内回り）
  C1_OUTER: '#ff6b35',   // 首都高速都心環状線（外回り）
  C2_INNER: '#4ecdc4',   // 首都高速中央循環線（内回り）
  C2_OUTER: '#4ecdc4',   // 首都高速中央循環線（外回り）
  YE: '#45b7d1',         // 首都高速八重洲線
  KK: '#96ceb4'          // 東京高速道路KK線
};

const roadIcons: { [key: string]: string } = {
  'C1_INNER': 'https://i.imgur.com/UVf9Maf.jpg',
  'C1_OUTER': 'https://i.imgur.com/hNGM318.jpg',
  'C2_INNER': 'https://i.imgur.com/kz6mMV4.jpg',
  'C2_OUTER': 'https://i.imgur.com/rNSUCiD.jpg',
  'YE': 'https://i.imgur.com/1fFb12y.jpg',
  'KK': 'https://i.imgur.com/KU8qTpt.jpg',
};

const RoadListItem = ({ road }: { road: any }) => {
  const router = useRouter();

  const getStatusInfo = (status: string) => {
    switch (status) {
      case '渋滞':
        return { icon: <WarningAmber sx={{ fontSize: 32, color: '#ffa000' }} />, text: '渋滞', color: '#ffa000' };
      case '通常':
        return { icon: <CheckCircleOutline sx={{ fontSize: 32, color: '#43a047' }} />, text: '通常', color: '#43a047' };
      case '工事':
        return { icon: <Build sx={{ fontSize: 32, color: '#1976d2' }} />, text: '工事', color: '#1976d2' };
      case '事故':
        return { icon: <ReportProblem sx={{ fontSize: 32, color: '#e53935' }} />, text: '事故', color: '#e53935' };
      default:
        return { icon: null, text: status, color: '#000' };
    }
  };

  const statusInfo = getStatusInfo(road.status);

  return (
    <Card 
      sx={{ 
        mb: 1.5, 
        borderRadius: 3, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }
      }}
      onClick={() => router.push(`/road-status/${road.id}`)}
    >
      <Box sx={{ display: 'flex', p: 1.5, alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: road.details ? 0.5 : 0 }}>
            <Box sx={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mr: 1.5, flexShrink: 0
            }}>
              <img src={roadIcons[road.id]} alt={road.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{road.name}</Typography>
          </Box>
          {road.details && <Typography variant="body2" sx={{ color: '#e53935', pl: '52px', fontSize: '0.8rem', fontWeight: 'bold' }}>{road.details}</Typography>}
        </Box>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 100,
          ml: 1, 
          color: statusInfo.color,
        }}>
          {statusInfo.icon}
          <Typography variant="body2" sx={{ fontWeight: 'bold', ml: 1 }}>
            {statusInfo.text}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
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

const RoadStatusPage = () => {
  const router = useRouter();
  const [roads, setRoads] = useState<any[]>([]);
  const { loading, isAdmin } = useAuth();

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const res = await fetch("/api/road-status");
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        setRoads(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('道路状況の取得に失敗しました:', error);
      }
    };
    fetchRoads();
  }, []);

  return (
    <Box sx={{ p: 0, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.5, background: '#fff', borderBottom: '1px solid #e0e0e0'
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <DirectionsCar sx={{ color: '#1a237e', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20 }}>道路状況</Typography>
        </Box>
        {!loading && isAdmin && (
          <IconButton onClick={() => router.push('/road-status/management')}>
            <Settings sx={{ color: '#1a237e' }} />
          </IconButton>
        )}
      </Box>
      
      <Box sx={{ p: 2 }}>
        {/* 事業紹介カード */}
        <Card sx={{ mb: 2, borderRadius: 3, p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#666', mb: 2, textAlign: 'center' }}>事業紹介</Typography>
          <Box display="flex" justifyContent="center" alignItems="center" gap={4}>
            <img src="https://i.imgur.com/MJqfI4u.png" alt="AOIRO PROJECT" style={{ height: 50, objectFit: 'contain' }} />
            <img src="https://i.imgur.com/DnSzsNc.jpg" alt="KEXCO" style={{ height: 50, objectFit: 'contain' }} />
          </Box>
        </Card>

        {/* 路線図カード */}
        <Card sx={{ mb: 2, borderRadius: 3, p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
           <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#666', mb: 1, textAlign: 'center' }}>路線図</Typography>
          <Box sx={{
            width: '100%',
            textAlign: 'center',
            background: '#fff',
            borderRadius: 2,
            p: 1,
            border: '1px solid #eee'
          }}>
            <img
              src="https://i.imgur.com/B5gMids.png"
              alt="首都高路線図"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />
          </Box>
        </Card>

        {/* 道路リスト */}
        <Box>
          {roads.map((road) => (
            <RoadListItem key={road.id} road={road} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default dynamic(() => Promise.resolve(RoadStatusPage), { ssr: false }); 