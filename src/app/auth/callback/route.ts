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
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('🔍 Auth Callback Debug Info:')
  console.log('URL:', request.url)
  console.log('Code:', code ? 'present' : 'missing')
  console.log('Access Token:', accessToken ? 'present' : 'missing')
  console.log('Refresh Token:', refreshToken ? 'present' : 'missing')
  console.log('Error:', error)
  console.log('Error Description:', errorDescription)

  const supabase = createRouteHandlerClient({ cookies })

  // OAuthエラーが直接渡された場合
  if (error) {
    console.error('OAuth Error:', error, errorDescription)
    return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
  }

  if (code) {
    // 通常のOAuth flow（クエリパラメータ）
    console.log('🔄 Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Code exchange error:', exchangeError)
      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
    }
    
    console.log('✅ Code exchange successful')
    console.log('User:', data.user?.email)
    console.log('User metadata:', data.user?.user_metadata)
    
    // 新規登録かどうかをチェック
    if (data.user && !data.user.email_confirmed_at) {
      // 新規登録でメール確認が必要な場合
      console.log('📧 Email confirmation required')
      return NextResponse.redirect(requestUrl.origin + '/login?message=registration_success')
    }
    
    // ユーザープロフィールの作成または更新
    if (data.user) {
      console.log('👤 Creating/updating user profile...')
      const { username, game_tag } = data.user.user_metadata || {}
      
      // Discordユーザーの場合、Discordの情報を使用
      let displayName = username
      let gameTag = game_tag
      
      if (data.user.app_metadata?.provider === 'discord') {
        displayName = data.user.user_metadata?.full_name || 
                     data.user.user_metadata?.name || 
                     data.user.email?.split('@')[0] ||
                     `discord_${data.user.id.slice(0, 8)}`
        
        gameTag = data.user.user_metadata?.discord_username || 
                  data.user.user_metadata?.username || 
                  `discord_${data.user.id.slice(0, 8)}`
      }
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          username: displayName,
          game_tag: gameTag,
        })
      
      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
      } else {
        console.log('✅ Profile created/updated successfully')
      }
    }
  } else if (accessToken && refreshToken) {
    // フラグメントベースの認証（クエリパラメータとして渡された場合）
    console.log('🔄 Setting session with tokens...')
    try {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      
      if (sessionError) {
        console.error('❌ Session setting error:', sessionError)
        return NextResponse.redirect(requestUrl.origin + '/login?error=session_error')
      }
      
      console.log('✅ Session set successfully')
      
      // 新規登録かどうかをチェック
      if (data.user && !data.user.email_confirmed_at) {
        // 新規登録でメール確認が必要な場合
        console.log('📧 Email confirmation required')
        return NextResponse.redirect(requestUrl.origin + '/login?message=registration_success')
      }
    } catch (error) {
      console.error('❌ Session error:', error)
      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
    }
  } else {
    console.error('❌ No code or tokens provided')
    return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
  }

  // 認証成功後のリダイレクト
  console.log('✅ Authentication successful, redirecting to:', next)
  return NextResponse.redirect(requestUrl.origin + next)
} 