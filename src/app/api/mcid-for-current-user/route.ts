import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { google } from 'googleapis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
/** MCID認証システムのスプレッドシート（Discord ID ↔ Minecraft ID 同期） */
const MCID_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

function getDiscordIdFromUser(user: { user_metadata?: Record<string, unknown> }): string | null {
  const m = user.user_metadata || {};
  const id = m.provider_id ?? m.sub;
  return id != null ? String(id).trim() || null : null;
}

/** GET: ログイン中のユーザーのMCID（Minecraft ID）をGASから取得。Discord IDで検索し、最新行のMinecraft IDを返す。 */
export async function GET(request: NextRequest) {
  try {
    let user: { id: string; user_metadata?: Record<string, unknown> } | null = null;
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
    if (!user) {
      return NextResponse.json({ mcid: null }, { status: 200 });
    }

    const discordId = getDiscordIdFromUser(user);
    if (!discordId || !MCID_SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json({ mcid: null }, { status: 200 });
    }

    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const serviceAccountKey = JSON.parse(key);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: MCID_SPREADSHEET_ID,
      range: 'A2:E',
    });
    const rows = (res.data.values || []) as string[][];
    // 列: A=タイムスタンプ, B=MinecraftID, C=表示名, D=Discordユーザー, E=Discord ID
    const matches = rows.filter((r) => (r[4] || '').trim() === discordId);
    const latest = matches.length > 0 ? matches[matches.length - 1] : null;
    const mcid = latest && latest[1] ? latest[1].trim() : null;
    return NextResponse.json({ mcid });
  } catch (e) {
    console.error('mcid-for-current-user GET error:', e);
    return NextResponse.json({ mcid: null }, { status: 200 });
  }
}
