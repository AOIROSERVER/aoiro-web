import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { isGarageConfigured, uploadRecruitEyecatchToGarage } from '@/lib/garage-storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'recruit-eyecatch';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const dynamic = 'force-dynamic';
// Netlify/サーバーレスで multipart を受け取るため
export const maxDuration = 60;

/**
 * 募集のアイキャッチ画像をアップロードするAPI
 * - GARAGE_* が設定されていれば NAS（Garage/MinIO）に保存
 * - 未設定なら Supabase Storage（recruit-eyecatch）に保存
 * 認証: Authorization Bearer または Cookie のセッション
 */
export async function POST(request: NextRequest) {
  const fail = (message: string, status: number, detail?: string) => {
    const body = detail ? { error: message, detail } : { error: message };
    return NextResponse.json(body, { status });
  };

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('es-upload-image: SUPABASE_URL or SERVICE_ROLE_KEY is missing');
      return fail('認証の設定がありません', 500);
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
      return fail('認証が必要です。ログインしてください。', 401);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error('es-upload-image formData:', e);
      return fail('フォームデータの読み取りに失敗しました', 500, String(e));
    }

    const file = formData.get('file') as File | null;
    if (!file || typeof file.size !== 'number') {
      return fail('ファイルを選択してください', 400);
    }
    if (file.size === 0) {
      return fail('ファイルが空です', 400);
    }
    if (file.size > MAX_SIZE) {
      return fail('ファイルサイズは5MB以下にしてください', 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return fail('JPEG/PNG/GIF/WebPのみ対応しています', 400);
    }

    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (e) {
      console.error('es-upload-image arrayBuffer:', e);
      return fail('ファイルの読み取りに失敗しました', 500, String(e));
    }

    const ext = file.name.split('.').pop() || 'jpg';

    // NAS（Garage）が設定されていればそちらに保存
    if (isGarageConfigured()) {
      try {
        const { url, path: garagePath } = await uploadRecruitEyecatchToGarage(
          buffer,
          file.type,
          ext
        );
        return NextResponse.json({ url, path: garagePath });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error('es-upload-image Garage upload error:', err);
        return fail('NASへのアップロードに失敗しました', 500, err.message);
      }
    }

    // Garage 未設定時は Supabase Storage に保存
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.toLowerCase().includes('bucket')) {
        return fail(
          `Supabase にバケット「${BUCKET}」がありません。ダッシュボードで public バケットを作成してください。`,
          502,
          error.message
        );
      }
      console.error('Supabase storage upload error:', error);
      return fail('アップロードに失敗しました', 500, error.message);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${data.path}`;
    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('es-upload-image error:', err);
    return fail('アップロードに失敗しました', 500, err.message);
  }
}
