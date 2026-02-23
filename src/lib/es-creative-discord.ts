/**
 * クリエイティブ申請を運営用Discordチャンネルに送信する
 * チャンネルID: 1475608910458261525
 */

const DISCORD_API = 'https://discord.com/api/v10';
const CREATIVE_CHANNEL_ID = '1475608910458261525';

/** 運営のDiscordユーザーID（メンション用）。環境変数 DISCORD_OPERATION_USER_ID で指定 */
function getOperationUserId(): string | null {
  const id = (process.env.DISCORD_OPERATION_USER_ID || '').trim();
  return id || null;
}

/**
 * クリエイティブ申請をDiscordチャンネルに送信する（PDFはDiscordにのみ送り、DBには保存しない）。
 * メッセージ: 〇〇会社さんがクリエイティブ申請をしています + PDF添付 + ダッシュボードにアクセス + @運営
 */
export async function sendCreativeApplicationToDiscord(params: {
  companyName: string;
  companyId: string;
  pdfBuffer: Buffer;
  pdfFileName?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.warn('[creative-discord] DISCORD_BOT_TOKEN not set');
    return { sent: false, error: 'DISCORD_BOT_TOKEN not set' };
  }
  const { companyName, companyId, pdfBuffer, pdfFileName } = params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aoiroserver.site').replace(/\/$/, '');
  const dashboardUrl = `${baseUrl}/es-system/creative-review`;
  const operationId = getOperationUserId();
  const mention = operationId ? `<@${operationId}>` : '@運営';
  const content = `${companyName}さんがクリエイティブ申請をしています。\n\nダッシュボードにアクセスして許可・拒否できます。\n${mention}`;
  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: 'ダッシュボードにアクセス', url: dashboardUrl },
      ],
    },
  ];

  const fileName = pdfFileName && /\.pdf$/i.test(pdfFileName) ? pdfFileName : `creative-${companyId}.pdf`;
  const pdfBytes = new Uint8Array(pdfBuffer);
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content, components }));
  form.append('files[0]', new Blob([pdfBytes], { type: 'application/pdf' }), fileName);

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
