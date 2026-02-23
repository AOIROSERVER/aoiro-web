import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import nodemailer from 'nodemailer';
import { appendCompanyApplication, getCompanyCreatorIds, getAICCompaniesForUser } from '@/lib/es-companies-sheets';
import { getCompanyByIdFromSheets, SEED_COMPANY } from '@/lib/es-companies-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DISCORD_API = 'https://discord.com/api/v10';

function getDiscordFromUser(user: { user_metadata?: Record<string, unknown>; email?: string }): { id: string; username: string } {
  const m = user.user_metadata || {};
  const id = String(m.provider_id ?? m.sub ?? '').trim();
  const username = String(
    m.full_name ?? m.name ?? m.username ?? m.preferred_username ?? user.email?.split('@')[0] ?? ''
  ).trim();
  return { id, username };
}

/** フォームから志望理由のみを取り出す（minecraft_tag は別列のため含めない） */
function getMotivationOnly(formData: Record<string, unknown> | undefined): string {
  if (!formData || typeof formData !== 'object') return '';
  const v = formData.motivation ?? formData['志望理由・意志表明'] ?? formData['志望理由'];
  return typeof v === 'string' ? v.trim() : '';
}

/** 社長のDiscord DMに「〇〇さんが入社申請をしています」+ メンション + 志望理由 + 画像(任意) + 許可/拒否ボタンを送る。戻り値: 送信できたか。 */
async function sendApplicationDmToOwner(params: {
  ownerDiscordId: string;
  applicantName: string;
  companyName: string;
  applicationId: string;
  motivation: string;
  imageBuffer?: Buffer;
  imageFileName?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn('[es-apply] DISCORD_BOT_TOKEN not set, skipping DM');
    return { sent: false, error: 'DISCORD_BOT_TOKEN not set' };
  }
  const { ownerDiscordId, applicantName, companyName, applicationId, motivation, imageBuffer, imageFileName } = params;
  const headers: Record<string, string> = {
    Authorization: `Bot ${botToken}`,
    'User-Agent': 'AOIROSERVER/1.0 (ApplyDM)',
  };

  const createDmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: ownerDiscordId }),
  });
  const createDmBody = await createDmRes.text();
  if (!createDmRes.ok) {
    console.error('[es-apply] Discord create DM failed:', createDmRes.status, createDmBody);
    let errMsg = createDmBody;
    try {
      const j = JSON.parse(createDmBody) as { message?: string };
      if (j.message) errMsg = j.message;
    } catch {
      // use raw
    }
    return { sent: false, error: errMsg };
  }
  const dmChannel = JSON.parse(createDmBody) as { id: string };
  const motivationText = motivation ? `\n**志望理由:**\n${motivation.slice(0, 1500)}${motivation.length > 1500 ? '…' : ''}` : '';
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aoiroserver.site').replace(/\/$/, '');
  const dashboardUrl = `${baseUrl}/es-system/recruit/my/`;
  const content = `<@${ownerDiscordId}> ${applicantName} さんが **${companyName}** への入社申請をしています。${motivationText}\n\nダッシュボードで許可・拒否できます。下のボタンからアクセスしてください。`;
  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: 'ダッシュボードにアクセスする', url: dashboardUrl },
      ],
    },
  ];

  if (imageBuffer && imageFileName) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ content, components }));
    const uint8 = new Uint8Array(imageBuffer);
    form.append('files[0]', new Blob([uint8]), imageFileName);
    const msgRes = await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'User-Agent': 'AOIROSERVER/1.0 (ApplyDM)' },
      body: form,
    });
    const msgBody = await msgRes.text();
    if (!msgRes.ok) {
      console.error('[es-apply] Discord send message with image failed:', msgRes.status, msgBody);
      return { sent: false, error: msgBody };
    }
  } else {
    const msgRes = await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, components }),
    });
    const msgBody = await msgRes.text();
    if (!msgRes.ok) {
      console.error('[es-apply] Discord send message failed:', msgRes.status, msgBody);
      return { sent: false, error: msgBody };
    }
  }
  return { sent: true };
}

const ADMIN_BACKUP_EMAIL = 'aoiroserver.m@gmail.com';

/** 念のため aoiroserver.m@gmail.com に全ユーザーの入社申請（応募者名・会社名・志望理由・画像）をメールで送る。ESシステムの sendNotificationEmail と同じ方式。 */
async function sendApplicationEmailToAdmin(params: {
  applicantName: string;
  companyName: string;
  applicationId: string;
  motivation: string;
  imageBuffer?: Buffer;
  imageFileName?: string;
}): Promise<void> {
  try {
    // Gmail SMTP設定（es-submit と同じ。EMAIL_USER/EMAIL_PASS もフォールバック）
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@aoiroserver.site';

    console.log('[es-apply] Gmail SMTP設定確認:', {
      hasGmailUser: !!gmailUser,
      hasGmailAppPassword: !!gmailAppPassword,
      fromEmail,
    });

    if (!gmailUser || !gmailAppPassword) {
      console.warn('[es-apply] GMAIL_USER/GMAIL_APP_PASSWORD（または EMAIL_USER/EMAIL_PASS）が不足しています。運営メール送信をスキップします。');
      return;
    }

    const { applicantName, companyName, applicationId, motivation, imageBuffer, imageFileName } = params;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    const motivationText = motivation ? motivation.slice(0, 2000) + (motivation.length > 2000 ? '…' : '') : '（未記入）';
    const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];
    if (imageBuffer && imageFileName) {
      const ext = imageFileName.split('.').pop()?.toLowerCase() || 'png';
      attachments.push({
        filename: imageFileName,
        content: imageBuffer,
        contentType: `image/${ext}`,
      });
    }

    const mailOptions = {
      from: fromEmail,
      to: ADMIN_BACKUP_EMAIL,
      subject: `[入社申請] ${companyName} - ${applicantName} (${applicationId})`,
      text: [
        `応募者: ${applicantName}`,
        `会社: ${companyName}`,
        `申請ID: ${applicationId}`,
        '',
        '志望理由:',
        motivationText,
      ].join('\n'),
      html: `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>入社申請通知</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #667eea; padding: 32px 24px; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 600;">📩 新しい入社申請が届きました</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">AOIROSERVER 入社申請（運営控え）</p>
            </div>
            <div style="padding: 32px 24px;">
              <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #333;">申請詳細</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #dee2e6;"><td style="padding: 12px 8px; font-weight: 600; color: #495057; width: 120px;">応募者</td><td style="padding: 12px 8px; color: #212529;">${escapeHtml(applicantName)}</td></tr>
                  <tr style="border-bottom: 1px solid #dee2e6;"><td style="padding: 12px 8px; font-weight: 600; color: #495057;">会社</td><td style="padding: 12px 8px; color: #212529;">${escapeHtml(companyName)}</td></tr>
                  <tr style="border-bottom: 1px solid #dee2e6;"><td style="padding: 12px 8px; font-weight: 600; color: #495057;">申請ID</td><td style="padding: 12px 8px; color: #212529;">${escapeHtml(applicationId)}</td></tr>
                  <tr style="border-bottom: 1px solid #dee2e6;"><td style="padding: 12px 8px; font-weight: 600; color: #495057;">志望理由</td><td style="padding: 12px 8px; color: #212529; word-break: break-word; white-space: pre-wrap;">${escapeHtml(motivationText)}</td></tr>
                  ${attachments.length ? `<tr><td style="padding: 12px 8px; font-weight: 600; color: #495057;">技術確認用画像</td><td style="padding: 12px 8px; color: #212529;">📎 ${escapeHtml(imageFileName ?? 'image')}（添付）</td></tr>` : ''}
                </table>
              </div>
              <div style="text-align: center;">
                <a href="https://aoiroserver.site/es-system/recruit/my/" style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">📊 自分の投稿（申請一覧）を開く</a>
              </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #6c757d;">AOIROSERVER 入社申請</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[es-apply] 運営控えメール送信成功:', info.messageId, '→', ADMIN_BACKUP_EMAIL);
  } catch (err) {
    console.error('[es-apply] 運営控えメール送信エラー:', err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** POST: 入社申請を送信。body: JSON { companyId, minecraftTag, formData } または FormData（+ skillImage 任意） */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let companyId: string | undefined;
    let minecraftTag: string | undefined;
    let formDataObj: Record<string, unknown> | undefined;
    let skillImageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      companyId = (formData.get('companyId') as string) ?? undefined;
      minecraftTag = (formData.get('minecraftTag') as string) ?? undefined;
      const formDataStr = formData.get('formData') as string | null;
      if (formDataStr) {
        try {
          formDataObj = JSON.parse(formDataStr) as Record<string, unknown>;
        } catch {
          formDataObj = undefined;
        }
      }
      const img = formData.get('skillImage');
      if (img instanceof File && img.size > 0) skillImageFile = img;
    } else {
      const body = await request.json();
      companyId = (body as { companyId?: string }).companyId;
      minecraftTag = (body as { minecraftTag?: string }).minecraftTag;
      formDataObj = (body as { formData?: Record<string, unknown> }).formData;
    }

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

    let email = '';
    let discordId = '';
    let discordUsername = '';

    let user: { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
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
    if (user) {
      email = user.email || '';
      const d = getDiscordFromUser(user);
      discordId = d.id;
      discordUsername = d.username;
    }

    // 正社員は1社まで。既に正社員で所属がある場合は申請不可
    if (company.employmentType === '正社員' && user?.id) {
      const aic = await getAICCompaniesForUser(user.id);
      if (aic.mainCompanyName && aic.mainCompanyName.trim()) {
        return NextResponse.json(
          { error: '正社員として既に1社に所属しています。アルバイトは複数加入可能です。' },
          { status: 400 }
        );
      }
    }

    const motivation = getMotivationOnly(formDataObj);
    const applicationId = await appendCompanyApplication({
      companyId,
      companyName: company.name,
      email,
      discordUsername,
      discordId,
      minecraftTag,
      motivation,
      status: 'pending',
      userId: user?.id ?? '',
    });

    const { createdByDiscordId } = await getCompanyCreatorIds(companyId);
    const applicantName = discordUsername || minecraftTag || '応募者';
    let imageBuffer: Buffer | undefined;
    let imageFileName: string | undefined;
    if (skillImageFile) {
      const ab = await skillImageFile.arrayBuffer();
      imageBuffer = Buffer.from(ab);
      imageFileName = skillImageFile.name || 'skill-image.png';
    }
    let dmSent = false;
    if (createdByDiscordId) {
      const dmResult = await sendApplicationDmToOwner({
        ownerDiscordId: createdByDiscordId,
        applicantName,
        companyName: company.name,
        applicationId,
        motivation,
        imageBuffer,
        imageFileName,
      });
      dmSent = dmResult.sent;
      if (!dmSent && dmResult.error) {
        console.warn('[es-apply] DM not sent:', dmResult.error);
      }
    } else {
      console.warn('[es-apply] 社長のDiscord IDがありません。会社ID:', companyId, '会社名:', company.name, '（募集作成時にDiscordでログインしたユーザーで作成するとDMが送れます）');
    }

    // 念のため全申請を aoiroserver.m@gmail.com にメールで送る（画像ありなら添付）
    await sendApplicationEmailToAdmin({
      applicantName,
      companyName: company.name,
      applicationId,
      motivation,
      imageBuffer,
      imageFileName,
    });

    return NextResponse.json({
      message: '入社申請を送信しました',
      timestamp: new Date().toISOString(),
      dmSent,
    });
  } catch (e) {
    console.error('es-apply POST error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '申請の送信に失敗しました' },
      { status: 500 }
    );
  }
}
