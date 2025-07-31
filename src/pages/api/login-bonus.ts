import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Login bonus API called');
    console.log('📋 Request method:', req.method);
    console.log('📋 Request headers:', {
      cookie: req.headers.cookie ? 'present' : 'missing',
      authorization: req.headers.authorization ? 'present' : 'missing',
      'content-type': req.headers['content-type']
    });
    
    // セッションクッキーの詳細を確認
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      console.log('🍪 Session cookies:', {
        'sb-access-token': cookies['sb-access-token'] ? 'present' : 'missing',
        'sb-refresh-token': cookies['sb-refresh-token'] ? 'present' : 'missing',
        'aoiro-auth-token': cookies['aoiro-auth-token'] ? 'present' : 'missing'
      });
    }
    
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
          sessionError = userResult.error;
        }
      } catch (error) {
        console.error('❌ Exception during user retrieval:', error);
        sessionError = error as any;
      }
    }
    
    console.log('🔍 Session check:', {
      hasSession: !!session,
      sessionError: sessionError ? {
        message: sessionError.message,
        status: sessionError.status,
        name: sessionError.name
      } : null,
      sessionUser: session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : null
    });
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return res.status(401).json({ 
        error: 'セッションエラーが発生しました', 
        details: sessionError.message,
        code: 'SESSION_ERROR',
        suggestion: 'ブラウザのキャッシュをクリアして再度ログインしてください'
      });
    }
    
    if (!session) {
      console.error('❌ No session found after trying all methods');
      return res.status(401).json({ 
        error: 'セッションが見つかりません', 
        details: 'Auth session missing! All authentication methods failed.',
        code: 'NO_SESSION',
        suggestion: 'ブラウザのキャッシュをクリアして再度ログインしてください。または、別のブラウザで試してください。'
      });
    }
    
    // セッションからユーザー情報を取得
    const user = session.user;
    
    if (!user) {
      console.error('❌ No user in session');
      return res.status(401).json({ 
        error: 'セッションにユーザー情報がありません', 
        details: 'No user in session',
        code: 'NO_USER_IN_SESSION',
        suggestion: 'ログインページで再度認証してください'
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
    console.log('📅 Checking bonus for date:', today);

    // GETリクエスト: ボーナス状態の確認のみ
    if (req.method === 'GET') {
      console.log('📋 GET request: Checking bonus status only');
      
      // 既に今日のボーナスを受け取っているか確認
      const { data: bonus, error: bonusError } = await supabase
        .from('login_bonus')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      console.log('📋 Bonus check result:', {
        hasBonus: !!bonus,
        bonusError: bonusError ? {
          message: bonusError.message,
          code: bonusError.code
        } : null,
        bonus: bonus ? {
          id: bonus.id,
          user_id: bonus.user_id,
          date: bonus.date,
          received: bonus.received
        } : null
      });

      if (bonusError && bonusError.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
        console.error('❌ Error checking existing bonus:', bonusError);
        return res.status(500).json({ error: 'ボーナス確認中にエラーが発生しました', details: bonusError.message });
      }

      if (bonus) {
        console.log('✅ Bonus already received today');
        return res.status(200).json({ 
          received: true, 
          message: '本日のログインボーナスはすでに受け取り済みです (+100P)',
          date: today,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('✅ Bonus available for today');
        return res.status(200).json({ 
          received: false, 
          message: 'ログインボーナスが利用可能です (+100P)',
          date: today,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // POSTリクエスト: ボーナスの取得
    if (req.method === 'POST') {
      console.log('📋 POST request: Claiming bonus');
      
      // 既に今日のボーナスを受け取っているか確認
      const { data: bonus, error: bonusError } = await supabase
        .from('login_bonus')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      console.log('📋 Bonus check result:', {
        hasBonus: !!bonus,
        bonusError: bonusError ? {
          message: bonusError.message,
          code: bonusError.code
        } : null,
        bonus: bonus ? {
          id: bonus.id,
          user_id: bonus.user_id,
          date: bonus.date,
          received: bonus.received
        } : null
      });

      if (bonusError && bonusError.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
        console.error('❌ Error checking existing bonus:', bonusError);
        return res.status(500).json({ error: 'ボーナス確認中にエラーが発生しました', details: bonusError.message });
      }

      if (bonus) {
        console.log('✅ Bonus already received today');
        return res.status(200).json({ 
          received: true, 
          message: '本日のログインボーナスはすでに受け取り済みです (+100P)',
          date: today,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      }

      console.log('🔄 Inserting new bonus record...');

      // ボーナス付与
      const { error: insertError } = await supabase.from('login_bonus').insert({
        user_id: user.id,
        date: today,
        received: true
      });

      if (insertError) {
        console.error('❌ Error inserting bonus:', insertError);
        return res.status(500).json({ error: 'ボーナス付与中にエラーが発生しました', details: insertError.message });
      }

      console.log('✅ Bonus record inserted successfully');

      // 現在のポイントを取得して+100
      console.log('🔄 Updating user points...');
      
      // まずテーブル構造を確認（実際のクエリでテスト）
      let hasPointsColumn = false;
      
      try {
        // user_profilesテーブルにpointsカラムがあるかテスト
        const { data: testPoints, error: pointsError } = await supabase
          .from('user_profiles')
          .select('points')
          .limit(1);
        
        hasPointsColumn = !pointsError;
        console.log('📋 user_profiles table has points column:', hasPointsColumn, 'error:', pointsError?.message);
      } catch (error) {
        console.log('📋 user_profiles points column test failed:', error);
      }

      if (hasPointsColumn) {
        // pointsカラムが存在する場合
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('points')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Error fetching user profile:', profileError);
          
          // プロフィールが存在しない場合は作成を試行
          if (profileError.code === 'PGRST116') {
            console.log('🔄 Creating user profile...');
            const { error: createProfileError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
                game_tag: user.user_metadata?.game_tag || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
                points: 100
              });

            if (createProfileError) {
              console.error('❌ Error creating user profile:', createProfileError);
              return res.status(500).json({ error: 'ユーザープロフィール作成中にエラーが発生しました', details: createProfileError.message });
            }
            console.log('✅ User profile created with 100 points');
          } else {
            return res.status(500).json({ error: 'ユーザープロフィール取得中にエラーが発生しました', details: profileError.message });
          }
        } else {
          // プロフィールが存在する場合、ポイントを更新
          const currentPoints = (profile && typeof profile.points === 'number') ? profile.points : 0;
          console.log('📊 Current points:', currentPoints);
          
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ points: currentPoints + 100 })
            .eq('id', user.id);

          if (updateError) {
            console.error('❌ Error updating user points:', updateError);
            return res.status(500).json({ error: 'ポイント更新中にエラーが発生しました', details: updateError.message });
          }
          console.log('✅ Points updated successfully (+100)');
        }
      } else {
        // pointsカラムが存在しない場合は、プロフィール作成のみ
        console.log('🔄 Creating user profile without points column...');
        const { error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            game_tag: user.user_metadata?.game_tag || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
          });

        if (createProfileError) {
          console.error('❌ Error creating user profile:', createProfileError);
          return res.status(500).json({ error: 'ユーザープロフィール作成中にエラーが発生しました', details: createProfileError.message });
        }
        console.log('✅ User profile created successfully');
      }

      console.log('🎉 Login bonus process completed successfully');
      
      // 最終的なポイント確認
      const { data: finalProfile, error: finalError } = await supabase
        .from('user_profiles')
        .select('points')
        .eq('id', user.id)
        .single();
      
      if (finalError) {
        console.error('❌ Error checking final points:', finalError);
      } else {
        console.log('📊 Final points after bonus:', finalProfile?.points);
      }
      
      return res.status(200).json({ 
        received: false, 
        message: 'ログインボーナスを付与しました！(+100ポイント)',
        finalPoints: finalProfile?.points,
        date: today,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    }
    
    // その他のHTTPメソッドは許可しない
    return res.status(405).json({ error: 'Method not allowed', details: 'Only GET and POST methods are allowed' });
    
  } catch (error) {
    console.error('❌ Unexpected error in login bonus API:', error);
    return res.status(500).json({ 
      error: 'ログインボーナスの処理中に予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 