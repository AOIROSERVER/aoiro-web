import { NextRequest, NextResponse } from 'next/server';

// Webhook DiscordのエンドポイントURL（Netlify Functionsのパス）
const WEBHOOK_DISCORD_URL = process.env.WEBHOOK_DISCORD_URL || 'https://YOUR_DEPLOY_DOMAIN/.netlify/functions/webhook-discord';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const line = searchParams.get('line');
  const direction = searchParams.get('direction');

  if (!line || !direction) {
    return NextResponse.json({ error: 'line and direction are required' }, { status: 400 });
  }

  try {
    // webhook-discord.js経由で全列車位置情報を取得
    const res = await fetch(WEBHOOK_DISCORD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'dummy/for/fetch' }) // 何かしらPOSTしないと405になるため
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch train positions' }, { status: 500 });
    }
    const data = await res.json();
    if (!data.positions) {
      return NextResponse.json({ error: 'No train positions found' }, { status: 404 });
    }
    // lineとdirectionで該当する列車位置のみ返す
    const train = data.positions.find(
      (t: any) => t.line === line && t.direction === direction
  );
  if (!train) {
    return NextResponse.json({ error: 'No train position found' }, { status: 404 });
  }
  return NextResponse.json(train);
  } catch (error) {
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
} 