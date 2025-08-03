import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Debug session API called');
    console.log('📋 Request headers:', {
      cookie: req.headers.cookie ? 'present' : 'missing',
      authorization: req.headers.authorization ? 'present' : 'missing',
      'content-type': req.headers['content-type']
    });
    
    const supabase = createPagesServerClient({ req, res });
    
    // セッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return res.status(200).json({ 
        status: 'error',
        error: 'セッションエラーが発生しました', 
        details: sessionError.message,
        code: 'SESSION_ERROR',
        session: null,
        user: null
      });
    }
    
    if (!session) {
      console.error('❌ No session found');
      return res.status(200).json({ 
        status: 'no_session',
        error: 'セッションが見つかりません', 
        details: 'No active session',
        code: 'NO_SESSION',
        session: null,
        user: null
      });
    }
    
    const user = session.user;
    
    if (!user) {
      console.error('❌ No user in session');
      return res.status(200).json({ 
        status: 'no_user',
        error: 'セッションにユーザー情報がありません', 
        details: 'No user in session',
        code: 'NO_USER_IN_SESSION',
        session: {
          access_token: session.access_token ? 'present' : 'missing',
          refresh_token: session.refresh_token ? 'present' : 'missing',
          expires_at: session.expires_at
        },
        user: null
      });
    }

    console.log('✅ User authenticated:', user.id, user.email);

    return res.status(200).json({
      status: 'success',
      session: {
        access_token: session.access_token ? 'present' : 'missing',
        refresh_token: session.refresh_token ? 'present' : 'missing',
        expires_at: session.expires_at
      },
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      },
      error: null,
      details: null,
      code: null
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in debug session API:', error);
    return res.status(500).json({ 
      status: 'error',
      error: 'セッション確認中に予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      session: null,
      user: null
    });
  }
} 