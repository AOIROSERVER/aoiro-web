import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateApplicationStatus } from '@/lib/es-companies-sheets';

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

/** 管理者のみ: 申請のステータスを更新（approved / rejected） */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const status = (body.status as string)?.toLowerCase();
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: '申請IDとステータス(approved/rejected/pending)を指定してください' }, { status: 400 });
    }
    const ok = await updateApplicationStatus(id, status);
    if (!ok) return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    return NextResponse.json({ message: 'ステータスを更新しました', status });
  } catch (e) {
    console.error('es-companies/applications [id] PATCH error:', e);
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    );
  }
}
