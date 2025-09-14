import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;
    const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;

    if (!botToken || !serverId || !memberRoleId) {
      return NextResponse.json({
        success: false,
        error: 'Discord設定が不完全です'
      });
    }

    // サーバー情報を取得
    const guildResponse = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!guildResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'サーバー情報の取得に失敗しました',
        status: guildResponse.status
      });
    }

    const guildData = await guildResponse.json();

    // ロール情報を取得
    const rolesResponse = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}/roles`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!rolesResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'ロール情報の取得に失敗しました',
        status: rolesResponse.status
      });
    }

    const rolesData = await rolesResponse.json();

    // ボットのロールと対象ロールを特定
    const botRole = rolesData.find((role: any) => 
      role.tags && role.tags.bot_id
    );
    
    const targetRole = rolesData.find((role: any) => 
      role.id === memberRoleId
    );

    return NextResponse.json({
      success: true,
      guild: {
        name: guildData.name,
        id: guildData.id,
        botRoleId: botRole?.id,
        botRoleName: botRole?.name,
        botRolePosition: botRole?.position,
        targetRoleId: targetRole?.id,
        targetRoleName: targetRole?.name,
        targetRolePosition: targetRole?.position,
        canManageRoles: botRole ? botRole.permissions & 0x10000000 : false, // Manage Roles permission
        roleHierarchyCorrect: botRole && targetRole ? botRole.position > targetRole.position : false
      }
    });

  } catch (error) {
    console.error('❌ Discord permissions check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
