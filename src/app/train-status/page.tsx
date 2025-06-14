"use client";
import { Box, Card, Typography, IconButton } from "@mui/material";
import { Train, Settings } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

// 路線データ（例）
const lines = [
  // JR路線
  { id: "CA", name: "東海道新幹線", color: "#0033cb", status: "平常運転" },
  { id: "JK", name: "京浜東北線", color: "#00b2e5", status: "平常運転" },
  { id: "JY", name: "山手線（内回り）", color: "#8fd400", status: "平常運転" },
  { id: "JY", name: "山手線（外回り）", color: "#8fd400", status: "平常運転" },
  { id: "JB", name: "総武線", color: "#ffd400", status: "平常運転" },
  { id: "JC", name: "中央線", color: "#f15a22", status: "平常運転" },
  { id: "JT", name: "東海道線", color: "#f68b1e", status: "平常運転" },
  { id: "JO", name: "横須賀線", color: "#1069b4", status: "平常運転" },
  // 東京メトロ路線
  { id: "M", name: "丸の内線", color: "#f62e36", status: "平常運転" },
  { id: "Z", name: "半蔵門線", color: "#8f76d6", status: "平常運転" },
  { id: "C", name: "千代田線", color: "#00bb86", status: "平常運転" },
  { id: "H", name: "日比谷線", color: "#b5b5ac", status: "平常運転" },
  { id: "G", name: "銀座線", color: "#f39700", status: "平常運転" },
  // 私鉄路線
  { id: "AK", name: "あきが丘線", color: "#e37e40", status: "平常運転" },
  { id: "AU", name: "あおうみ線 (空港アクセス線)", color: "#15206b", status: "平常運転" }
];

function StatusIcon() {
  return <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #43a047', display: 'inline-block', mr: 1 }} />;
}

const TrainStatusPage = () => {
  const router = useRouter();
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
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #43a047', mr: 0.5 }} />
              <Typography sx={{ color: '#43a047', fontWeight: 600, fontSize: 15 }}>平常運転</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #ffa000', mr: 0.5 }} />
              <Typography sx={{ color: '#ffa000', fontWeight: 600, fontSize: 15 }}>遅延</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #e53935', mr: 0.5 }} />
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
                {line.id}
              </Box>
              <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 700, fontSize: 18 }}>{line.name}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <StatusIcon />
              <Typography sx={{ color: '#43a047', fontWeight: 700, fontSize: 17 }}>平常運転</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default dynamic(() => Promise.resolve(TrainStatusPage), { ssr: false }); 