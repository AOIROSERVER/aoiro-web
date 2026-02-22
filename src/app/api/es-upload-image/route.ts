import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'recruit-eyecatch';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const dynamic = 'force-dynamic';

/**
 * 募集のアイキャッチ画像を Supabase Storage にアップロードするAPI
 * POST: multipart/form-data で file を送信 → 公開URLを返す
 * ログイン済みユーザーなら誰でもアップロード可（recruit-eyecatch バケット）
 * 認証: Authorization Bearer または Cookie のセッション
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('es-upload-image: SUPABASE_URL or SERVICE_ROLE_KEY is missing');
      return NextResponse.json({ error: 'アップロードの設定がありません' }, { status: 500 });
    }

    let user: { id: string } | null = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/Bearer\s+/i, '');
    if (token) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user: u }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && u) user = u;
    }
    if (!user) {
      try {
        const supabaseCookie = createRouteHandlerClient({ cookies });
        const { data: { user: u } } = await supabaseCookie.auth.getUser();
        if (u) user = u;
      } catch {
        // cookie 取得失敗時はそのまま 401
      }
    }
    if (!user) {
      return NextResponse.json({ error: '認証が必要です。ログインしてください。' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: 'ファイルを選択してください' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'JPEG/PNG/GIF/WebPのみ対応しています' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      if (error.message?.includes('Bucket not found')) {
        return NextResponse.json(
          { error: `Supabase にバケット「${BUCKET}」がありません。ダッシュボードで public バケットを作成してください。` },
          { status: 502 }
        );
      }
      console.error('Supabase storage upload error:', error);
      return NextResponse.json({ error: error.message || 'アップロードに失敗しました' }, { status: 500 });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${data.path}`;
    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch (e) {
    console.error('es-upload-image error:', e);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
