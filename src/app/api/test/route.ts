import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'APIテスト成功',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'POST APIテスト成功',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
}