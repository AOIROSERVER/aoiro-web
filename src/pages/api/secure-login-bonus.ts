import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Secure login bonus API called');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request headers:', {
      cookie: req.headers.cookie ? 'present' : 'missing',
      authorization: req.headers.authorization ? 'present' : 'missing',
      'content-type': req.headers['content-type']
    });
    
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
    
    console.log('🔍 Tokens from cookies:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing'
    });
    
    // セッションを取得（複数の方法を試行）
    let session;
    let sessionError;
    
    // 方法1: トークンからセッションを設定
    if (accessToken && refreshToken) {
      try {
        console.log('🔄 Method 1: Setting session from tokens...');
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        session = data.session;
        sessionError = error;
        
        if (session) {
          console.log('✅ Session set from tokens successfully');
        } else {
          console.log('❌ Failed to set session from tokens, trying method 2...');
        }
      } catch (error) {
        console.error('❌ Exception during session setting:', error);
        sessionError = error as any;
      }
    }
    
    // 方法2: 通常のセッション取得を試行
    if (!session) {
      try {
        console.log('🔄 Method 2: Getting session directly...');
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data.session;
        sessionError = sessionResult.error;
        
        if (session) {
          console.log('✅ Session retrieved directly successfully');
        } else {
          console.log('❌ Failed to get session directly, trying method 3...');
        }
      } catch (error) {
        console.error('❌ Exception during session retrieval:', error);
        sessionError = error as any;
      }
    }
    
    // 方法3: ユーザー情報を直接取得
    if (!session) {
      try {
        console.log('🔄 Method 3: Getting user directly...');
        const userResult = await supabase.auth.getUser();
        if (userResult.data.user) {
          // ユーザーが存在する場合は、セッションなしでも続行
          console.log('✅ User found, proceeding without session');
          session = { user: userResult.data.user } as any;
        } else {
          console.log('❌ No user found');
        }
      } catch (error) {
        console.error('❌ Exception during user retrieval:', error);
        sessionError = error as any;
      }
    }
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return res.status(401).json({ 
        error: 'セッションエラーが発生しました', 
        details: sessionError.message,
        code: 'SESSION_ERROR'
      });
    }
    
    if (!session) {
      console.error('❌ No session found after all methods');
      return res.status(401).json({ 
        error: 'セッションが見つかりません', 
        details: 'No active session after trying multiple methods',
        code: 'NO_SESSION',
        debug: {
          cookies: req.headers.cookie ? 'present' : 'missing',
          authorization: req.headers.authorization ? 'present' : 'missing',
          userAgent: req.headers['user-agent'] || 'missing',
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing'
        }
      });
    }
    
    const user = session.user;
    
    if (!user) {
      console.error('❌ No user in session');
      return res.status(401).json({ 
        error: 'セッションにユーザー情報がありません', 
        details: 'No user in session',
        code: 'NO_USER_IN_SESSION'
      });
    }

    console.log('✅ User authenticated:', user.id, user.email);

    // GETリクエスト: ボーナス状態の確認
    if (req.method === 'GET') {
      console.log('📋 GET request: Checking bonus eligibility');
      
      try {
        // 今日の日付を取得（日本時間）
        const today = new Date().toLocaleDateString('ja-JP', { 
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');
        
        // 新しい関数を使用してボーナス資格をチェック
        const { data: eligibility, error: eligibilityError } = await supabase
          .rpc('check_bonus_eligibility', {
            user_uuid: user.id,
            check_date: today
          });

        if (eligibilityError) {
          console.error('❌ Error checking bonus eligibility:', eligibilityError);
          return res.status(500).json({ 
            error: 'ボーナス資格確認中にエラーが発生しました', 
            details: eligibilityError.message 
          });
        }

        console.log('📋 Bonus eligibility result:', eligibility);

        if (eligibility && eligibility.length > 0) {
          const result = eligibility[0];
          return res.status(200).json({
            received: !result.can_claim,
            message: result.reason,
            currentPoints: result.current_points,
            totalBonusReceived: result.total_bonus_received,
            lastBonusDate: result.last_bonus_date,
            userId: user.id,
            timestamp: new Date().toISOString()
          });
        } else {
          return res.status(200).json({
            received: false,
            message: 'ボーナスを取得できます',
            currentPoints: 0,
            totalBonusReceived: 0,
            lastBonusDate: null,
            userId: user.id,
            timestamp: new Date().toISOString()
          });
        }
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
        // クライアント情報を取得
        const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const sessionId = session.access_token ? session.access_token.slice(-20) : 'unknown';
        
        console.log('📋 Client info:', {
          ip: userIp,
          userAgent: userAgent.substring(0, 100),
          sessionId: sessionId
        });
        
        // 新しい関数を使用してボーナスを取得
        const { data: claimResult, error: claimError } = await supabase
          .rpc('claim_daily_bonus', {
            user_uuid: user.id,
            bonus_amount: 100,
            user_ip: userIp.toString(),
            user_agent: userAgent,
            session_id: sessionId
          });

        if (claimError) {
          console.error('❌ Error claiming bonus:', claimError);
          return res.status(500).json({ 
            error: 'ボーナス取得中にエラーが発生しました', 
            details: claimError.message 
          });
        }

        console.log('📋 Claim result:', claimResult);

        if (claimResult && claimResult.length > 0) {
          const result = claimResult[0];
          
          if (result.success) {
            return res.status(200).json({
              received: false,
              message: result.message,
              finalPoints: result.new_points,
              totalBonusReceived: result.total_bonus_received,
              userId: user.id,
              timestamp: new Date().toISOString()
            });
          } else {
            return res.status(400).json({
              received: true,
              message: result.message,
              finalPoints: result.new_points,
              totalBonusReceived: result.total_bonus_received,
              userId: user.id,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          return res.status(500).json({
            error: 'ボーナス取得の結果が不明です',
            details: 'No result from claim function'
          });
        }
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
    console.error('❌ Unexpected error in secure login bonus API:', error);
    return res.status(500).json({ 
      error: 'ログインボーナスの処理中に予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 