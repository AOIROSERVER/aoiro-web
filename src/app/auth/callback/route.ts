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
  console.log('Origin:', requestUrl.origin)
  console.log('Code:', code ? 'present' : 'missing')
  console.log('Code length:', code?.length)
  console.log('Access Token:', accessToken ? 'present' : 'missing')
  console.log('Refresh Token:', refreshToken ? 'present' : 'missing')
  console.log('Error:', error)
  console.log('Error Description:', errorDescription)
  console.log('All query params:', Object.fromEntries(requestUrl.searchParams.entries()))
  console.log('User Agent:', request.headers.get('user-agent'))
  console.log('Referer:', request.headers.get('referer'))

  const supabase = createRouteHandlerClient({ cookies })

  // OAuthエラーが直接渡された場合
  if (error) {
    console.error('❌ OAuth Error:', error, errorDescription)
    console.error('OAuth Error Details:', {
      error,
      errorDescription,
      url: request.url,
      origin: requestUrl.origin,
      allParams: Object.fromEntries(requestUrl.searchParams.entries())
    })
    return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
  }

  if (code) {
    // 通常のOAuth flow（クエリパラメータ）
    console.log('🔄 Exchanging code for session...')
    console.log('Code length:', code?.length)
    console.log('Provider from URL:', requestUrl.searchParams.get('provider'))
    console.log('Code format check:', code?.includes('-') ? 'UUID-like (Supabase session code)' : 'OAuth code')
    
    try {
      console.log('🔄 Attempting code exchange...')
      console.log('Code to exchange:', code?.substring(0, 20) + '...')
      
      // Supabaseが生成したセッションコードかどうかをチェック
      const isSupabaseSessionCode = code?.includes('-') && code?.length === 36;
      
      if (isSupabaseSessionCode) {
        console.log('🔍 Detected Supabase session code, using setSession...')
        
        // Supabaseセッションコードの場合は、セッションを設定
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: code,
          refresh_token: code,
        })
        
        if (sessionError) {
          console.error('❌ Session setting error:', sessionError)
          return NextResponse.redirect(requestUrl.origin + '/login?error=session_error')
        }
        
        if (!data.session) {
          console.error('❌ No session created')
          return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
        }
        
        console.log('✅ Session set successfully with Supabase code')
        console.log('User:', data.session.user?.email)
        
        // ユーザープロフィールの作成または更新
        if (data.session.user) {
          console.log('👤 Creating/updating user profile...')
          const { username, game_tag } = data.session.user.user_metadata || {}
          
          // プロバイダー別のユーザー情報処理
          let displayName = username
          let gameTag = game_tag
          
          if (data.session.user.app_metadata?.provider === 'discord') {
            console.log('🎮 Discord user detected')
            displayName = data.session.user.user_metadata?.full_name || 
                         data.session.user.user_metadata?.name || 
                         data.session.user.email?.split('@')[0] ||
                         `discord_${data.session.user.id.slice(0, 8)}`
            
            gameTag = data.session.user.user_metadata?.discord_username || 
                      data.session.user.user_metadata?.username || 
                      `discord_${data.session.user.id.slice(0, 8)}`
            
            console.log('Discord display name:', displayName)
            console.log('Discord game tag:', gameTag)
          } else if (data.session.user.app_metadata?.provider === 'google') {
            console.log('🔍 Google user detected')
            displayName = data.session.user.user_metadata?.full_name || 
                         data.session.user.user_metadata?.name || 
                         data.session.user.email?.split('@')[0] ||
                         `google_${data.session.user.id.slice(0, 8)}`
            
            gameTag = data.session.user.user_metadata?.email?.split('@')[0] || 
                      `google_${data.session.user.id.slice(0, 8)}`
            
            console.log('Google display name:', displayName)
            console.log('Google game tag:', gameTag)
          }
          
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.session.user.id,
              username: displayName,
              game_tag: gameTag,
            })
          
          if (profileError) {
            console.error('❌ Profile creation error:', profileError)
          } else {
            console.log('✅ Profile created/updated successfully')
          }
        }
        
        // 認証成功後のリダイレクト
        console.log('✅ Authentication successful, redirecting to:', next)
        return NextResponse.redirect(requestUrl.origin + next)
      } else {
        // 通常のOAuthコードの処理
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('❌ Code exchange error:', exchangeError)
          console.error('Error details:', {
            message: exchangeError.message,
            status: exchangeError.status,
            name: exchangeError.name,
            stack: exchangeError.stack
          })
          console.error('Code exchange context:', {
            codeLength: code?.length,
            codePrefix: code?.substring(0, 20),
            provider: requestUrl.searchParams.get('provider'),
            url: request.url
          })
          
          // Google特有のエラーハンドリング
          if (exchangeError.message?.includes('invalid_grant')) {
            console.error('❌ Invalid grant error (Google OAuth)')
            return NextResponse.redirect(requestUrl.origin + '/login?error=invalid_grant')
          }
          
          // PKCEエラーの場合は特別な処理
          if (exchangeError.message?.includes('bad_code_verifier')) {
            console.error('❌ PKCE code verifier error detected')
            return NextResponse.redirect(requestUrl.origin + '/login?error=pkce_error')
          }
          
          // 認証エラーの詳細
          if (exchangeError.message?.includes('auth_error')) {
            console.error('❌ Auth error detected')
            return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
          }
          
          // その他のエラー
          console.error('❌ Unknown code exchange error')
          return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
        }
        
        console.log('✅ Code exchange successful')
        console.log('User:', data.user?.email)
        console.log('User metadata:', data.user?.user_metadata)
        console.log('App metadata:', data.user?.app_metadata)
        
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
          
          // プロバイダー別のユーザー情報処理
          let displayName = username
          let gameTag = game_tag
          
          if (data.user.app_metadata?.provider === 'discord') {
            console.log('🎮 Discord user detected')
            displayName = data.user.user_metadata?.full_name || 
                         data.user.user_metadata?.name || 
                         data.user.email?.split('@')[0] ||
                         `discord_${data.user.id.slice(0, 8)}`
            
            gameTag = data.user.user_metadata?.discord_username || 
                      data.user.user_metadata?.username || 
                      `discord_${data.user.id.slice(0, 8)}`
            
            console.log('Discord display name:', displayName)
            console.log('Discord game tag:', gameTag)
          } else if (data.user.app_metadata?.provider === 'google') {
            console.log('🔍 Google user detected')
            displayName = data.user.user_metadata?.full_name || 
                         data.user.user_metadata?.name || 
                         data.user.email?.split('@')[0] ||
                         `google_${data.user.id.slice(0, 8)}`
            
            gameTag = data.user.user_metadata?.email?.split('@')[0] || 
                      `google_${data.user.id.slice(0, 8)}`
            
            console.log('Google display name:', displayName)
            console.log('Google game tag:', gameTag)
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
      }
    } catch (error) {
      console.error('❌ Code exchange exception:', error)
      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
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
    console.log('Available params:', {
      code: !!code,
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      error,
      errorDescription
    })
    return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
  }

  // 認証成功後のリダイレクト
  console.log('✅ Authentication successful, redirecting to:', next)
  return NextResponse.redirect(requestUrl.origin + next)
} 