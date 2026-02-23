import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getAICCompaniesForUser } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** GET: ログイン中のユーザーのAIC所属（正社員1社＋アルバイト複数）をGASから取得。 */
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/Bearer\s+/i, '');
    if (token && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }
    if (!userId) {
      try {
        const supabaseCookie = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabaseCookie.auth.getUser();
        if (user) userId = user.id;
      } catch {
        // ignore
      }
    }
    if (!userId) {
      return NextResponse.json({ mainCompanyName: null, partTimeCompanyNames: [] }, { status: 200 });
    }
    const companies = await getAICCompaniesForUser(userId);
    return NextResponse.json({
      mainCompanyName: companies.mainCompanyName,
      partTimeCompanyNames: companies.partTimeCompanyNames,
      companyName: companies.mainCompanyName, // 後方互換
    });
  } catch (e) {
    console.error('aic-company GET error:', e);
    return NextResponse.json({ mainCompanyName: null, partTimeCompanyNames: [], companyName: null }, { status: 200 });
  }
}
