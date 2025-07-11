import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')
  const expiresIn = requestUrl.searchParams.get('expires_in')
  const tokenType = requestUrl.searchParams.get('token_type')
  const next = requestUrl.searchParams.get('next') || '/train-status'

  const supabase = createRouteHandlerClient({ cookies })

  if (code) {
    // 通常のOAuth flow（クエリパラメータ）
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('認証エラー:', error)
      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
    }
    
          // 新規登録かどうかをチェック
      if (data.user && !data.user.email_confirmed_at) {
        // 新規登録でメール確認が必要な場合
        return NextResponse.redirect(requestUrl.origin + '/login?message=registration_success')
      }
      
      // ユーザープロフィールの作成または更新
      if (data.user) {
        const { username, game_tag } = data.user.user_metadata || {}
        if (username || game_tag) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              username: username || data.user.email?.split('@')[0],
              game_tag: game_tag || `user_${data.user.id.slice(0, 8)}`,
            })
          
          if (profileError) {
            console.error('プロフィール作成エラー:', profileError)
          }
        }
      }
    
    // ユーザープロフィールの作成または更新
    if (data.user) {
      const { username, game_tag } = data.user.user_metadata || {}
      if (username || game_tag) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            username: username || data.user.email?.split('@')[0],
            game_tag: game_tag || `user_${data.user.id.slice(0, 8)}`,
          })
        
        if (profileError) {
          console.error('プロフィール作成エラー:', profileError)
        }
      }
    }
  } else if (accessToken && refreshToken) {
    // フラグメントベースの認証（クエリパラメータとして渡された場合）
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      
      if (error) {
        console.error('セッション設定エラー:', error)
        return NextResponse.redirect(requestUrl.origin + '/login?error=session_error')
      }
      
      // 新規登録かどうかをチェック
      if (data.user && !data.user.email_confirmed_at) {
        // 新規登録でメール確認が必要な場合
        return NextResponse.redirect(requestUrl.origin + '/login?message=registration_success')
      }
    } catch (error) {
      console.error('認証エラー:', error)
      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
    }
  }

  // 認証成功後のリダイレクト
  return NextResponse.redirect(requestUrl.origin + next)
} 