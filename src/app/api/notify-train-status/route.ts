console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30)); // 先頭だけ
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const { lineId, lineName, status, details } = await request.json();

    // 通知メッセージの作成
    const message = {
      notification: {
        title: `${lineName}の運行情報`,
        body: `${status}${details ? `: ${details}` : ''}`,
      },
      data: {
        lineId,
        lineName,
        status,
        details: details || '',
      },
      topic: `train-status-${lineId}`, // トピックベースの通知
    };

    // 通知の送信
    await admin.messaging().send(message);

    return NextResponse.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { message: 'Error sending notification' },
      { status: 500 }
    );
  }
} 