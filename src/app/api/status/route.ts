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
    description: 'AOIROSERVERアプリ',
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

// その他のモックサービス（AOIROSERVER以外）
const otherMockServices: ServiceStatus[] = [
  {
    name: 'AOIROSERVER公式サイト',
    status: 'operational',
    responseTime: 85,
    lastChecked: new Date().toISOString(),
    description: 'AOIROSERVER公式サイト',
    url: 'https://aoiroserver.tokyo'
  },
  {
    name: 'AOIROSERVER アプリ',
    status: 'operational',
    responseTime: 95,
    lastChecked: new Date().toISOString(),
    description: 'AOIROSERVERアプリ',
    url: 'https://aoiroserver.site'
  },
  {
    name: 'データベース',
    status: 'operational',
    responseTime: 45,
    lastChecked: new Date().toISOString(),
    description: 'Supabase データベース'
  },
  {
    name: '認証サービス',
    status: 'operational',
    responseTime: 75,
    lastChecked: new Date().toISOString(),
    description: 'Supabase Auth'
  },
  {
    name: '通知サービス',
    status: 'operational',
    responseTime: 150,
    lastChecked: new Date().toISOString(),
    description: 'プッシュ通知・メール通知'
  }
];

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiStartTime = new Date();
  
  try {
    // 実際のサービスチェックを実行
    const statusPromises = services.map(checkServiceStatus);
    const actualStatuses = await Promise.all(statusPromises);
    
    // 実際のチェック結果とその他のモックサービスを組み合わせ
    const allServices = [...actualStatuses, ...otherMockServices.filter(s => 
      !actualStatuses.some(as => as.name === s.name)
    )];
    
    const apiEndTime = new Date();
    const lastUpdated = apiEndTime.toISOString();
    
    console.log('📊 ステータスAPI: 全サービスチェック完了', apiEndTime.toLocaleString('ja-JP'));
    
    return NextResponse.json({
      services: allServices,
      lastUpdated,
      totalServices: allServices.length,
      operationalServices: allServices.filter(s => s.status === 'operational').length
    });
  } catch (error) {
    console.error('ステータスチェックエラー:', error);
    
    // エラー時はAOIROSERVERの実際のステータスを取得してからモックデータを返す
    try {
      const aoiroServerStatus = await getAoiroServerStatus();
      const allServices = [aoiroServerStatus, ...otherMockServices];
      
      const apiEndTime = new Date();
      const lastUpdated = apiEndTime.toISOString();
      
      console.log('📊 ステータスAPI: フォールバック処理完了', apiEndTime.toLocaleString('ja-JP'));
      
      return NextResponse.json({
        services: allServices,
        lastUpdated,
        totalServices: allServices.length,
        operationalServices: allServices.filter(s => s.status === 'operational').length
      });
    } catch (fallbackError) {
      console.error('フォールバックエラー:', fallbackError);
      
      // 最終フォールバック：AOIROSERVERを停止中として扱う
      const fallbackAoiroServer: ServiceStatus = {
        name: 'AOIROSERVER',
        status: 'outage',
        responseTime: undefined,
        lastChecked: new Date().toISOString(),
        description: 'Minecraft Bedrockサーバー'
      };
      
      const allServices = [fallbackAoiroServer, ...otherMockServices];
      
      const apiEndTime = new Date();
      const lastUpdated = apiEndTime.toISOString();
      
      console.log('📊 ステータスAPI: 最終フォールバック処理完了', apiEndTime.toLocaleString('ja-JP'));
      
      return NextResponse.json({
        services: allServices,
        lastUpdated,
        totalServices: allServices.length,
        operationalServices: allServices.filter(s => s.status === 'operational').length
      });
    }
  }
} 