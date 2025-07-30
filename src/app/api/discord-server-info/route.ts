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

    // Discord APIを使用してサーバー情報を取得（with_counts=trueでメンバー数を取得）
    const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}?with_counts=true`, {
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
    console.log('Guild data received:', guildData);
    
    // オンラインメンバー数を取得（with_counts=trueで既に取得済みの場合）
    let onlineCount = 0;
    
    // guildDataからオンライン数を取得
    if (guildData.approximate_presence_count !== undefined) {
      onlineCount = guildData.approximate_presence_count;
      console.log('Online count from guild data:', onlineCount);
    } else {
      // フォールバック: 別のAPIエンドポイントで取得
      const presenceResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}/preview`, {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (presenceResponse.ok) {
        const presenceData = await presenceResponse.json();
        console.log('Presence data received:', presenceData);
        onlineCount = presenceData.approximate_presence_count || 0;
      }
    }

    // メンバー数を取得（複数のフィールドをチェック）
    const memberCount = guildData.approximate_member_count || 
                       guildData.member_count || 
                       guildData.members || 
                       700;
    
    // オンライン数を取得（複数のフィールドをチェック）
    const finalOnlineCount = onlineCount || 
                            guildData.approximate_presence_count || 
                            guildData.presence_count || 
                            100;
    
    console.log('Final member count:', memberCount);
    console.log('Final online count:', finalOnlineCount);
    console.log('Raw guild data keys:', Object.keys(guildData));
    
    return NextResponse.json({
      memberCount: memberCount,
      onlineCount: finalOnlineCount,
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