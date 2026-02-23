import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { updateApplicationStatus, getApplicationsFromSheets, getCompanyCreatorIds, setAICCompanyForUser, getCompanyByIdFromSheets } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getDiscordIdFromUser(user: { user_metadata?: Record<string, unknown> }): string | null {
  const m = user.user_metadata || {};
  const id = m.provider_id ?? m.sub;
  return id != null ? String(id).trim() || null : null;
}

async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '');
  if (!token || !supabaseUrl) return null;
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!key) return null;
  const supabase = createClient(supabaseUrl, key);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (user) return user;
  try {
    const supabaseCookie = createRouteHandlerClient({ cookies });
    const { data: { user: u } } = await supabaseCookie.auth.getUser();
    return u;
  } catch {
    return null;
  }
}

async function canManageApplication(request: NextRequest, applicationCompanyId: string): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  if (!user) return false;
  const isAdmin = user.email === 'aoiroserver.m@gmail.com' || user.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
  if (isAdmin) return true;
  const { createdBy, createdByDiscordId } = await getCompanyCreatorIds(applicationCompanyId);
  if (createdBy && createdBy === user.id) return true;
  const discordId = getDiscordIdFromUser(user);
  if (discordId && createdByDiscordId && createdByDiscordId === discordId) return true;
  return false;
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
      const company = await getCompanyByIdFromSheets(app.companyId);
      const employmentType = (company?.employmentType === '正社員' ? '正社員' : 'アルバイト') as '正社員' | 'アルバイト';
      await setAICCompanyForUser(app.userId, app.companyName, employmentType);
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
