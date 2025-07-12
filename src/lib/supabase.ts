import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqxadmvnsusscsudrmqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxeGFkbXZuc3Vzc2NzdWRybXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTUyMjMsImV4cCI6MjA2NTkzMTIyM30.XfQ5KyRUR_9o9PfvySjud0YW-BwHH87jUSX_Em1_F54';

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