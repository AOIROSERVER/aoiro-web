import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    console.log('🔍 User profile API called');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id, user.email);

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

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
        hasPointsColumn: 'points' in profile,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      } : null
    });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      
      // プロフィールが存在しない場合は作成を試行
      if (profileError.code === 'PGRST116') {
        console.log('🔄 Creating user profile...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            game_tag: user.user_metadata?.game_tag || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            points: 0
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Profile creation error:', createError);
          return NextResponse.json({ error: 'プロフィールの作成に失敗しました' }, { status: 500 })
        }
        
        console.log('✅ User profile created:', newProfile);
        return NextResponse.json({ profile: newProfile })
      }
      
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('❌ Server error:', error);
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { username, game_tag } = body

    // バリデーション
    if (!username || !game_tag) {
      return NextResponse.json({ error: 'ユーザー名とゲームタグは必須です' }, { status: 400 })
    }

    if (game_tag.length < 3) {
      return NextResponse.json({ error: 'ゲームタグは3文字以上で入力してください' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(game_tag)) {
      return NextResponse.json({ error: 'ゲームタグは英数字、ハイフン、アンダースコアのみ使用できます' }, { status: 400 })
    }

    // ゲームタグの重複チェック（自分以外）
    const { data: existingGameTag, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('game_tag', game_tag)
      .neq('id', user.id)
      .single()

    if (existingGameTag) {
      return NextResponse.json({ error: 'このゲームタグは既に使用されています' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        username,
        game_tag,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 