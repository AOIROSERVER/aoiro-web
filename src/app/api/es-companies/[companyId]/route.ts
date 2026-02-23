import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import {
  getCompanyByIdFromSheets,
  getCompanyCreatorIds,
  updateCompanyInSheets,
  setCompanyActiveInSheets,
  SEED_COMPANY,
} from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null> {
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

function getDiscordIdFromUser(user: { user_metadata?: Record<string, unknown> }): string | null {
  const m = user.user_metadata || {};
  const id = m.provider_id ?? m.sub;
  return id != null ? String(id).trim() || null : null;
}

async function canManageCompany(request: NextRequest, companyId: string): Promise<boolean> {
  if (companyId === SEED_COMPANY.id) return false;
  const user = await getAuthenticatedUser(request);
  if (!user) return false;
  const isAdmin = user.email === 'aoiroserver.m@gmail.com' || user.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
  if (isAdmin) return true;
  const { createdBy, createdByDiscordId } = await getCompanyCreatorIds(companyId);
  if (createdBy && createdBy === user.id) return true;
  const discordId = getDiscordIdFromUser(user);
  if (discordId && createdByDiscordId && createdByDiscordId === discordId) return true;
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }
    if (companyId === SEED_COMPANY.id) {
      return NextResponse.json(SEED_COMPANY);
    }
    const company = await getCompanyByIdFromSheets(companyId);
    if (!company) {
      return NextResponse.json({ error: '会社が見つかりません' }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (e) {
    console.error('es-companies [companyId] GET error:', e);
    return NextResponse.json(
      { error: '会社情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/** 会社の編集（作成者または管理者） */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    if (!companyId || companyId === SEED_COMPANY.id) {
      return NextResponse.json({ error: 'この会社は編集できません' }, { status: 400 });
    }
    if (!(await canManageCompany(request, companyId))) {
      return NextResponse.json({ error: 'この会社を編集する権限がありません' }, { status: 403 });
    }
    const body = await request.json() as Record<string, unknown>;
    const updates: Parameters<typeof updateCompanyInSheets>[1] = {};
    if (body.name !== undefined) updates.name = String(body.name);
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.location !== undefined) updates.location = String(body.location);
    if (body.employmentType !== undefined) updates.employmentType = String(body.employmentType);
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.map(String) : [];
    if (body.maxParticipants !== undefined) updates.maxParticipants = Number(body.maxParticipants) || 0;
    if (body.imageUrls !== undefined) updates.imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map(String) : [];
    if (body.formSchema !== undefined) updates.formSchema = body.formSchema as Record<string, unknown> | null;
    const ok = await updateCompanyInSheets(companyId, updates);
    if (!ok) return NextResponse.json({ error: '会社の更新に失敗しました' }, { status: 500 });
    return NextResponse.json({ message: '更新しました' });
  } catch (e) {
    console.error('es-companies [companyId] PATCH error:', e);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}

/** 会社の削除（論理削除・非表示）。作成者または管理者のみ */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    if (!companyId || companyId === SEED_COMPANY.id) {
      return NextResponse.json({ error: 'この会社は削除できません' }, { status: 400 });
    }
    if (!(await canManageCompany(request, companyId))) {
      return NextResponse.json({ error: 'この会社を削除する権限がありません' }, { status: 403 });
    }
    const ok = await setCompanyActiveInSheets(companyId, false);
    if (!ok) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
    return NextResponse.json({ message: '削除しました（非表示になりました）' });
  } catch (e) {
    console.error('es-companies [companyId] DELETE error:', e);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
