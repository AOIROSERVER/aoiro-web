import { NextRequest, NextResponse } from 'next/server';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import { updateApplicationStatus, getApplicationsFromSheets, setAICCompanyForUser } from '@/lib/es-companies-sheets';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_APPLICATION_PUBLIC_KEY ?? '';

/** Discord インタラクション（ボタン押下など）を受け付け、署名検証後に許可/拒否を処理 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }
  if (!DISCORD_PUBLIC_KEY) {
    console.error('DISCORD_APPLICATION_PUBLIC_KEY not set');
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const rawBody = await request.text();
  const isValid = await verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
  }

  let body: { type?: number; data?: { custom_id?: string } };
  try {
    body = JSON.parse(rawBody) as { type?: number; data?: { custom_id?: string } };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  if (body.type === InteractionType.MESSAGE_COMPONENT && body.data?.custom_id) {
    const customId = body.data.custom_id as string;
    const [action, applicationId] = customId.split(':');
    if (!applicationId || !['apply_approve', 'apply_reject'].includes(action)) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '不明な操作です。', flags: 64 },
      });
    }

    const status = action === 'apply_approve' ? 'approved' : 'rejected';
    const ok = await updateApplicationStatus(applicationId, status);
    if (!ok) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '申請が見つかりません。', flags: 64 },
      });
    }

    if (status === 'approved') {
      const applications = await getApplicationsFromSheets();
      const app = applications.find((a) => a.id === applicationId);
      if (app?.userId && app?.companyName) {
        await setAICCompanyForUser(app.userId, app.companyName);
      }
    }

    const message = status === 'approved' ? '✅ 許可しました。' : '❌ 拒否しました。';
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: message, flags: 64 },
    });
  }

  return NextResponse.json({ type: InteractionResponseType.PONG });
}
