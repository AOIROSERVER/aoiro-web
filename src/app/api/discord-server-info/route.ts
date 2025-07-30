import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Discord Bot TokenとサーバーIDを環境変数から取得
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;

    // 環境変数が設定されていない場合はデフォルト値を返す
    if (!botToken || !serverId) {
      return NextResponse.json({
        memberCount: 700,
        onlineCount: 100,
        serverName: 'AOIROSERVER'
      });
    }

    // Discord APIを使用してサーバー情報を取得
    const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Discord API error: ${response.status}`);
      // APIエラーの場合もデフォルト値を返す
      return NextResponse.json({
        memberCount: 700,
        onlineCount: 100,
        serverName: 'AOIROSERVER'
      });
    }

    const guildData = await response.json();
    
    // オンラインメンバー数を取得
    const presenceResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}/preview`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    let onlineCount = 0;
    if (presenceResponse.ok) {
      const presenceData = await presenceResponse.json();
      onlineCount = presenceData.approximate_presence_count || 0;
    }

    return NextResponse.json({
      memberCount: guildData.approximate_member_count || 150,
      onlineCount: onlineCount || 25,
      serverName: guildData.name || 'AOIROSERVER'
    });

  } catch (error) {
    console.error('Discord server info error:', error);
    // エラーの場合もデフォルト値を返す
    return NextResponse.json({
      memberCount: 700,
      onlineCount: 100,
      serverName: 'AOIROSERVER'
    });
  }
} 