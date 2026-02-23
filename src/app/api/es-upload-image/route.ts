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

/** data URL (data:image/png;base64,...) から mime と拡張子を取得 */
function parseDataUrl(dataUrl: string): { mime: string; ext: string; buffer: ArrayBuffer } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1].trim().toLowerCase();
  if (!mime.startsWith('image/') || !ALLOWED_TYPES.includes(mime)) return null;
  const ext = mime === 'image/jpeg' ? 'jpg' : mime.replace('image/', '');
  try {
    const bin = atob(m[2]);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return { mime, ext, buffer: buf.buffer };
  } catch {
    return null;
  }
}

/**
 * 募集のアイキャッチ画像をアップロードするAPI
 * - クエスト作成と同じ保存先: storage=supabase のときは常に Supabase Storage（recruit-eyecatch）に保存
 * - それ以外: GARAGE_* が設定されていれば NAS（Garage）、未設定なら Supabase
 * - 送信: FormData(file) または JSON({ base64: "data:image/..." })（クエスト作成と同じクライアント技術）
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

    const useSupabaseOnly = request.nextUrl.searchParams.get('storage') === 'supabase';

    let buffer: ArrayBuffer;
    let contentType: string;
    let ext: string;

    const contentTypeHeader = request.headers.get('content-type') || '';
    if (contentTypeHeader.includes('application/json')) {
      let json: { base64?: string };
      try {
        json = await request.json();
      } catch (e) {
        return fail('JSONの読み取りに失敗しました', 400, String(e));
      }
      const dataUrl = typeof json?.base64 === 'string' ? json.base64 : '';
      const parsed = parseDataUrl(dataUrl);
      if (!parsed) {
        return fail('base64 は data:image/...;base64,... 形式の画像を指定してください', 400);
      }
      buffer = parsed.buffer;
      contentType = parsed.mime;
      ext = parsed.ext;
      if (buffer.byteLength > MAX_SIZE) {
        return fail('ファイルサイズは5MB以下にしてください', 400);
      }
    } else {
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

      try {
        buffer = await file.arrayBuffer();
      } catch (e) {
        console.error('es-upload-image arrayBuffer:', e);
        return fail('ファイルの読み取りに失敗しました', 500, String(e));
      }
      contentType = file.type;
      ext = file.name.split('.').pop() || 'jpg';
    }

    // 募集作成（クエストと同じ保存先）のときは常に Supabase。それ以外は Garage があれば Garage
    if (!useSupabaseOnly && isGarageConfigured()) {
      try {
        const { url, path: garagePath } = await uploadRecruitEyecatchToGarage(
          buffer,
          contentType,
          ext
        );
        return NextResponse.json({ url, path: garagePath });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error('es-upload-image Garage upload error:', err);
        return fail('NASへのアップロードに失敗しました', 500, err.message);
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
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
