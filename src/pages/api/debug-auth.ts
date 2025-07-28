import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Debug auth API called');
    
    const supabase = createPagesServerClient({ req, res });
    
    // セッション情報を取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    const debugInfo = {
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          email_confirmed_at: session.user.email_confirmed_at,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata
        } : null,
        access_token: session?.access_token ? 'present' : 'missing',
        refresh_token: session?.refresh_token ? 'present' : 'missing',
        expires_at: session?.expires_at
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        email_confirmed_at: user?.email_confirmed_at,
        user_metadata: user?.user_metadata,
        app_metadata: user?.app_metadata
      },
      errors: {
        sessionError: sessionError ? {
          message: sessionError.message,
          status: sessionError.status,
          name: sessionError.name
        } : null,
        userError: userError ? {
          message: userError.message,
          status: userError.status,
          name: userError.name
        } : null
      },
      cookies: {
        hasAuthCookie: !!req.cookies['sb-access-token'] || !!req.cookies['sb-refresh-token'],
        authCookies: Object.keys(req.cookies).filter(key => key.startsWith('sb-'))
      },
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        cookie: req.headers.cookie ? 'present' : 'missing'
      }
    };
    
    console.log('📋 Debug info:', debugInfo);
    
    return res.status(200).json(debugInfo);
    
  } catch (error) {
    console.error('❌ Debug auth error:', error);
    return res.status(500).json({ 
      error: 'デバッグ中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 