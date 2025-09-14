import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;
    const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;

    console.log('🔍 Discord Configuration Check:', {
      botTokenExists: !!botToken,
      botTokenLength: botToken?.length || 0,
      serverIdExists: !!serverId,
      serverId: serverId,
      memberRoleIdExists: !!memberRoleId,
      memberRoleId: memberRoleId
    });

    return NextResponse.json({
      success: true,
      config: {
        botTokenExists: !!botToken,
        botTokenLength: botToken?.length || 0,
        serverIdExists: !!serverId,
        serverId: serverId,
        memberRoleIdExists: !!memberRoleId,
        memberRoleId: memberRoleId
      }
    });

  } catch (error) {
    console.error('❌ Discord config check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
