"use client";
import { Box, Typography, IconButton, Button, Paper, Select, MenuItem, TextField, Collapse, Alert, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SupabaseNotification } from "../../../components/SupabaseNotification";

// 路線の表示順序を定義
const lineOrder = [
  'CA',   // 東海道新幹線
  'JK',   // 京浜東北線
  'JY1',  // 山手線（内回り）
  'JY2',  // 山手線（外回り）
  'JB',   // 総武線
  'JC',   // 中央線
  'JT',   // 東海道線
  'JO',   // 横須賀線
  'M',    // 丸の内線
  'Z',    // 半蔵門線
  'C',    // 千代田線
  'H',    // 日比谷線
  'G',    // 銀座線
  'AK',   // あきが丘線
  'AU'    // あおうみ線
];

const initialLines = [
  { id: "CA", name: "東海道新幹線", status: "平常運転", section: "", detail: "" },
  { id: "JK", name: "京浜東北線", status: "平常運転", section: "", detail: "" },
  { id: "JY1", name: "山手線（内回り）", status: "平常運転", section: "", detail: "" },
  { id: "JY2", name: "山手線（外回り）", status: "平常運転", section: "", detail: "" },
  { id: "JB", name: "総武線", status: "平常運転", section: "", detail: "" },
  { id: "JC", name: "中央線", status: "平常運転", section: "", detail: "" },
  { id: "JT", name: "東海道線", status: "平常運転", section: "", detail: "" },
  { id: "JO", name: "横須賀線", status: "平常運転", section: "", detail: "" },
  { id: "M", name: "丸の内線", status: "平常運転", section: "", detail: "" },
  { id: "Z", name: "半蔵門線", status: "平常運転", section: "", detail: "" },
  { id: "C", name: "千代田線", status: "平常運転", section: "", detail: "" },
  { id: "H", name: "日比谷線", status: "平常運転", section: "", detail: "" },
  { id: "G", name: "銀座線", status: "平常運転", section: "", detail: "" },
  { id: "AK", name: "あきが丘線", status: "平常運転", section: "", detail: "" },
  { id: "AU", name: "あおうみ線 (空港アクセス線)", status: "平常運転", section: "", detail: "" }
];

export default function TrainStatusManagement() {
  const router = useRouter();
  const [lines, setLines] = useState(initialLines);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, lineName: string, oldStatus: string, newStatus: string }>({
    open: false,
    lineName: '',
    oldStatus: '',
    newStatus: ''
  });

  // 路線を定義された順序でソートする関数
  const sortLines = (linesData: any[]) => {
    return linesData.sort((a: any, b: any) => {
      const aIndex = lineOrder.indexOf(a.id);
      const bIndex = lineOrder.indexOf(b.id);
      
      // 定義されていない路線は最後に配置
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
  };

  // APIからデータ取得
  const fetchLines = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/train-status");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // 取得したデータをソートして設定
          setLines(sortLines(data));
        }
      }
    } catch (e) {
      console.error('Error fetching train status:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLines();
  }, []);

  const handleEdit = (line: any) => {
    setEditId(line.id);
    setEditValues({ ...line });
  };
  const handleCancel = () => {
    setEditId(null);
    setEditValues({});
  };
  const handleChange = (field: string, value: string) => {
    setEditValues((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleSave = async () => {
    // 現在の路線情報を取得
    const currentLine = lines.find(l => l.id === editId);
    if (!currentLine) return;

    // ステータスが変更されているかチェック
    const statusChanged = currentLine.status !== editValues.status;
    
    if (statusChanged) {
      // ステータスが変更されている場合は確認ダイアログを表示
      setConfirmDialog({
        open: true,
        lineName: currentLine.name,
        oldStatus: currentLine.status,
        newStatus: editValues.status
      });
    } else {
      // ステータスが変更されていない場合は直接保存
      await saveTrainStatus();
    }
  };

  const saveTrainStatus = async () => {
    try {
      setLoading(true);
      // Supabase保存用にlineIdを明示的に付与
      const saveData = { ...editValues, lineId: editValues.id };
      const response = await fetch("/api/save-train-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      if (!response.ok) {
        throw new Error('Failed to save train status');
      }
      // ローカルのlinesも更新（ソートを維持）
      const newLines = lines.map((l) => l.id === editId ? { ...editValues } : l);
      setLines(sortLines(newLines));
      setEditId(null);
      setEditValues({});
      // 保存後に再取得（ソート済み）
      await fetchLines();
      setMessage({ type: 'success', text: '運行情報を保存しました' });
    } catch (e) {
      console.error('Error saving train status:', e);
      setMessage({ type: 'error', text: '運行情報の保存に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    setConfirmDialog({ open: false, lineName: '', oldStatus: '', newStatus: '' });
    await saveTrainStatus();
  };

  const handleCancelConfirm = () => {
    setConfirmDialog({ open: false, lineName: '', oldStatus: '', newStatus: '' });
  };

  // バリデーション関数
  const validateForm = () => {
    // ステータスが必須
    if (!editValues.status) return false;
    
    // 遅延や運転見合わせの場合は区間と詳細情報が必須
    if (editValues.status === '遅延' || editValues.status === '運転見合わせ') {
      if (!editValues.section || !editValues.detail) return false;
    }
    
    return true;
  };

  // 保存ボタンの無効化状態を取得
  const isSaveDisabled = !validateForm() || loading;


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
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20 }}>運行状況管理</Typography>
        </Box>
      </Box>

      {/* メッセージ表示 */}
      {message && (
        <Box sx={{ px: 2, py: 1 }}>
          <Alert severity={message.type} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        </Box>
      )}
      {/* 路線リスト */}
      <Box sx={{ px: 2, pt: 2 }}>
        {lines.map((line) => (
          <Paper key={line.id} sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 17 }}>{line.name}</Typography>
              {editId === line.id ? (
                <>
                  <IconButton 
                    color="primary" 
                    onClick={handleSave} 
                    disabled={isSaveDisabled}
                    sx={{ 
                      opacity: isSaveDisabled ? 0.5 : 1,
                      '&:hover': {
                        opacity: isSaveDisabled ? 0.5 : 0.8
                      }
                    }}
                  >
                    <SaveIcon />
                  </IconButton>
                  <IconButton color="inherit" onClick={handleCancel}><CloseIcon /></IconButton>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(line)}>編集</Button>
                </Box>
              )}
            </Box>
            <Collapse in={editId === line.id}>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
                    運行状況ステータス
                    <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
                  </Typography>
                  <Select
                    value={editValues.status || ''}
                    onChange={e => handleChange('status', e.target.value)}
                    size="small"
                    sx={{ 
                      minWidth: 160,
                      backgroundColor: !editValues.status ? '#fff3e0' : 'white'
                    }}
                  >
                    <MenuItem value="平常運転">平常運転</MenuItem>
                    <MenuItem value="遅延">遅延</MenuItem>
                    <MenuItem value="運転見合わせ">運転見合わせ</MenuItem>
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
                    遅延区間・運転見合わせ区間
                    {(editValues.status === '遅延' || editValues.status === '運転見合わせ') && (
                      <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
                    )}
                  </Typography>
                  <TextField
                    value={editValues.section || ''}
                    onChange={e => handleChange('section', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="例: 東京〜新宿"
                    sx={{
                      backgroundColor: (editValues.status === '遅延' || editValues.status === '運転見合わせ') && !editValues.section ? '#fff3e0' : 'white'
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
                    詳細情報
                    {(editValues.status === '遅延' || editValues.status === '運転見合わせ') && (
                      <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
                    )}
                  </Typography>
                  <TextField
                    value={editValues.detail || ''}
                    onChange={e => handleChange('detail', e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="詳細な状況や備考を入力"
                    sx={{
                      backgroundColor: (editValues.status === '遅延' || editValues.status === '運転見合わせ') && !editValues.detail ? '#fff3e0' : 'white'
                    }}
                  />
                </Box>
              </Box>
            </Collapse>
            {/* 現在の情報表示 */}
            {editId !== line.id && (
              <Box sx={{ mt: 1, color: '#555', fontSize: 15 }}>
                <span>ステータス: {line.status}</span>
                {line.section && <span> ／ 区間: {line.section}</span>}
                {line.detail && <><br />詳細: {line.detail}</>}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
      <SupabaseNotification />

      {/* 確認ダイアログ */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <WarningIcon color="error" />
          運行情報変更の確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>{confirmDialog.lineName}</strong>の運行情報を変更します。
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>変更前:</strong> {confirmDialog.oldStatus}
            <br />
            <strong>変更後:</strong> {confirmDialog.newStatus}
          </DialogContentText>
          <DialogContentText sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
            ⚠️ この変更により、この路線の通知を登録しているユーザー全員にメール通知が送信されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelConfirm} color="inherit">
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmSave} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            変更を保存して通知を送信
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 