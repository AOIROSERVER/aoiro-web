"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { Add, Edit, Delete, Save, Cancel } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface EmployeeCard {
  id: string;
  user_id: string;
  section_name: string;
  employee_number: string;
  card_number: string;
  issue_date: string;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ユーザーインターフェースは不要になったため削除

export default function EmployeeCardsAdminPage() {
  const [employeeCards, setEmployeeCards] = useState<EmployeeCard[]>([]);
  // ユーザーリストは不要になったため削除
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<EmployeeCard | null>(null);
  const [formData, setFormData] = useState({
    user_email: '',
    section_name: '',
    employee_number: '',
    card_number: '',
    issue_date: '',
    expiry_date: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const { user, loading: authLoading } = useAuth();

  // 管理者権限チェック
  useEffect(() => {
    console.log('useEffect実行:', { authLoading, user: user?.id, userEmail: user?.email });
    
    if (!authLoading && user) {
      console.log('管理者権限チェック開始');
      checkAdminRole();
    } else if (!authLoading && !user) {
      console.log('ユーザーがログインしていません');
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkAdminRole = async () => {
    try {
      console.log('管理者権限チェック開始, ユーザーID:', user?.id);
      console.log('ユーザーメール:', user?.email);
      
      // 一時的に管理者権限チェックをバイパス（デバッグ用）
      if (user?.email === 'aoiroserver.m@gmail.com') {
        console.log('管理者ユーザーとして認識、権限チェックをスキップ');
        loadEmployeeCards();
        return;
      }
      
      const response = await fetch('/api/check-admin-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      console.log('権限チェックレスポンス:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('権限チェック失敗:', errorData);
        window.location.href = '/';
        return;
      }

      const data = await response.json();
      console.log('権限チェック成功:', data);

      loadEmployeeCards();
    } catch (error) {
      console.error('権限チェックエラー:', error);
      window.location.href = '/';
    }
  };

  const loadEmployeeCards = async () => {
    try {
      console.log('社員証明書読み込み開始');
      const response = await fetch('/api/admin/employee-cards', {
        method: 'GET',
      });

      console.log('社員証明書APIレスポンス:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('社員証明書データ:', data);
        setEmployeeCards(data.employeeCards || []);
      } else {
        console.error('社員証明書APIエラー:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('社員証明書読み込みエラー:', error);
    } finally {
      console.log('社員証明書読み込み完了、loadingをfalseに設定');
      setLoading(false);
    }
  };

  // ユーザーリストの読み込みは不要になったため削除

  const handleOpenDialog = (card?: EmployeeCard) => {
    if (card) {
      setEditingCard(card);
      // 編集時はユーザーIDからメールアドレスを取得する必要がある
      // 一時的にユーザーIDを表示
      setFormData({
        user_email: card.user_id, // 後でメールアドレスに変換
        section_name: card.section_name,
        employee_number: card.employee_number,
        card_number: card.card_number,
        issue_date: card.issue_date,
        expiry_date: card.expiry_date
      });
    } else {
      setEditingCard(null);
      setFormData({
        user_email: '',
        section_name: '',
        employee_number: '',
        card_number: '',
        issue_date: '',
        expiry_date: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCard(null);
    setFormData({
      user_email: '',
      section_name: '',
      employee_number: '',
      card_number: '',
      issue_date: '',
      expiry_date: ''
    });
  };

  const handleSubmit = async () => {
    try {
      console.log('フォーム送信開始');
      console.log('現在の認証状態:', { user: user?.email, authLoading });
      
      // バリデーションチェック
      if (!formData.user_email || !formData.section_name || !formData.employee_number || 
          !formData.card_number || !formData.issue_date || !formData.expiry_date) {
        setSnackbar({
          open: true,
          message: 'すべての必須フィールドを入力してください',
          severity: 'error'
        });
        return;
      }

      // 日付の妥当性チェック
      if (new Date(formData.issue_date) >= new Date(formData.expiry_date)) {
        setSnackbar({
          open: true,
          message: '発行日は有効期限より前の日付を設定してください',
          severity: 'error'
        });
        return;
      }

      const url = editingCard 
        ? `/api/admin/employee-cards/${editingCard.id}`
        : '/api/admin/employee-cards';
      
      const method = editingCard ? 'PUT' : 'POST';

      console.log('送信データ:', formData);

      // 認証トークンを取得（複数の方法を試行）
      let token = null;
      
      try {
        // 方法1: セッションから取得
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
        console.log('セッションからトークン取得:', token ? '成功' : '失敗');
        
        // 方法2: ローカルストレージから取得
        if (!token) {
          const storedSession = localStorage.getItem('aoiro-auth-token');
          if (storedSession) {
            try {
              const parsedSession = JSON.parse(storedSession);
              token = parsedSession.access_token;
              console.log('ローカルストレージからトークン取得:', token ? '成功' : '失敗');
            } catch (e) {
              console.log('ローカルストレージのパースに失敗');
            }
          }
        }
        
        // 方法3: 現在のユーザーから取得
        if (!token) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // ユーザーが存在する場合は、セッションを再取得
            const { data: { session: newSession } } = await supabase.auth.getSession();
            token = newSession?.access_token;
            console.log('ユーザーからセッション再取得:', token ? '成功' : '失敗');
          }
        }
        
      } catch (error) {
        console.error('トークン取得エラー:', error);
      }
      
      if (!token) {
        console.log('トークン取得失敗、ログイン状態を確認');
        setSnackbar({
          open: true,
          message: '認証トークンが取得できません。再度ログインしてください。',
          severity: 'error'
        });
        return;
      }
      
      console.log('トークン取得成功:', token ? 'あり' : 'なし');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingCard ? '社員証明書を更新しました' : '社員証明書を作成しました',
          severity: 'success'
        });
        handleCloseDialog();
        loadEmployeeCards();
      } else {
        throw new Error('操作に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('この社員証明書を削除しますか？')) return;

    try {
      const response = await fetch(`/api/admin/employee-cards/${cardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: '社員証明書を削除しました',
          severity: 'success'
        });
        loadEmployeeCards();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error'
      });
    }
  };

  const getUserEmail = (userId: string) => {
    // const user = users.find(u => u.id === userId); // usersは削除されたため
    return '不明'; // ユーザーリストがないため
  };

  const getUserName = (userId: string) => {
    // const user = users.find(u => u.id === userId); // usersは削除されたため
    return '不明'; // ユーザーリストがないため
  };

  if (loading || authLoading) {
    return (
      <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5" sx={{ color: "#666", mb: 2 }}>
            読み込み中...
          </Typography>
          <Typography variant="body2" sx={{ color: "#999" }}>
            authLoading: {authLoading ? 'true' : 'false'}, loading: {loading ? 'true' : 'false'}
          </Typography>
          <Typography variant="body2" sx={{ color: "#999" }}>
            ユーザー: {user ? `${user.email} (${user.id})` : '未ログイン'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: 8, pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight="bold" mb={2} sx={{ color: "#0a1a0a" }}>
              社員証明書管理
            </Typography>
            <Typography variant="body1" sx={{ color: "#666" }}>
              社員証明書情報の作成、編集、削除を行います
            </Typography>
          </Box>
          <Button
            variant="outlined"
            href="/admin"
            sx={{
              borderColor: "#0a1a0a",
              color: "#0a1a0a",
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: "500",
              "&:hover": {
                borderColor: "#1a2a1a",
                backgroundColor: "rgba(10, 26, 10, 0.04)",
              }
            }}
          >
            ダッシュボードに戻る
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: "linear-gradient(135deg, #0a1a0a 0%, #2a3a2a 100%)",
              color: "white",
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: "bold",
              "&:hover": {
                background: "linear-gradient(135deg, #1a2a1a 0%, #3a4a3a 100%)",
              }
            }}
          >
            新規作成
          </Button>
          
          <Button
            variant="outlined"
            onClick={async () => {
              console.log('認証状態確認');
              const { data: { session } } = await supabase.auth.getSession();
              const { data: { user } } = await supabase.auth.getUser();
              console.log('セッション:', session);
              console.log('ユーザー:', user);
              console.log('ローカルストレージ:', localStorage.getItem('aoiro-auth-token'));
            }}
            sx={{
              borderColor: "#666",
              color: "#666",
              px: 2,
              py: 1.5,
              borderRadius: 2,
            }}
          >
            認証確認
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ユーザー</TableCell>
                <TableCell>セクション</TableCell>
                <TableCell>社員番号</TableCell>
                <TableCell>カード番号</TableCell>
                <TableCell>発行日</TableCell>
                <TableCell>有効期限</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employeeCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {getUserName(card.user_id)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {getUserEmail(card.user_id)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{card.section_name}</TableCell>
                  <TableCell>{card.employee_number}</TableCell>
                  <TableCell>{card.card_number}</TableCell>
                  <TableCell>
                    {new Date(card.issue_date).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    {new Date(card.expiry_date).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: card.is_active ? '#e8f5e8' : '#ffebee',
                        color: card.is_active ? '#2e7d32' : '#c62828',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {card.is_active ? '有効' : '無効'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(card)}
                        sx={{ color: '#1976d2' }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(card.id)}
                        sx={{ color: '#d32f2f' }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 作成・編集ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCard ? '社員証明書編集' : '社員証明書作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              value={formData.user_email}
              onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
              placeholder="例：user@example.com"
              helperText="AOIRO IDとして登録されているメールアドレスを入力してください"
              required
            />

            <TextField
              fullWidth
              label="セクション名"
              value={formData.section_name}
              onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
              placeholder="例：開発セクション、営業セクション、クリエイティブセクション"
              required
              helperText="所属するセクション名を入力してください"
            />

            <TextField
              fullWidth
              label="社員番号"
              value={formData.employee_number}
              onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
              placeholder="例：EMP001、EMP002"
              required
              helperText="一意の社員番号を入力してください"
            />

            <TextField
              fullWidth
              label="カード番号"
              value={formData.card_number}
              onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
              placeholder="例：1234 5678 9012 3456"
            />

            <TextField
              fullWidth
              label="発行日"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              helperText="証明書の発行日を選択してください"
            />

            <TextField
              fullWidth
              label="有効期限"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              helperText="証明書の有効期限を選択してください（発行日より後の日付）"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
            {editingCard ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

              {/* 環境変数設定の注意事項は不要になったため削除 */}

        {/* スナックバー */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
    </Container>
  );
}
