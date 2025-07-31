import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;

    if (!botToken || !serverId) {
      return NextResponse.json({
        error: 'Missing environment variables',
        botTokenExists: !!botToken,
        serverIdExists: !!serverId
      });
    }

    // Botの情報を取得
    const botResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (botResponse.ok) {
      const botData = await botResponse.json();
      console.log('🤖 Bot Info:', {
        id: botData.id,
        username: botData.username,
        discriminator: botData.discriminator,
        verified: botData.verified,
        flags: botData.flags
      });
    }

    // Botの権限を確認
    const permissionsResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}/members/@me`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json();
      console.log('🔐 Bot Permissions:', {
        user: {
          id: permissionsData.user?.id,
          username: permissionsData.user?.username
        },
        roles: permissionsData.roles,
        permissions: permissionsData.permissions
      });
    }

    // サーバーの詳細情報を取得
    const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (guildResponse.ok) {
      const guildData = await guildResponse.json();
      console.log('🏠 Guild Info:', {
        name: guildData.name,
        member_count: guildData.member_count,
        approximate_member_count: guildData.approximate_member_count,
        approximate_presence_count: guildData.approximate_presence_count,
        owner_id: guildData.owner_id,
        permissions: guildData.permissions
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Bot information retrieved successfully'
    });

  } catch (error) {
    console.error('Bot Info Error:', error);
    return NextResponse.json({
      error: 'Failed to get bot information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 