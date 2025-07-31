import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Discord Bot TokenとサーバーIDを環境変数から取得
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const serverId = process.env.DISCORD_SERVER_ID;

    console.log('🔍 Discord API Configuration:');
    console.log('- Bot Token:', botToken ? 'Set' : 'Not set');
    console.log('- Server ID:', serverId ? 'Set' : 'Not set');

    // 環境変数が設定されていない場合はデフォルト値を返す
    if (!botToken || !serverId) {
      console.log('❌ Missing environment variables, returning default values');
      return NextResponse.json({
        memberCount: 700,
        onlineCount: 100,
        serverName: 'AOIROSERVER'
      });
    }

    // Discord APIを使用してサーバー情報を取得（with_counts=trueでメンバー数を取得）
    const apiUrl = `https://discord.com/api/v10/guilds/${serverId}?with_counts=true`;
    console.log('🔗 Discord API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AOIROSERVER/1.0'
      },
    });
    
    // レスポンスヘッダーをログ出力（レート制限などの確認）
    console.log('📋 Response Headers:', {
      'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
      'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
      'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
      'content-type': response.headers.get('content-type')
    });

    if (!response.ok) {
      console.error(`❌ Discord API error: ${response.status} - ${response.statusText}`);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // 代替エンドポイントを試す
      console.log('🔄 Trying alternative Discord API endpoint...');
      const alternativeResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AOIROSERVER/1.0'
        },
      });
      
      if (alternativeResponse.ok) {
        const alternativeData = await alternativeResponse.json();
        console.log('✅ Alternative API response:', alternativeData);
        
        const altMemberCount = alternativeData.approximate_member_count || 
                              alternativeData.member_count || 
                              700;
        const altOnlineCount = alternativeData.approximate_presence_count || 
                              alternativeData.presence_count || 
                              100;
        
        return NextResponse.json({
          memberCount: altMemberCount,
          onlineCount: altOnlineCount,
          serverName: alternativeData.name || 'AOIROSERVER'
        });
      }
      
      // 両方のAPIが失敗した場合、デフォルト値を返す
      console.log('❌ Both Discord API endpoints failed, using default values');
      return NextResponse.json({
        memberCount: 700,
        onlineCount: 100,
        serverName: 'AOIROSERVER'
      });
    }

    const guildData = await response.json();
    console.log('✅ Discord API Response:');
    console.log('- Status:', response.status);
    console.log('- Guild Name:', guildData.name);
    console.log('- Member Count:', guildData.approximate_member_count);
    console.log('- Presence Count:', guildData.approximate_presence_count);
    console.log('- Total Members:', guildData.member_count);
    console.log('- All Keys:', Object.keys(guildData));
    
    // より詳細な情報を取得するために別のエンドポイントも試す
    console.log('🔄 Trying to get more detailed guild info...');
    const detailedResponse = await fetch(`https://discord.com/api/v10/guilds/${serverId}`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AOIROSERVER/1.0'
      },
    });
    
    if (detailedResponse.ok) {
      const detailedData = await detailedResponse.json();
      console.log('📊 Detailed Guild Data:');
      console.log('- Approximate Member Count:', detailedData.approximate_member_count);
      console.log('- Approximate Presence Count:', detailedData.approximate_presence_count);
      console.log('- Member Count:', detailedData.member_count);
      console.log('- Member Count (exact):', detailedData.members);
      console.log('- Owner ID:', detailedData.owner_id);
      console.log('- Verification Level:', detailedData.verification_level);
    }
    
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
    
    // 実際のデータが取得できたかチェック
    const hasRealData = guildData.approximate_member_count || guildData.approximate_presence_count;
    console.log('📊 Data Quality Check:');
    console.log('- Has real data from Discord API:', !!hasRealData);
    console.log('- Using fallback values:', !hasRealData);
    
    console.log('📊 Final Results:');
    console.log('- Member Count:', memberCount);
    console.log('- Online Count:', finalOnlineCount);
    console.log('- Server Name:', guildData.name || 'AOIROSERVER');
    
    return NextResponse.json({
      memberCount: memberCount,
      onlineCount: finalOnlineCount,
      serverName: guildData.name || 'AOIROSERVER'
    });

  } catch (error) {
    console.error('❌ Discord server info error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // エラーの場合もデフォルト値を返す
    return NextResponse.json({
      memberCount: 700,
      onlineCount: 100,
      serverName: 'AOIROSERVER'
    });
  }
} 