import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCompaniesFromSheets, getMyCompaniesFromSheets, addCompanyToSheets, SEED_COMPANY } from '@/lib/es-companies-sheets';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine');
    if (mine === '1') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace(/Bearer\s+/i, '');
      if (!token || !supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json([]);
      }
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await supabase.auth.getUser(token);
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
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/Bearer\s+/i, '');
    if (!token || !supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
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
    const createdBy = user.id;
    const id = await addCompanyToSheets({
      name: name.trim(),
      description,
      location,
      employmentType,
      tags,
      formSchema,
      maxParticipants,
      imageUrls,
      createdBy,
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
