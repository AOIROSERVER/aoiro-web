import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getApplicationsFromSheets } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '');
  if (!token || !supabaseUrl || !supabaseServiceKey) return false;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.email === 'aoiroserver.m@gmail.com' || user?.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
}

/** 管理者のみ: 入社申請一覧を取得。クエリ companyId で会社別に絞り込み可能 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || undefined;
    const list = await getApplicationsFromSheets(companyId);
    return NextResponse.json(list);
  } catch (e) {
    console.error('es-companies/applications GET error:', e);
    return NextResponse.json(
      { error: '申請一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
