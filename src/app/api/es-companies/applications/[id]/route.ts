import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateApplicationStatus, getApplicationsFromSheets, getCompanyCreatedBy, setAICCompanyForUser } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function canManageApplication(request: NextRequest, applicationCompanyId: string): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '');
  if (!token || !supabaseUrl || !supabaseServiceKey) return false;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;
  const isAdmin = user.email === 'aoiroserver.m@gmail.com' || user.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
  if (isAdmin) return true;
  const createdBy = await getCompanyCreatedBy(applicationCompanyId);
  return createdBy === user.id;
}

/** 管理者または募集作成者: 申請のステータスを更新（approved / rejected） */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const applications = await getApplicationsFromSheets();
    const app = applications.find((a) => a.id === id);
    if (!app) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }
    if (!(await canManageApplication(request, app.companyId))) {
      return NextResponse.json({ error: 'この申請を操作する権限がありません' }, { status: 403 });
    }
    const body = await request.json();
    const status = (body.status as string)?.toLowerCase();
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: '申請IDとステータス(approved/rejected/pending)を指定してください' }, { status: 400 });
    }
    const ok = await updateApplicationStatus(id, status);
    if (!ok) return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    if (status === 'approved' && app.userId && app.companyName) {
      await setAICCompanyForUser(app.userId, app.companyName);
    }
    return NextResponse.json({ message: 'ステータスを更新しました', status });
  } catch (e) {
    console.error('es-companies/applications [id] PATCH error:', e);
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    );
  }
}
