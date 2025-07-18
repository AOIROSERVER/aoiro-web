import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    console.log('📧 テストメール送信開始:', { email });

    // Gmail SMTP設定を取得
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@aoiroserver.site';

    console.log('🔧 Gmail SMTP設定確認:', {
      hasGmailUser: !!gmailUser,
      hasGmailAppPassword: !!gmailAppPassword,
      fromEmail: fromEmail
    });

    if (!gmailUser || !gmailAppPassword) {
      console.error('❌ Gmail SMTP設定が不足しています');
      return NextResponse.json(
        { error: 'Gmail SMTP設定が不足しています' },
        { status: 500 }
      );
    }

    // テストメールの内容
    const subject = '【テスト】運行情報メールサービス';
    const content = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>テストメール</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- ヘッダー -->
          <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e1e5e9;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <span style="color: white; font-size: 16px; font-weight: bold;">🚂</span>
              </div>
              <div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">運行情報メールサービス</h1>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">テストメール</p>
              </div>
            </div>
          </div>

          <!-- メインコンテンツ -->
          <div style="padding: 32px 24px;">
            <!-- テスト通知 -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; background-color: #0369a1; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                  <span style="color: white; font-size: 14px;">🧪</span>
                </div>
                <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: #0369a1;">テストメール</h2>
              </div>
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
                運行情報メールサービスのテストメールです。
              </p>
            </div>

            <!-- 詳細情報 -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">テスト内容</h3>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">テスト種類</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">メール送信機能テスト</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">送信先</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${email}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; color: #6b7280;">送信時刻</span>
                  <span style="font-size: 14px; color: #374151; font-weight: 500;">${new Date().toLocaleString('ja-JP')}</span>
                </div>
              </div>
            </div>

            <!-- 説明 -->
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #0369a1;">このメールについて</h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">このメールが届くということは、メール送信機能が正常に動作していることを意味します。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">実際の運行情報が変更された際は、このような形式でメールが送信されます。</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="width: 6px; height: 6px; background-color: #0369a1; border-radius: 50%; margin-right: 12px; margin-top: 6px;"></span>
                  <span style="font-size: 14px; color: #374151; line-height: 1.5;">メールの受信設定やスパムフォルダの確認をお願いします。</span>
                </div>
              </div>
            </div>

            <!-- フッター -->
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                このメールは自動送信されています
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                通知設定の変更はアプリ内の設定画面から行ってください
              </p>
            </div>
          </div>

          <!-- フッター -->
          <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                <strong>運行情報メールサービス</strong>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                鉄道運行情報の自動通知サービス
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px;">
                <a href="https://aoiroserver.site" style="color: #dc2626; text-decoration: none;">公式サイト</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                送信日時: ${new Date().toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Nodemailerを使用してGmail SMTPでメール送信
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: subject,
      html: content
    };

    console.log('🔧 Gmail SMTP テストメール送信:', {
      from: fromEmail,
      to: email,
      subject: subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Gmail SMTPテストメール送信成功:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'テストメールを送信しました',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ テストメール送信エラー:', error);
    return NextResponse.json(
      { error: 'テストメール送信に失敗しました' },
      { status: 500 }
    );
  }
} 