import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getCompaniesFromSheets, getMyCompaniesFromSheets, addCompanyToSheets, SEED_COMPANY } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Authorization Bearer または Cookie からユーザーを取得（user_metadata 含む） */
async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '');
  if (token && supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) return user;
  }
  try {
    const supabaseCookie = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabaseCookie.auth.getUser();
    if (user) return user;
  } catch {
    // cookie 取得失敗時は null
  }
  return null;
}

function getDiscordFromUser(user: { user_metadata?: Record<string, unknown> }): { id: string; username: string } {
  const m = user.user_metadata || {};
  const id = String(m.provider_id ?? m.sub ?? '').trim();
  const username = String(
    m.full_name ?? m.name ?? (m as { custom_claims?: { global_name?: string } }).custom_claims?.global_name ?? ''
  ).trim();
  return { id, username };
}

async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  return user?.email === 'aoiroserver.m@gmail.com' || user?.email === process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL || false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine');
    if (mine === '1') {
      const user = await getAuthenticatedUser(request);
      if (!user) return NextResponse.json([]);
      const list = await getMyCompaniesFromSheets(user.id);
      return NextResponse.json(list);
    }
    const companies = await getCompaniesFromSheets();
    const list = companies.length > 0 ? companies : [SEED_COMPANY];
    return NextResponse.json(list);
  } catch (e) {
    console.error('es-companies GET error:', e);
    return NextResponse.json(
      { error: '会社一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/** ログイン済みユーザー: 募集（会社・プロジェクト）を新規登録 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const body = await request.json();
    const {
      name,
      description,
      location,
      employmentType,
      tags,
      formSchema,
      maxParticipants,
      imageUrls,
    } = body as {
      name: string;
      description?: string;
      location?: string;
      employmentType?: string;
      tags?: string[];
      formSchema?: Record<string, unknown>;
      maxParticipants?: number;
      imageUrls?: string[];
    };
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '会社名は必須です' }, { status: 400 });
    }
    const { id: discordId, username: discordUsername } = getDiscordFromUser(user);
    const id = await addCompanyToSheets({
      name: name.trim(),
      description,
      location,
      employmentType,
      tags,
      formSchema,
      maxParticipants,
      imageUrls,
      createdBy: user.id,
      createdByDiscordId: discordId,
      createdByDiscordUsername: discordUsername,
    });
    return NextResponse.json({ id, message: '会社を登録しました' });
  } catch (e) {
    console.error('es-companies POST error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '登録に失敗しました' },
      { status: 500 }
    );
  }
}
