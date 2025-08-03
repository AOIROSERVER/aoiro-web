import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Debug user profile API called');
    
    const supabase = createPagesServerClient({ req, res });
    
    // セッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return res.status(401).json({
        error: 'セッションエラーが発生しました',
        details: sessionError.message,
        code: 'SESSION_ERROR'
      });
    }
    
    if (!session) {
      console.error('❌ No session found');
      return res.status(401).json({
        error: 'セッションが見つかりません',
        details: 'No active session',
        code: 'NO_SESSION'
      });
    }
    
    const user = session.user;
    console.log('✅ User authenticated:', user.id, user.email);
    
    // ユーザープロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('📋 Profile query result:', {
      hasProfile: !!profile,
      profileError: profileError ? {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      } : null,
      profile: profile ? {
        id: profile.id,
        username: profile.username,
        game_tag: profile.game_tag,
        points: profile.points,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      } : null
    });
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return res.status(500).json({
        error: 'プロフィールの取得に失敗しました',
        details: profileError.message,
        code: profileError.code
      });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile
    });
    
  } catch (error) {
    console.error('❌ Debug user profile error:', error);
    return res.status(500).json({
      error: 'デバッグ中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 