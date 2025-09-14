import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { discordUserId, minecraftId, gamertag } = await request.json();

    const botToken = process.env.DISCORD_BOT_TOKEN;
    // Discord通知チャンネルID（環境変数で設定可能、デフォルトは指定されたチャンネル）
    const channelId = process.env.DISCORD_NOTIFICATION_CHANNEL_ID || '1416816910904987851';

    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: 'Discord bot token not configured',
      }, { status: 500 });
    }

    if (!discordUserId) {
      return NextResponse.json({
        success: false,
        error: 'Discord User ID is required',
      }, { status: 400 });
    }

    // Discordチャンネルにメッセージを送信
    const messageContent = `🎮 **MCID認証完了！**\n<@${discordUserId}> さんがMCID認証を完了しました！\nAOIROSERVERをお楽しみください！🎉`;

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AOIROSERVER/1.0 (MCIDAuthNotification, 1.0)'
      },
      body: JSON.stringify({
        content: messageContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord API error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Discord API error: ${response.status} - ${errorText}`,
      }, { status: 500 });
    }

    const messageData = await response.json();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Discord notification sent successfully:', messageData.id);
    }

    return NextResponse.json({
      success: true,
      messageId: messageData.id,
      message: 'Discord notification sent successfully',
    });

  } catch (error) {
    console.error('❌ Error sending Discord notification:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
