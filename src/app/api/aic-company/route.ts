import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getAICCompanyForUser } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** GET: ログイン中のユーザーのAIC所属会社名をGASから取得。無ければ null。 */
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
      return NextResponse.json({ companyName: null }, { status: 200 });
    }
    const companyName = await getAICCompanyForUser(userId);
    return NextResponse.json({ companyName });
  } catch (e) {
    console.error('aic-company GET error:', e);
    return NextResponse.json({ companyName: null }, { status: 200 });
  }
}
