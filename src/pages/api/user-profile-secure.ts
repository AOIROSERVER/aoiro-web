import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 User profile secure API called');
    
    const supabase = createPagesServerClient({ req, res });
    
    // セッションクッキーからトークンを取得
    const cookies = req.headers.cookie ? req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>) : {};
    
    const accessToken = cookies['sb-access-token'];
    const refreshToken = cookies['sb-refresh-token'];
    
    // セッションを取得（複数の方法を試行）
    let session;
    let sessionError;
    
    // 方法1: トークンからセッションを設定
    if (accessToken && refreshToken) {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        session = data.session;
        sessionError = error;
      } catch (error) {
        sessionError = error as any;
      }
    }
    
    // 方法2: 通常のセッション取得を試行
    if (!session) {
      try {
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data.session;
        sessionError = sessionResult.error;
      } catch (error) {
        sessionError = error as any;
      }
    }
    
    // 方法3: ユーザー情報を直接取得
    if (!session) {
      try {
        const userResult = await supabase.auth.getUser();
        if (userResult.data.user) {
          session = { user: userResult.data.user } as any;
        }
      } catch (error) {
        sessionError = error as any;
      }
    }
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return res.status(401).json({ 
        error: 'セッションエラーが発生しました', 
        details: sessionError.message
      });
    }
    
    if (!session) {
      console.error('❌ No session found');
      return res.status(401).json({ 
        error: 'セッションが見つかりません', 
        details: 'No active session'
      });
    }
    
    const user = session.user;
    
    if (!user) {
      console.error('❌ No user in session');
      return res.status(401).json({ 
        error: 'セッションにユーザー情報がありません', 
        details: 'No user in session'
      });
    }

    console.log('✅ User authenticated:', user.id, user.email);

    // 新しいテーブル構造からユーザープロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles_secure')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      
      // プロフィールが存在しない場合は作成
      if (profileError.code === 'PGRST116') {
        console.log('📋 Creating new user profile...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles_secure')
          .insert({
            id: user.id,
            username: user.email || `user_${user.id}`,
            game_tag: user.email || `user_${user.id}`,
            points: 0,
            total_bonus_received: 0,
            last_bonus_date: null
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          return res.status(500).json({ 
            error: 'プロフィール作成中にエラーが発生しました', 
            details: createError.message 
          });
        }

        console.log('✅ New profile created:', newProfile);
        return res.status(200).json({
          profile: newProfile,
          message: '新しいプロフィールが作成されました'
        });
      }
      
      return res.status(500).json({ 
        error: 'プロフィール取得中にエラーが発生しました', 
        details: profileError.message 
      });
    }

    console.log('✅ Profile retrieved:', profile);
    return res.status(200).json({
      profile: profile,
      message: 'プロフィールを正常に取得しました'
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in user profile secure API:', error);
    return res.status(500).json({ 
      error: 'プロフィール処理中に予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 