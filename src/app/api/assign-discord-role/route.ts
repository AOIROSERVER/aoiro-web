import { NextRequest, NextResponse } from 'next/server';

// 動的レンダリングを強制（Netlify対応）
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { discordUserId, minecraftId } = await request.json();

    console.log('🔄 Assigning Discord role:', {
      discordUserId: discordUserId?.substring(0, 8) + '...',
      minecraftId: minecraftId || 'N/A'
    });

    if (!discordUserId) {
      return NextResponse.json(
        { error: 'Discord User IDが必要です' },
        { status: 400 }
      );
    }

    // 環境変数から必要な情報を取得
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;
    const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;

    console.log('🔍 Discord Configuration:', {
      botTokenExists: !!botToken,
      serverIdExists: !!serverId,
      memberRoleIdExists: !!memberRoleId
    });

    if (!botToken || !serverId || !memberRoleId) {
      console.error('❌ Missing Discord configuration');
      return NextResponse.json(
        { error: 'Discord設定が不完全です' },
        { status: 500 }
      );
    }

    try {
      // まず、ユーザーがサーバーのメンバーかどうか確認
      console.log('🔄 Checking if user is server member...');
      const memberCheckResponse = await fetch(
        `https://discord.com/api/v10/guilds/${serverId}/members/${discordUserId}`,
        {
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'AOIROSERVER/1.0'
          }
        }
      );

      if (memberCheckResponse.status === 404) {
        console.log('❌ User is not a member of the server');
        return NextResponse.json(
          { error: 'ユーザーがサーバーのメンバーではありません' },
          { status: 404 }
        );
      }

      if (!memberCheckResponse.ok) {
        console.error('❌ Failed to check member status:', memberCheckResponse.status);
        return NextResponse.json(
          { error: 'メンバー状態の確認に失敗しました' },
          { status: 500 }
        );
      }

      const memberData = await memberCheckResponse.json();
      console.log('✅ User is a server member:', {
        username: memberData.user?.username,
        nickname: memberData.nick,
        joinedAt: memberData.joined_at,
        currentRoles: memberData.roles?.length || 0
      });

      // 既に認定メンバーロールを持っているかチェック
      if (memberData.roles && memberData.roles.includes(memberRoleId)) {
        console.log('⚠️ User already has the member role');
        return NextResponse.json({
          success: true,
          alreadyHadRole: true,
          message: 'ユーザーは既に認定メンバーロールを持っています'
        });
      }

      // ロールを付与
      console.log('🔄 Assigning member role...');
      
      // 監査ログの理由を安全にエンコード（英語のみ、特殊文字なし）
      const auditReason = minecraftId ? 
        `MCID Auth Complete - ${minecraftId}` : 
        'MCID Auth System';
      
      const roleAssignResponse = await fetch(
        `https://discord.com/api/v10/guilds/${serverId}/members/${discordUserId}/roles/${memberRoleId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'AOIROSERVER/1.0',
            'X-Audit-Log-Reason': auditReason
          }
        }
      );

      if (!roleAssignResponse.ok) {
        const errorText = await roleAssignResponse.text();
        console.error('❌ Failed to assign role:', {
          status: roleAssignResponse.status,
          statusText: roleAssignResponse.statusText,
          error: errorText
        });
        
        return NextResponse.json(
          { 
            error: 'ロール付与に失敗しました',
            details: `Status: ${roleAssignResponse.status}`,
            discordError: errorText
          },
          { status: 500 }
        );
      }

      console.log('✅ Role assigned successfully');

      // ロール付与成功をログ記録
      try {
        const logResponse = await fetch(
          `https://discord.com/api/v10/guilds/${serverId}/audit-logs?action_type=25&limit=1`,
          {
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'AOIROSERVER/1.0'
            }
          }
        );

        if (logResponse.ok) {
          const logData = await logResponse.json();
          console.log('📋 Role assignment logged:', logData.audit_log_entries?.[0]);
        }
      } catch (logError) {
        console.warn('⚠️ Failed to fetch audit log, but role assignment was successful');
      }

      return NextResponse.json({
        success: true,
        message: '認定メンバーロールを正常に付与しました',
        roleId: memberRoleId,
        userId: discordUserId
      });

    } catch (discordApiError) {
      console.error('❌ Discord API error:', discordApiError);
      return NextResponse.json(
        { 
          error: 'Discord API通信エラー',
          details: discordApiError instanceof Error ? discordApiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Discord role assignment error:', error);
    return NextResponse.json(
      { 
        error: 'ロール付与中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
