import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { appendCompanyApplication, getCompanyCreatorIds } from '@/lib/es-companies-sheets';
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

/** 社長のDiscord DMに「〇〇さんが入社申請をしています」+ 画像(任意) + 許可/拒否ボタンを送る */
async function sendApplicationDmToOwner(params: {
  ownerDiscordId: string;
  applicantName: string;
  companyName: string;
  applicationId: string;
  imageBuffer?: Buffer;
  imageFileName?: string;
}): Promise<void> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn('DISCORD_BOT_TOKEN not set, skipping DM');
    return;
  }
  const { ownerDiscordId, applicantName, companyName, applicationId, imageBuffer, imageFileName } = params;
  const headers: Record<string, string> = {
    Authorization: `Bot ${botToken}`,
    'User-Agent': 'AOIROSERVER/1.0 (ApplyDM)',
  };

  const createDmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: ownerDiscordId }),
  });
  if (!createDmRes.ok) {
    const err = await createDmRes.text();
    console.error('Discord create DM failed:', createDmRes.status, err);
    return;
  }
  const dmChannel = (await createDmRes.json()) as { id: string };
  const content = `${applicantName} さんが **${companyName}** への入社申請をしています。\n下のボタンで許可または拒否してください。`;
  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: '許可', custom_id: `apply_approve:${applicationId}` },
        { type: 2, style: 4, label: '拒否', custom_id: `apply_reject:${applicationId}` },
      ],
    },
  ];

  if (imageBuffer && imageFileName) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ content, components }));
    form.append('files[0]', new Blob([imageBuffer]), imageFileName);
    const msgRes = await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'User-Agent': 'AOIROSERVER/1.0 (ApplyDM)' },
      body: form,
    });
    if (!msgRes.ok) console.error('Discord send message with image failed:', await msgRes.text());
  } else {
    const msgRes = await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, components }),
    });
    if (!msgRes.ok) console.error('Discord send message failed:', await msgRes.text());
  }
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
    if (createdByDiscordId) {
      let imageBuffer: Buffer | undefined;
      let imageFileName: string | undefined;
      if (skillImageFile) {
        const ab = await skillImageFile.arrayBuffer();
        imageBuffer = Buffer.from(ab);
        imageFileName = skillImageFile.name || 'skill-image.png';
      }
      await sendApplicationDmToOwner({
        ownerDiscordId: createdByDiscordId,
        applicantName,
        companyName: company.name,
        applicationId,
        imageBuffer,
        imageFileName,
      });
    }

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
