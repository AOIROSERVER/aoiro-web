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
  const from = requestUrl.searchParams.get('from')
  const next = requestUrl.searchParams.get('next') || (from === 'register' ? '/register' : '/train-status')
  const source = requestUrl.searchParams.get('source')
  
  console.log('🚀 Auth Callback Started');
  console.log('🔍 Request Details:', {
    url: request.url,
    pathname: requestUrl.pathname,
    search: requestUrl.search,
    origin: requestUrl.origin
  });
  
  // MCID認証ページからの認証の場合の特別処理
  // fromパラメータ、nextパラメータ、リファラーヘッダー、sourceパラメータのいずれかでMCID認証ページからの認証を検出
  const referer = request.headers.get('referer') || '';
  const isFromMinecraftAuth = from === 'minecraft-auth' || 
                              next === '/minecraft-auth' || 
                              next === '/minecraft-auth/verify' ||
                              source === 'minecraft-auth-page' ||
                              referer.includes('/minecraft-auth') ||
                              referer.includes('minecraft-auth') ||
                              requestUrl.pathname.includes('minecraft-auth');
  
  console.log('🔍 MCID Auth Detection:', {
    from,
    next,
    source,
    referer,
    pathname: requestUrl.pathname,
    isFromMinecraftAuth,
    sourceIsMinecraftAuthPage: source === 'minecraft-auth-page',
    refererIncludesMinecraftAuth: referer.includes('/minecraft-auth'),
    refererIncludesMinecraftAuthVerify: referer.includes('minecraft-auth'),
    pathnameIncludesMinecraftAuth: requestUrl.pathname.includes('minecraft-auth'),
    fullReferer: referer
  });
  
  // マインクラフト認証の検出のみ（早期リダイレクトは削除）
  // セッション作成後にリダイレクトを行うようにAICシステムと同様の処理に変更
  
  console.log('Next parameter calculation:', {
    from,
    nextParam: requestUrl.searchParams.get('next'),
    calculatedNext: next
  })
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
  console.log('From parameter:', from)
  console.log('Next parameter:', next)
  console.log('From === register:', from === 'register')
  console.log('From === minecraft-auth:', from === 'minecraft-auth')
  console.log('Next === /minecraft-auth:', next === '/minecraft-auth')
  console.log('Next === /minecraft-auth/verify:', next === '/minecraft-auth/verify')
  console.log('User Agent:', request.headers.get('user-agent'))
  console.log('Referer:', request.headers.get('referer'))
  console.log('Origin header:', request.headers.get('origin'))

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
    
    // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
    if (from === 'register') {
      const baseUrl = 'https://aoiroserver.site'
      const redirectUrl = baseUrl + '/register?error=auth_error'
      console.log('🔄 Redirecting to register page with auth error:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
    
    return NextResponse.redirect('https://aoiroserver.site/login?error=auth_error')
  }

  if (code) {
    // 通常のOAuth flow（クエリパラメータ）
    console.log('🔄 Exchanging code for session...')
    console.log('Code length:', code?.length)
    console.log('Provider from URL:', requestUrl.searchParams.get('provider'))
    console.log('Code format check:', code?.includes('-') ? 'UUID-like (Supabase session code)' : 'OAuth code')
    
    // MCID認証ページからの認証の場合の詳細ログ
    if (from === 'minecraft-auth') {
      console.log('🎮 MCID Auth Debug Info:')
      console.log('From parameter:', from)
      console.log('Next parameter:', next)
      console.log('Full URL:', request.url)
      console.log('Code details:', {
        codeLength: code?.length,
        codePrefix: code?.substring(0, 20),
        codeSuffix: code?.substring(code.length - 10),
        isCodeValid: !!code && code.length > 10
      })
      console.log('Request headers:', {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin')
      })
    }
    
    try {
      console.log('🔄 Attempting code exchange...')
      console.log('Code to exchange:', code?.substring(0, 20) + '...')
      
      // Discord OAuthの場合は、通常のOAuth flowとして処理
      console.log('🔍 Processing Discord OAuth code...')
      console.log('Code details:', {
        codeLength: code?.length,
        codePrefix: code?.substring(0, 20),
        codeSuffix: code?.substring(code.length - 10),
        isCodeValid: !!code && code.length > 10
      })
      
      // OAuthコードをセッションに交換
      console.log('🔄 Calling exchangeCodeForSession...')
      console.log('Code details for exchange:', {
        codeLength: code?.length,
        codePrefix: code?.substring(0, 20),
        codeSuffix: code?.substring(code.length - 10),
        isCodeValid: !!code && code.length > 10
      })
      
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code!)
      console.log('Exchange result:', {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        hasError: !!sessionError,
        errorMessage: sessionError?.message,
        errorStatus: sessionError?.status,
        errorName: sessionError?.name
      })
      
      // MCID認証ページからの認証の場合の詳細ログ
      if (from === 'minecraft-auth') {
        console.log('🎮 MCID Auth Exchange Result:')
        console.log('Session created:', !!data?.session)
        console.log('User created:', !!data?.user)
        console.log('Error occurred:', !!sessionError)
        if (sessionError) {
          console.log('Error details:', {
            message: sessionError.message,
            status: sessionError.status,
            name: sessionError.name,
            stack: sessionError.stack
          })
        }
        if (data?.session) {
          console.log('Session details:', {
            userId: data.session.user?.id,
            userEmail: data.session.user?.email,
            provider: data.session.user?.app_metadata?.provider,
            userMetadata: data.session.user?.user_metadata
          })
        }
      }
        
      if (sessionError) {
        console.error('❌ Session setting error:', sessionError)
        console.error('Session error details:', {
          message: sessionError.message,
          status: sessionError.status,
          name: sessionError.name,
          stack: sessionError.stack
        })
        console.error('Discord OAuth context:', {
          codeLength: code?.length,
          codePrefix: code?.substring(0, 20),
          provider: 'discord',
          from: from,
          url: request.url,
          origin: requestUrl.origin,
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer')
        })
        
        // Discord OAuth特有のエラーハンドリング
        if (sessionError.message?.includes('invalid_grant')) {
          console.error('❌ Invalid grant error - code may be expired or used')
          return NextResponse.redirect('https://aoiroserver.site/login?error=invalid_grant')
        }
        
        if (sessionError.message?.includes('redirect_uri')) {
          console.error('❌ Redirect URI mismatch')
          return NextResponse.redirect('https://aoiroserver.site/login?error=redirect_uri_mismatch')
        }
        
        if (sessionError.message?.includes('client_id')) {
          console.error('❌ Client ID error')
          return NextResponse.redirect('https://aoiroserver.site/login?error=client_id_error')
        }
        
        // PKCE関連のエラーハンドリング
        if (sessionError.message?.includes('pkce') || sessionError.message?.includes('code_verifier')) {
          console.error('❌ PKCE error - code verifier mismatch or missing')
          return NextResponse.redirect('https://aoiroserver.site/login?error=pkce_error')
        }
        
        if (sessionError.status === 400 && sessionError.message?.includes('grant_type')) {
          console.error('❌ Grant type error - PKCE flow issue')
          return NextResponse.redirect('https://aoiroserver.site/login?error=pkce_grant_error')
        }
        
        // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
        if (from === 'register') {
          const baseUrl = 'https://aoiroserver.site'
          const redirectUrl = baseUrl + '/register?error=session_error'
          console.log('🔄 Redirecting to register page with session error:', redirectUrl)
          return NextResponse.redirect(redirectUrl)
        }
        
        // MCID認証ページからの認証の場合は、MCID認証ページにエラー付きでリダイレクト
        if (from === 'minecraft-auth') {
          const baseUrl = 'https://aoiroserver.site'
          let errorType = 'session_error';
          let errorDetails = '';
          
          // エラーの詳細に基づいてエラータイプを決定
          if (sessionError.message?.includes('invalid_grant')) {
            errorType = 'invalid_grant';
            errorDetails = '認証コードが無効または期限切れです';
          } else if (sessionError.message?.includes('redirect_uri')) {
            errorType = 'redirect_uri_mismatch';
            errorDetails = 'リダイレクトURIの設定に問題があります';
          } else if (sessionError.message?.includes('client_id')) {
            errorType = 'client_id_error';
            errorDetails = 'クライアントIDの設定に問題があります';
          } else if (sessionError.message?.includes('pkce') || sessionError.message?.includes('code_verifier')) {
            errorType = 'pkce_error';
            errorDetails = 'PKCE認証セッションに問題があります';
          } else if (sessionError.status === 400) {
            errorType = 'bad_request';
            errorDetails = 'リクエストの形式に問題があります';
          }
          
          const redirectUrl = baseUrl + `/minecraft-auth?error=${errorType}&details=${encodeURIComponent(errorDetails)}`;
          console.log('🔄 Redirecting to minecraft-auth page with detailed error:', redirectUrl);
          console.log('Error type:', errorType);
          console.log('Error details:', errorDetails);
          return NextResponse.redirect(redirectUrl);
        }
        
        return NextResponse.redirect('https://aoiroserver.site/login?error=session_error')
      }
      
      if (!data.session) {
        console.error('❌ No session created')
        console.error('Session data:', data)
        
        // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
        if (from === 'register') {
          const baseUrl = 'https://aoiroserver.site'
          const redirectUrl = baseUrl + '/register?error=session_error'
          console.log('🔄 Redirecting to register page with no session error:', redirectUrl)
          return NextResponse.redirect(redirectUrl)
        }
        
        // MCID認証ページからの認証の場合は、MCID認証ページにエラー付きでリダイレクト
        if (from === 'minecraft-auth') {
          const baseUrl = 'https://aoiroserver.site'
          const redirectUrl = baseUrl + '/minecraft-auth?error=no_session&details=' + encodeURIComponent('セッションの作成に失敗しました');
          console.log('🔄 Redirecting to minecraft-auth page with no session error:', redirectUrl);
          return NextResponse.redirect(redirectUrl);
        }
        
        return NextResponse.redirect('https://aoiroserver.site/login?error=session_error')
      }
      
      console.log('✅ Session set successfully with Discord OAuth')
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
    } catch (error) {
      console.error('❌ Code exchange exception:', error)
      console.error('Exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      
      // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
      if (from === 'register') {
        const baseUrl = 'https://aoiroserver.site'
        const redirectUrl = baseUrl + '/register?error=auth_error'
        console.log('🔄 Redirecting to register page with code exchange error:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }
      
      // MCID認証ページからの認証の場合は、MCID認証ページにエラー付きでリダイレクト
      if (from === 'minecraft-auth') {
        const baseUrl = 'https://aoiroserver.site'
        const redirectUrl = baseUrl + '/minecraft-auth?error=code_exchange_error&details=' + encodeURIComponent('認証コードの交換に失敗しました');
        console.log('🔄 Redirecting to minecraft-auth page with code exchange error:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
      }
      
      return NextResponse.redirect('https://aoiroserver.site/login?error=auth_error')
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
        console.error('Session error details:', {
          message: sessionError.message,
          status: sessionError.status,
          name: sessionError.name,
          stack: sessionError.stack
        })
        
        // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
        if (from === 'register') {
          const baseUrl = 'https://aoiroserver.site'
          const redirectUrl = baseUrl + '/register?error=session_error'
          console.log('🔄 Redirecting to register page with token session error:', redirectUrl)
          return NextResponse.redirect(redirectUrl)
        }
        
        return NextResponse.redirect('https://aoiroserver.site/login?error=session_error')
      }
      
      if (!data.session) {
        console.error('❌ No session created with tokens')
        console.error('Token session data:', data)
        
        // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
        if (from === 'register') {
          const baseUrl = 'https://aoiroserver.site'
          const redirectUrl = baseUrl + '/register?error=session_error'
          console.log('🔄 Redirecting to register page with no token session error:', redirectUrl)
          return NextResponse.redirect(redirectUrl)
        }
        
        return NextResponse.redirect('https://aoiroserver.site/login?error=session_error')
      }
      
      console.log('✅ Session set successfully')
      
      // 新規登録かどうかをチェック
      if (data.user && !data.user.email_confirmed_at) {
        // 新規登録でメール確認が必要な場合
        console.log('📧 Email confirmation required')
        return NextResponse.redirect('https://aoiroserver.site/login?message=registration_success')
      }
    } catch (error) {
      console.error('❌ Session error:', error)
      console.error('Session exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      
      // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
      if (from === 'register') {
        const baseUrl = 'https://aoiroserver.site'
        const redirectUrl = baseUrl + '/register?error=auth_error'
        console.log('🔄 Redirecting to register page with token session exception:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }
      
      return NextResponse.redirect('https://aoiroserver.site/login?error=auth_error')
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
    
    // 新規作成画面からの認証の場合は、新規作成画面にエラー付きでリダイレクト
    if (from === 'register') {
      const baseUrl = 'https://aoiroserver.site'
      const redirectUrl = baseUrl + '/register?error=auth_error'
      console.log('🔄 Redirecting to register page with no code/tokens error:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    }
    
    return NextResponse.redirect('https://aoiroserver.site/login?error=auth_error')
  }

  // 認証成功後のリダイレクト
  console.log('✅ Authentication successful, redirecting to:', next)
  console.log('From register page:', from === 'register')
  console.log('From minecraft-auth page:', from === 'minecraft-auth')
  console.log('From parameter value:', from)
  console.log('Next parameter value:', next)
  console.log('All URL parameters:', Object.fromEntries(requestUrl.searchParams.entries()))
  console.log('Request URL:', request.url)
  console.log('Request origin:', requestUrl.origin)
  console.log('Decision logic:', {
    fromIsRegister: from === 'register',
    fromIsMinecraftAuth: from === 'minecraft-auth',
    nextIsRegister: next === '/register',
    nextIsMinecraftAuth: next === '/minecraft-auth',
    shouldRedirectToRegister: from === 'register' || next === '/register',
    shouldRedirectToMinecraftAuth: from === 'minecraft-auth' || next === '/minecraft-auth'
  })
  
  // 新規作成画面からの認証の場合は、Discord連携完了を示すパラメータを追加
  if (from === 'register') {
    // 確実にhttps://aoiroserver.siteにリダイレクト
    const baseUrl = 'https://aoiroserver.site'
    const redirectUrl = baseUrl + next + '?discord_linked=true'
    console.log('🔄 Redirecting to register page with discord_linked=true:', redirectUrl)
    console.log('Base URL used:', baseUrl)
    console.log('Next path:', next)
    console.log('Final redirect URL:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Minecraft認証ページからの認証の場合は、MCID認証ページに成功パラメータ付きでリダイレクト
  // より確実な検出のため、isFromMinecraftAuth変数も使用
  if (isFromMinecraftAuth || from === 'minecraft-auth') {
    const baseUrl = 'https://aoiroserver.site'
    const redirectUrl = baseUrl + '/minecraft-auth/verify?auth_success=true&from=minecraft-auth'
    console.log('🔄 Redirecting to minecraft-auth verify page with success:', redirectUrl)
    console.log('Base URL used:', baseUrl)
    console.log('Final redirect URL:', redirectUrl)
    console.log('Detection reason:', {
      isFromMinecraftAuth,
      fromIsMinecraftAuth: from === 'minecraft-auth',
      source,
      referer
    })
    return NextResponse.redirect(redirectUrl)
  }
  
  // fromパラメータがminecraft-authでない場合でも、nextが/minecraft-authの場合はMCID認証ページにリダイレクト
  if (next === '/minecraft-auth' || next === '/minecraft-auth/verify') {
    const baseUrl = 'https://aoiroserver.site'
    const redirectUrl = baseUrl + '/minecraft-auth/verify?auth_success=true&from=minecraft-auth'
    console.log('🔄 Redirecting to minecraft-auth verify page based on next parameter:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Discord OAuthからの認証で、fromパラメータが不明な場合は新規作成画面にリダイレクト
  if (!from && requestUrl.searchParams.get('provider') === 'discord') {
    const baseUrl = 'https://aoiroserver.site'
    const redirectUrl = baseUrl + '/register?discord_linked=true'
    console.log('🔄 Redirecting to register page for Discord OAuth without from parameter:', redirectUrl)
    return NextResponse.redirect(redirectUrl)
  }
  
  // デフォルトページへのリダイレクトも確実にhttps://aoiroserver.siteを使用
  const baseUrl = 'https://aoiroserver.site'
  const defaultRedirectUrl = baseUrl + next
  console.log('🔄 Redirecting to default page:', defaultRedirectUrl)
  console.log('Default redirect reason:', {
    from: from,
    next: next,
    fromNotRegister: from !== 'register',
    fromNotMinecraftAuth: from !== 'minecraft-auth',
    nextNotRegister: next !== '/register',
    nextNotMinecraftAuth: next !== '/minecraft-auth'
  })
  return NextResponse.redirect(defaultRedirectUrl)
} 