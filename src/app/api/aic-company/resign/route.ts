import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { resignAICForUser, resignFromCompany } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** POST: ログイン中のユーザーのAIC所属を退職。body に companyName があればその会社だけ退職、なければすべて退職。 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    let body: { companyName?: string } = {};
    try {
      body = await request.json();
    } catch {
      // body なしなら全退職
    }
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const ok = companyName
      ? await resignFromCompany(userId, companyName)
      : await resignAICForUser(userId);
    if (!ok) {
      return NextResponse.json({ error: '退職処理に失敗しました' }, { status: 500 });
    }
    return NextResponse.json({ message: '退職しました' });
  } catch (e) {
    console.error('aic-company/resign POST error:', e);
    return NextResponse.json({ error: '退職処理に失敗しました' }, { status: 500 });
  }
}
