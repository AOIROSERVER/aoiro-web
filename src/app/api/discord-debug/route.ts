import { NextResponse } from 'next/server';

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;

    console.log('🔍 Discord Debug Info:');
    console.log('- Bot Token exists:', !!botToken);
    console.log('- Server ID exists:', !!serverId);
    console.log('- Server ID type:', typeof serverId);

    if (!botToken || !serverId) {
      return NextResponse.json({
        error: 'Missing environment variables',
        botTokenExists: !!botToken,
        serverIdExists: !!serverId
      });
    }

    // Discord APIをテスト
    const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}?with_counts=true`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Discord API Response Status:', response.status);
    console.log('Discord API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Discord API Error Response:', errorText);
      
      return NextResponse.json({
        error: 'Discord API error',
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
    }

    const guildData = await response.json();
    console.log('Discord API Success Response:', guildData);

    return NextResponse.json({
      success: true,
      guildName: guildData.name,
      memberCount: guildData.approximate_member_count,
      presenceCount: guildData.approximate_presence_count,
      totalMembers: guildData.member_count,
      allKeys: Object.keys(guildData)
    });

  } catch (error) {
    console.error('Discord Debug Error:', error);
    return NextResponse.json({
      error: 'Exception occurred',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 