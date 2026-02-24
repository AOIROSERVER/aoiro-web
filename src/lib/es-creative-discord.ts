/**
 * クリエイティブ申請を運営用Discordチャンネルに送信する
 * チャンネルID: 1475608910458261525
 */

const DISCORD_API = 'https://discord.com/api/v10';
const CREATIVE_CHANNEL_ID = '1475608910458261525';

/**
 * クリエイティブ申請をDiscordチャンネルに送信する（PDFはDiscordにのみ送り、DBには保存しない）。最大5枚まで。
 * メッセージ: 〇〇会社さんがクリエイティブ申請をしています + PDF添付 + ダッシュボードにアクセス
 */
export async function sendCreativeApplicationToDiscord(params: {
  companyName: string;
  companyId: string;
  pdfBuffers: { buffer: Buffer; fileName?: string }[];
}): Promise<{ sent: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn('[creative-discord] DISCORD_BOT_TOKEN not set');
    return { sent: false, error: 'DISCORD_BOT_TOKEN not set' };
  }
  const { companyName, companyId, pdfBuffers } = params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aoiroserver.site').replace(/\/$/, '');
  const dashboardUrl = `${baseUrl}/es-system/creative-review`;
  const content = `${companyName}さんがクリエイティブ申請をしています。\n\n下のボタンで許可・拒否できます。`;
  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: '許可', custom_id: `creative_approve:${companyId}` },
        { type: 2, style: 4, label: '拒否', custom_id: `creative_reject:${companyId}` },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: 'ダッシュボードにアクセス', url: dashboardUrl },
      ],
    },
  ];

  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content, components }));
  const maxFiles = Math.min(pdfBuffers.length, 5);
  for (let i = 0; i < maxFiles; i++) {
    const item = pdfBuffers[i];
    const fileName = (item.fileName && /\.pdf$/i.test(item.fileName)) ? item.fileName : `creative-${companyId}-${i + 1}.pdf`;
    const pdfBytes = new Uint8Array(item.buffer);
    form.append(`files[${i}]`, new Blob([pdfBytes], { type: 'application/pdf' }), fileName);
  }

  const msgRes = await fetch(`${DISCORD_API}/channels/${CREATIVE_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'User-Agent': 'AOIROSERVER/1.0 (CreativeDM)' },
    body: form,
  });
  const msgBody = await msgRes.text();
  if (!msgRes.ok) {
    console.error('[creative-discord] Discord send failed:', msgRes.status, msgBody);
    return { sent: false, error: msgBody };
  }
  return { sent: true };
}

/**
 * クリエイティブ申請が承認されたとき、該当会社の社長（募集作成者）にDMで承認通知を送る。
 */
export async function sendCreativeApprovalDmToOwner(params: {
  ownerDiscordId: string;
}): Promise<{ sent: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn('[creative-discord] DISCORD_BOT_TOKEN not set, skipping approval DM');
    return { sent: false, error: 'DISCORD_BOT_TOKEN not set' };
  }
  const { ownerDiscordId } = params;
  const headers: Record<string, string> = {
    Authorization: `Bot ${botToken}`,
    'User-Agent': 'AOIROSERVER/1.0 (CreativeApprovalDM)',
  };

  const createDmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: ownerDiscordId }),
  });
  const createDmBody = await createDmRes.text();
  if (!createDmRes.ok) {
    console.error('[creative-discord] Discord create DM (approval) failed:', createDmRes.status, createDmBody);
    return { sent: false, error: createDmBody };
  }
  const dmChannel = JSON.parse(createDmBody) as { id: string };

  const content = `<@${ownerDiscordId}> 様

平素よりAOIROSERVERをご利用いただき、誠にありがとうございます。

このたびご申請いただきましたクリエイティブ権限につきまして、運営にて慎重に審査を行いました結果、正式に承認いたしましたことをご通知申し上げます。

本通知をもって、クリエイティブ権限のご利用が可能となります。
ご利用にあたりましては、サーバー規約および運営方針を厳守いただき、良識ある行動をお願い申し上げます。

今後とも健全かつ円滑なサーバー運営へのご理解とご協力を賜りますよう、何卒よろしくお願い申し上げます。

AOIROSERVER運営`;

  const msgRes = await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const msgBody = await msgRes.text();
  if (!msgRes.ok) {
    console.error('[creative-discord] Discord send approval DM failed:', msgRes.status, msgBody);
    return { sent: false, error: msgBody };
  }
  return { sent: true };
}

/**
 * クリエイティブ申請メッセージの許可・拒否ボタンを両方とも押せなくする（1回押したら無効化）。
 */
export async function disableCreativeMessageButtons(
  channelId: string,
  messageId: string,
  companyId: string
): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return false;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aoiroserver.site').replace(/\/$/, '');
  const dashboardUrl = `${baseUrl}/es-system/creative-review`;
  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: '許可', custom_id: `creative_approve:${companyId}`, disabled: true },
        { type: 2, style: 4, label: '拒否', custom_id: `creative_reject:${companyId}`, disabled: true },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: 'ダッシュボードにアクセス', url: dashboardUrl },
      ],
    },
  ];
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${botToken}`,
      'User-Agent': 'AOIROSERVER/1.0 (CreativeDM)',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ components }),
  });
  if (!res.ok) {
    console.error('[creative-discord] disable buttons failed:', res.status, await res.text());
    return false;
  }
  return true;
}
