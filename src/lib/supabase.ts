import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase環境変数が設定されていません');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'aoiro-auth-token',
    debug: process.env.NODE_ENV === 'development',
  },
  // リアルタイム機能を無効化して警告を回避
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // グローバル設定
  global: {
    headers: {
      'X-Client-Info': 'aoiro-web',
    },
  },
});

// デバッグ用：Supabaseクライアントの状態を確認
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase client initialized');
  console.log('URL:', supabaseUrl);
  console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
  console.log('Environment:', process.env.NODE_ENV);
}