'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { ExpandMore, Refresh } from '@mui/icons-material';

export default function DebugTablesPage() {
  const [tableStructure, setTableStructure] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTableStructure = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/check-table-structure');
      const data = await res.json();
      setTableStructure(data);
    } catch (err) {
      setError('テーブル構造の取得に失敗しました');
      console.error('Table structure fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableStructure();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        テーブル構造デバッグ
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">テーブル構造</Typography>
          <Button
            startIcon={<Refresh />}
            onClick={fetchTableStructure}
            disabled={loading}
            variant="outlined"
          >
            更新
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {tableStructure && (
              <>
                <Alert 
                  severity={tableStructure.user_profiles_has_points ? 'success' : 'warning'} 
                  sx={{ mb: 2 }}
                >
                  user_profilesテーブル: {tableStructure.user_profiles_has_points ? 'pointsカラムが存在します' : 'pointsカラムが存在しません'}
                </Alert>

                <Alert 
                  severity={tableStructure.login_bonus_has_user_id ? 'success' : 'warning'} 
                  sx={{ mb: 2 }}
                >
                  login_bonusテーブル: {tableStructure.login_bonus_has_user_id ? 'user_idカラムが存在します' : 'user_idカラムが存在しません'}
                </Alert>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">user_profilesテーブル構造</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        カラム一覧:
                      </Typography>
                      <pre style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '10px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(tableStructure.user_profiles, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">login_bonusテーブル構造</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        カラム一覧:
                      </Typography>
                      <pre style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '10px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(tableStructure.login_bonus, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          トラブルシューティング
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            pointsカラムが存在しない場合の対処法:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              SupabaseダッシュボードでSQLエディタを開く
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              以下のSQLを実行:
            </Typography>
            <Box component="pre" sx={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              mt: 1
            }}>
{`ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

UPDATE user_profiles 
SET points = 0 
WHERE points IS NULL;`}
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
} 