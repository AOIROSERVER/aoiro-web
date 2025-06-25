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

  const supabase = createRouteHandlerClient({ cookies })

  if (code) {
    // 通常のOAuth flow（クエリパラメータ）
    await supabase.auth.exchangeCodeForSession(code)
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
    } catch (error) {
      console.error('認証エラー:', error)
      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_error')
    }
  }

  // 認証成功後のリダイレクト
  return NextResponse.redirect(requestUrl.origin + '/train-status')
} 