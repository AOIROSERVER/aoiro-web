import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getApplicationsFromSheets, getMyCompaniesFromSheets } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Bearer または Cookie でログイン中のユーザーを取得 */
async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email?: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '');
  if (token && supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) return user;
  }
  try {
    const supabaseCookie = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabaseCookie.auth.getUser();
    if (user) return user;
  } catch {
    // ignore
  }
  return null;
}

/** 管理者または募集作成者: 入社申請一覧を取得。クエリ companyId で会社別に絞り込み可能 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const isAdmin = user.email === 'aoiroserver.m@gmail.com' || user.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || undefined;
    let list = await getApplicationsFromSheets(companyId);
    if (!isAdmin) {
      const myCompanies = await getMyCompaniesFromSheets(user.id);
      const myIds = new Set(myCompanies.map((c) => c.id));
      list = list.filter((a) => myIds.has(a.companyId));
    }
    return NextResponse.json(list);
  } catch (e) {
    console.error('es-companies/applications GET error:', e);
    return NextResponse.json(
      { error: '申請一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
