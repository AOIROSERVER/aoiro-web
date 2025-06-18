import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const db = getFirestore();
    // "train_status" コレクションに lineId をドキュメントIDとして保存
    await db.collection('train_status').doc(data.lineId).set(data);
    return NextResponse.json({ message: '保存成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '保存失敗', error: String(error) }, { status: 500 });
  }
} 