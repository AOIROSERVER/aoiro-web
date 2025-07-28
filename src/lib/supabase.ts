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

// クッキー管理のヘルパー関数
export const setAuthCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax${process.env.NODE_ENV === 'production' ? ';secure' : ''}`;
};

export const getAuthCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const removeAuthCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// デバッグ用：Supabaseクライアントの状態を確認
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase client initialized');
  console.log('URL:', supabaseUrl);
  console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
  console.log('Environment:', process.env.NODE_ENV);
}