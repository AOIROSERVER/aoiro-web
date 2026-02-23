import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * DiscordユーザーIDからユーザー情報（アバターURL・表示名）を取得。
 * ページ読み込み時に呼び出してアイコンを表示する用（保存不要）。
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!userId || !botToken) {
      return NextResponse.json({ error: 'userId or Discord bot not configured' }, { status: 400 });
    }

    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ username: null, globalName: null, avatarUrl: null }, { status: 200 });
      }
      return NextResponse.json({ error: 'Discord user not found' }, { status: res.status });
    }

    const user = (await res.json()) as {
      id: string;
      username?: string;
      global_name?: string;
      avatar?: string;
    };

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    return NextResponse.json({
      username: user.username ?? null,
      globalName: user.global_name ?? null,
      avatarUrl,
    });
  } catch (e) {
    console.error('discord-user [userId] GET error:', e);
    return NextResponse.json({ error: 'Failed to fetch Discord user' }, { status: 500 });
  }
}
