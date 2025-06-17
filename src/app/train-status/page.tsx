"use client";
import { Box, Card, Typography, IconButton } from "@mui/material";
import { Train, Settings } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";

function StatusIcon({ status }: { status: string }) {
  if (status === '平常運転') {
    return (
      <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />
    );
  } else if (status === '遅延') {
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
  } else if (status === '運転見合わせ') {
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

const TrainStatusPage = () => {
  const router = useRouter();
  const [lines, setLines] = useState<any[]>([]);

  useEffect(() => {
    const fetchLines = async () => {
      const res = await fetch("/api/train-status");
      const data = await res.json();
      setLines(Array.isArray(data) ? data : data.lines);
    };
    fetchLines();
  }, []);

  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 2, background: '#fff', borderBottom: '1px solid #e0e0e0', mb: 0.5
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Train sx={{ color: '#1a237e', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20 }}>運行状況</Typography>
        </Box>
        <IconButton onClick={() => router.push('/train-status/management')}>
          <Settings sx={{ color: '#1a237e' }} />
        </IconButton>
      </Box>
      {/* 路線図カード */}
      <Box sx={{ px: 2, mt: 2, mb: 2 }}>
        <Box sx={{
          background: '#f6f3fb',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          p: 2,
        }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#3c2e67', mb: 1 }}>路線図</Typography>
          <Box sx={{
            width: '100%',
            textAlign: 'center',
            mb: 1.5,
            background: '#fff',
            borderRadius: 2,
            p: 1
          }}>
            <img
              src="https://i.imgur.com/lXFbsaE.jpg"
              alt="路線図"
              style={{
                width: '100%',
                maxWidth: 500,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}
            />
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center" gap={3}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <StatusIcon status="平常運転" />
              <Typography sx={{ color: '#43a047', fontWeight: 600, fontSize: 15 }}>平常運転</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <StatusIcon status="遅延" />
              <Typography sx={{ color: '#ffa000', fontWeight: 600, fontSize: 15 }}>遅延</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <StatusIcon status="運転見合わせ" />
              <Typography sx={{ color: '#e53935', fontWeight: 600, fontSize: 15 }}>運転見合わせ</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      {/* 路線リスト */}
      <Box sx={{ px: 2, pb: 2 }}>
        {lines.map((line, idx) => (
          <Box
            key={line.id + idx}
            sx={{
              background: '#fff',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              mb: 2,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.13)'
              }
            }}
            onClick={() => router.push(`/train-status/${line.id}`)}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: ['M', 'Z', 'C', 'H', 'G'].includes(line.id) ? '50%' : 2,
                  border: ['M', 'Z', 'C', 'H', 'G'].includes(line.id) ? `8px solid ${line.color}` : `2.8px solid ${line.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#1a237e',
                  background: '#fff',
                  mr: 1
                }}
              >
                {(line.id === 'JY1' || line.id === 'JY2') ? 'JY' : line.id}
              </Box>
              <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 700, fontSize: 18 }}>{line.name}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <StatusIcon status={line.status} />
              <Typography sx={{ color: line.status === '平常運転' ? '#43a047' : line.status === '遅延' ? '#ffa000' : '#e53935', fontWeight: 700, fontSize: 17 }}>{line.status}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default dynamic(() => Promise.resolve(TrainStatusPage), { ssr: false }); 