"use client";
import { Box, Card, Typography, IconButton, CircularProgress } from "@mui/material";
import { Train, Settings, Computer, SignalCellular4Bar, SignalCellular0Bar } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeUserToPush } from '../../lib/pushNotification';
import { FaUsers, FaServer } from 'react-icons/fa';

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

// 路線ごとのデフォルト色を定義
const defaultLineColors: { [key: string]: string } = {
  CA: '#0033cb',   // 東海道新幹線
  JK: '#00b2e5',   // 京浜東北線
  JY1: '#8fd400',  // 山手線（内回り）
  JY2: '#8fd400',  // 山手線（外回り）
  JB: '#ffd400',   // 総武線
  JC: '#f15a22',   // 中央線
  JT: '#f68b1e',   // 東海道線
  JO: '#1069b4',   // 横須賀線
  M: '#f62e36',    // 丸の内線
  Z: '#8f76d6',    // 半蔵門線
  C: '#00bb86',    // 千代田線
  H: '#b5b5ac',    // 日比谷線
  G: '#f39700',    // 銀座線
  AK: '#e37e40',   // あきが丘線
  AU: '#15206b'    // あおうみ線
};

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

export default function TrainStatusPage() {
  const router = useRouter();
  const [lines, setLines] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<{ 
    online: boolean; 
    responseTime: number | null;
    playerCount?: number;
    maxPlayers?: number;
    version?: string | null;
    motd?: string | null;
    gamemode?: string | null;
    map?: string | null;
  }>({ online: false, responseTime: null });
  const { loading, isAdmin, user, session } = useAuth();

  // サーバー状況をチェックする関数
  const checkServerStatus = async () => {
    const startTime = Date.now();
    try {
      // プロキシAPIを使用してMinecraft Bedrockサーバーのステータスをチェック
      const response = await fetch(`/api/minecraft-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // タイムアウトを10秒に設定（Minecraftサーバーは応答が遅い場合がある）
        signal: AbortSignal.timeout(10000)
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log('MinecraftサーバーAPIレスポンス:', data);
        
        // Minecraftサーバーがオンラインかどうかをチェック
        if (data.online) {
          console.log('✅ サーバーはオンラインです');
          setServerStatus({ 
            online: true, 
            responseTime,
            playerCount: data.players?.online || 0,
            maxPlayers: data.players?.max || 0,
            version: data.version || 'Unknown',
            motd: data.motd?.clean?.[0] || 'AOIROSERVER',
            gamemode: data.gamemode || 'Unknown',
            map: data.map?.clean || 'Unknown'
          });
        } else {
          console.log('❌ サーバーはオフラインです');
          setServerStatus({ 
            online: false, 
            responseTime: null,
            playerCount: 0,
            maxPlayers: 0,
            version: null,
            motd: null,
            gamemode: null,
            map: null
          });
        }
      } else {
        console.log('❌ APIレスポンスが正常ではありません');
        setServerStatus({ 
          online: false, 
          responseTime: null,
          playerCount: 0,
          maxPlayers: 0,
          version: null,
          motd: null,
          gamemode: null,
          map: null
        });
      }
    } catch (error) {
      console.error('Minecraftサーバー接続エラー:', error);
      setServerStatus({ 
        online: false, 
        responseTime: null,
        playerCount: 0,
        maxPlayers: 0,
        version: null,
        motd: null,
        gamemode: null,
        map: null
      });
    }
  };

  // 認証状態の確認（デバッグ用に一時的に無効化）
  useEffect(() => {
    console.log('🔍 Train Status Page - Auth Check:');
    console.log('Loading:', loading);
    console.log('User:', user);
    console.log('Session:', session);
    console.log('Is Admin:', isAdmin);
    console.log('Current pathname:', window.location.pathname);
    console.log('Current URL:', window.location.href);
    
    // デバッグ用：認証チェックを一時的に無効化
    console.log('🚧 DEBUG MODE: Authentication check disabled for testing');
    console.log('✅ Proceeding to show train status page regardless of auth state');
    
    // 元の認証チェック（コメントアウト）
    /*
    // ローディング中は待機
    if (loading) {
      console.log('⏳ Still loading, waiting...');
      return;
    }
    
    // ユーザーが認証されていない場合
    if (!user) {
      console.log('❌ User not authenticated, redirecting to login');
      console.log('User check details:', {
        userExists: !!user,
        userEmail: user ? (user as any).email : 'undefined',
        userID: user ? (user as any).id : 'undefined',
        sessionExists: !!session,
        sessionUser: session?.user?.email || 'undefined'
      });
      router.push('/login');
      return;
    }
    
    // ユーザーが認証されている場合
    console.log('✅ User authenticated:', user.email);
    console.log('User metadata:', user.user_metadata);
    console.log('App metadata:', user.app_metadata);
    
    // セッションの詳細確認
    if (session) {
      console.log('Session details:', {
        access_token: session.access_token ? 'present' : 'missing',
        refresh_token: session.refresh_token ? 'present' : 'missing',
        expires_at: session.expires_at,
        user_id: session.user?.id,
        user_email: session.user?.email
      });
    } else {
      console.log('⚠️ No session found but user exists');
    }
    
    console.log('✅ Auth check completed successfully');
    */
  }, [loading, user, session, isAdmin, router]);

  useEffect(() => {
    const fetchLines = async () => {
      const res = await fetch("/api/train-status");
      const data = await res.json();
      const linesData = Array.isArray(data) ? data : data.lines;
      
      // デバッグ用：東海道新幹線のデータを確認
      const caLine = linesData.find((line: any) => line.id === 'CA');
      console.log('東海道新幹線のデータ:', caLine);
      
      // 路線を定義された順序でソート
      const sortedLines = linesData.sort((a: any, b: any) => {
        const aIndex = lineOrder.indexOf(a.id);
        const bIndex = lineOrder.indexOf(b.id);
        
        // 定義されていない路線は最後に配置
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
      
      setLines(sortedLines);
    };
    fetchLines();
  }, []);

  // サーバー状況を定期的にチェック
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 300000); // 5分（300秒）ごとにチェック
    return () => clearInterval(interval);
  }, []);

  // デバッグ用：ローディング状態も一時的に無効化
  /*
  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /><Typography mt={2}>認証確認中...</Typography></Box>;
  }
  */

  return (
    <Box sx={{ p: 0, background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 2, background: '#fff', borderBottom: '1px solid #e0e0e0', mb: 0.5
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Train sx={{ color: '#1a237e', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1a237e', fontSize: 20 }}>運行状況</Typography>
        </Box>
        {!loading && isAdmin && (
          <IconButton onClick={() => router.push('/train-status/management')}>
            <Settings sx={{ color: '#1a237e' }} />
          </IconButton>
        )}
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
      <Box sx={{ px: 2, pb: 2, flex: 1 }}>
        {lines.map((line, idx) => {
          // デバッグ用：色の値を計算
          let finalColor = line.color || defaultLineColors[line.id] || '#1a237e';
          
          // 東海道新幹線の場合は強制的に色を設定
          if (line.id === 'CA') {
            finalColor = '#0033cb';
            console.log('東海道新幹線の色を強制設定:', finalColor);
          }
          
          console.log(`路線 ${line.id} (${line.name}):`, {
            lineColor: line.color,
            defaultColor: defaultLineColors[line.id],
            finalColor: finalColor
          });
          
          return (
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
            <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: ['M', 'Z', 'C', 'H', 'G'].includes(line.id) ? '50%' : 2,
                  border: ['M', 'Z', 'C', 'H', 'G'].includes(line.id) ? `8px solid ${finalColor}` : `2.8px solid ${finalColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#1a237e',
                  background: '#fff',
                  mr: 1,
                  ...(line.id === 'CA' && {
                    border: '2.8px solid #0033cb'
                  })
                }}
                style={line.id === 'CA' ? { border: '2.8px solid #0033cb' } : {}}
              >
                {(line.id === 'JY1' || line.id === 'JY2') ? 'JY' : line.id}
              </Box>
              <Typography variant="h6" sx={{ color: '#1a237e', fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{line.name}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <StatusIcon status={line.status} />
                <Typography sx={{ color: line.status === '平常運転' ? '#43a047' : line.status === '遅延' ? '#ffa000' : '#e53935', fontWeight: 700, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{line.status}</Typography>
              </Box>
            </Box>
          </Box>
          );
        })}
      </Box>
    </Box>
  );
} 