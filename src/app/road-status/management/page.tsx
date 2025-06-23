"use client";
import { Box, Typography, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";
import { DirectionsCar, ArrowBack, Edit, Save, Cancel, CheckCircleOutline, WarningAmber, Build, ReportProblem } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const roadIcons: { [key: string]: string } = {
  'C1_INNER': 'https://i.imgur.com/UVf9Maf.jpg',
  'C1_OUTER': 'https://i.imgur.com/hNGM318.jpg',
  'C2_INNER': 'https://i.imgur.com/kz6mMV4.jpg',
  'C2_OUTER': 'https://i.imgur.com/rNSUCiD.jpg',
  'YE': 'https://i.imgur.com/1fFb12y.jpg',
  'KK': 'https://i.imgur.com/KU8qTpt.jpg',
};

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

const statusOptions = ['通常', '渋滞', '工事', '事故', '通行止め'];

const HelmetSVG = (props: any) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <ellipse cx="12" cy="17" rx="8" ry="3" fill="#1976d2"/>
    <path d="M4 17V13C4 8.58 7.58 5 12 5C16.42 5 20 8.58 20 13V17" fill="#ffc107"/>
    <rect x="11" y="8" width="2" height="5" fill="#1976d2"/>
  </svg>
);

function StatusIcon({ status }: { status: string }) {
  const iconProps = { sx: { fontSize: 24, mr: 1 } };
  switch (status) {
    case '通常':
      return <CheckCircleOutline {...iconProps} color="success" />;
    case '渋滞':
      return <WarningAmber {...iconProps} color="warning" />;
    case '工事':
      return <Box sx={{ display: 'inline-block', mr: 1 }}><HelmetSVG /></Box>;
    case '事故':
    case '通行止め':
      return <ReportProblem {...iconProps} color="error" />;
    default:
      return null;
  }
}

const RoadStatusManagementPage = () => {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [roads, setRoads] = useState<any[]>([]);
  const [editingRoad, setEditingRoad] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    congestion: '',
    note: ''
  });

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const res = await fetch("/api/road-status");
        const data = await res.json();
        const roadsData = Array.isArray(data) ? data : data.roads;
        
        // 道路を定義された順序でソート
        const sortedRoads = roadsData.sort((a: any, b: any) => {
          const aIndex = roadOrder.indexOf(a.id);
          const bIndex = roadOrder.indexOf(b.id);
          
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          
          return aIndex - bIndex;
        });
        
        setRoads(sortedRoads);
      } catch (error) {
        console.error('道路状況の取得に失敗しました:', error);
        // エラー時はダミーデータを表示
        const dummyRoads = roadOrder.map(id => ({
          id,
          name: id === 'C1_INNER' ? '首都高速都心環状線（内回り）' :
                id === 'C1_OUTER' ? '首都高速都心環状線（外回り）' :
                id === 'C2_INNER' ? '首都高速中央循環線（内回り）' :
                id === 'C2_OUTER' ? '首都高速中央循環線（外回り）' :
                id === 'YE' ? '首都高速八重洲線' :
                '東京高速道路KK線',
          color: defaultRoadColors[id],
          status: '通常',
          congestion: '軽微',
          note: ''
        }));
        setRoads(dummyRoads);
      }
    };
    fetchRoads();
  }, []);

  const handleEditClick = (road: any) => {
    setEditingRoad(road);
    setEditForm({
      status: road.status || '通常',
      congestion: road.congestion || '軽微',
      note: road.note || ''
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRoad) return;

    try {
      const response = await fetch('/api/road-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingRoad.id,
          ...editForm,
        }),
      });

      if (!response.ok) {
        throw new Error('更新に失敗しました');
      }

      // 状態を更新してUIに反映
      const updatedRoad = await response.json();
      const updatedRoads = roads.map(road => 
        road.id === editingRoad.id 
          ? { ...road, ...updatedRoad[0] }
          : road
      );
      setRoads(updatedRoads);
      setEditDialogOpen(false);
      setEditingRoad(null);
    } catch (error) {
      console.error('道路状況の更新に失敗しました:', error);
    }
  };

  const handleCancel = () => {
    setEditDialogOpen(false);
    setEditingRoad(null);
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /><Typography mt={2}>認証確認中...</Typography></Box>;
  }
  if (!isAdmin) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="error.main">管理者のみアクセス可能です</Typography></Box>;
  }

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
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20 }}>道路状況管理</Typography>
        </Box>
      </Box>

      {/* 道路リスト */}
      <Box sx={{ px: 2, pb: 2, pt: 2 }}>
        {roads.map((road, idx) => {
          let finalColor = road.color || defaultRoadColors[road.id] || '#1a237e';
          
          return (
          <Box
            key={road.id + idx}
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
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                }}
              >
                <img src={roadIcons[road.id as keyof typeof roadIcons]} alt={road.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 700, fontSize: 18 }}>{road.name}</Typography>
                {road.note && (
                  <Typography variant="body2" sx={{ color: '#666', fontSize: 14, mt: 0.5 }}>
                    {road.note}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <StatusIcon status={road.status} />
                <Typography sx={{
                  color: road.status === '通常' ? 'success.main' :
                         road.status === '渋滞' ? 'warning.main' :
                         road.status === '工事' ? 'info.main' :
                         (road.status === '事故' || road.status === '通行止め') ? 'error.main' : 'text.primary',
                  fontWeight: 700, 
                  fontSize: 17 
                }}>
                  {road.status}
                </Typography>
              </Box>
              <IconButton 
                onClick={() => handleEditClick(road)}
                sx={{ color: '#1a237e' }}
              >
                <Edit />
              </IconButton>
            </Box>
          </Box>
          );
        })}
      </Box>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#1a237e', fontWeight: 'bold' }}>
          道路状況の編集
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="h6" sx={{ color: '#1a237e', mb: 2 }}>
              {editingRoad?.name}
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>通行状況</InputLabel>
              <Select
                value={editForm.status}
                label="通行状況"
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>渋滞状況</InputLabel>
              <Select
                value={editForm.congestion}
                label="渋滞状況"
                onChange={(e) => setEditForm({ ...editForm, congestion: e.target.value })}
              >
                <MenuItem value="軽微">軽微</MenuItem>
                <MenuItem value="中程度">中程度</MenuItem>
                <MenuItem value="重度">重度</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="備考"
              multiline
              rows={3}
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} startIcon={<Cancel />}>
            キャンセル
          </Button>
          <Button onClick={handleSave} startIcon={<Save />} variant="contained" sx={{ bgcolor: '#1a237e' }}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default dynamic(() => Promise.resolve(RoadStatusManagementPage), { ssr: false }); 