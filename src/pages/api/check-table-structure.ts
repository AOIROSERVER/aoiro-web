import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Checking table structure...');
    
    const supabase = createPagesServerClient({ req, res });
    
    // user_profilesテーブルの構造を確認（実際のクエリでテスト）
    let userProfilesHasPoints = false;
    let loginBonusHasUserId = false;
    
    try {
      // user_profilesテーブルにpointsカラムがあるかテスト
      const { data: testPoints, error: pointsError } = await supabase
        .from('user_profiles')
        .select('points')
        .limit(1);
      
      userProfilesHasPoints = !pointsError;
      console.log('📋 user_profiles points column test:', { hasPoints: userProfilesHasPoints, error: pointsError?.message });
    } catch (error) {
      console.log('📋 user_profiles points column test failed:', error);
    }
    
    try {
      // login_bonusテーブルにuser_idカラムがあるかテスト
      const { data: testUserId, error: userIdError } = await supabase
        .from('login_bonus')
        .select('user_id')
        .limit(1);
      
      loginBonusHasUserId = !userIdError;
      console.log('📋 login_bonus user_id column test:', { hasUserId: loginBonusHasUserId, error: userIdError?.message });
    } catch (error) {
      console.log('📋 login_bonus user_id column test failed:', error);
    }

    const result = {
      user_profiles_has_points: userProfilesHasPoints,
      login_bonus_has_user_id: loginBonusHasUserId,
    };

    console.log('📋 Table structure:', result);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ 
      error: 'テーブル構造確認中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 