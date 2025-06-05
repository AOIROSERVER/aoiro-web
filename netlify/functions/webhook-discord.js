let latestTrainPosition = null; // グローバル変数で一時保存

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const body = JSON.parse(event.body);
  console.log('受信:', body);

  // 受信した内容を保存
  latestTrainPosition = body;

  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok' }),
  };
};