import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { google } from 'googleapis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
/** MCID認証システムのスプレッドシート（https://docs.google.com/spreadsheets/d/1rb2x4ONBTvpawQH-tQvkL-Ah3ziQP0msC23KPrv-204） */
const MCID_SPREADSHEET_ID = process.env.MCID_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;

/** スプレッドシートの「Discord ID」列には record-minecraft-auth が Supabase user.id (UUID) を書き込んでいる。そのため user.id で照合する。 */
function getIdsToMatch(user: { id: string; user_metadata?: Record<string, unknown> }): string[] {
  const ids: string[] = [user.id?.trim()].filter(Boolean);
  const m = user.user_metadata || {};
  const providerId = m.provider_id != null ? String(m.provider_id).trim() : '';
  const sub = m.sub != null ? String(m.sub).trim() : '';
  if (providerId && !ids.includes(providerId)) ids.push(providerId);
  if (sub && !ids.includes(sub)) ids.push(sub);
  return ids;
}

/** GET: ログイン中のユーザーのMCIDをスプレッドシートから取得。Supabase user.id（＝シートに記録されているDiscord ID列）で検索し、最新行のMinecraft IDを返す。 */
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

    if (!MCID_SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json({ mcid: null }, { status: 200 });
    }

    const idsToMatch = getIdsToMatch(user);
    if (idsToMatch.length === 0) {
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
    // 列: A=タイムスタンプ, B=MinecraftID, C=表示名, D=Discordユーザー, E=Discord ID（ここにはSupabase user.idが記録されている）
    const matches = rows.filter((r) => {
      const colE = (r[4] || '').trim();
      return idsToMatch.includes(colE);
    });
    const latest = matches.length > 0 ? matches[matches.length - 1] : null;
    const mcid = latest && latest[1] ? latest[1].trim() : null;
    return NextResponse.json({ mcid });
  } catch (e) {
    console.error('mcid-for-current-user GET error:', e);
    return NextResponse.json({ mcid: null }, { status: 200 });
  }
}
