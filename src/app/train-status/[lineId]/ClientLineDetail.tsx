"use client";
import { Box, Typography, IconButton, Paper } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TrainIcon from "@mui/icons-material/Train";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRouter } from "next/navigation";

export default function ClientLineDetail({ line, stationData, params }: any) {
  const router = useRouter();
  if (!line) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>路線が見つかりません</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 2, background: '#fff', borderBottom: '1px solid #e0e0e0', mb: 0.5
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => router.back()}>
            <ArrowBackIosNewIcon sx={{ color: '#1a237e' }} />
          </IconButton>
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
          <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: `2.5px solid ${line.statusColor}`, display: 'inline-block', mr: 1 }} />
          <Typography sx={{ color: line.statusColor, fontWeight: 700, fontSize: 18 }}>{line.status}</Typography>
        </Box>
      </Box>
      {/* 列車位置情報カード型ボタン */}
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
          onClick={() => router.push(`/train-status/${params.lineId}/train-position`)}
        >
          <TrainIcon sx={{ color: '#2196f3', fontSize: 32, mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#222' }}>列車位置情報</Typography>
            <Typography sx={{ fontSize: 13, color: '#888', mt: 0.2 }}>リアルタイムで列車の位置を確認</Typography>
          </Box>
          <ChevronRightIcon sx={{ color: '#888', fontSize: 28 }} />
        </Paper>
      </Box>
      {/* 主要駅一覧 */}
      <Box sx={{ px: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <TrainIcon sx={{ color: '#1976d2' }} />
          <Typography sx={{ color: '#1976d2', fontWeight: 700, fontSize: 16 }}>主要駅一覧</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          {/* 縦ライン */}
          <Box sx={{ width: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
            {stationData[params.lineId].map((_: any, idx: number) => (
              <Box key={idx} sx={{ width: 6, height: idx === stationData[params.lineId].length - 1 ? 24 : 64, background: line.color, borderRadius: 3, mb: idx === stationData[params.lineId].length - 1 ? 0 : -1 }} />
            ))}
          </Box>
          {/* 駅カードリスト */}
          <Box sx={{ flex: 1 }}>
            {stationData[params.lineId].map((station: any, idx: number) => (
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
                      {station.transfers.map((tr: any) => (
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
                  {station.icons.map((icon: any, i: number) => (
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