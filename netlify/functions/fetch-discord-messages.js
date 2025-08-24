// HTTPクライアントライブラリ
const https = require('https');

exports.handler = async (event, context) => {
  console.log('🚂 fetch-discord-messages 開始');
  
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

  console.log('🔑 環境変数チェック:', {
    tokenExists: !!DISCORD_BOT_TOKEN,
    channelExists: !!CHANNEL_ID,
    tokenPrefix: DISCORD_BOT_TOKEN ? DISCORD_BOT_TOKEN.substring(0, 10) + '...' : 'なし'
  });

  if (!DISCORD_BOT_TOKEN || !CHANNEL_ID) {
    console.error('❌ Discord設定が不足:', { DISCORD_BOT_TOKEN: !!DISCORD_BOT_TOKEN, CHANNEL_ID: !!CHANNEL_ID });
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing Discord config', details: { tokenExists: !!DISCORD_BOT_TOKEN, channelExists: !!CHANNEL_ID } }) };
  }

  const url = `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=20`;

  try {
    console.log('🌐 Discord API呼び出し開始:', url);
    
    // Node.js標準のhttpsモジュールを使用
    const apiResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'discord.com',
        path: `/api/v10/channels/${CHANNEL_ID}/messages?limit=20`,
        method: 'GET',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
    
    console.log('📡 Discord API応答:', {
      status: apiResponse.status,
      statusText: apiResponse.statusText
    });

    if (apiResponse.status !== 200) {
      console.error('❌ Discord API エラー:', apiResponse.data);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: 'Discord API error', 
          status: apiResponse.status, 
          details: apiResponse.data 
        }) 
      };
    }

    const messages = JSON.parse(apiResponse.data);
    console.log('📨 取得メッセージ数:', messages.length);

    // 列車位置情報だけ抽出
    const trainMessages = messages
      .filter(msg => /^.+\/.+\/.+到着$/.test(msg.content))
      .map(msg => ({
        content: msg.content,
        timestamp: msg.timestamp
      }));

    console.log('🚂 列車メッセージ数:', trainMessages.length);
    console.log('🚂 列車メッセージ一覧:', trainMessages.map(m => m.content));

    return {
      statusCode: 200,
      body: JSON.stringify({ trainMessages })
    };
  } catch (e) {
    console.error('❌ 予期しないエラー:', e);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Discord fetch error', 
        details: e.toString(),
        stack: e.stack 
      }) 
    };
  }
}; 