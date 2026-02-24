import { NextRequest, NextResponse } from 'next/server';
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import { updateApplicationStatus, getApplicationsFromSheets, setAICCompanyForUser, getCompanyByIdFromSheets, getCompanyCreatorIds, updateCompanyInSheets } from '@/lib/es-companies-sheets';
import { sendApprovalDmToApplicant } from '@/app/api/es-apply/route';
import { sendCreativeApprovalDmToOwner } from '@/lib/es-creative-discord';

const DISCORD_PUBLIC_KEY = (process.env.DISCORD_APPLICATION_PUBLIC_KEY ?? '').trim();

/** クリエイティブ申請の許可・拒否をDiscord上で実行できるDiscordユーザーID（環境変数 DISCORD_OPERATION_USER_ID と同一想定） */
function getAllowedCreativeAdminDiscordId(): string | null {
  const id = (process.env.DISCORD_OPERATION_USER_ID ?? '').trim();
  return id || null;
}

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

  let body: { type?: number; data?: { custom_id?: string }; member?: { user?: { id?: string } }; user?: { id?: string } };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  if (body.type === InteractionType.MESSAGE_COMPONENT && body.data?.custom_id) {
    const customId = body.data.custom_id as string;
    const [action, id] = customId.split(':');

    if (action === 'creative_approve' || action === 'creative_reject') {
      const companyId = id;
      const allowedId = getAllowedCreativeAdminDiscordId();
      const clickerDiscordId = body.member?.user?.id ?? body.user?.id ?? '';
      if (!allowedId || clickerDiscordId !== allowedId) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'クリエイティブ申請の許可・拒否は管理者のみ実行できます。', flags: 64 },
        });
      }
      const company = await getCompanyByIdFromSheets(companyId);
      if (!company) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '会社が見つかりません。', flags: 64 },
        });
      }
      const status = action === 'creative_approve' ? 'approved' : 'rejected';
      const ok = await updateCompanyInSheets(companyId, { creativeStatus: status });
      if (!ok) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '更新に失敗しました。', flags: 64 },
        });
      }
      if (status === 'approved') {
        const { createdByDiscordId } = await getCompanyCreatorIds(companyId);
        if (createdByDiscordId?.trim()) {
          const dmResult = await sendCreativeApprovalDmToOwner({ ownerDiscordId: createdByDiscordId.trim() });
          if (!dmResult.sent && dmResult.error) {
            console.warn('[discord-interaction] クリエイティブ承認DM送信スキップ:', dmResult.error);
          }
        }
      }
      const message = status === 'approved' ? '✅ クリエイティブ申請を許可しました。' : '❌ クリエイティブ申請を拒否しました。';
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: message, flags: 64 },
      });
    }

    const applicationId = id;
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
        const company = await getCompanyByIdFromSheets(app.companyId);
        const employmentType = (company?.employmentType === '正社員' ? '正社員' : 'アルバイト') as '正社員' | 'アルバイト';
        await setAICCompanyForUser(app.userId, app.companyName, employmentType);
      }
      if (app?.discordId?.trim()) {
        const { createdByDiscordUsername } = await getCompanyCreatorIds(app.companyId);
        const applicantName = (app.discord || app.minecraftTag || '応募者').trim() || '応募者';
        const hrName = (createdByDiscordUsername || '採用担当').trim();
        const dmResult = await sendApprovalDmToApplicant({
          applicantDiscordId: app.discordId.trim(),
          applicantName,
          companyName: app.companyName,
          hrName,
        });
        if (!dmResult.sent && dmResult.error) {
          console.warn('[discord-interaction] 入社承認DM送信スキップ:', dmResult.error);
        }
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
