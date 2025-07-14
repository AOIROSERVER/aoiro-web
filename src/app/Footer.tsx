'use client';

import { useEffect, useState } from 'react';
import { FaUsers, FaServer } from 'react-icons/fa';
import { Box, Typography, Link } from "@mui/material";

export default function Footer() {
  // サーバー稼働状況の状態管理
  const [serverStatus, setServerStatus] = useState<{
    online: boolean;
    responseTime: number | null;
    playerCount?: number;
    maxPlayers?: number;
    version?: string | null;
  }>({ online: false, responseTime: null });

  // サーバー状況を取得
  useEffect(() => {
    const checkServerStatus = async () => {
      const startTime = Date.now();
      try {
        const response = await fetch(`/api/minecraft-status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000)
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        if (response.ok) {
          const data = await response.json();
          setServerStatus({
            online: !!data.online,
            responseTime,
            playerCount: data.players?.online || 0,
            maxPlayers: data.players?.max || 0,
            version: data.version || '-'
          });
        } else {
          setServerStatus({ online: false, responseTime: null });
        }
      } catch {
        setServerStatus({ online: false, responseTime: null });
      }
    };
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ background: '#f0f0f0', color: '#00001C', py: 4 }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        {/* 左側：既存の文字・ボタン */}
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ borderLeft: '2px solid #00001C', height: 20, mx: 1 }} />
            <Link href="/privacy" color="inherit" underline="hover" sx={{ fontSize: 16, fontWeight: 400 }}>プライバシーポリシー</Link>
            <Box sx={{ borderLeft: '2px solid #00001C', height: 20, mx: 1 }} />
            <Link 
              href="/contact" 
              color="inherit" 
              underline="hover" 
              sx={{ fontSize: 16, fontWeight: 400 }}
            >
              お問い合わせ
            </Link>
            <Box sx={{ borderLeft: '2px solid #00001C', height: 20, mx: 1 }} />
            <Link 
              href="https://discord.com/invite/U9DVtc2y5J" 
              target="_blank" 
              rel="noopener noreferrer"
              color="inherit" 
              underline="hover" 
              sx={{ 
                fontSize: 16, 
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
              </svg>
              Discord
            </Link>
            <Box sx={{ borderLeft: '2px solid #00001C', height: 20, mx: 1 }} />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 400, mt: 1 }}>Copyright © 2024 AOIROSERVER All Rights Reserved.</Typography>
        </Box>
        {/* 右側：サーバー稼働状況 */}
        <Box sx={{ minWidth: 0, textAlign: { xs: 'center', sm: 'right' }, flex: 1, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-end' }, justifyContent: 'center' }}>
          <Box sx={{
            background: 'transparent',
            color: '#666',
            py: 0.7,
            px: 1.2,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.2,
            border: 'none',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', sm: 'flex-end' },
            justifyContent: 'center',
          }}>
            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1.3} width="100%">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <Box sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: serverStatus.online ? '#4caf50' : '#f44336',
                  mr: 0.7,
                  border: '1.5px solid #fff',
                  boxShadow: serverStatus.online ? '0 0 0 1.5px #c8e6c9' : '0 0 0 1.5px #ffcdd2'
                }} />
                <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, color: serverStatus.online ? '#388e3c' : '#c62828' }}>
                  AOIROSERVER{serverStatus.online ? '稼働中' : '停止中'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <FaUsers style={{ fontSize: 15, color: '#1976d2' }} />
                <Typography component="span" sx={{ fontSize: 14, color: '#555', fontWeight: 600 }}>
                  {serverStatus.playerCount || 0}/{serverStatus.maxPlayers || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <FaServer style={{ fontSize: 15, color: '#1976d2' }} />
                <Typography component="span" sx={{ fontSize: 14, color: '#555', fontWeight: 600 }}>
                  {serverStatus.version || '-'}
                </Typography>
              </Box>
              {serverStatus.online && serverStatus.responseTime && (
                <Typography component="span" sx={{ fontSize: 12, color: '#888', fontWeight: 500, ml: 0.7 }}>
                  応答: {serverStatus.responseTime}ms
                </Typography>
              )}
            </Box>
            <Typography sx={{ color: '#bbb', fontSize: 10, mt: 0.4 }}>
              AOIROSERVER
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 