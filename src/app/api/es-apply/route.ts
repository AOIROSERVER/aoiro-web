import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appendCompanyApplication } from '@/lib/es-companies-sheets';
import { getCompanyByIdFromSheets, SEED_COMPANY } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    const authHeader = request.headers.get('authorization');
    let email = '';
    let discordUsername = '';

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader?.replace(/Bearer\s+/i, '') || undefined;
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          email = user.email || '';
          discordUsername =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.username ||
            user.user_metadata?.preferred_username ||
            user.email?.split('@')[0] ||
            '';
        }
      }
    }

    const formDataJson = typeof formData === 'object' ? JSON.stringify(formData) : '{}';

    await appendCompanyApplication({
      companyId,
      companyName: company.name,
      email,
      discordUsername,
      minecraftTag,
      formDataJson,
      status: 'pending',
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
