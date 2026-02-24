import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getCompaniesFromSheets, getMyCompaniesFromSheets, addCompanyToSheets, SEED_COMPANY } from '@/lib/es-companies-sheets';
import { sendCreativeApplicationToDiscord } from '@/lib/es-creative-discord';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Authorization Bearer または Cookie からユーザーを取得（SERVICE_ROLE_KEY がなくても anon で検証） */
async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '');
  const key = supabaseServiceKey || supabaseAnonKey;
  if (token && supabaseUrl && key) {
    const supabase = createClient(supabaseUrl, key);
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
      const discordId = getDiscordFromUser(user).id || null;
      const list = await getMyCompaniesFromSheets(user.id, discordId || undefined);
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

/** ログイン済みユーザー: 募集（会社・プロジェクト）を新規登録。クリエイティブ必要時は multipart で PDF を送る（DBには保存せずDiscordにのみ送る） */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const contentType = request.headers.get('content-type') ?? '';
    let name: string;
    let description: string | undefined;
    let location: string | undefined;
    let employmentType: string | undefined;
    let tags: string[] | undefined;
    let formSchema: Record<string, unknown> | undefined;
    let maxParticipants: number | undefined;
    let imageUrls: string[] | undefined;
    let hourlyWage: string;
    let monthlySalary: string;
    let creativeRequired: boolean | undefined;
    const creativePdfBuffers: { buffer: Buffer; fileName?: string }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = (formData.get('name') as string)?.trim() ?? '';
      description = (formData.get('description') as string)?.trim() || undefined;
      location = (formData.get('location') as string)?.trim() || undefined;
      employmentType = (formData.get('employmentType') as string)?.trim() || undefined;
      const tagsStr = formData.get('tags') as string;
      tags = tagsStr ? tagsStr.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
      const formSchemaStr = formData.get('formSchema') as string;
      if (formSchemaStr) {
        try {
          formSchema = JSON.parse(formSchemaStr) as Record<string, unknown>;
        } catch {
          formSchema = undefined;
        }
      }
      maxParticipants = formData.get('maxParticipants') != null ? Number(formData.get('maxParticipants')) || 0 : undefined;
      const imageUrlsStr = formData.get('imageUrls') as string;
      imageUrls = imageUrlsStr ? JSON.parse(imageUrlsStr) as string[] : undefined;
      hourlyWage = String(formData.get('hourlyWage') ?? '').trim();
      monthlySalary = String(formData.get('monthlySalary') ?? '').trim();
      creativeRequired = formData.get('creativeRequired') === 'true' || formData.get('creativeRequired') === '1';
      const pdfFiles = formData.getAll('creativePdf');
      for (let i = 0; i < Math.min(pdfFiles.length, 5); i++) {
        const f = pdfFiles[i];
        if (f instanceof Blob && f.size > 0) {
          const ab = await f.arrayBuffer();
          const fileName = (f as File).name;
          creativePdfBuffers.push({ buffer: Buffer.from(ab), fileName: fileName || undefined });
        }
      }
    } else {
      const body = await request.json() as Record<string, unknown>;
      name = (body.name as string)?.trim() ?? '';
      description = body.description as string | undefined;
      location = body.location as string | undefined;
      employmentType = body.employmentType as string | undefined;
      tags = body.tags as string[] | undefined;
      formSchema = body.formSchema as Record<string, unknown> | undefined;
      maxParticipants = body.maxParticipants as number | undefined;
      imageUrls = body.imageUrls as string[] | undefined;
      hourlyWage = String(body.hourlyWage ?? '').trim();
      monthlySalary = String(body.monthlySalary ?? '').trim();
      creativeRequired = !!body.creativeRequired;
    }

    if (!name) {
      return NextResponse.json({ error: '会社名は必須です' }, { status: 400 });
    }
    if (!hourlyWage) {
      return NextResponse.json({ error: '時給は必須です' }, { status: 400 });
    }
    if (!monthlySalary) {
      return NextResponse.json({ error: '月給は必須です' }, { status: 400 });
    }
    if (creativeRequired && creativePdfBuffers.length === 0) {
      return NextResponse.json({ error: 'クリエイティブ必要の場合はPDFファイルのアップロードが必須です（最大5枚）' }, { status: 400 });
    }
    const { id: discordId, username: discordUsername } = getDiscordFromUser(user);
    const id = await addCompanyToSheets({
      name,
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
      hourlyWage,
      monthlySalary,
      creativeRequired: !!creativeRequired,
      creativeStatus: creativeRequired ? 'pending' : undefined,
      creativeFileUrl: undefined,
    });
    if (creativeRequired && creativePdfBuffers.length > 0) {
      const dmResult = await sendCreativeApplicationToDiscord({
        companyName: name,
        companyId: id,
        pdfBuffers: creativePdfBuffers,
      });
      if (!dmResult.sent && dmResult.error) {
        console.warn('[es-companies] クリエイティブ申請Discord送信スキップ:', dmResult.error);
      }
    }
    return NextResponse.json({ id, message: '会社を登録しました' });
  } catch (e) {
    console.error('es-companies POST error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '登録に失敗しました' },
      { status: 500 }
    );
  }
}
