const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

  if (!DISCORD_BOT_TOKEN || !CHANNEL_ID) {
    return { statusCode: 500, body: 'Missing Discord config' };
  }

  const url = `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=20`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });
    const messages = await res.json();

    // 列車位置情報だけ抽出
    const trainMessages = messages
      .filter(msg => /^.+\/.+\/.+到着$/.test(msg.content))
      .map(msg => ({
        content: msg.content,
        timestamp: msg.timestamp
      }));

    return {
      statusCode: 200,
      body: JSON.stringify({ trainMessages })
    };
  } catch (e) {
    return { statusCode: 500, body: 'Discord fetch error: ' + e.toString() };
  }
}; 