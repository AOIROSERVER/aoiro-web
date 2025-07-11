import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
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
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
} 