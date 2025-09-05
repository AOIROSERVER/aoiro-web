'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ServerStatus = {
  online: boolean;
  responseTime: number | null;
  playerCount?: number;
  maxPlayers?: number;
  version?: string | null;
  lastUpdated: string;
  loading: boolean;
};

type ServerStatusContextType = {
  serverStatus: ServerStatus;
  refreshServerStatus: () => Promise<void>;
  isLoading: boolean;
};

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

export const useServerStatus = () => {
  const context = useContext(ServerStatusContext);
  if (context === undefined) {
    throw new Error('useServerStatus must be used within a ServerStatusProvider');
  }
  return context;
};

export const ServerStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    online: false,
    responseTime: null,
    playerCount: 0,
    maxPlayers: 0,
    version: null,
    lastUpdated: '',
    loading: false
  });

  const refreshServerStatus = async () => {
    console.log('🔄 ServerStatusContext: サーバーステータスを更新中...', new Date().toLocaleString('ja-JP'));
    
    setServerStatus(prev => ({ ...prev, loading: true }));
    
    const startTime = Date.now();
    try {
      const response = await fetch('/api/minecraft-status', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ ServerStatusContext: サーバーステータス更新完了', new Date().toLocaleString('ja-JP'), 'online:', data.online);
        
        // デバッグ情報がある場合はログに出力
        if (data.debug) {
          console.log('🔍 ServerStatusContext: デバッグ情報:', data.debug);
        }
        
        // プレイヤー数デバッグ
        console.log('🔍 ServerStatusContext: プレイヤー数デバッグ:', {
          'data.players': data.players,
          'data.players?.online': data.players?.online,
          'data.players?.max': data.players?.max,
          'playerCount設定値': data.players?.online || 0,
          'maxPlayers設定値': data.players?.max || 0
        });
        
        const newStatus = {
          online: !!data.online,
          responseTime,
          playerCount: data.players?.online || 0,
          maxPlayers: data.players?.max || 0,
          version: data.version || null,
          lastUpdated: new Date().toLocaleString('ja-JP'),
          loading: false
        };
        
        console.log('🔍 ServerStatusContext: 設定する新しいステータス:', newStatus);
        
        setServerStatus(newStatus);
      } else {
        const errorText = await response.text();
        console.log('❌ ServerStatusContext: サーバーステータス更新失敗', new Date().toLocaleString('ja-JP'), {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        setServerStatus({
          online: false,
          responseTime: null,
          playerCount: 0,
          maxPlayers: 0,
          version: null,
          lastUpdated: new Date().toLocaleString('ja-JP'),
          loading: false
        });
      }
    } catch (error) {
      console.log('❌ ServerStatusContext: サーバーステータス更新エラー', new Date().toLocaleString('ja-JP'), {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setServerStatus({
        online: false,
        responseTime: null,
        playerCount: 0,
        maxPlayers: 0,
        version: null,
        lastUpdated: new Date().toLocaleString('ja-JP'),
        loading: false
      });
    }
  };

  useEffect(() => {
    console.log('🚀 ServerStatusContext: 初回サーバーステータス確認開始', new Date().toLocaleString('ja-JP'));
    refreshServerStatus();
    
    const interval = setInterval(() => {
      console.log('⏰ ServerStatusContext: 5秒間隔でのサーバーステータス更新実行', new Date().toLocaleString('ja-JP'));
      refreshServerStatus();
    }, 5000);
    
    console.log('📅 ServerStatusContext: 5秒間隔タイマー設定完了', new Date().toLocaleString('ja-JP'));
    
    return () => {
      console.log('🧹 ServerStatusContext: タイマークリーンアップ', new Date().toLocaleString('ja-JP'));
      clearInterval(interval);
    };
  }, []);

  return (
    <ServerStatusContext.Provider value={{ 
      serverStatus, 
      refreshServerStatus,
      isLoading: serverStatus.loading 
    }}>
      {children}
    </ServerStatusContext.Provider>
  );
}; 