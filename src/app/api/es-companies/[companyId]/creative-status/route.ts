import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { updateCompanyInSheets, getCompanyByIdFromSheets, getCompanyCreatorIds, SEED_COMPANY } from '@/lib/es-companies-sheets';
import { sendCreativeApprovalDmToOwner } from '@/lib/es-creative-discord';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email?: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '');
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!token || !supabaseUrl || !key) return null;
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

/** 管理者のみ: クリエイティブ申請の許可/拒否 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const isAdmin = user.email === 'aoiroserver.m@gmail.com' || user.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者アカウントでのみ許可・拒否できます' }, { status: 403 });
    }
    const { companyId } = await params;
    if (!companyId || companyId === SEED_COMPANY.id) {
      return NextResponse.json({ error: '無効な会社IDです' }, { status: 400 });
    }
    const body = await request.json() as { status?: string };
    const status = (body.status as string)?.toLowerCase();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status は approved または rejected を指定してください' }, { status: 400 });
    }
    const company = await getCompanyByIdFromSheets(companyId);
    if (!company) {
      return NextResponse.json({ error: '会社が見つかりません' }, { status: 404 });
    }
    const ok = await updateCompanyInSheets(companyId, { creativeStatus: status });
    if (!ok) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    if (status === 'approved') {
      const { createdByDiscordId } = await getCompanyCreatorIds(companyId);
      if (createdByDiscordId?.trim()) {
        const dmResult = await sendCreativeApprovalDmToOwner({ ownerDiscordId: createdByDiscordId.trim() });
        if (!dmResult.sent && dmResult.error) {
          console.warn('[creative-status] クリエイティブ承認DM送信スキップ:', dmResult.error);
        }
      }
    }
    return NextResponse.json({ message: status === 'approved' ? 'クリエイティブ申請を許可しました' : 'クリエイティブ申請を拒否しました', status });
  } catch (e) {
    console.error('creative-status PATCH error:', e);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}
