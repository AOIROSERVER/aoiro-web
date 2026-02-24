import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import {
  getApplicationsFromSheets,
  getCompanyCreatorIds,
  updateApplicationStatus,
  resignFromCompany,
} from '@/lib/es-companies-sheets';
import { sendDismissalDmToEmployee } from '@/app/api/es-apply/route';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getDiscordIdFromUser(user: { user_metadata?: Record<string, unknown> }): string | null {
  const m = user.user_metadata || {};
  const id = m.provider_id ?? m.sub;
  return id != null ? String(id).trim() || null : null;
}

async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null> {
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

async function canManageApplication(
  request: NextRequest,
  applicationCompanyId: string
): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  if (!user) return false;
  const isAdmin =
    user.email === 'aoiroserver.m@gmail.com' || user.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
  if (isAdmin) return true;
  const { createdBy, createdByDiscordId } = await getCompanyCreatorIds(applicationCompanyId);
  if (createdBy && createdBy === user.id) return true;
  const discordId = getDiscordIdFromUser(user);
  if (discordId && createdByDiscordId && createdByDiscordId === discordId) return true;
  return false;
}

/** 社長または管理者: 許可済み従業員を解雇する。理由必須。AICからも削除し、解雇DMを送る。 */
export async function POST(
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
    const status = (app.status || '').toLowerCase();
    if (status !== 'approved') {
      return NextResponse.json(
        { error: '解雇できるのは許可済みの従業員のみです' },
        { status: 400 }
      );
    }
    if (!(await canManageApplication(request, app.companyId))) {
      return NextResponse.json({ error: 'この申請を操作する権限がありません' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return NextResponse.json({ error: '解雇理由を入力してください' }, { status: 400 });
    }

    const ok = await updateApplicationStatus(id, 'dismissed');
    if (!ok) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });

    if (app.userId && app.companyName) {
      await resignFromCompany(app.userId, app.companyName);
    }

    const { createdByDiscordUsername } = await getCompanyCreatorIds(app.companyId);
    if (app.discordId?.trim()) {
      const dmResult = await sendDismissalDmToEmployee({
        employeeDiscordId: app.discordId.trim(),
        companyName: app.companyName,
        reason,
        ownerDiscordUsername: createdByDiscordUsername || '代表者',
      });
      if (!dmResult.sent && dmResult.error) {
        console.warn('[dismiss] 解雇DM送信スキップ:', dmResult.error);
      }
    }

    return NextResponse.json({ message: '解雇処理が完了しました', status: 'dismissed' });
  } catch (e) {
    console.error('es-companies/applications [id]/dismiss POST error:', e);
    return NextResponse.json({ error: '解雇処理に失敗しました' }, { status: 500 });
  }
}
