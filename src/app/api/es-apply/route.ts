import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { appendCompanyApplication } from '@/lib/es-companies-sheets';
import { getCompanyByIdFromSheets, SEED_COMPANY } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getDiscordFromUser(user: { user_metadata?: Record<string, unknown>; email?: string }): { id: string; username: string } {
  const m = user.user_metadata || {};
  const id = String(m.provider_id ?? m.sub ?? '').trim();
  const username = String(
    m.full_name ?? m.name ?? m.username ?? m.preferred_username ?? user.email?.split('@')[0] ?? ''
  ).trim();
  return { id, username };
}

/** フォームから志望理由のみを取り出す（minecraft_tag は別列のため含めない） */
function getMotivationOnly(formData: Record<string, unknown> | undefined): string {
  if (!formData || typeof formData !== 'object') return '';
  const v = formData.motivation ?? formData['志望理由・意志表明'] ?? formData['志望理由'];
  return typeof v === 'string' ? v.trim() : '';
}

/** POST: 入社申請を送信。body: { companyId, minecraftTag, formData }。認証はAuthorization Bearer (Supabase session) または cookie */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, minecraftTag, formData } = body as {
      companyId?: string;
      minecraftTag?: string;
      formData?: Record<string, unknown>;
    };

    if (!companyId || !minecraftTag) {
      return NextResponse.json(
        { error: '会社IDとMinecraftタグは必須です' },
        { status: 400 }
      );
    }

    let company = await getCompanyByIdFromSheets(companyId);
    if (!company && companyId === SEED_COMPANY.id) {
      company = SEED_COMPANY;
    }
    if (!company) {
      return NextResponse.json({ error: '会社が見つかりません' }, { status: 404 });
    }

    let email = '';
    let discordId = '';
    let discordUsername = '';

    let user: { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/Bearer\s+/i, '');
    if (token && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user: u } } = await supabase.auth.getUser(token);
      if (u) user = u;
    }
    if (!user) {
      try {
        const supabaseCookie = createRouteHandlerClient({ cookies });
        const { data: { user: u } } = await supabaseCookie.auth.getUser();
        if (u) user = u;
      } catch {
        // ignore
      }
    }
    if (user) {
      email = user.email || '';
      const d = getDiscordFromUser(user);
      discordId = d.id;
      discordUsername = d.username;
    }

    const motivation = getMotivationOnly(formData);

    await appendCompanyApplication({
      companyId,
      companyName: company.name,
      email,
      discordUsername,
      discordId,
      minecraftTag,
      motivation,
      status: 'pending',
      userId: user?.id ?? '',
    });

    return NextResponse.json({
      message: '入社申請を送信しました',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('es-apply POST error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '申請の送信に失敗しました' },
      { status: 500 }
    );
  }
}
