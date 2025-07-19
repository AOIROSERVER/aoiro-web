'use client';

import { FaUsers, FaServer } from 'react-icons/fa';
import { Box, Typography, Link } from "@mui/material";
import { useServerStatus } from "../contexts/ServerStatusContext";

export default function Footer() {
  const { serverStatus } = useServerStatus();

  return (
    <>
      {/* スマホ用稼働状況表示（フッターの上） */}
      <Box className="mobile-server-status" sx={{
        display: { xs: 'flex', sm: 'none' },
        justifyContent: 'center',
        alignItems: 'center',
        py: 1.5,
        px: 2,
        background: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        borderBottom: '1px solid #e9ecef',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: serverStatus.online ? '#4caf50' : '#f44336',
            border: '1px solid #fff',
            boxShadow: serverStatus.online ? '0 0 0 1px #c8e6c9' : '0 0 0 1px #ffcdd2'
          }} />
          <Typography component="span" sx={{ 
            fontWeight: 600, 
            fontSize: 13, 
            color: serverStatus.online ? '#388e3c' : '#c62828',
            whiteSpace: 'nowrap'
          }}>
            AOIROSERVER{serverStatus.online ? '稼働中' : '停止中'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaUsers style={{ fontSize: 13, color: '#1976d2' }} />
          <Typography component="span" sx={{ 
            fontSize: 13, 
            color: '#555', 
            fontWeight: 500
          }}>
            {serverStatus.playerCount || 0}/{serverStatus.maxPlayers || 0}
          </Typography>
        </Box>
        {serverStatus.online && serverStatus.responseTime && (
          <Typography component="span" sx={{ 
            fontSize: 11, 
            color: '#888', 
            fontWeight: 500
          }}>
            応答: {serverStatus.responseTime}ms
          </Typography>
        )}
      </Box>

      {/* フッター本体 */}
      <Box className="footer" sx={{ background: '#f0f0f0', color: '#00001C', py: 4 }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          {/* 左側：既存の文字・ボタン */}
          <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' }, justifyContent: 'center' }}>
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
              alignItems: { xs: 'center', sm: 'flex-start' },
              justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#bbb', fontSize: 10, mb: 0.4 }}>
                © 2024 AOIROSERVER
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Link href="/about" sx={{ color: '#666', textDecoration: 'none', fontSize: 12, '&:hover': { color: '#333' } }}>
                  このアプリについて
                </Link>
                <Typography component="span" sx={{ color: '#ccc', fontSize: 12 }}>|</Typography>
                <Link href="/help" sx={{ color: '#666', textDecoration: 'none', fontSize: 12, '&:hover': { color: '#333' } }}>
                  ヘルプ
                </Link>
                <Typography component="span" sx={{ color: '#ccc', fontSize: 12 }}>|</Typography>
                <Link href="/contact" sx={{ color: '#666', textDecoration: 'none', fontSize: 12, '&:hover': { color: '#333' } }}>
                  お問い合わせ
                </Link>
                <Typography component="span" sx={{ color: '#ccc', fontSize: 12 }}>|</Typography>
                <Link href="/privacy" sx={{ color: '#666', textDecoration: 'none', fontSize: 12, '&:hover': { color: '#333' } }}>
                  プライバシーポリシー
                </Link>
                <Typography component="span" sx={{ color: '#ccc', fontSize: 12 }}>|</Typography>
                <Link href="/terms" sx={{ color: '#666', textDecoration: 'none', fontSize: 12, '&:hover': { color: '#333' } }}>
                  利用規約
                </Link>
              </Box>
            </Box>
          </Box>

          {/* 右側：サーバー状況（PC版のみ） */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' },
            minWidth: 0, 
            textAlign: 'right', 
            flex: 1, 
            flexDirection: 'column', 
            alignItems: 'flex-end', 
            justifyContent: 'center',
            gap: 0
          }}>
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
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 0
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" width="100%" sx={{ 
                flexDirection: 'row', 
                flexWrap: 'nowrap',
                gap: 1.3,
                minWidth: 'auto',
                overflow: 'hidden'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Box sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: serverStatus.online ? '#4caf50' : '#f44336',
                    border: '1.5px solid #fff',
                    boxShadow: serverStatus.online ? '0 0 0 1.5px #c8e6c9' : '0 0 0 1.5px #ffcdd2'
                  }} />
                  <Typography component="span" sx={{ 
                    fontWeight: 700, 
                    fontSize: 14, 
                    color: serverStatus.online ? '#388e3c' : '#c62828',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    lineHeight: 1,
                    wordBreak: 'keep-all',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    AOIROSERVER{serverStatus.online ? '稼働中' : '停止中'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <FaUsers style={{ fontSize: 15, color: '#1976d2' }} />
                  <Typography component="span" sx={{ 
                    fontSize: 14, 
                    color: '#555', 
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {serverStatus.playerCount || 0}/{serverStatus.maxPlayers || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <FaServer style={{ fontSize: 15, color: '#1976d2' }} />
                  <Typography component="span" sx={{ 
                    fontSize: 14, 
                    color: '#555', 
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {serverStatus.version || '-'}
                  </Typography>
                </Box>
                {serverStatus.online && serverStatus.responseTime && (
                  <Typography component="span" sx={{ 
                    fontSize: 12, 
                    color: '#888', 
                    fontWeight: 500, 
                    whiteSpace: 'nowrap'
                  }}>
                    応答: {serverStatus.responseTime}ms
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
} 