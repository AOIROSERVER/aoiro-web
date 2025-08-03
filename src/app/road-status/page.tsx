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
      case '通行止め':
        return { icon: <ReportProblem sx={{ fontSize: 32, color: '#e53935' }} />, text: '通行止め', color: '#e53935' };
      default:
        return { icon: null, text: status, color: '#000' };
    }
  };

  const statusInfo = getStatusInfo(road.status);

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 4, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        p: 2, 
        alignItems: 'flex-start',
        background: road.status !== '通常' ? 'linear-gradient(135deg, #fff 0%, #fafafa 100%)' : '#fff'
      }}>
        <Box sx={{ flexGrow: 1 }}>
          {/* 道路名とアイコン */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: (road.note || road.congestion) ? 1 : 0 }}>
            <Box sx={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mr: 2, flexShrink: 0,
              background: '#f8f9fa',
              borderRadius: 2,
              border: '1px solid #e9ecef'
            }}>
              <img src={roadIcons[road.id]} alt={road.name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              color: '#2c3e50',
              lineHeight: 1.2
            }}>
              {road.name}
            </Typography>
          </Box>
          
          {/* 詳細情報を横並びで表示 */}
          {(road.note || road.congestion) && (
            <Box sx={{ 
              pl: 6, 
              mt: 0.5,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center'
            }}>
              {/* 備考情報（区間情報） */}
              {road.note && (
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  background: road.status === '渋滞' ? '#fff8e1' : 
                             road.status === '工事' ? '#e8f4fd' : 
                             road.status === '事故' || road.status === '通行止め' ? '#ffebee' : '#f8f9fa',
                  border: `1px solid ${road.status === '渋滞' ? '#ffcc02' : 
                             road.status === '工事' ? '#2196f3' : 
                             road.status === '事故' || road.status === '通行止め' ? '#f44336' : '#dee2e6'}`,
                  maxWidth: '100%'
                }}>
                  <Typography variant="body2" sx={{ 
                    color: road.status === '渋滞' ? '#e65100' : 
                           road.status === '工事' ? '#1565c0' : 
                           road.status === '事故' || road.status === '通行止め' ? '#c62828' : '#495057',
                    fontSize: '0.85rem', 
                    fontWeight: 500,
                    lineHeight: 1.2
                  }}>
                    {road.note}
                  </Typography>
                </Box>
              )}
              
              {/* 渋滞状況（通常以外の場合） */}
              {road.congestion && road.status !== '通常' && (
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1,
                  py: 0.3,
                  borderRadius: 1,
                  background: road.congestion === '重度' ? '#ffebee' : 
                             road.congestion === '中程度' ? '#fff3e0' : '#f5f5f5',
                  border: `1px solid ${road.congestion === '重度' ? '#ffcdd2' : 
                             road.congestion === '中程度' ? '#ffcc80' : '#e0e0e0'}`
                }}>
                  <Typography variant="body2" sx={{ 
                    color: road.congestion === '重度' ? '#d32f2f' : 
                           road.congestion === '中程度' ? '#f57c00' : '#666',
                    fontSize: '0.75rem', 
                    fontWeight: 600
                  }}>
                    {road.congestion}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
        
        {/* ステータス表示を右側に配置 */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 100,
          ml: 2,
          color: statusInfo.color,
        }}>
          {statusInfo.icon}
          <Typography variant="body2" sx={{ 
            fontWeight: 'bold', 
            mt: 0.5,
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
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
      <Box className="page-header">
        <Box className="page-title">
          <DirectionsCar className="page-title-icon" />
          <Typography className="page-title-text">道路状況</Typography>
        </Box>
        {!loading && isAdmin && (
          <IconButton onClick={() => router.push('/road-status/management')} className="page-header-action">
            <Settings />
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