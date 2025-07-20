import { NextResponse } from 'next/server';

// サービスステータス型
type ServiceStatus = {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  responseTime?: number;
  lastChecked: string;
  description: string;
  url?: string;
  playerCount?: number;
  maxPlayers?: number;
  version?: string;
};

// サービス定義（実際のサービスのみ）
const services = [
  {
    name: 'AOIROSERVER',
    description: 'Minecraft Bedrockサーバー',
    url: 'minecraft://' + (process.env.MINECRAFT_SERVER_HOST || 'localhost') + ':' + (process.env.MINECRAFT_SERVER_PORT || '19132')
  },
  {
    name: 'AOIROSERVER公式サイト',
    description: 'AOIROSERVER公式サイト',
    url: 'https://aoiroserver.tokyo'
  },
  {
    name: 'AOIROSERVER アプリ',
    description: 'AOIROSERVERアプリサイト',
    url: 'https://aoiroserver.site'
  },
  {
    name: 'Supabase',
    description: 'データベース・認証サービス',
    url: 'https://supabase.com'
  }
];

// サービスステータスをチェックする関数
async function checkServiceStatus(service: { name: string; description: string; url: string }): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  // Minecraftサーバーの場合は専用のAPIを使用
  if (service.name === 'AOIROSERVER') {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/minecraft-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log('MinecraftサーバーAPIレスポンス:', JSON.stringify(data, null, 2));
        
        if (data.online) {
          return {
            name: service.name,
            status: 'operational',
            responseTime,
            lastChecked: new Date().toISOString(),
            description: service.description,
            url: service.url,
            playerCount: data.players?.online || 0,
            maxPlayers: data.players?.max || 0,
            version: data.version
          };
        } else {
          return {
            name: service.name,
            status: 'outage',
            responseTime,
            lastChecked: new Date().toISOString(),
            description: service.description,
            url: service.url
          };
        }
      } else {
        const responseTime = Date.now() - startTime;
        return {
          name: service.name,
          status: 'outage',
          responseTime,
          lastChecked: new Date().toISOString(),
          description: service.description,
          url: service.url
        };
      }
    } catch (error) {
      console.error('MinecraftサーバーAPIエラー:', error);
      const responseTime = Date.now() - startTime;
      return {
        name: service.name,
        status: 'outage',
        responseTime,
        lastChecked: new Date().toISOString(),
        description: service.description,
        url: service.url
      };
    }
  }
  
  // その他のサービスは通常のHTTPチェック
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
    
    const response = await fetch(service.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AOIRO-Status-Checker/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name: service.name,
        status: 'operational',
        responseTime,
        lastChecked: new Date().toISOString(),
        description: service.description,
        url: service.url
      };
    } else {
      return {
        name: service.name,
        status: 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        description: service.description,
        url: service.url
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: service.name,
      status: 'outage',
      responseTime,
      lastChecked: new Date().toISOString(),
      description: service.description,
      url: service.url
    };
  }
}

// 動的にAOIROSERVERステータスを取得する関数
async function getAoiroServerStatus(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/minecraft-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log('AOIROSERVERステータス確認:', JSON.stringify(data, null, 2));
      
      if (data.online) {
        return {
          name: 'AOIROSERVER',
          status: 'operational',
          responseTime,
          lastChecked: new Date().toISOString(),
          description: 'Minecraft Bedrockサーバー',
          playerCount: data.players?.online || 0,
          maxPlayers: data.players?.max || 0,
          version: data.version
        };
      } else {
        return {
          name: 'AOIROSERVER',
          status: 'outage',
          responseTime,
          lastChecked: new Date().toISOString(),
          description: 'Minecraft Bedrockサーバー'
        };
      }
    } else {
      return {
        name: 'AOIROSERVER',
        status: 'outage',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        description: 'Minecraft Bedrockサーバー'
      };
    }
  } catch (error) {
    console.error('AOIROSERVERステータス取得エラー:', error);
    return {
      name: 'AOIROSERVER',
      status: 'outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      description: 'Minecraft Bedrockサーバー'
    };
  }
}

export async function GET() {
  try {
    console.log('📊 ステータスAPI: 全サービスチェック開始', new Date().toLocaleString('ja-JP'));
    
    // 各サービスのステータスを並行してチェック
    const statusPromises = services.map(async (service) => {
      try {
        return await checkServiceStatus(service);
      } catch (error) {
        console.error(`❌ ${service.name} ステータスチェックエラー:`, error);
        return {
          name: service.name,
          status: 'outage' as const,
          lastChecked: new Date().toISOString(),
          description: service.description,
          url: service.url
        };
      }
    });

    const statuses = await Promise.all(statusPromises);
    
    console.log('📊 ステータスAPI: 全サービスチェック完了', new Date().toLocaleString('ja-JP'));
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      services: statuses
    });
    
  } catch (error) {
    console.error('❌ ステータスAPI エラー:', error);
    
    // エラー時でも基本的なレスポンスを返す
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'サービスステータスの取得に失敗しました',
      services: services.map(service => ({
        name: service.name,
        status: 'outage' as const,
        lastChecked: new Date().toISOString(),
        description: service.description,
        url: service.url
      }))
    }, { status: 500 });
  }
} 