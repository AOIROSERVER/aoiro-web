import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Login bonus fallback API called');
    console.log('📋 Request method:', req.method);
    
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

    // 今日の日付を取得（日本時間）
    const today = new Date().toLocaleDateString('ja-JP', { 
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    // GETリクエスト: ボーナス状態の確認
    if (req.method === 'GET') {
      console.log('📋 GET request: Checking bonus status');
      
      try {
        // 新しいテーブル構造でボーナス状態を確認
        const { data: bonusHistory, error: historyError } = await supabase
          .from('login_bonus_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('bonus_date', today)
          .single();

        if (historyError && historyError.code !== 'PGRST116') {
          console.error('❌ Error checking bonus history:', historyError);
          return res.status(500).json({ 
            error: 'ボーナス状態確認中にエラーが発生しました', 
            details: historyError.message 
          });
        }

        const received = !!bonusHistory;
        
        // ユーザープロフィールを取得
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles_secure')
          .select('points, total_bonus_received, last_bonus_date')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ Error fetching profile:', profileError);
        }

        return res.status(200).json({
          received: received,
          message: received ? '本日は既にボーナスを取得済みです' : 'ボーナスを取得できます',
          currentPoints: profile?.points || 0,
          totalBonusReceived: profile?.total_bonus_received || 0,
          lastBonusDate: profile?.last_bonus_date,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error in GET request:', error);
        return res.status(500).json({ 
          error: 'ボーナス状態確認中にエラーが発生しました',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // POSTリクエスト: ボーナスの取得
    if (req.method === 'POST') {
      console.log('📋 POST request: Claiming bonus');
      
      try {
        // まず今日のボーナスが既に取得されているかチェック
        const { data: existingBonus, error: checkError } = await supabase
          .from('login_bonus_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('bonus_date', today)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Error checking existing bonus:', checkError);
          return res.status(500).json({ 
            error: 'ボーナス確認中にエラーが発生しました', 
            details: checkError.message 
          });
        }

        if (existingBonus) {
          return res.status(400).json({
            received: true,
            message: '本日は既にボーナスを取得済みです',
            finalPoints: 0,
            totalBonusReceived: 0,
            userId: user.id,
            timestamp: new Date().toISOString()
          });
        }

        // ボーナス履歴を記録
        const { data: bonusRecord, error: insertError } = await supabase
          .from('login_bonus_history')
          .insert({
            user_id: user.id,
            bonus_date: today,
            bonus_amount: 100,
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown',
            session_id: session.access_token ? session.access_token.slice(-20) : 'unknown'
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error inserting bonus record:', insertError);
          return res.status(500).json({ 
            error: 'ボーナス記録中にエラーが発生しました', 
            details: insertError.message 
          });
        }

        // ユーザープロフィールを更新（既存のポイントに追加）
        const { data: currentProfile, error: fetchError } = await supabase
          .from('user_profiles_secure')
          .select('points, total_bonus_received')
          .eq('id', user.id)
          .single();

        let currentPoints = 0;
        let currentTotalBonus = 0;

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('❌ Error fetching current profile:', fetchError);
        } else if (currentProfile) {
          currentPoints = currentProfile.points || 0;
          currentTotalBonus = currentProfile.total_bonus_received || 0;
        }

        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles_secure')
          .upsert({
            id: user.id,
            username: user.email || `user_${user.id}`,
            game_tag: user.email || `user_${user.id}`,
            points: currentPoints + 100,
            total_bonus_received: currentTotalBonus + 1,
            last_bonus_date: today
          }, {
            onConflict: 'id'
          })
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
          // ボーナス記録は成功したので、プロフィール更新エラーは無視
        }

        return res.status(200).json({
          received: false,
          message: 'ボーナスを正常に付与しました (+100P)',
          finalPoints: updatedProfile?.points || 100,
          totalBonusReceived: updatedProfile?.total_bonus_received || 1,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error in POST request:', error);
        return res.status(500).json({ 
          error: 'ボーナス取得中にエラーが発生しました',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // その他のHTTPメソッドは許可しない
    return res.status(405).json({ 
      error: 'Method not allowed', 
      details: 'Only GET and POST methods are allowed' 
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in login bonus fallback API:', error);
    return res.status(500).json({ 
      error: 'ログインボーナスの処理中に予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 