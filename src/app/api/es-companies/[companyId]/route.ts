import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import {
  getCompanyByIdFromSheets,
  getCompanyCreatorIds,
  getApplicationsFromSheets,
  updateCompanyInSheets,
  setCompanyActiveInSheets,
  deleteCompanyRowFromSheets,
  SEED_COMPANY,
} from '@/lib/es-companies-sheets';
import { sendCreativeApplicationToDiscord } from '@/lib/es-creative-discord';

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
    const { createdByDiscordId, createdByDiscordUsername } = await getCompanyCreatorIds(companyId);
    const applications = await getApplicationsFromSheets(companyId);
    const members = applications
      .filter((a) => (a.status || '').toLowerCase() === 'approved')
      .map((a) => ({ discordId: a.discordId || '', discordUsername: a.discord || '' }))
      .filter((m) => m.discordId || m.discordUsername);

    const withOwnerAndMembers = {
      ...company,
      createdByDiscordId: createdByDiscordId ?? undefined,
      createdByDiscordUsername: createdByDiscordUsername ?? undefined,
      members,
    };
    return NextResponse.json(withOwnerAndMembers);
  } catch (e) {
    console.error('es-companies [companyId] GET error:', e);
    return NextResponse.json(
      { error: '会社情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/** 会社の編集（作成者または管理者）。multipart の場合は PDF を Discord に送信可能 */
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
    const contentType = request.headers.get('content-type') ?? '';
    let updates: Parameters<typeof updateCompanyInSheets>[1] = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      updates.name = (formData.get('name') as string)?.trim();
      updates.description = (formData.get('description') as string)?.trim() || undefined;
      updates.location = (formData.get('location') as string)?.trim() || undefined;
      updates.employmentType = (formData.get('employmentType') as string)?.trim() || undefined;
      const tagsStr = formData.get('tags') as string;
      updates.tags = tagsStr ? tagsStr.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
      updates.maxParticipants = formData.get('maxParticipants') != null ? Number(formData.get('maxParticipants')) || 0 : undefined;
      const imageUrlsStr = formData.get('imageUrls') as string;
      updates.imageUrls = imageUrlsStr ? (JSON.parse(imageUrlsStr) as string[]) : undefined;
      updates.hourlyWage = (formData.get('hourlyWage') as string)?.trim() || undefined;
      updates.monthlySalary = (formData.get('monthlySalary') as string)?.trim() || undefined;
      const creativeRequired = formData.get('creativeRequired') === 'true' || formData.get('creativeRequired') === '1';
      updates.creativeRequired = creativeRequired;
      if (creativeRequired) {
        updates.creativeStatus = 'pending';
      } else {
        updates.creativeStatus = '';
        updates.creativeFileUrl = '';
      }
      const pdfFiles = formData.getAll('creativePdf');
      const pdfBuffers: { buffer: Buffer; fileName?: string }[] = [];
      for (let i = 0; i < Math.min(pdfFiles.length, 5); i++) {
        const f = pdfFiles[i];
        if (f instanceof Blob && f.size > 0) {
          const ab = await f.arrayBuffer();
          const fileName = (f as File).name;
          pdfBuffers.push({ buffer: Buffer.from(ab), fileName: fileName || undefined });
        }
      }
      const ok = await updateCompanyInSheets(companyId, updates);
      if (!ok) return NextResponse.json({ error: '会社の更新に失敗しました' }, { status: 500 });
      if (pdfBuffers.length > 0) {
        const company = await getCompanyByIdFromSheets(companyId);
        const companyName = company?.name ?? '';
        const dmResult = await sendCreativeApplicationToDiscord({
          companyName,
          companyId,
          pdfBuffers,
        });
        if (!dmResult.sent && dmResult.error) {
          console.warn('[es-companies PATCH] クリエイティブ申請Discord送信スキップ:', dmResult.error);
        }
      }
      return NextResponse.json({ message: '更新しました' });
    }

    const body = await request.json() as Record<string, unknown>;
    if (body.name !== undefined) updates.name = String(body.name);
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.location !== undefined) updates.location = String(body.location);
    if (body.employmentType !== undefined) updates.employmentType = String(body.employmentType);
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.map(String) : [];
    if (body.maxParticipants !== undefined) updates.maxParticipants = Number(body.maxParticipants) || 0;
    if (body.imageUrls !== undefined) updates.imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map(String) : [];
    if (body.formSchema !== undefined) updates.formSchema = body.formSchema as Record<string, unknown> | null;
    if (body.hourlyWage !== undefined) updates.hourlyWage = String(body.hourlyWage);
    if (body.monthlySalary !== undefined) updates.monthlySalary = String(body.monthlySalary);
    if (body.creativeRequired !== undefined) {
      updates.creativeRequired = !!body.creativeRequired;
      if (body.creativeRequired) {
        updates.creativeStatus = 'pending';
      } else {
        updates.creativeStatus = '';
        updates.creativeFileUrl = '';
      }
    }
    if (body.creativeFileUrl !== undefined) updates.creativeFileUrl = String(body.creativeFileUrl).trim();
    const ok = await updateCompanyInSheets(companyId, updates);
    if (!ok) return NextResponse.json({ error: '会社の更新に失敗しました' }, { status: 500 });
    return NextResponse.json({ message: '更新しました' });
  } catch (e) {
    console.error('es-companies [companyId] PATCH error:', e);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}

/** 会社の削除。GASから行を削除し、Supabaseのアイキャッチ画像も削除。作成者または管理者のみ */
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
    const company = await getCompanyByIdFromSheets(companyId);
    const imageUrls = company?.imageUrls ?? [];
    const bucketName = 'recruit-eyecatch';
    const pathsToRemove: string[] = [];
    for (const url of imageUrls) {
      if (!url || typeof url !== 'string') continue;
      const match = url.match(/\/storage\/v1\/object\/public\/recruit-eyecatch\/(.+)$/);
      if (match?.[1]) pathsToRemove.push(match[1]);
    }
    if (pathsToRemove.length > 0 && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error } = await supabase.storage.from(bucketName).remove(pathsToRemove);
      if (error) console.warn('[es-companies DELETE] Supabase storage remove error:', error.message);
    }
    const ok = await deleteCompanyRowFromSheets(companyId);
    if (!ok) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
    return NextResponse.json({ message: '削除しました（シートから削除し、アイキャッチ画像も削除しました）' });
  } catch (e) {
    console.error('es-companies [companyId] DELETE error:', e);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
