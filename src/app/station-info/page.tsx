"use client";
import { useState } from "react";
import { Box, Card, Typography, TextField, InputAdornment, Grid, Avatar, IconButton } from "@mui/material";
import { Search, Business, ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

// ダミー駅データ
const stations = [
  { id: "S01", name: "東京", line: "山手線" },
  { id: "S02", name: "新宿", line: "中央線" },
  { id: "S03", name: "品川", line: "京浜東北線" },
  { id: "S04", name: "渋谷", line: "山手線" },
  { id: "S05", name: "池袋", line: "山手線" },
  { id: "S06", name: "秋葉原", line: "総武線" },
];

export default function StationInfoPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const filtered = stations.filter(
    (s) => s.name.includes(search) || s.line.includes(search)
  );
  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 2,
        background: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <IconButton onClick={() => router.back()}>
          <ArrowBack sx={{ color: '#1a237e' }} />
        </IconButton>
        <Business sx={{ color: '#2196F3', fontSize: 28, ml: 1 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20, ml: 1 }}>
          駅情報
        </Typography>
      </Box>
      
      {/* コンテンツ */}
      <Box sx={{ p: 2 }}>
        {/* 検索欄 */}
        <TextField
          fullWidth
          placeholder="駅名・路線名で検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3, background: '#fff', borderRadius: 2 }}
        />
        {/* 駅リスト */}
        <Grid container spacing={2}>
          {filtered.map((station) => (
            <Grid key={station.id} {...{ item: true, xs: 12, sm: 6 }}>
              <Card
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: 2,
                  cursor: 'pointer',
                }}
                // 詳細画面への遷移はonClickでrouter.push(`/station-info/${station.id}`)などで実装可能
              >
                <Avatar sx={{ bgcolor: '#2196F3', color: '#fff', fontWeight: 'bold' }}>{station.name[0]}</Avatar>
                <Box>
                  <Typography variant="h6">{station.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{station.line}</Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
} 